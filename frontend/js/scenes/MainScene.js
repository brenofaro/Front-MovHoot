// js/scenes/MainScene.js
export default class MainScene extends Phaser.Scene {
    constructor() {
      super({ key: 'MainScene' });
    }
  
    preload() {
      // Carrega os assets (certifique-se de que os arquivos existem na pasta "assets")
      this.load.image('background', 'assets/bg.png');
      this.load.image('player', 'assets/player.png');
    }
  
    create() {
      // Dimensões e configuração da área do jogo
      this.gameWidth = this.scale.width;
      this.gameHeight = this.scale.height;
      this.marginTop = 80; // área superior reservada para a pergunta
  
      // Desenha o fundo para cobrir todo o canvas
      this.add.image(this.gameWidth / 2, this.gameHeight / 2, 'background')
        .setDisplaySize(this.gameWidth, this.gameHeight);
  
      // Exibe a pergunta
      this.questionText = this.add.text(this.gameWidth / 2, this.marginTop / 2, 
        "Pergunta: Qual a capital do Brasil?", {
          fontSize: '24px',
          fill: '#fff'
        }).setOrigin(0.5);
  
      // Define a área de jogo (excluindo a margem da pergunta)
      this.gameAreaHeight = this.gameHeight - this.marginTop;
  
      // Desenha linhas divisórias para os quadrantes da área de jogo
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.lineBetween(this.gameWidth / 2, this.marginTop, this.gameWidth / 2, this.gameHeight);
      graphics.lineBetween(0, this.marginTop + this.gameAreaHeight / 2, this.gameWidth, this.marginTop + this.gameAreaHeight / 2);
  
      // Textos das respostas nos quadrantes
      this.answerAText = this.add.text(this.gameWidth / 4, this.marginTop + this.gameAreaHeight / 4, "A: Opção A", {
        fontSize: '20px',
        fill: '#fff'
      }).setOrigin(0.5);
      this.answerBText = this.add.text(3 * this.gameWidth / 4, this.marginTop + this.gameAreaHeight / 4, "B: Opção B", {
        fontSize: '20px',
        fill: '#fff'
      }).setOrigin(0.5);
      this.answerCText = this.add.text(this.gameWidth / 4, this.marginTop + 3 * this.gameAreaHeight / 4, "C: Opção C", {
        fontSize: '20px',
        fill: '#fff'
      }).setOrigin(0.5);
      this.answerDText = this.add.text(3 * this.gameWidth / 4, this.marginTop + 3 * this.gameAreaHeight / 4, "D: Opção D", {
        fontSize: '20px',
        fill: '#fff'
      }).setOrigin(0.5);
  
      // Cria o sprite do jogador
      this.player = this.physics.add.sprite(this.gameWidth / 2, this.gameHeight - 50, 'player');
      this.player.setCollideWorldBounds(true);
      this.player.setDisplaySize(50, 50);
  
      // Configura o teclado
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.keyboard.on('keydown-ENTER', () => {
        const selectedAnswer = this.getSelectedAnswer();
        console.log("Resposta selecionada:", selectedAnswer);
        if (this.selectedText) {
          this.selectedText.setText("Resposta selecionada: " + selectedAnswer);
        } else {
          this.selectedText = this.add.text(this.gameWidth / 2, this.gameHeight - 20, 
            "Resposta selecionada: " + selectedAnswer, {
              fontSize: '24px',
              fill: '#fff'
            }).setOrigin(0.5);
        }
      });
  
      // Ajusta posições se a janela for redimensionada
      this.scale.on('resize', this.resize, this);
    }
  
    update() {
      // Zera a velocidade do jogador a cada frame
      this.player.setVelocity(0);
      
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-200);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(200);
      }
      if (this.cursors.up.isDown) {
        this.player.setVelocityY(-200);
      } else if (this.cursors.down.isDown) {
        this.player.setVelocityY(200);
      }
    }
  
    // Determina qual resposta foi selecionada com base na posição do jogador
    getSelectedAnswer() {
      const effectiveY = this.player.y - this.marginTop; // posição relativa na área de jogo
      const halfGameArea = this.gameAreaHeight / 2;
      
      if (this.player.x < this.gameWidth / 2 && effectiveY < halfGameArea) {
        return "A"; // Quadrante superior esquerdo
      } else if (this.player.x >= this.gameWidth / 2 && effectiveY < halfGameArea) {
        return "B"; // Quadrante superior direito
      } else if (this.player.x < this.gameWidth / 2 && effectiveY >= halfGameArea) {
        return "C"; // Quadrante inferior esquerdo
      } else {
        return "D"; // Quadrante inferior direito
      }
    }
  
    // Atualiza as posições dos elementos quando a tela é redimensionada
    resize(gameSize) {
      const { width, height } = gameSize;
      this.gameWidth = width;
      this.gameHeight = height;
      this.gameAreaHeight = height - this.marginTop;
      
      this.cameras.main.setSize(width, height);
      this.questionText.setPosition(width / 2, this.marginTop / 2);
      this.answerAText.setPosition(width / 4, this.marginTop + this.gameAreaHeight / 4);
      this.answerBText.setPosition(3 * width / 4, this.marginTop + this.gameAreaHeight / 4);
      this.answerCText.setPosition(width / 4, this.marginTop + 3 * this.gameAreaHeight / 4);
      this.answerDText.setPosition(3 * width / 4, this.marginTop + 3 * this.gameAreaHeight / 4);
    }
  }
  