class Gui {
  constructor(scene) {
    const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui");

    const message = new BABYLON.GUI.TextBlock();
    message.color = "white";
    message.fontSize = 24;
    message.top = 50;
    ui.addControl(message);
    this.message = message;

    const score = new BABYLON.GUI.TextBlock();
    score.color = "white";
    score.fontSize = 24;
    score.top = -1 * window.innerHeight / 2 + 30;
    // FIXME: update position on window resize
    ui.addControl(score);
    this.score = score;

    this.targetScore = 1;
    this.currentScore = 1;

    setInterval(() => {
      if (this.targetScore > this.currentScore) {
        this.currentScore += 10;
        this.score.text = `${this.currentScore}`;
      }
    }, 100);
  }

  setMessage(text) {
    this.message.text = text;
  }

  resetScore() {
    this.currentScore = 0;
    this.targetScore = 0;
    this.score.text = '0';
  }

  addScore(value) {
    this.targetScore += value;
  }
}

window.Gui = Gui;
