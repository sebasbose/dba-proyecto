import { consumeJobs } from "./services/rabbitmq.js";
import { initMySQL } from "./services/mysql.js";
import { initMongoDB } from "./services/mongodb.js";
import { initPostgres } from "./services/postgres.js";
import { initRabbitMQ } from "./services/rabbitmq.js";
import { processJobData } from "./utils/process_jobs.js";

async function processJob(jobData) {
  try {
    await processJobData(jobData);
  } catch (error) {
    console.error(`Error processing job:`, error.message);
    throw error;
  }
}

async function startConsumer() {
  console.log("Starting consumer...");

  try {
    await initMySQL();
    await initMongoDB();
    await initPostgres();
    await initRabbitMQ();

    console.log("All databases connected");
    console.log("Waiting for jobs from queue...");

    await consumeJobs(processJob);
  } catch (error) {
    console.error("Consumer initialization error:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("Shutting down consumer...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down consumer...");
  process.exit(0);
});

startConsumer();
