package org.example;

import com.rabbitmq.client.*;

import java.io.IOException;
import java.util.*;

public class ChatServer {
    private static final String DIRECT_EXCHANGE = "chat_server";
    private static ConnectionFactory factory;
    private static Connection connection;
    private static Channel channel;

    private static final Map<String, Set<String>> groups = new HashMap<>();
    private static final Map<String, String> roomPins = new HashMap<>(); // Mapeamento de sala → PIN

    public static void main(String[] argv) throws Exception {
        factory = new ConnectionFactory();
        factory.setHost("127.0.0.1");
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        connection = factory.newConnection();
        channel = connection.createChannel();
        channel.exchangeDeclare(DIRECT_EXCHANGE, BuiltinExchangeType.DIRECT);

        String queueName = "server_queue";
        channel.queueDeclare(queueName, false, false, false, null);
        channel.queueBind(queueName, DIRECT_EXCHANGE, "server");

        System.out.println("🚀 Servidor rodando...");

        Consumer consumer = new DefaultConsumer(channel) {
            @Override
            public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                String message = new String(body, "UTF-8");
                System.out.println("📩 Servidor recebeu: " + message);

                if (message.startsWith("!admin_create_room")) {
                    String[] parts = message.split(" ", 4);
                    if (parts.length == 4) {
                        String nomeSala = parts[1];
                        String assunto = parts[2];
                        String adminUser = parts[3]; // Nome do Admin para resposta

                        // Gera um PIN aleatório de 4 dígitos
                        String pin = String.format("%04d", new Random().nextInt(10000));

                        // Armazena a sala e o PIN
                        groups.put(nomeSala, new HashSet<>());
                        roomPins.put(nomeSala, pin);

                        System.out.println(" Sala criada: " + nomeSala + " | Assunto: " + assunto + " | PIN: " + pin);

                        // Envia resposta para o Admin com o PIN da sala
                        String resposta = "!server_room_created " + pin + " " + nomeSala;
                        channel.basicPublish(DIRECT_EXCHANGE, adminUser, null, resposta.getBytes("UTF-8"));

                        groups.computeIfAbsent(nomeSala, k -> new HashSet<>()).add(adminUser);
                        System.out.println("👤 Usuário " + adminUser + " entrou na sala " + nomeSala);
                    }
                } else if (message.startsWith("!join")) {
                    String[] parts = message.split(" ", 3);

                    String user = parts[1];
                    String pin = parts[2];

                    String room = null;
                    for (Map.Entry<String, String> entry : roomPins.entrySet()) {
                        if (entry.getValue().equals(pin)) {
                            room = entry.getKey();
                            break;
                        }
                    }

                    if (room != null) {
                        groups.computeIfAbsent(room, k -> new HashSet<>()).add(user);
                        System.out.println("👤 Usuário " + user + " entrou na sala " + room);

                        // Notifica o usuário que ele entrou com sucesso
                        channel.basicPublish(DIRECT_EXCHANGE, user, null,
                                ("✅ Você entrou na sala: " + room).getBytes("UTF-8"));

                    } else {
                        System.out.println(" PIN inválido: " + pin);
                        channel.basicPublish(DIRECT_EXCHANGE, user, null,
                                "⚠️ PIN inválido! Verifique e tente novamente.".getBytes("UTF-8"));
                    }
                } else if (message.startsWith("!msg")){
                    String[] parts = message.split(" ", 4);
                    if (parts.length == 4) {
                        String room = parts[1];
                        String msg = parts[2];
                        String src = parts[3];

                        if (groups.containsKey(room)) {
                            for (String user : groups.get(room)) {
                                channel.basicPublish(DIRECT_EXCHANGE, user, null, ("💬 " + src + " "+ msg).getBytes("UTF-8"));
                            }
                            System.out.println("📢 Mensagem enviada para a sala " + room + ": " + msg);
                        } else {
                            System.out.println("⚠️ Sala " + room + " não existe!");
                        }
                    }
                }
            }
        };

        channel.basicConsume(queueName, true, consumer);
    }
}
