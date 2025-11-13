import mysql from "mysql2/promise";
import dotenv from "dotenv";
export { pool };

dotenv.config();

let pool;
let cachedSkills = [];

export async function initMySQL() {
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  await loadSkills();
  console.log(`MySQL connected - Loaded ${cachedSkills.length} skills`);
}

async function loadSkills() {
  try {
    const [rows] = await pool.query("SELECT id, name, category FROM skills");
    cachedSkills = rows;
  } catch (error) {
    console.error("Error loading skills:", error);
    throw error;
  }
}

export function getSkillsList() {
  return cachedSkills;
}

export function getSkillByName(name) {
  return cachedSkills.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

export async function getOrCreateCompany(companyName, country = null) {
  if (!companyName) return null;

  try {
    const [rows] = await pool.query("SELECT id FROM companies WHERE name = ?", [
      companyName,
    ]);

    if (rows.length > 0) {
      return rows[0].id;
    }

    const [result] = await pool.query(
      "INSERT INTO companies (name, country) VALUES (?, ?)",
      [companyName, country],
    );

    return result.insertId;
  } catch (error) {
    console.error("Error getting/creating company:", error);
    throw error;
  }
}

export async function saveJob(jobData) {
  const { job_id, title, country, remote_type, job_type, url, company } =
    jobData;

  try {
    const companyId = company
      ? await getOrCreateCompany(company, country)
      : null;

    await pool.query(
      `INSERT INTO jobs 
   (job_id, company_id, title, country, remote_type, job_type, url) 
   VALUES (?, ?, ?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE
     scraped_at = CURRENT_TIMESTAMP`,
      [job_id, companyId, title, country, remote_type, job_type, url],
    );

    console.log(`Job saved in MySQL: ${job_id}`);
    return true;
  } catch (error) {
    console.error("Error saving job in MySQL:", error);
    throw error;
  }
}

export async function saveJobSkills(jobId, skills) {
  if (!skills || skills.length === 0) return;

  try {
    const values = skills.map((skill) => [jobId, skill.id, true]);

    await pool.query(
      "INSERT IGNORE INTO job_skills (job_id, skill_id, is_required) VALUES ?",
      [values],
    );

    console.log(`Saved ${skills.length} skills for job ${jobId}`);
  } catch (error) {
    console.error("Error saving job skills:", error);
    throw error;
  }
}

export async function closeMySQL() {
  if (pool) {
    await pool.end();
  }
}
