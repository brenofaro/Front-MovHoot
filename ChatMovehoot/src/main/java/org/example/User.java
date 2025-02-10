package org.example;

import com.rabbitmq.client.*;

import java.io.IOException;
import java.util.Scanner;

public class User {
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
        System.out.print("Digite seu nome de usuário: ");
        username = sc.nextLine();

        String queueName = "queue_" + username;
        channel.queueDeclare(queueName, false, false, false, null);
        channel.queueBind(queueName, DIRECT_EXCHANGE, username);

        System.out.println("Conectado como " + username);

        // Thread para ouvir mensagens recebidas
        Thread listenerThread = new Thread(() -> {
            try {
                Consumer consumer = new DefaultConsumer(channel) {
                    @Override
                    public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
                        String message = new String(body, "UTF-8");
                        System.out.println("\n📩 Mensagem recebida: " + message);
                    }
                };

                channel.basicConsume(queueName, true, consumer);

            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        listenerThread.start();

        // Solicitar PIN para entrar na sala
        System.out.println("Digite o PIN da sala:");
        String pin = sc.nextLine();

        // Enviar solicitação para entrar na sala
        channel.basicPublish(DIRECT_EXCHANGE, "server", null, ("!join " + username + " " + pin).getBytes("UTF-8"));
        System.out.println("📤 Solicitação para entrar na sala enviada ao servidor!");

        // Mantém o usuário rodando para receber mensagens
        while (true) {
            System.out.println("Mensagem:");
            String msg = sc.nextLine();

            String mensagem = "!msg " + msg + " " + username;
            channel.basicPublish(DIRECT_EXCHANGE, "server", null, mensagem.getBytes("UTF-8"));
        }
    }
}