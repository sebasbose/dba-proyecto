import express from "express";
import { pool as postgresPool } from "../services/postgres.js";
import { pool as mysqlPool } from "../services/mysql.js";
import { getJobContent } from "../services/mongodb.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    const pgQuery = q.trim().replace(/\s+/g, " & ");

    const result = await postgresPool.query(
      `SELECT job_id, skills_array, job_type,
              ts_rank(search_vector, to_tsquery('english', $1)) as rank
       FROM job_search_index 
       WHERE search_vector @@ to_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT 50`,
      [pgQuery],
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const jobIds = result.rows.map((r) => r.job_id);

    const [jobs] = await mysqlPool.query(
      "SELECT * FROM jobs WHERE job_id IN (?) ORDER BY scraped_at DESC",
      [jobIds],
    );

    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        const content = await getJobContent(job.job_id).catch(() => null);
        const pgData = result.rows.find((r) => r.job_id === job.job_id);

        return {
          ...job,
          description: content?.description || null,
          skills: pgData?.skills_array || [],
          relevance_score: pgData?.rank || 0,
        };
      }),
    );

    res.json({
      success: true,
      data: enrichedJobs,
      total: enrichedJobs.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
