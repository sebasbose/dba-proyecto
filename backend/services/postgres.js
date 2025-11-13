import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
export { pool };

dotenv.config();

let pool;

export async function initPostgres() {
  pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    max: 10,
  });

  try {
    await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
    throw error;
  }
}

export async function saveJobIndex(jobData) {
  const { job_id, title, description, skills, job_type } = jobData;

  try {
    const keywords = `${title} ${description}`.toLowerCase();

    const skillsArray = skills.map((s) => s.name);

    await pool.query(
      `INSERT INTO job_search_index 
       (job_id, keywords, skills_array, search_vector, job_type) 
       VALUES ($1, $2, $3, to_tsvector('spanish', $4), $5)
       ON CONFLICT (job_id) 
       DO UPDATE SET
         keywords = EXCLUDED.keywords,
         skills_array = EXCLUDED.skills_array,
         search_vector = EXCLUDED.search_vector,
         job_type = EXCLUDED.job_type,
         updated_at = CURRENT_TIMESTAMP`,
      [job_id, keywords, skillsArray, keywords, job_type],
    );

    console.log(`Job index saved in PostgreSQL: ${job_id}`);
    return true;
  } catch (error) {
    console.error("Error saving job index in PostgreSQL:", error);
    throw error;
  }
}

export async function searchJobs(query) {
  try {
    const result = await pool.query(
      `SELECT job_id, skills_array, job_type 
       FROM job_search_index 
       WHERE search_vector @@ to_tsquery('spanish', $1)
       LIMIT 20`,
      [query.replace(/\s+/g, " & ")],
    );

    return result.rows;
  } catch (error) {
    console.error("Error searching jobs:", error);
    throw error;
  }
}

export async function closePostgres() {
  if (pool) {
    await pool.end();
  }
}
