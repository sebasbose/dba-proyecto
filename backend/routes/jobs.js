import express from "express";
// import { v4 as uuidv4 } from "uuid";
import { extractSkills } from "../utils/skills.js";
import { saveJob, saveJobSkills } from "../services/mysql.js";
import { saveJobContent } from "../services/mongodb.js";
import { saveJobIndex } from "../services/postgres.js";
import crypto from "crypto";

function generateJobId(url) {
  const hash = crypto.createHash("sha256").update(url).digest("hex");
  return `job-${hash.substring(0, 16)}`;
}

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { title, description, country, remote_type, job_type, url, company } =
      req.body;

    if (!title || !description || !url) {
      return res.status(400).json({
        success: false,
        error: "Missing requiered parameters",
      });
    }

    const validRemoteTypes = ["remoto", "hybrid", "onsite"];
    const remoteType = remote_type ? remote_type.toLowerCase() : null;
    if (remoteType && !validRemoteTypes.includes(remoteType)) {
      return res.status(400).json({
        success: false,
        error: "remote_type must be one of: remote, hybrid, onsite",
      });
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

    res.status(201).json({
      success: true,
      message: "Job saved successfully",
      data: {
        job_id: jobId,
        skills_found: skills.length,
        skills: skills.map((s) => s.name),
      },
    });
  } catch (error) {
    console.error("Error saving job:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
