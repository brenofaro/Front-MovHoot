import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  // Propriedades para as dimensões e configuração da área do jogo
  private gameWidth: number = 0;
  private gameHeight: number = 0;
  private marginTop: number = 80;
  private gameAreaHeight: number = 0;

  // Elementos de texto para exibição da pergunta e das respostas
  private questionText!: Phaser.GameObjects.Text;
  private answerAText!: Phaser.GameObjects.Text;
  private answerBText!: Phaser.GameObjects.Text;
  private answerCText!: Phaser.GameObjects.Text;
  private answerDText!: Phaser.GameObjects.Text;
  private selectedText?: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;

  // Jogador e controles
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // Temporizador para cada questão
  private remainingTime: number = 10;
  private countdownText!: Phaser.GameObjects.Text;
  private countdownEvent!: Phaser.Time.TimerEvent;

  // Controle de fluxo da questão (para evitar múltiplas respostas)
  private questionActive: boolean = true;

  // Sistema de pontuação
  private score: number = 0;

  // Array de questões (exemplo) com propriedade 'correctAnswer'
  private questions: {
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: string;
  }[] = [
    {
      question: "Pergunta: Qual a capital do Brasil?",
      options: { A: "A: Brasília", B: "B: Rio de Janeiro", C: "C: São Paulo", D: "D: Salvador" },
      correctAnswer: "A"
    },
    {
      question: "Pergunta: Qual a capital da França?",
      options: { A: "A: Lyon", B: "B: Marselha", C: "C: Paris", D: "D: Nice" },
      correctAnswer: "C"
    }
    // Adicione mais questões conforme necessário.
  ];
  private currentQuestionIndex: number = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Carrega os assets (imagem de fundo e do jogador)
    this.load.image('background', 'assets/background.png');
    this.load.image('player', 'assets/player.png');
  }

  create(): void {
    // Obtém as dimensões do jogo
    this.gameWidth = this.scale.width;
    this.gameHeight = this.scale.height;
    this.gameAreaHeight = this.gameHeight - this.marginTop;

    // Adiciona o fundo que cobre todo o canvas
    const bg = this.add.image(this.gameWidth / 2, this.gameHeight / 2, 'background');
    bg.setDisplaySize(this.gameWidth, this.gameHeight);

    // Cria o texto da pergunta (centralizado na parte superior)
    this.questionText = this.add.text(
      this.gameWidth / 2,
      this.marginTop / 2,
      "",
      { fontSize: '24px', color: '#fff' }
    ).setOrigin(0.5);

    // Desenha linhas divisórias para formar os quadrantes da área de jogo
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.lineBetween(this.gameWidth / 2, this.marginTop, this.gameWidth / 2, this.gameHeight);
    graphics.lineBetween(0, this.marginTop + this.gameAreaHeight / 2, this.gameWidth, this.marginTop + this.gameAreaHeight / 2);

    // Cria os textos das respostas nos quadrantes
    this.answerAText = this.add.text(
      this.gameWidth / 4,
      this.marginTop + this.gameAreaHeight / 4,
      "",
      { fontSize: '20px', color: '#fff' }
    ).setOrigin(0.5);
    this.answerBText = this.add.text(
      (3 * this.gameWidth) / 4,
      this.marginTop + this.gameAreaHeight / 4,
      "",
      { fontSize: '20px', color: '#fff' }
    ).setOrigin(0.5);
    this.answerCText = this.add.text(
      this.gameWidth / 4,
      this.marginTop + (3 * this.gameAreaHeight) / 4,
      "",
      { fontSize: '20px', color: '#fff' }
    ).setOrigin(0.5);
    this.answerDText = this.add.text(
      (3 * this.gameWidth) / 4,
      this.marginTop + (3 * this.gameAreaHeight) / 4,
      "",
      { fontSize: '20px', color: '#fff' }
    ).setOrigin(0.5);

    // Cria o texto que exibe o tempo restante para a questão
    this.countdownText = this.add.text(50, 50, 'Tempo: ' + this.remainingTime, { fontSize: '24px', color: '#fff' });

    // Cria o texto do placar (score)
    this.scoreText = this.add.text(50, 80, 'Score: ' + this.score, { fontSize: '24px', color: '#fff' });

    // Configura a primeira questão
    this.setupQuestion();

    // Cria o sprite do jogador
    this.player = this.physics.add.sprite(this.gameWidth / 2, this.gameHeight - 50, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDisplaySize(50, 50);

    // Configura os controles do teclado
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Inicia a contagem regressiva
    this.startCountdown();

    // Permite que o jogador selecione a resposta pressionando ENTER (quando a questão estiver ativa)
    this.input.keyboard!.on('keydown-ENTER', () => {
      if (this.questionActive) {
        const selectedAnswer = this.getSelectedAnswer();
        this.processAnswer(selectedAnswer);
      }
    });

    // Atualiza as posições dos elementos se a janela for redimensionada
    this.scale.on('resize', this.resize, this);
  }

  update(time: number, delta: number): void {
    // Zera a velocidade do jogador a cada frame
    this.player.setVelocity(0);

    // Se a questão estiver ativa, permite o movimento do jogador
    if (this.questionActive) {
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
  }

  /**
   * Retorna a resposta selecionada com base na posição atual do jogador.
   */
  private getSelectedAnswer(): string {
    const effectiveY = this.player.y - this.marginTop; // posição relativa dentro da área de jogo
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

  /**
   * Configura a questão atual, atualizando os textos da pergunta e das respostas.
   */
  private setupQuestion(): void {
    const current = this.questions[this.currentQuestionIndex];
    this.questionText.setText(current.question);
    this.answerAText.setText(current.options.A);
    this.answerBText.setText(current.options.B);
    this.answerCText.setText(current.options.C);
    this.answerDText.setText(current.options.D);

    // Restaura a cor padrão dos textos das respostas
    this.answerAText.setColor("#fff");
    this.answerBText.setColor("#fff");
    this.answerCText.setColor("#fff");
    this.answerDText.setColor("#fff");

    // Limpa o feedback da resposta, se houver
    if (this.selectedText) {
      this.selectedText.setText("");
    }
  }

  /**
   * Chama a próxima questão ou finaliza a partida, se não houver mais questões.
   */
  private proximaQuestao(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.setupQuestion();
      this.resetCountdown();
      this.questionActive = true;
    } else {
      // Se a última questão já foi respondida, finaliza a partida
      this.finishMatch();
    }
  }

  /**
   * Inicia a contagem regressiva para a questão.
   */
  private startCountdown(): void {
    if (this.countdownEvent) {
      this.countdownEvent.remove(false);
    }
    this.remainingTime = 10;
    this.countdownText.setText("Tempo: " + this.remainingTime);

    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.remainingTime--;
        this.countdownText.setText("Tempo: " + this.remainingTime);

        if (this.remainingTime <= 0 && this.questionActive) {
          // Se o tempo acabar, seleciona automaticamente a resposta com base na posição do jogador
          const selectedAnswer = this.getSelectedAnswer();
          this.processAnswer(selectedAnswer);
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Reinicia a contagem regressiva.
   */
  private resetCountdown(): void {
    if (this.countdownEvent) {
      this.countdownEvent.remove(false);
    }
    this.startCountdown();
  }

  /**
   * Processa a resposta selecionada, atualiza o placar, exibe o feedback e, após um intervalo curto, chama a próxima questão ou finaliza a partida.
   */
  private processAnswer(selectedAnswer: string): void {
    if (!this.questionActive) return;

    // Impede respostas múltiplas
    this.questionActive = false;

    // Para a contagem regressiva
    if (this.countdownEvent) {
      this.countdownEvent.remove(false);
    }

    const currentQuestion = this.questions[this.currentQuestionIndex];
    const correctAnswer = currentQuestion.correctAnswer;
    const isCorrect = selectedAnswer === correctAnswer;

    // Atualiza o placar se a resposta estiver correta
    if (isCorrect) {
      this.score++;
      this.scoreText.setText("Score: " + this.score);
    }

    // Exibe feedback sobre a resposta
    const feedback = "Resposta selecionada: " + selectedAnswer + (isCorrect ? " (Correta)" : " (Incorreta)");
    if (this.selectedText) {
      this.selectedText.setText(feedback);
    } else {
      this.selectedText = this.add.text(
        this.gameWidth / 2,
        this.gameHeight - 20,
        feedback,
        { fontSize: '24px', color: '#fff' }
      ).setOrigin(0.5);
    }

    // Destaca a resposta correta em verde
    switch (correctAnswer) {
      case "A":
        this.answerAText.setColor("#00ff00");
        break;
      case "B":
        this.answerBText.setColor("#00ff00");
        break;
      case "C":
        this.answerCText.setColor("#00ff00");
        break;
      case "D":
        this.answerDText.setColor("#00ff00");
        break;
    }
    // Se a resposta do jogador estiver incorreta, destaca-a em vermelho
    if (!isCorrect) {
      switch (selectedAnswer) {
        case "A":
          this.answerAText.setColor("#ff0000");
          break;
        case "B":
          this.answerBText.setColor("#ff0000");
          break;
        case "C":
          this.answerCText.setColor("#ff0000");
          break;
        case "D":
          this.answerDText.setColor("#ff0000");
          break;
      }
    }

    // Após um curto intervalo (2 segundos), passa para a próxima questão ou finaliza a partida
    this.time.delayedCall(2000, () => {
      // Restaura as cores padrão das respostas
      this.answerAText.setColor("#fff");
      this.answerBText.setColor("#fff");
      this.answerCText.setColor("#fff");
      this.answerDText.setColor("#fff");

      this.proximaQuestao();
    });
  }

  /**
   * Finaliza a partida e transita para a scene de finalização, passando os dados do placar final.
   */
  private finishMatch(): void {
    // Neste exemplo, criamos um objeto de pontuação final. Em um jogo multiplayer real,
    // os dados viriam do servidor ou de um sistema de gerenciamento do lobby.
    const finalScores = { 
                          'Jogador 1': this.score,
                          'Jogador 2': 2,
                          'Jogador 3': 1
    };
    this.scene.start('FinalScene', { scores: finalScores });
  }

  /**
   * Ajusta as posições dos elementos quando a tela é redimensionada.
   */
  private resize(gameSize: { width: number; height: number }): void {
    const { width, height } = gameSize;
    this.gameWidth = width;
    this.gameHeight = height;
    this.gameAreaHeight = height - this.marginTop;

    // Ajusta o tamanho da câmera
    this.cameras.main.setSize(width, height);

    // Reposiciona os textos da pergunta e das respostas
    this.questionText.setPosition(width / 2, this.marginTop / 2);
    this.answerAText.setPosition(width / 4, this.marginTop + this.gameAreaHeight / 4);
    this.answerBText.setPosition((3 * width) / 4, this.marginTop + this.gameAreaHeight / 4);
    this.answerCText.setPosition(width / 4, this.marginTop + (3 * this.gameAreaHeight) / 4);
    this.answerDText.setPosition((3 * width) / 4, this.marginTop + (3 * this.gameAreaHeight) / 4);

    // Reposiciona o contador de tempo e o placar
    this.countdownText.setPosition(50, 50);
    this.scoreText.setPosition(50, 80);
  }
}
