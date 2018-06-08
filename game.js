var canvas = document.getElementById("renderCanvas"); // Get the canvas element
var engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

let MAX_Y = 100;
let MAX_X = 100;
let fov = 0;

const scene = createScene(); //Call the createScene function
const ship = createShip();

let level = -1;

const exhaust = createExhaust();
exhaust.emitter = ship;

var oidMaterial = new BABYLON.StandardMaterial("asteroid material", scene);
oidMaterial.diffuseColor = new BABYLON.Color3(.5, .5, .5);
oidMaterial.wireframe = true;

var ballMaterial = new BABYLON.StandardMaterial("ball material", scene);
ballMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);

// ship.enablePhysics();

let wrapped = [
  ship
];

let balls = [];
let gameOver = false;

window.addEventListener("resize", onResize);
const keys = {};

const firing = false;

document.onkeydown = onKeyDown;
document.onkeyup = onKeyUp;

nextLevel();

scene.registerBeforeRender(updateScene);
engine.runRenderLoop(() => scene.render());

function createScene() {
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 0, -100), scene);
  camera.setTarget(BABYLON.Vector3.Zero());

  fov = camera.fov;
  MAX_Y = Math.sin(camera.fov / 2) * 109 * 2;
  MAX_X = MAX_Y * (window.innerWidth / window.innerHeight);

  // console.log(MAX_Y, MAX_X)
  // camera.attachControl(canvas, true);

  var bgMaterial = new BABYLON.StandardMaterial("background", scene);
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

function createExhaust() {
  const exhaust = new BABYLON.ParticleSystem("exhaust", 2000, scene);
  exhaust.particleTexture = new BABYLON.Texture("textures/flare.png", scene);
  exhaust.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
  exhaust.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
  exhaust.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
  exhaust.minSize = 0.1;
  exhaust.maxSize = 0.5;
  exhaust.minLifeTime = 0;
  exhaust.maxLifeTime = 0.5;
  exhaust.emitRate = 1000;
  exhaust.minEmitBox = new BABYLON.Vector3(-0.3, -1, 0);
  exhaust.maxEmitBox = new BABYLON.Vector3(0.3, -1, 0);
  exhaust.direction1 = new BABYLON.Vector3(-1, 5, 0).normalize();
  exhaust.direction2 = new BABYLON.Vector3(1, 5, 0).normalize();
  exhaust.minEmitPower = -20;
  exhaust.maxEmitPower = -50;
  exhaust.updateSpeed = 0.005;

  return exhaust;
}

function createAsteroid(diameter) {
  const oid = BABYLON.MeshBuilder.CreateSphere(`oid`, { diameter, segments: 2 }, scene);
  oid.gen = 0;
  oid.position = new BABYLON.Vector3(
    Math.random() * 80 - 40,
    Math.random() * 80 - 40,
    0
  );
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

  oid.physicsImpostor.registerOnPhysicsCollide(ship.physicsImpostor, (me, other) => {
    gameOver = true;

    //exhaust.stop();

    const explosion = createExplosion();

    other.setAngularVelocity(new BABYLON.Quaternion(0,0,10,0));
    exhaust.start();

    setTimeout(() => exhaust.stop(), 500);
    setTimeout(() => {
      scene.removeMesh(ship);

      setTimeout(() => scene.getPhysicsEngine().removeImpostor(other), 0);
    }, 1000);
  });

  return oid;
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

  const fire = new BABYLON.ParticleSystem("exhaust", 2000, scene);
  fire.particleTexture = new BABYLON.Texture("textures/flare.png", scene);
  fire.color1 = new BABYLON.Color4(0, 0.8, 1.0, 1.0);
  fire.color2 = new BABYLON.Color4(0, 0.5, 1.0, 1.0);
  fire.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
  fire.minSize = 0.1;
  fire.maxSize = 1.5;
  fire.minLifeTime = 0;
  fire.maxLifeTime = 0.1;
  fire.emitRate = 1000;
  fire.minEmitBox = new BABYLON.Vector3(0.1, 0.1, 0);
  fire.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0);

  fire.direction1 = new BABYLON.Vector3(-0.2, -0.2, -0.2);
  fire.direction2 = new BABYLON.Vector3(0.2, 0.2, 0.2);
  fire.minAngularSpeed = -1;
  fire.maxAngularSpeed = 1;
  fire.minEmitPower = 0.5;
  fire.maxEmitPower = 1;
  fire.updateSpeed = 0.005;

  fire.emitter = ball;
  //explosion.targetStopDuration = .3;
  fire.start();

  ball.fire = fire;

  ball.physicsImpostor.registerOnPhysicsCollide(wrapped.map(w => w.physicsImpostor), (me, other) => {
    me.object.ttl = 0;
    crackAsteroid(other.object);
    createBallExplosion(ball.position.clone());
  });
}



function crackAsteroid(oid) {
  scene.removeMesh(oid);
  setTimeout(() => scene.getPhysicsEngine().removeImpostor(oid.physicsImpostor), 0);
  wrapped = wrapped.filter(i => i !== oid);

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
      wrapped.push(a1);
      wrapped.push(a2);
      wrapped.push(a3);
     } else {
      a1 = createAsteroid(oid.diameter - 1);
      a2 = createAsteroid(oid.diameter - 1);

      a1.position = oid.position.clone().add(v1.scale(oid.diameter * 0.4));
      a2.position = oid.position.clone().add(v1.scale(-1 * oid.diameter * 0.4 ));

      a1.gen = oid.gen + 1;
      a2.gen = oid.gen + 1;
      wrapped.push(a1);
      wrapped.push(a2);
    }

    // FIXME: small should fire, big ones should stay on place
  }

  createOidExplosion(v1, oid.position);

  if(wrapped.length === 1) { // all asteroids gone
    nextLevel();
  }
}

function nextLevel() {
  level++;
  console.log('NEXT LEVEL', level);
  for(i=0; i<Math.pow(2, level); i++) {
    const oid = createAsteroid(Math.random() * 8 + 1);
    wrapped.push(oid);
  }
}

function createExplosion() {
  const explosion = new BABYLON.ParticleSystem("explosion", 2000, scene);
  explosion.particleTexture = new BABYLON.Texture("textures/flare.png", scene);
  explosion.color1 = new BABYLON.Color4(1, 0.8, 1.0, 1.0);
  explosion.color2 = new BABYLON.Color4(1, 0.5, 1.0, 1.0);
  explosion.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
  explosion.minSize = 0.4;
  explosion.maxSize = 1.3;
  explosion.minLifeTime = 0;
  explosion.maxLifeTime = 0.5;
  explosion.emitRate = 1000;
  //explosion.minEmitBox = new BABYLON.Vector3(-0.3, -1, 0);
  //explosion.maxEmitBox = new BABYLON.Vector3(0.3, -1, 0);
  explosion.direction1 = new BABYLON.Vector3(-5, -5, -5);
  explosion.direction2 = new BABYLON.Vector3(5, 5, 5);
  explosion.minAngularSpeed = -2;
  explosion.maxAngularSpeed = 2;
  explosion.minEmitPower = 0.5;
  explosion.maxEmitPower = 4;
  explosion.updateSpeed = 0.005;

  explosion.emitter = ship;
  explosion.targetStopDuration = .3;
  explosion.start();
}


function createBallExplosion(target) {
  const explosion = new BABYLON.ParticleSystem("ball explosion", 2000, scene);
  explosion.particleTexture = new BABYLON.Texture("textures/flare.png", scene);
  explosion.color1 = new BABYLON.Color4(0, 0.8, 1.0, 1.0);
  explosion.color2 = new BABYLON.Color4(0, 0.5, 1.0, 1.0);
  explosion.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
  explosion.minSize = 0.1;
  explosion.maxSize = 1;
  explosion.minLifeTime = 0;
  explosion.maxLifeTime = 0.25;
  explosion.emitRate = 1000;
  //explosion.minEmitBox = new BABYLON.Vector3(-0.3, -1, 0);
  //explosion.maxEmitBox = new BABYLON.Vector3(0.3, -1, 0);
  explosion.direction1 = new BABYLON.Vector3(-20, -20, -20);
  explosion.direction2 = new BABYLON.Vector3(20, 20, 20);
  explosion.minAngularSpeed = -2;
  explosion.maxAngularSpeed = 2;
  explosion.minEmitPower = 0.5;
  explosion.maxEmitPower = 4;
  explosion.updateSpeed = 0.005;

  explosion.emitter = target;
  explosion.targetStopDuration = .03;
  explosion.start();
}

function createOidExplosion(vector, target) {
  const explosion = new BABYLON.ParticleSystem("oid explosion", 2000, scene);
  explosion.particleTexture = new BABYLON.Texture("textures/flare.png", scene);
  explosion.color1 = new BABYLON.Color4(0.5, 0.5, 0.5, 0);
  explosion.color2 = new BABYLON.Color4(1.0, 1.0, 1.0, 0);
  explosion.colorDead = new BABYLON.Color4(0, 0, 0.0, 0.0);
  explosion.minSize = 0.1;
  explosion.maxSize = 1;
  explosion.minLifeTime = 1;
  explosion.maxLifeTime = 2;
  explosion.emitRate = 2000;
  //explosion.minEmitBox = new BABYLON.Vector3(-0.3, -1, 0);
  //explosion.maxEmitBox = new BABYLON.Vector3(0.3, -1, 0);
  explosion.direction1 = vector.scale(100); //new BABYLON.Vector3(-20, -20, -20);
  //explosion.direction2 = vector.add(new BABYLON.Vector3(-1, -1, 0)); //new BABYLON.Vector3(20, 20, 20);
  explosion.minAngularSpeed = -2;
  explosion.maxAngularSpeed = 2;
  explosion.minEmitPower = 0.1;
  explosion.maxEmitPower = 1;
  explosion.updateSpeed = 0.005;

  explosion.emitter = target;
  explosion.targetStopDuration = .03;
  explosion.start();
}

function onResize() {
  engine.resize();
  MAX_Y = Math.sin(fov / 2) * 109 * 2;
  MAX_X = MAX_Y * (window.innerWidth / window.innerHeight);
}

function onKeyDown({ key }) {
  if(gameOver) {
    if (key === " ") {
      window.history.go(0);
    }
    return;
  }
  keys[key] = 1;

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

function updateScene() {
  const now = new Date().getTime();

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
    createBall();
  }

  wrapped.map(obj => {
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
  })

  balls.filter(ball => ball.ttl <= now).map(ball => {
    console.log('ball ttl done');
    //ball.physicsImpostor = null;
    scene.removeMesh(ball);
    ball.fire.stop();
    setTimeout(() => scene.getPhysicsEngine().removeImpostor(ball.physicsImpostor), 0);
  });
  balls = balls.filter(ball => ball.ttl > now);
};