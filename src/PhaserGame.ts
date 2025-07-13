import Phaser from "phaser";
import GameScene from "./scenes/GameScene";

let phaserGame: Phaser.Game | null = null;

function calculateGameDimensions() {
  const container = document.getElementById("game-container");
  let gameWidth = 800;
  let gameHeight = 600;

  if (container) {
    gameWidth = container.clientWidth * window.devicePixelRatio;
    gameHeight = container.clientHeight * window.devicePixelRatio;
  }

  return { gameWidth, gameHeight };
}

function loadPhaser() {
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = null;
  }

  const { gameWidth, gameHeight } = calculateGameDimensions();

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "game-container",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: gameWidth,
      height: gameHeight,
    },
    pixelArt: true,
    render: {
      antialias: false,
      preserveDrawingBuffer: true,
      failIfMajorPerformanceCaveat: true,
    },
    backgroundColor: "#c3bedd",
    scene: [GameScene],
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
  };

  phaserGame = new Phaser.Game(config);
}

function destroyPhaserGame() {
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = null;
  }
}

window.addEventListener("resize", () => {
  if (phaserGame && phaserGame.isBooted) {
    const { gameWidth, gameHeight } = calculateGameDimensions();
    phaserGame.scale.resize(gameWidth, gameHeight);
  }
});

export { loadPhaser, destroyPhaserGame };
