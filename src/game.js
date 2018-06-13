const BALL_SPEED = 40;
const BALL_RECOIL = 1;
const BALL_TTL = 1000;

const UFO_MIN_RESPAWN = 3000;
const UFO_MAX_RESPAWN = 6000;
const UFO_WAIT_TIME = 1500;

const SHIELD_RECHARGE_TIME = 10000;
const MAX_OVERHEAT = 10;

const sleep = wait => new Promise(resolve => setTimeout(resolve, wait));

var canvas = document.getElementById("renderCanvas"); // Get the canvas element
var engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

let MAX_Y = 100;
let MAX_X = 100;
let fov = 0;

const scene = createScene(); //Call the createScene function
window.addEventListener("resize", onResize);

const fx = new window.Fx(scene);
const gui = new window.Gui(scene);

let level = -1;

var oidMaterial = new BABYLON.StandardMaterial("asteroid material", scene);
oidMaterial.diffuseColor = new BABYLON.Color3(.5, .5, .5);
oidMaterial.wireframe = true;

var ballMaterial = new BABYLON.StandardMaterial("ball material", scene);
ballMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);

var shipMaterial = new BABYLON.StandardMaterial("ship material", scene);
ballMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);

var shieldMaterial = new BABYLON.StandardMaterial("shield material", scene);
shieldMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
shieldMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 1.0);
// shieldMaterial.wireframe = true;
shieldMaterial.alpha = 0;

enableShield();

const ship = createShip();
const exhaust = fx.createExhaust(ship);
ship.material = shipMaterial;

let ufo = null;

let oids = [];
let balls = [];
let gameOver = false;
let overheat = 0;

ufoAi();

const keys = {};

const firing = false;

document.onkeydown = onKeyDown;
document.onkeyup = onKeyUp;

let onboardingMode;

setOnboarding('move');

gui.resetScore();

nextLevel();

scene.registerBeforeRender(updateScene);
engine.runRenderLoop(() => scene.render());

function setOnboarding(id) {
  if (id === 'move') {
    gui.setMessage("Use ← ↑ → to move");
  }
  if (id === 'fire') {
    gui.setMessage('Press SPACE to fire');
  }

  if (id === 'hit') {
    gui.setMessage('Now hit that asteroid');
  }

  if (id === 'bye') {
    gui.setMessage('Destroy all the asteroids');
    setTimeout(() => gui.setMessage('Good luck'), 2000);
    setTimeout(() => gui.setMessage(''), 3000);
  }

  if (id === 'dead') {
    gui.setMessage('Press ENTER to restart');
  }

  if (id === 'level') {
    gui.setMessage(`Level ${level}` );
    setTimeout(() => gui.setMessage(''), 1000);
  }

  onboardingMode = id;
}

function createScene() {
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 0, -100), scene);
  camera.setTarget(BABYLON.Vector3.Zero());

  fov = camera.fov;
  MAX_Y = Math.sin(camera.fov / 2) * 109 * 2;
  MAX_X = MAX_Y * (window.innerWidth / window.innerHeight);

  // console.log(MAX_Y, MAX_X)
  // camera.attachControl(canvas, true);

  var bgMaterial = new BABYLON.StandardMaterial("background material", scene);
  bgMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  bgMaterial.disableLighting = true;

  const box = BABYLON.MeshBuilder.CreateBox("background", {size: 1}, scene);
  box.scaling.x = 99999;
  box.scaling.y = 99999;
  box.position.z = 20;
  box.material = bgMaterial;

  const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
  const light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);

  scene.workerCollisions = true;

  const physicsPlugin = new BABYLON.CannonJSPlugin();
  scene.enablePhysics(new BABYLON.Vector3(0, 0, 0));

  return scene;
};

function createShip() {
  const ship = BABYLON.MeshBuilder.CreateCylinder("ship", {diameterTop: 0, diameterBottom: 1, tesselation: 4, height: 2}, scene);
  ship.physicsImpostor = new BABYLON.PhysicsImpostor(ship, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.1 }, scene);

  const shield = BABYLON.MeshBuilder.CreateSphere("shield", {diameter: 3, segments: 4}, scene);
  shield.material = shieldMaterial;
  shield.rotation.y = Math.PI;

  ship.addChild(shield);
  return ship;
}

function createUfo() {
  const ufo = BABYLON.MeshBuilder.CreateSphere("ufo", {diameter: 2.5, diameterY: 1.2, segments: 6}, scene);

  ufo.position.x = (Math.random() - 0.5) * MAX_X;
  ufo.position.y = (Math.random() - 0.5) * MAX_Y;

  ufo.physicsImpostor = new BABYLON.PhysicsImpostor(ufo, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.1 }, scene);

  oids.map(oid => oid.physicsImpostor.registerOnPhysicsCollide(ufo.physicsImpostor, onAsteroidHitUfo));
  balls.map(oid => oid.physicsImpostor.registerOnPhysicsCollide(ufo.physicsImpostor, onBallHitUfo));
  ship.physicsImpostor.registerOnPhysicsCollide(ufo.physicsImpostor, onShipHitUfo);

  ufo.physicsImpostor.applyImpulse(new BABYLON.Vector3(3, 0, 0), ufo.getAbsolutePosition());
  return ufo;
}

async function ufoAi() {
  let ufolevel = 0;
  while (true) {
    // await sleep(15000 + Math.floor(Math.random() * 15000));
    await sleep(UFO_MIN_RESPAWN + Math.floor(Math.random() * (UFO_MAX_RESPAWN - UFO_MIN_RESPAWN)));

    const theUfo = createUfo();
    ufo = theUfo;
    ufo.level = ufolevel;


     console.log('level', ufolevel, ufo.level);

    while (true) {
      await sleep(Math.floor(Math.random() * UFO_WAIT_TIME));
      if (!ufo) {
        break;
      }

      if (gameOver) {
        continue;
      }

      // calculate the closest heading taking screen wrap into account
      let heading = ship.position.subtract(ufo.position);
      const headings = [
        heading.add(new BABYLON.Vector3(MAX_X, 0, 0)),
        heading.add(new BABYLON.Vector3(-MAX_X, 0, 0)),
        heading.add(new BABYLON.Vector3(0, MAX_Y, 0)),
        heading.add(new BABYLON.Vector3(0, -MAX_Y, 0)),
      ];
      let len = heading.length();
      headings.map((h, i) => {
        const l = h.length();
        if (len > l) {
          heading = h;
          len = l;
        }
      });

      if (Math.random() > 0.5) {
        heading.normalize();
        ufo.physicsImpostor.applyImpulse(heading.scale(1), ufo.getAbsolutePosition());
      } else {
        const ball_speed = BALL_SPEED / 2 + level*2;
        const error = Math.max(0, 3 - level/3);
        const distance_in_sec = heading.length() / ball_speed;

        if (distance_in_sec < BALL_TTL / 1000) {
          const tgtvel = ship.physicsImpostor.getLinearVelocity().scale(distance_in_sec);
          const myvel = ufo.physicsImpostor.getLinearVelocity().scale(distance_in_sec);
          const err = new BABYLON.Vector3(error * (Math.random() * 2 - 1), error * (Math.random() * 2 - 1), 0);
          const ball = createBall(heading.add(tgtvel).subtract(myvel).add(err), ufo, ball_speed);
          ball.fire = fx.createUfoBall(ball);
        }
      }
    }
    ufolevel++;
    scene.removeMesh(theUfo);
    setTimeout(() => scene.getPhysicsEngine().removeImpostor(theUfo.physicsImpostor), 0);
  }
}

function createAsteroid(diameter) {
  const oid = BABYLON.MeshBuilder.CreateSphere(`oid`, { diameter, segments: 2 }, scene);
  oid.gen = 0;

  while(true) {
    oid.position = new BABYLON.Vector3(
      Math.random() * 80 - 40,
      Math.random() * 80 - 40,
      0
    );
    if(BABYLON.Vector3.Distance(oid.position, ship.position) < 10) {
      continue;
    }

    break;
  }

  oid.physicsImpostor = new BABYLON.PhysicsImpostor(oid, BABYLON.PhysicsImpostor.SphereImpostor, { mass: diameter * diameter, restitution: 0.1 }, scene);
  const force = new BABYLON.Vector3(
    100 * (Math.random() * 2 - 1),
    100 * (Math.random() * 2 - 1),
    0,
  );
  oid.physicsImpostor.applyImpulse(force, oid.getAbsolutePosition());
  oid.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(
    1 * (Math.random() * 2 - 1),
    1 * (Math.random() * 2 - 1),
    1 * (Math.random() * 2 - 1),
    0
  ));
  oid.material = oidMaterial;

  oid.diameter = diameter;

  oid.physicsImpostor.registerOnPhysicsCollide(ship.physicsImpostor, onAsteroidHitShip);
  if(ufo) {
    oid.physicsImpostor.registerOnPhysicsCollide(ufo.physicsImpostor, onAsteroidHitUfo);
  }
  return oid;
}

function disableShield() {
  lastHit = new Date().getTime();
  shieldMaterial.alpha = 0;
  shield = false;
}

function enableShield() {
  shieldMaterial.alpha = 0.5;
  shield = true;
}

function onAsteroidHitShip(me, other) {
  if (shield) {
    disableShield();
    return;
  }

  gameOver = true;
  setOnboarding('dead');

  //exhaust.stop();

  const explosion = fx.createShipExplosion(ship);

  other.setAngularVelocity(new BABYLON.Quaternion(0,0,10,0));
  exhaust.start();

  setTimeout(() => exhaust.stop(), 500);
  setTimeout(() => {
    scene.removeMesh(ship);

    setTimeout(() => scene.getPhysicsEngine().removeImpostor(other), 0);
  }, 1000);
}

function onAsteroidHitUfo(me, other) {
  const explosion = fx.createUfoExplosion(ufo);
  other.setAngularVelocity(new BABYLON.Quaternion(0,0,10,0));

  ufo = false;
}

function onBallHitShip(me, other) {
  me.object.ttl = 0;
  fx.createBallExplosion(me.object.position.clone());

  if (shield) {
    disableShield();
    return;
  }

  onAsteroidHitShip(me, other);
}

function onBallHitUfo(me, other) {
  me.object.ttl = 0;

  if (ufo.level) {
    gui.addScore(500 + ufo.level * 100);
  }

  fx.createBallExplosion(me.object.position.clone());
  onAsteroidHitUfo(me, other);
}

function onShipHitUfo(me, other) {
  onAsteroidHitShip(other, me);
  onAsteroidHitUfo(me, other);
}

function createBall(tgt, owner, speed) {
  tgt.normalize();

  const ball = BABYLON.MeshBuilder.CreateBox(`ball`, { size: 0.1 }, scene);
  ball.position = tgt.scale(2).add(owner.position);

  ball.physicsImpostor = new BABYLON.PhysicsImpostor(ball, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.1 }, scene);

  ball.physicsImpostor.applyImpulse(owner.physicsImpostor.getLinearVelocity(), ball.getAbsolutePosition());
  ball.physicsImpostor.applyImpulse(tgt.scale(speed), ball.getAbsolutePosition());
  owner.physicsImpostor.applyImpulse(tgt.scale(-1 * BALL_RECOIL), owner.getAbsolutePosition());

  ball.ttl = new Date().getTime() + BALL_TTL;
  balls.push(ball);

  ball.physicsImpostor.registerOnPhysicsCollide(oids.map(w => w.physicsImpostor), onBallHitAsteroid);
  if (ufo) {
    ball.physicsImpostor.registerOnPhysicsCollide(ufo.physicsImpostor, onBallHitUfo);
  }
  ball.physicsImpostor.registerOnPhysicsCollide(ship.physicsImpostor, onBallHitShip);

  return ball;
}

function onBallHitAsteroid(me, other) {
  me.object.ttl = 0;
  crackAsteroid(other.object);
  fx.createBallExplosion(me.object.position.clone());
}

function crackAsteroid(oid) {
  if (onboardingMode === 'hit') {
    setOnboarding('bye');
  }

  const speedMultiplier = Math.ceil(Math.sqrt(oid.physicsImpostor.getLinearVelocity().length()));
  const sizeMultiplier = Math.ceil(Math.sqrt(9 - oid.diameter));

  console.log(speedMultiplier, sizeMultiplier)

  gui.addScore(10 * speedMultiplier * sizeMultiplier);

  scene.removeMesh(oid);
  setTimeout(() => scene.getPhysicsEngine().removeImpostor(oid.physicsImpostor), 0);
  oids = oids.filter(i => i !== oid);

  const v1 = new BABYLON.Vector3(Math.random(), Math.random(), 0).normalize();

  if (oid.diameter > 3 && oid.gen <= 1) {
    if(Math.random() > .5 && oid.diameter > 4) {
      const v2 = new BABYLON.Vector3(Math.random(), Math.random(), 0).normalize();

      a1 = createAsteroid(oid.diameter / 2);
      a2 = createAsteroid(oid.diameter / 2);
      a3 = createAsteroid(oid.diameter / 2);

      a1.position = oid.position.clone().add(v1.scale(oid.diameter * 0.45));
      a2.position = oid.position.clone().add(v1.scale(oid.diameter * 0.45));
      a3.position = oid.position.clone().add(v1.add(v2).scale(oid.diameter * 0.45));
      a1.gen = oid.gen + 1;
      a2.gen = oid.gen + 1;
      a3.gen = oid.gen + 1;
      oids.push(a1);
      oids.push(a2);
      oids.push(a3);

      balls.map(ball => ball.physicsImpostor.registerOnPhysicsCollide([a1, a2, a3].map(w => w.physicsImpostor), onBallHitAsteroid));
    } else {
      a1 = createAsteroid(oid.diameter - 1);
      a2 = createAsteroid(oid.diameter - 1);

      a1.position = oid.position.clone().add(v1.scale(oid.diameter * 0.4));
      a2.position = oid.position.clone().add(v1.scale(-1 * oid.diameter * 0.4 ));

      a1.gen = oid.gen + 1;
      a2.gen = oid.gen + 1;
      oids.push(a1);
      oids.push(a2);

      balls.map(ball => ball.physicsImpostor.registerOnPhysicsCollide([a1, a2].map(w => w.physicsImpostor), onBallHitAsteroid));
    }

    // FIXME: small should fire, big ones should stay on place
  }

  fx.createOidExplosion(v1, oid.position);

  if(oids.length === 0) { // all asteroids gone
    nextLevel();
  }
}

function nextLevel() {
  level++;
  if (onboardingMode !== 'move') {
    setOnboarding('level');
  }
  for(i=0; i<Math.pow(2, level); i++) {
    const oid = createAsteroid(Math.random() * 8 + 1);
    oids.push(oid);
  }
}

function onResize() {
  engine.resize();
  MAX_Y = Math.sin(fov / 2) * 109 * 2;
  MAX_X = MAX_Y * (window.innerWidth / window.innerHeight);
}

function onKeyDown({ key }) {
  if(gameOver) {
    if (key === "Enter") {
      window.history.go(0);
    }
    return;
  }
  keys[key] = 1;

  if (onboardingMode === 'move') {
    if (['ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(key) >= 0) {
      setOnboarding('fire');
    }
  }

  if (onboardingMode === 'fire') {
    if (key === ' ') {
      setOnboarding('hit');
    }
  }

  if (key === 'ArrowLeft')
    ship.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(0,0,5,0));

  if (key === 'ArrowRight')
    ship.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(0,0,-5,0));

  if (key === 'ArrowUp')
    exhaust.start();
}

function onKeyUp({key}) {
  if(gameOver) {
    return;
  }
  keys[key] = 0;

  if (key === 'ArrowLeft')
    ship.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(0,0,0,0));

  if (key === 'ArrowRight')
    ship.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(0,0,0,0));

  if (key === 'ArrowUp')
    exhaust.stop();
}

function fire() {
  if (overheat >= MAX_OVERHEAT) {
    return;
  }

  const q = ship.rotationQuaternion.toEulerAngles();

  const tgt = new BABYLON.Vector3(
    Math.sin(q.z) * -1,
    Math.cos(q.z),
    0,
  );

  const ball = createBall(tgt, ship, BALL_SPEED);
  ball.fire = fx.createShipBall(ball);

  overheat += 1;
}

let prev = 0;

function wrap(obj) {
  if(obj.position.x > MAX_X / 2) {
    obj.position.x -= MAX_X;
  }

  if(obj.position.x < -MAX_X / 2) {
    obj.position.x += MAX_X;
  }

  if(obj.position.y > MAX_Y / 2) {
    obj.position.y -= MAX_Y;
  }

  if(obj.position.y < -MAX_Y / 2) {
    obj.position.y += MAX_Y;
  }

  obj.position.z = 0;
}

function updateScene() {
  const now = new Date().getTime();

  if (!gameOver) {
    if (!shield) {
      if (now - lastHit > SHIELD_RECHARGE_TIME) {
        enableShield();
      }
    }
  }

  overheat = Math.max(0, overheat - (now - prev) / 1000);

  if (keys.ArrowUp && !gameOver) {
    const q = ship.rotationQuaternion.toEulerAngles();
    const force = new BABYLON.Vector3(
      0.5 * Math.sin(q.z) * -1,
      0.5 * Math.cos(q.z),
      0,
    );
    ship.physicsImpostor.applyImpulse(force, ship.getAbsolutePosition());
  }

  if (keys[' ']) {
    keys[' '] = 0;
    fire();
  }

  shipMaterial.diffuseColor.g = 1 - (overheat / MAX_OVERHEAT);
  shipMaterial.diffuseColor.b = 1 - (overheat / MAX_OVERHEAT);
  shipMaterial.emissiveColor.r = (overheat / MAX_OVERHEAT);

  oids.map(wrap);
  balls.map(wrap);
  if (ufo) {
    wrap(ufo);
  }
  wrap(ship);

  balls.filter(ball => ball.ttl <= now).map(ball => {
    scene.removeMesh(ball);
    ball.fire.stop();
    setTimeout(() => scene.getPhysicsEngine().removeImpostor(ball.physicsImpostor), 0);
  });
  balls = balls.filter(ball => ball.ttl > now);

  prev = now;
};