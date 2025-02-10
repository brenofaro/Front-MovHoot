package org.example;

import com.rabbitmq.client.*;

import java.io.IOException;
import java.util.Scanner;

public class Admin {
    private static final String DIRECT_EXCHANGE = "chat_server";

    private static String username;
    private static ConnectionFactory factory;
    private static Connection connection;
    private static Channel channel;

    public static void main(String[] argv) throws Exception {
        factory = new ConnectionFactory();
        factory.setHost("127.0.0.1");
        factory.setUsername("guest");
        factory.setPassword("guest");
        factory.setVirtualHost("/");

        connection = factory.newConnection();
        channel = connection.createChannel();

        channel.exchangeDeclare(DIRECT_EXCHANGE, BuiltinExchangeType.DIRECT);

        Scanner sc = new Scanner(System.in);
        System.out.print("Digite seu nome de usuário (Admin): ");
        username = sc.nextLine();

        // Fila específica do Admin para receber mensagens do servidor
        String queueName = "queue_admin_" + username;
        channel.queueDeclare(queueName, false, false, false, null);
        channel.queueBind(queueName, DIRECT_EXCHANGE, username); // Admin escuta sua própria chave

        System.out.println("✅ Conectado como Admin: " + username);

        // Thread para escutar mensagens do servidor
        Thread listenerThread = new Thread(() -> {
            try {
                Consumer consumer = new DefaultConsumer(channel) {
                    @Override
                    public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                        String message = new String(body, "UTF-8");
                        System.out.println("\n📩 Mensagem do servidor: " + message);

                        // Se o servidor criou a sala, exibir o PIN
                        if (message.startsWith("!server_room_created")) {
                            String[] parts = message.split(" ", 3);
                            if (parts.length == 3) {
                                String pin = parts[1];
                                String nomeSala = parts[2];
                                System.out.println("🔑 Sala '" + nomeSala + "' criada com PIN: " + pin);
                            }
                        }
                    }
                };

                channel.basicConsume(queueName, true, consumer);

            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        listenerThread.start();

        // Criar salas continuamente
        while (true) {
            System.out.println("Nome da sala:");
            String nome_sala = sc.nextLine();
            System.out.println("Assunto da sala:");
            String assunto_sala = sc.nextLine();

            // Enviar a solicitação com o nome do Admin como chave de roteamento para resposta
            String mensagem = "!admin_create_room " + nome_sala + " " + assunto_sala + " " + username;
            channel.basicPublish(DIRECT_EXCHANGE, "server", null, mensagem.getBytes("UTF-8"));

            System.out.println("📤 Solicitação de criação de sala enviada!");
            while (true) {
            System.out.println("Opções");
            System.out.println("1 - Criar uma nova sala");
            System.out.println("2 - Mandar mensagem");
            String opcao = sc.nextLine();

                if (opcao.equals("1")) {
                    System.out.println("Nome da sala:");
                    nome_sala = sc.nextLine();
                    System.out.println("Assunto da sala:");
                    assunto_sala = sc.nextLine();

                    // Enviar a solicitação com o nome do Admin como chave de roteamento para resposta
                    mensagem = "!admin_create_room " + nome_sala + " " + assunto_sala + " " + username;
                    channel.basicPublish(DIRECT_EXCHANGE, "server", null, mensagem.getBytes("UTF-8"));
                } else if (opcao.equals("2")) {
                    System.out.println("Mensagem:");
                    String msg = sc.nextLine();

                    mensagem = "!msg " + msg + " " + username;
                    channel.basicPublish(DIRECT_EXCHANGE, "server", null, mensagem.getBytes("UTF-8"));

                }
            }

        }
    }
}
