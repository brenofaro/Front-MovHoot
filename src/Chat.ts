// src/Chat.ts
export default class Chat {
    private chatContainer: HTMLElement;
    private chatMessages: HTMLElement;
    private chatInput: HTMLInputElement;
    private chatSendButton: HTMLElement;
  
    constructor() {
      // Certifique-se de que os elementos existem no DOM (veja o passo 2)
      this.chatContainer = document.getElementById('chat-container')!;
      this.chatMessages = document.getElementById('chat-messages')!;
      this.chatInput = document.getElementById('chat-input') as HTMLInputElement;
      this.chatSendButton = document.getElementById('chat-send')!;
  
      this.initEvents();
    }
  
    private initEvents(): void {
      this.chatSendButton.addEventListener('click', () => this.sendMessage());
      this.chatInput.addEventListener('keyup', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
  
    private sendMessage(): void {
      const message = this.chatInput.value.trim();
      if (message !== '') {
        // Exibe a mensagem no chat (por enquanto, localmente)
        this.addMessage("Você: " + message);
        this.chatInput.value = '';
  
        // Futuro: publicar a mensagem via MQTT
        // Ex: mqttClient.publish('chat/topic', message);
      }
    }
  
    public addMessage(message: string): void {
      const li = document.createElement('li');
      li.textContent = message;
      this.chatMessages.appendChild(li);
      // Mantém o scroll no fim
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
  
    // Futuro: método para conectar e gerenciar o MQTT
    // connectMQTT() { ... }
  }
  