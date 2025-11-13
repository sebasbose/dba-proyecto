CREATE TABLE companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(100),
    industry VARCHAR(100),
    website TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE jobs (
    job_id VARCHAR(255) PRIMARY KEY,
    company_id INT,
    title VARCHAR(500) NOT NULL,
    country VARCHAR(100),
		remote_type ENUM('remote', 'onsite', 'hybrid', 'not_specified'),
    job_type VARCHAR(50),
    url TEXT NOT NULL,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    INDEX idx_company_id (company_id),
    INDEX idx_country (country),
    INDEX idx_remote_type (remote_type),
    INDEX idx_scraped_at (scraped_at),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_skills (
    job_id VARCHAR(255) NOT NULL,
    skill_id INT NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_id, skill_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    INDEX idx_job_id (job_id),
    INDEX idx_skill_id (skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO skills (name, category) VALUES

-- Frontend
('React', 'Frontend'),
('Vue', 'Frontend'),
('Angular', 'Frontend'),
('JavaScript', 'Frontend'),
('TypeScript', 'Frontend'),
('HTML', 'Frontend'),
('CSS', 'Frontend'),
('Next.js', 'Frontend'),
('Svelte', 'Frontend'),
('jQuery', 'Frontend'),
('Tailwind', 'Frontend'),
('Bootstrap', 'Frontend'),
('Sass', 'Frontend'),
('Webpack', 'Frontend'),

-- Backend
('Node.js', 'Backend'),
('Python', 'Backend'),
('Java', 'Backend'),
('Go', 'Backend'),
('PHP', 'Backend'),
('Ruby', 'Backend'),
('C#', 'Backend'),
('.NET', 'Backend'),
('Django', 'Backend'),
('Flask', 'Backend'),
('Spring Boot', 'Backend'),
('Express', 'Backend'),
('FastAPI', 'Backend'),
('Laravel', 'Backend'),
('Rails', 'Backend'),

-- Databases
('MySQL', 'Database'),
('PostgreSQL', 'Database'),
('MongoDB', 'Database'),
('Redis', 'Database'),
('SQL', 'Database'),
('NoSQL', 'Database'),
('Oracle', 'Database'),
('SQL Server', 'Database'),
('Cassandra', 'Database'),
('DynamoDB', 'Database'),
('Elasticsearch', 'Database'),

-- DevOps/Cloud
('Docker', 'DevOps'),
('Kubernetes', 'DevOps'),
('AWS', 'Cloud'),
('Azure', 'Cloud'),
('GCP', 'Cloud'),
('Jenkins', 'DevOps'),
('GitLab CI', 'DevOps'),
('GitHub Actions', 'DevOps'),
('Terraform', 'DevOps'),
('Ansible', 'DevOps'),
('CircleCI', 'DevOps'),

-- Tools & Others
('Git', 'Tools'),
('REST', 'API'),
('GraphQL', 'API'),
('Microservices', 'Architecture'),
('Agile', 'Methodology'),
('Scrum', 'Methodology'),
('Linux', 'OS'),
('CI/CD', 'DevOps'),
('API', 'General'),
('Jira', 'Tools'),
('Figma', 'Design'),
('Postman', 'Tools');

INSERT INTO companies (name, country, industry, website) 
VALUES ('IBM', 'Estados Unidos', 'Technology', 'https://www.ibm.com');
