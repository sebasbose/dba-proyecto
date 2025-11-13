import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jobsRouter from "./routes/jobs.js";
import searchRouter from "./routes/search.js";
import { initMySQL, closeMySQL } from "./services/mysql.js";
import { initMongoDB, closeMongoDB } from "./services/mongodb.js";
import { initPostgres, closePostgres } from "./services/postgres.js";
import {
  initRabbitMQ,
  sendJobToQueue,
  consumeJobs,
} from "./services/rabbitmq.js";

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT;

app.use(cors());
app.use(express.json());

app.use("/api/jobs", jobsRouter);

app.use("/api/search", searchRouter);

// app.get("/health", (req, res) => {
//   res.json({ status: "ok" });
// });

async function initDatabases() {
  try {
    await initMySQL();
    await initMongoDB();
    await initPostgres();
    await initRabbitMQ();

    console.log("All databases connected successfully");
  } catch (error) {
    console.error("Error connecting to databases:", error);
    process.exit(1);
  }
}

async function shutdown() {
  await closeMySQL();
  await closeMongoDB();
  await closePostgres();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function start() {
  await initDatabases();

  app.listen(PORT, () => {
    console.log(`Server on http://localhost:${PORT}`);
  });
}

start();
