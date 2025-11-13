import crypto from "crypto";
import { extractSkills } from "./skills.js";
import { saveJob, saveJobSkills } from "../services/mysql.js";
import { saveJobContent } from "../services/mongodb.js";
import { saveJobIndex } from "../services/postgres.js";

function generateJobId(url) {
  const hash = crypto.createHash("sha256").update(url).digest("hex");
  return `job-${hash.substring(0, 16)}`;
}

export async function processJobData(rawJobData) {
  const { title, description, country, remote_type, job_type, url, company } =
    rawJobData;

  if (!title || !description || !url) {
    throw new Error("Missing required parameters: title, description, url");
  }

  const validRemoteTypes = ["remote", "hybrid", "onsite"];
  const remoteType = remote_type ? remote_type.toLowerCase() : null;

  if (remoteType && !validRemoteTypes.includes(remoteType)) {
    throw new Error("remote_type must be one of: remote, hybrid, onsite");
  }

  const jobId = generateJobId(url);
  const fullText = `${title} ${description}`;
  const skills = extractSkills(fullText);

  const jobData = {
    job_id: jobId,
    title: title.trim(),
    description: description.trim(),
    country: country || null,
    remote_type: remoteType,
    job_type: job_type || null,
    url: url.trim(),
    company: company || null,
    skills: skills,
    scraped_at: new Date().toISOString(),
  };

  console.log(`Processing job: ${jobId}`);
  console.log(`Skills found: ${skills.map((s) => s.name).join(", ")}`);

  await Promise.all([
    saveJob(jobData), // MySQL
    saveJobContent(jobData), // MongoDB
    saveJobIndex(jobData), // PostgreSQL
  ]);

  if (skills.length > 0) {
    await saveJobSkills(jobId, skills);
  }

  console.log(`Job saved successfully: ${jobId}`);

  return {
    job_id: jobId,
    skills_found: skills.length,
    skills: skills.map((s) => s.name),
  };
}
