import Phaser from 'phaser';

export class FinalScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FinalScene' });
  }

  // O método init recebe dados passados da scene anterior
  init(data: { scores: { [playerName: string]: number } }) {
    this.registry.set('finalScores', data.scores);
  }

  create(): void {
    // Recupera os dados de pontuação
    const scores = this.registry.get('finalScores') as { [playerName: string]: number };

    // Exibe o título da tela de finalização
    this.add.text(this.scale.width / 2, 50, 'Placar Final', { fontSize: '32px', color: '#fff' })
      .setOrigin(0.5);

    // Exibe os nomes dos jogadores e suas pontuações
    let yPos = 120;
    for (const player in scores) {
      const score = scores[player];
      this.add.text(100, yPos, `${player}: ${score}`, { fontSize: '24px', color: '#fff' });
      yPos += 40;
    }

    // Botão para reiniciar o jogo ou voltar para o lobby
    const restartButton = this.add.text(this.scale.width / 2, yPos + 40, 'Reiniciar Jogo', { fontSize: '28px', color: '#0f0' })
      .setOrigin(0.5)
      .setInteractive();

    restartButton.on('pointerdown', () => {
      // Volta para a MainScene ou para uma Scene de lobby, conforme a sua lógica
      this.scene.start('MainMenu');
    });
  }
}
