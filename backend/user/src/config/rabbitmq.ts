import amqp from 'amqplib';

let channel: amqp.Channel;

export const connectRabbitMQ = async() => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_Host,
            port: 5672,
            username: process.env.Rabbitmq_Username,
            password: process.env.Rabbitmq_Password
        });

        channel = await connection.createChannel();
        console.log("================== Connected to RabbitMQ=====================");
    } catch (error) {
        console.error("Failed to connect rabbitMQ",error);
    }
}

export const publishToQueue = async (queueName: string, message: any) => {
    if (!channel) {
        console.log("=================RabbitMQ channel is not initaliazed======================");
        return;
    }
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true })
};