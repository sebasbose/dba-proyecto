import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client;
let db;

export async function initMongoDB() {
  const uri = `mongodb://${process.env.MONGO_ROOT_USER}:${process.env.MONGO_ROOT_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;

  client = new MongoClient(uri);

  try {
    await client.connect();
    db = client.db(process.env.MONGO_DATABASE);
    // Para evitar que se handen duplicando los bretes
    await db
      .collection("job_content")
      .createIndex({ job_id: 1 }, { unique: true });

    console.log("MongoDB connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

export async function saveJobContent(jobData) {
  const { job_id, title, description } = jobData;

  try {
    const collection = db.collection("job_content");

    const document = {
      job_id,
      title,
      description,
      full_text: `${title} ${description}`,
      updated_at: new Date(),
    };

    const result = await collection.updateOne(
      { job_id },
      {
        $set: document,
        $setOnInsert: { created_at: new Date() },
      },
      // Para evitar que se handen duplicando los bretes
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      console.log(`New job content saved in MongoDB: ${job_id}`);
    } else {
      console.log(`Job content updated in MongoDB: ${job_id}`);
    }

    return true;
  } catch (error) {
    console.error("Error saving job content in MongoDB:", error);
    throw error;
  }
}

export async function getJobContent(jobId) {
  try {
    const collection = db.collection("job_content");
    return await collection.findOne({ job_id: jobId });
  } catch (error) {
    console.error("Error getting job content:", error);
    throw error;
  }
}

export async function closeMongoDB() {
  if (client) {
    await client.close();
  }
}
