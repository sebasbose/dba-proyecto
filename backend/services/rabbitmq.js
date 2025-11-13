import amqp from "amqplib";

let connection;
let channel;

export async function initRabbitMQ() {
  const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    // Crear cola para jobs scrapeados
    await channel.assertQueue("scraped_jobs", { durable: true });

    console.log("RabbitMQ connected");
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
    throw error;
  }
}

export async function sendJobToQueue(jobData) {
  try {
    channel.sendToQueue("scraped_jobs", Buffer.from(JSON.stringify(jobData)), {
      persistent: true,
    });
  } catch (error) {
    console.error("Error sending to queue:", error);
    throw error;
  }
}

export async function consumeJobs(callback) {
  try {
    await channel.consume("scraped_jobs", async (msg) => {
      if (msg) {
        const jobData = JSON.parse(msg.content.toString());
        await callback(jobData);
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error("Error consuming from queue:", error);
    throw error;
  }
}

export async function closeRabbitMQ() {
  if (channel) await channel.close();
  if (connection) await connection.close();
}
