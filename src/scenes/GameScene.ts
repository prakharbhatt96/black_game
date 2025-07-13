import Phaser from "phaser";
import { destroyPhaserGame } from "../PhaserGame";
export default class GameScene extends Phaser.Scene {
  gridSize!: number;
  cellSize!: number;
  spacing!: number;
  grid!: Phaser.GameObjects.Rectangle[][];
  blackCells!: Set<string>;
  boundary!: Phaser.GameObjects.Rectangle;
  private isMobile: boolean | undefined;
  private reset!: Phaser.GameObjects.Image;
  private bg!: Phaser.GameObjects.Image;
  private titeImage!: Phaser.GameObjects.Image;
  private new!: Phaser.GameObjects.Image;
  private isMobiles: boolean = false;
  private gameTimer!: Phaser.Time.TimerEvent;
  private timerText!: Phaser.GameObjects.Text;
  private remainingTime!: number;
  private countdownEvent!: Phaser.Time.TimerEvent;


  sounds: {
    // bgm: Phaser.Sound.BaseSound;
    flip: Phaser.Sound.BaseSound;
    win: Phaser.Sound.BaseSound;
  } | undefined;
  private audioButton: Phaser.GameObjects.Image | undefined;
  private isAudioOn: boolean | undefined;
  private gridSizeButtons: Phaser.GameObjects.Text[] = [];
  private selectedGridSizeIndex: number = 0; // Default to first button (3x3)

  constructor() {
    super({ key: "GridGame" });
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  }

  preload() {
    this.load.image("theblackBG", "assets/theblack_assets/theblackBG.webp");
    this.load.image("theblack", "assets/theblack_assets/theblack.webp");
    this.load.image("theblacknew", "assets/theblack_assets/theblacknew.webp");
    this.load.image("theblackreset", "assets/theblack_assets/theblackreset.webp");
    this.load.image("theblackcontinue", "assets/theblack_assets/theblackcontinue.webp");
    this.load.image("theblackgameover", "assets/theblack_assets/theblackgameover.webp");
    this.load.image("audioOff", "assets/theblack_assets/audioOff.webp");
    this.load.image("audioOn", "assets/theblack_assets/audioOn.webp");
    // this.load.audio("bgm", "assets/theblack_assets/bgm.mp3");
    this.load.audio("flip", "assets/theblack_assets/flip.mp3");
    this.load.audio("win", "assets/theblack_assets/win.mp3");
    this.load.image("timesup", "assets/theblack_assets/timesup.webp");
  }

  init(data: { gridSize?: number }) {
    this.gridSize = data.gridSize || 3;
  }

  create() {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
    this.sounds = {
      flip: this.sound.add("flip"),
      win: this.sound.add("win")
    };
    const { isMobile } = this.getPlatformInfo();
    const width = this.scale.width;
    const height = this.scale.height;
    const isTablet = window.innerWidth >= 600 && window.innerWidth <= 1024;
    const isLandscape = this.isMobileLandscape?.() || width > height;
    const screenMin = Math.min(width, height);
    const dpr = window.devicePixelRatio;
    this.bg = this.add.image(width / 2, height / 2, 'theblackBG');
    const bgScale = Math.max(width / this.bg.width, height / this.bg.height);
    this.bg.setScale(bgScale);
    let titleImageScale = 0.5;
    let titleImageHeight = height * 0.1;
    let titleImageWidth = width * 0.5;
  
    if (isMobile) {
      if (isLandscape) {
        titleImageScale = dpr * 0.3;
        titleImageHeight = height * 0.1;
      } else if (isTablet) {
        titleImageScale = 1;
        titleImageHeight = height * 0.07;
      } else {
        titleImageScale = 0.7;
        titleImageHeight = height * 0.1;
      }
    }
  
    this.titeImage = this.add.image(titleImageWidth, titleImageHeight, 'theblack')
      .setScale(titleImageScale)
      .setOrigin(0.5);
  
    // Grid Initialization
    this.calculateResponsiveGrid();
    this.grid = [];
    this.blackCells = new Set();
  
    while (this.blackCells.size < 4) {
      const i = Phaser.Math.Between(0, this.gridSize * this.gridSize - 1);
      this.blackCells.add(`${Math.floor(i / this.gridSize)},${i % this.gridSize}`);
    }
  
    for (let row = 0; row < this.gridSize; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        const index = `${row},${col}`;
        const isBlack = this.blackCells.has(index);
        const cell = this.add.rectangle(
          this.getCellX(col), this.getCellY(row),
          this.cellSize, this.cellSize,
          isBlack ? 0x000000 : 0xffffff
        ).setInteractive();
        cell.setData({ row, col, color: isBlack ? 'black' : 'white' });
        cell.on("pointerdown", () => this.handleCellClick(cell));
        this.grid[row][col] = cell;
      }
    }
  
    // Grid Boundary
    this.boundary = this.add.rectangle(
      width / 2,
      height / 2 + height * 0.05,
      this.getTotalGridWidth() + 10,
      this.getTotalGridHeight() + 10,
      0xe11d4a
    ).setStrokeStyle(4, 0xffffff).setDepth(-1);
  
    // New Button
    let newScale = dpr * 0.75;
    let newX = width / 2;
    let newY = height * 0.9;
  
    if (isMobile) {
      newScale = 2;
      if (isLandscape) {
        newX = width * 0.13;
        newY = height / 2;
        newScale = dpr * 0.5;
      } else if (isTablet) {
        newY = height * 0.86;
      } else {
        newY = height * 0.8;
      }
    }
  
    this.new = this.add.image(newX, newY, "theblacknew")
      .setOrigin(0.5)
      .setScale(newScale)
      .setInteractive()
      .setDepth(12)
      .on("pointerdown", () => {
        this.scene.restart();
        this.sound.stopAll();
      });
  
    this.createGridSizeButtons();
  
    this.remainingTime = (this.gridSize) * 60;
  
    let timerX = width / 1.62;
    let timerY = height * 0.27;
    let fontSize = `${Math.max(24, width * 0.02625)}px`;
  
    if (isMobile) {
      timerX = width * 0.78;
      timerY = height * 0.12;
      fontSize = `${Math.max(24, width * 0.07)}px`;
      if (isTablet) {
        timerY = width * 0.27;
        timerX = width * 0.85;
      }
      if (isLandscape) {
        timerX = width * 0.8;
        timerY = height * 0.32;
        const sizeMult = isTablet ? 0.055 : 0.06;
        fontSize = `${screenMin * sizeMult}px`;
      }
    }
  
    this.timerText = this.add.text(timerX, timerY, '', {
      fontSize, color: '#3c3b3d',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 0.5
    }).setOrigin(0.5).setDepth(2);
  
    this.updateTimerText();
  
    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.remainingTime--;
        this.updateTimerText();
        if (this.remainingTime <= 0) {
          this.countdownEvent.remove();
          this.showGameOverPopupWithImage("timesup");
        }
      },
      loop: true
    });
  
    // Audio Button
    this.isAudioOn = localStorage.getItem("isAudioOn") === "true";
    let audioX = width * 0.55;
    let audioY = height * 0.27;
    let audioScale = 0.3;
  
    if (isMobile) {
      audioX = width * 0.6;
      audioY = height * 0.22;
      audioScale = 0.6;
      if (isTablet) {
        audioY = height * 0.07;
      }
      if (isLandscape) {
        audioX = width * 0.13;
        audioY = height * 0.32;
        audioScale = 1;
      }
    }
  
    this.audioButton = this.add.image(audioX, audioY, this.isAudioOn ? "audioOn" : "audioOff")
      .setInteractive()
      .setScale(isMobile ? 0.6 : audioScale * dpr * 1.25)
      .on("pointerdown", () => {
        this.isAudioOn = !this.isAudioOn;
        localStorage.setItem("isAudioOn", String(this.isAudioOn));
        this.audioButton?.setTexture(this.isAudioOn ? "audioOn" : "audioOff");
      });
  }
  
  updateTimerText() {
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    this.timerText.setText(`${formatted}`);
  }
  createGridSizeButtons() {
    const buttonLabels = ["3X3", "4X4"];
    const gridSizes = [3, 4];
    const { isMobile } = this.getPlatformInfo();
    this.gridSizeButtons.forEach(button => button.destroy());
    this.gridSizeButtons = [];
    let buttonWidth = isMobile ? this.scale.width * 0.18 : 0;
    let buttonHeight = isMobile ? this.scale.height * 0.1 : 0;
    let buttonXStart = this.scale.width * 0.4;
    let buttonSpacing = isMobile ? this.scale.width * 0.2 : 80;

    let baseFontMultiplier = 0.03;
    if (isMobile) {
      buttonXStart = this.scale.width * 0.25;
      const width = window.innerWidth;
      const isTablet = width >= 600 && width <= 1024;
      if (isTablet) {
        buttonXStart = this.scale.width * 0.2;
      }
      if (this.isMobileLandscape()) {
        buttonWidth = this.scale.width * 0.01
        buttonHeight = this.scale.height * 0.02
        buttonXStart = this.scale.width * 0.77;
        buttonSpacing = this.scale.width * 0.065;
        baseFontMultiplier = 0.025;
      }
    }
    let buttonY = this.scale.height * 0.27;
    if (isMobile) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTablet = width >= 600 && width <= 1024;
      const isLandscape = width > height;
      buttonY = this.scale.height * 0.22;

      if (isTablet && !isLandscape) {
        buttonY = this.scale.height * 0.18;
      } else if (isTablet && isLandscape) {

        buttonY = this.scale.height * 0.5;
      } else if (!isTablet && isLandscape) {
        // Phone landscape
        buttonY = this.scale.height * 0.5;
      }
    }


    let nextButtonX = buttonXStart;
    buttonLabels.forEach((label, index) => {
      let font = isMobile ? 0.04 : 0.04 * 1.25 * devicePixelRatio;
      if (isMobile) {
        if (this.isMobileLandscape()) {
          font = 0.03;
        }
      }


      const computedFontSize = `${Math.max(24, this.scale.width * baseFontMultiplier)}px`;

      const button = this.add.text(nextButtonX, buttonY, label, {
        fontSize: computedFontSize,
        color: '#fff',
        backgroundColor: '#333',
        padding: {
          x: isMobile ? buttonWidth * 0.2 : 10 * window.devicePixelRatio * 1.25,
          y: isMobile ? buttonHeight * 0.2 : 5 * window.devicePixelRatio * 1.25,
        },
        align: "center"
      })
        .setOrigin(0.5)
        .setInteractive()
        .on("pointerdown", () => {
          this.selectedGridSizeIndex = index;
          this.highlightSelectedButton();
          this.scene.restart({ gridSize: gridSizes[index] });
        });

      this.gridSizeButtons.push(button);

      const buttonwidth = button.width;
      let paddingBetweenButtons = (isMobile ? 20 : 15) * window.devicePixelRatio;
      if (window.innerWidth > window.innerHeight) {
        paddingBetweenButtons = 15;
      }
      nextButtonX += buttonwidth + paddingBetweenButtons;

    })
    // Highlight the initially selected button based on current grid size
    this.selectedGridSizeIndex = gridSizes.indexOf(this.gridSize);
    if (this.selectedGridSizeIndex === -1) this.selectedGridSizeIndex = 0;
    this.highlightSelectedButton();
  }
  highlightSelectedButton() {
    this.gridSizeButtons.forEach((button, index) => {
      if (index === this.selectedGridSizeIndex) {
        // Selected button - apply tint
        button.setBackgroundColor('#e11d4a');
      } else {
        // Normal button
        button.setBackgroundColor('#333');
      }
    });
  }
  calculateResponsiveGrid() {
    console.log("grid changed", this.isAudioOn)
    this.sound.stopAll();
    let screenWidth = this.scale.width * 0.9;
    let screenHeight = this.scale.height * 0.9;
    if (this.isMobile) {
      if (this.isMobileLandscape()) {
        screenHeight = this.scale.height * 0.8;
      }
    }
    const maxCellSize = Math.min(screenWidth / this.gridSize, screenHeight / this.gridSize);
    let scaleSize = 0.5;
    if (this.isMobile) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTablet = width >= 600 && width <= 1024;

      if (isTablet) {
        scaleSize = 0.7; // Smaller than mobile, larger than desktop

      } else {
        scaleSize = 0.9; // Mobile phones

      }

      if (this.isMobileLandscape()) {
        scaleSize = 0.6
      }
    }
    this.cellSize = maxCellSize * scaleSize;
    this.spacing = maxCellSize * 0.03;
  }
  getTotalGridWidth() {
    return this.gridSize * this.cellSize + (this.gridSize - 1) * this.spacing;
  }
  getTotalGridHeight() {
    return this.gridSize * this.cellSize + (this.gridSize - 1) * this.spacing;
  }
  getCellX(col: number) {
    return (this.scale.width / 2) - (this.getTotalGridWidth() / 2) + col * (this.cellSize + this.spacing) + this.cellSize / 2;
  }
  getCellY(row: number) {
    let yOffset = (this.scale.height - this.getTotalGridHeight()) / 2;
    if (this.isMobile) {
      if (this.isMobileLandscape()) {
      } else if (window.innerWidth >= 600 && window.innerWidth <= 1024) {

        yOffset += this.scale.height * 0.05;
      } else {
        yOffset += this.scale.height * 0.02;
      }
    } else {
      yOffset += this.scale.height * 0.09;
    }

    return yOffset + row * (this.cellSize + this.spacing) + this.cellSize / 2;
  }
  toggleCellColor(cell: Phaser.GameObjects.Rectangle, index: string, color: string) {
    if (this.isAudioOn) {
      this.sounds?.flip.play();
    }
    this.tweens.add({
      targets: cell,
      scaleX: 0,
      duration: 150,
      ease: "Linear",
      onComplete: () => {

        cell.fillColor = color === "black" ? 0x000000 : 0xffffff;
        cell.setData("color", color);

        if (color === "black") {
          this.blackCells.add(index);
        } else {
          this.blackCells.delete(index);
        }
        this.tweens.add({
          targets: cell,
          scaleX: 1,
          duration: 150,
          ease: "Linear",
          onComplete: () => {
            this.checkWinCondition();
          }
        });
      }
    });
  }
  handleCellClick(cell: Phaser.GameObjects.Rectangle) {
    let row = cell.getData("row");
    let col = cell.getData("col");
    let index = `${row},${col}`;
    let currentColor = cell.getData("color");
    let newColor = currentColor === "black" ? "white" : "black";

    this.toggleCellColor(cell, index, newColor);

    let directions = [
      { r: -1, c: 0 }, { r: 1, c: 0 }, // Vertical
      { r: 0, c: -1 }, { r: 0, c: 1 }  // Horizontal
    ];

    for (let dir of directions) {
      let newRow = row + dir.r;
      let newCol = col + dir.c;
      let neighborIndex = `${newRow},${newCol}`;

      if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
        let neighbor = this.grid[newRow][newCol];
        let neighborNewColor = neighbor.getData("color") === "black" ? "white" : "black";
        this.toggleCellColor(neighbor, neighborIndex, neighborNewColor);
      }
    }

    this.time.delayedCall(50, () => {
      this.checkWinCondition();
    });
  }
  checkWinCondition() {
    let allBlack = true;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col].getData("color") !== "black") {
          allBlack = false;
          break;
        }
      }
      if (!allBlack) break;
    }

    if (allBlack) {
      setTimeout(() => {
        this.showGameOverPopupWithImage("theblackgameover");
        this.timerText.alpha = 0;
      }, 200);
    }
  }
  showGameOverPopupWithImage(imageKey = "theblackgameover") {
    if (this.isAudioOn) {
      this.sounds?.win.play();
    }
    this.new.destroy();
    const overlay = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.5
    ).setInteractive().on("pointerdown", () => { });
    const popup = this.add.image(this.scale.width / 2, this.scale.height / 2, imageKey)
      .setDepth(12)
      .setOrigin(0.5);
    const popupScale = Math.min(this.scale.width * 0.7 / popup.width, this.scale.height * 0.5 / popup.height);
    popup.setScale(popupScale);
    const buttonScale = popupScale * 0.8;
    let homeheight = this.isMobile
      ? this.isMobileLandscape()
        ? this.scale.height * 0.59
        : this.scale.height * 0.53
      : this.scale.height * 0.59;

    const homewidth = popup.x;
    this.add.image(homewidth, homeheight, "theblackcontinue")
      .setOrigin(0.5)
      .setScale(buttonScale)
      .setInteractive()
      .setDepth(12)
      .on("pointerdown", () => {
        this.redirectToMainMenu();
      });
  }
  redirectToMainMenu() {
    destroyPhaserGame();
  }
  isMobileLandscape(): boolean {
    const { isMobile } = this.getPlatformInfo();
    return isMobile && window.innerWidth > window.innerHeight;
  }

  isTabletLandscape(): boolean {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTablet = this.isMobiles && width >= 600 && width <= 1024;
    return isTablet && width > height;
  }

  getPlatformInfo() {
    const userAgent = window.navigator.userAgent;
    let platform: string = "Unknown";
    let isMobile: boolean = false;
    if (/iPhone|iPad|iPod|Android/i.test(userAgent)) {
      platform = "Mobile";
      isMobile = true;
    } else if (/Windows NT|Macintosh/i.test(userAgent)) {
      platform = "Desktop";
    }
    return { platform, isMobile };

  }
}

