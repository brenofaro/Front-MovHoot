// js/main.js
import MainScene from './scenes/MainScene.js';
import Chat from './Chat.js';

// Configuração do jogo com Phaser
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: MainScene
};

const game = new Phaser.Game(config);

// Inicializa a instância do chat
const chat = new Chat();
