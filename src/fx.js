class Fx {
  constructor(scene) {
    this.flareTexture = new BABYLON.Texture("textures/flare.png", scene);
    this.scene = scene;
  }

  createExhaust(target) {
    const exhaust = new BABYLON.ParticleSystem("exhaust", 2000, this.scene);
    exhaust.particleTexture = this.flareTexture;

    exhaust.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
    exhaust.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
    exhaust.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

    // exhaust.color1 = new BABYLON.Color4(1.0, 1.0, 0.0, 1.0),
    // exhaust.color1 = new BABYLON.Color4(1.0, 0.0, 0.5, 1.0),
    // exhaust.colorDead = new BABYLON.Color4(0.2, 0.0, 0.0, 0.0),

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

    exhaust.emitter = target;

    return exhaust;
  }

  createOidExplosion(vector, target) {
    const explosion = new BABYLON.ParticleSystem("oid explosion", 2000, this.scene);
    explosion.particleTexture = this.flareTexture;

    explosion.color1 = new BABYLON.Color4(0.5, 0.5, 0.5, 0);
    explosion.color2 = new BABYLON.Color4(1.0, 1.0, 1.0, 0);
    explosion.colorDead = new BABYLON.Color4(0, 0, 0.0, 0.0);
    explosion.minSize = 0.1;
    explosion.maxSize = 1;
    explosion.minLifeTime = 1;
    explosion.maxLifeTime = 2;
    explosion.emitRate = 2000;

    explosion.direction1 = vector.scale(100);

    explosion.minAngularSpeed = -2;
    explosion.maxAngularSpeed = 2;
    explosion.minEmitPower = 0.1;
    explosion.maxEmitPower = 1;
    explosion.updateSpeed = 0.005;

    explosion.emitter = target;
    explosion.targetStopDuration = .03;
    explosion.start();
  }

  createBallExplosion(target) {
    const explosion = new BABYLON.ParticleSystem("ball explosion", 2000, this.scene);
    explosion.particleTexture = this.flareTexture;

    explosion.color1 = new BABYLON.Color4(0, 0.8, 1.0, 1.0);
    explosion.color2 = new BABYLON.Color4(0, 0.5, 1.0, 1.0);
    explosion.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
    explosion.minSize = 0.1;
    explosion.maxSize = 1;
    explosion.minLifeTime = 0;
    explosion.maxLifeTime = 0.25;
    explosion.emitRate = 1000;

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

  createUfoExplosion(target) {
    return this.createColorExplosion(
      target,
      new BABYLON.Color4(0.8, 1.0, 0.8, 1.0),
      new BABYLON.Color4(0.5, 1.0, 0.5, 1.0),
      new BABYLON.Color4(0.2, 0.1, 0.0, 0.0),
    );
  }

  createShipExplosion(target) {
    return this.createColorExplosion(
      target,
      new BABYLON.Color4(1.0, 0.8, 1.0, 1.0),
      new BABYLON.Color4(1.0, 0.5, 1.0, 1.0),
      new BABYLON.Color4(0.0, 0.0, 0.2, 0.0),
    );
  }

  createColorExplosion(target, c1, c2, c3) {
    const explosion = new BABYLON.ParticleSystem("explosion", 2000, this.scene);
    explosion.particleTexture = this.flareTexture;

    explosion.color1 = c1;
    explosion.color2 = c2;
    explosion.colorDead = c3;

    explosion.minSize = 0.4;
    explosion.maxSize = 1.3;
    explosion.minLifeTime = 0;
    explosion.maxLifeTime = 0.5;
    explosion.emitRate = 1000;

    explosion.direction1 = new BABYLON.Vector3(-5, -5, -5);
    explosion.direction2 = new BABYLON.Vector3(5, 5, 5);
    explosion.minAngularSpeed = -2;
    explosion.maxAngularSpeed = 2;
    explosion.minEmitPower = 0.5;
    explosion.maxEmitPower = 4;
    explosion.updateSpeed = 0.005;

    explosion.emitter = target;
    explosion.targetStopDuration = .3;
    explosion.start();
  }

  createColorBall(target, c1, c2, c3) {
    const fire = new BABYLON.ParticleSystem("ball", 2000, scene);
    fire.particleTexture = this.flareTexture;

    fire.color1 = c1;
    fire.color2 = c2;
    fire.colorDead = c3;
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

    fire.emitter = target;
    fire.start();

    return fire;
  }

  createShipBall(target) {
    return this.createColorBall(
      target,
      new BABYLON.Color4(0.0, 0.8, 1.0, 1.0),
      new BABYLON.Color4(0.0, 0.5, 1.0, 1.0),
      new BABYLON.Color4(0.0, 0.0, 0.2, 0.0),
    );
  }

  createUfoBall(target) {
    return this.createColorBall(
      target,
      new BABYLON.Color4(0.0, 1.0, 0.0, 1.0),
      new BABYLON.Color4(0.5, 1.0, 0.5, 1.0),
      new BABYLON.Color4(0.0, 0.2, 0.0, 0.0),
    );
  }
}

window.Fx = Fx;