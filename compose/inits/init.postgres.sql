CREATE TABLE job_search_index (
    job_id VARCHAR(255) PRIMARY KEY,
    keywords TEXT,
    skills_array TEXT[],
    search_vector tsvector,
    job_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_vector ON job_search_index USING GIN(search_vector);
CREATE INDEX idx_skills_array ON job_search_index USING GIN(skills_array);
CREATE INDEX idx_job_type ON job_search_index(job_type);
