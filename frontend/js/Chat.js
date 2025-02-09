// js/Chat.js
export default class Chat {
    constructor() {
      this.chatContainer = document.getElementById('chat-container');
      this.chatMessages = document.getElementById('chat-messages');
      this.chatInput = document.getElementById('chat-input');
      this.chatSendButton = document.getElementById('chat-send');
      
      // Inicialização de eventos do chat
      this.initEvents();
      
      // Futuro: método para conectar ao broker MQTT
      // this.connectMQTT();
    }
    
    initEvents() {
      this.chatSendButton.addEventListener('click', () => this.sendMessage());
      this.chatInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
    
    sendMessage() {
      const message = this.chatInput.value.trim();
      if (message !== '') {
        // Exibe a mensagem no chat (por enquanto, localmente)
        this.addMessage("Você: " + message);
        this.chatInput.value = '';
        
        // Futuro: publicar a mensagem via MQTT
        // this.mqttClient.publish('chat/topic', message);
      }
    }
    
    addMessage(message) {
      const li = document.createElement('li');
      li.textContent = message;
      this.chatMessages.appendChild(li);
      // Mantém o scroll no fim
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    // Futuro: método para conectar e gerenciar o MQTT
    connectMQTT() {
      // Exemplo: utilizar MQTT.js para conectar-se ao broker
      // this.mqttClient = mqtt.connect('wss://broker-endereco:porta');
      // this.mqttClient.on('connect', () => { console.log('Conectado ao MQTT'); });
      // this.mqttClient.on('message', (topic, payload) => { this.addMessage(payload.toString()); });
      // this.mqttClient.subscribe('chat/topic');
    }
  }
  