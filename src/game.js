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

const ship = createShip();
const exhaust = fx.createExhaust(ship);
ship.material = shipMaterial;

let ufo = null;

let oids = [];
let balls = [];
let gameOver = false;
let overheat = 0;

createUfo();

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

// let down = false;
// let mouse = {x:0, y: 0};

// document.addEventListener('gesturestart', function (e) {
//     e.preventDefault();
// });

// document.addEventListener('touchmove', function(event) {
//   event = event.originalEvent || event;
//   if(event.scale > 1) {
//     event.preventDefault();
//   }
// }, false);

// //if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
//   canvas.addEventListener('mousedown', e => {
//     down = true;
//     onMove(e);
//     exhaust.start();
//   });

//   canvas.addEventListener('mousemove', onMove);

//   canvas.addEventListener('mouseup', () => {
//     down = false;
//     exhaust.stop();
//   });
// //}

// function onMove (e) {
//   mouse.x = (e.clientX / window.innerWidth) - .5;
//   mouse.y = (e.clientY / window.innerHeight) - .5;
// }

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
  return ship;
}

function createUfo() {
  ufo = BABYLON.MeshBuilder.CreateSphere("ufo", {diameter: 2.5, diameterY: 1.2, segments: 6}, scene);
  ufo.position.x = 10;
  ufo.position.y = 10;
  ufo.physicsImpostor = new BABYLON.PhysicsImpostor(ufo, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.1 }, scene);

  oids.map(oid => oid.physicsImpostor.registerOnPhysicsCollide(ufo.physicsImpostor, onAsteroidHitUfo));
  balls.map(oid => oid.physicsImpostor.registerOnPhysicsCollide(ufo.physicsImpostor, onBallHitUfo));
  ship.physicsImpostor.registerOnPhysicsCollide(ufo.physicsImpostor, onShipHitUfo);
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
  oid.physicsImpostor.registerOnPhysicsCollide(ufo.physicsImpostor, onAsteroidHitUfo);
  return oid;
}

function onAsteroidHitShip(me, other) {
  gameOver = true;
  setOnboarding('dead');

  //exhaust.stop();

  const explosion = fx.createExplosion(ship);

  other.setAngularVelocity(new BABYLON.Quaternion(0,0,10,0));
  exhaust.start();

  setTimeout(() => exhaust.stop(), 500);
  setTimeout(() => {
    scene.removeMesh(ship);

    setTimeout(() => scene.getPhysicsEngine().removeImpostor(other), 0);
  }, 1000);
}

function onAsteroidHitUfo(me, other) {
  const explosion = fx.createExplosion(ufo);
  other.setAngularVelocity(new BABYLON.Quaternion(0,0,10,0));

  setTimeout(() => {
    scene.removeMesh(ufo);

    setTimeout(() => scene.getPhysicsEngine().removeImpostor(ufo), 0);

    setTimeout(createUfo, 3000);
  }, 1000);
}

function onBallHitUfo(me, other) {
  me.object.ttl = 0;
  fx.createBallExplosion(me.object.position.clone());
  onAsteroidHitUfo(me, other);
}

function onShipHitUfo(me, other) {
  onAsteroidHitShip(other, me);
  onAsteroidHitUfo(me, other);
}

function createBall() {
  const ball = BABYLON.MeshBuilder.CreateBox(`ball`, { size: 0.1 }, scene);
  ball.material = ballMaterial;
  const q = ship.rotationQuaternion.toEulerAngles();

  ball.position = ship.position.clone();
  ball.position.x += 2 * Math.sin(q.z) * -1;
  ball.position.y += 2 * Math.cos(q.z);

  ball.physicsImpostor = new BABYLON.PhysicsImpostor(ball, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.1 }, scene);

  const force = new BABYLON.Vector3(
    50 * Math.sin(q.z) * -1,
    50 * Math.cos(q.z),
    0,
  ).add(ship.physicsImpostor.getLinearVelocity()); // .add(ship.velocity);

  const force2 = new BABYLON.Vector3(
    -1 * Math.sin(q.z) * -1,
    -1 * Math.cos(q.z),
    0,
  );

  ball.physicsImpostor.applyImpulse(force, ball.getAbsolutePosition());
  ship.physicsImpostor.applyImpulse(force2, ship.getAbsolutePosition());

  ball.ttl = new Date().getTime() + 1000;
  balls.push(ball);

  const fire = fx.createFire(ball);

  ball.fire = fire;

  ball.physicsImpostor.registerOnPhysicsCollide(oids.map(w => w.physicsImpostor), onBallHitAsteroid);
  ball.physicsImpostor.registerOnPhysicsCollide(ufo.physicsImpostor, onBallHitUfo);
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
  if (overheat >= 10) {
    return;
  }

  createBall();
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

  shipMaterial.diffuseColor.g = 1 - (overheat / 10);
  shipMaterial.diffuseColor.b = 1 - (overheat / 10);
  shipMaterial.emissiveColor.r = (overheat / 10);

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