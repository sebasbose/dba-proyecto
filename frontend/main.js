const API_URL = "/api/search";
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const loadingDiv = document.getElementById("loading");
const noResultsDiv = document.getElementById("noResults");
const resultsCountDiv = document.getElementById("resultsCount");

let debounceTimer;

searchInput.addEventListener("input", (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const query = e.target.value.trim();
    if (query.length > 2) {
      searchJobs(query);
    } else {
      resultsDiv.innerHTML = "";
      resultsCountDiv.textContent = "";
    }
  }, 500);
});

async function searchJobs(query) {
  loadingDiv.style.display = "block";
  noResultsDiv.style.display = "none";
  resultsDiv.innerHTML = "";
  resultsCountDiv.textContent = "";

  try {
    const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    loadingDiv.style.display = "none";

    if (data.success && data.data.length > 0) {
      resultsCountDiv.textContent = `Found ${data.total} jobs`;
      renderJobs(data.data);
    } else {
      noResultsDiv.style.display = "block";
    }
  } catch (error) {
    loadingDiv.style.display = "none";
    console.error("Search error:", error);
    noResultsDiv.textContent = "Error searching jobs";
    noResultsDiv.style.display = "block";
  }
}

function renderJobs(jobs) {
  jobs.forEach((job) => {
    const card = document.createElement("div");
    card.className = "job-card";
    card.onclick = () => window.open(job.url, "_blank");

    const description = job.description
      ? job.description.substring(0, 300) + "..."
      : "No description available";

    const meta = [];
    if (job.company_name) meta.push(`🏢 ${job.company_name}`);
    if (job.country) meta.push(`📍 ${job.country}`);
    if (job.remote_type) meta.push(`💼 ${job.remote_type}`);

    const skillsHtml =
      job.skills && job.skills.length > 0
        ? `<div class="skills">
           ${job.skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join("")}
         </div>`
        : "";

    card.innerHTML = `
      <div class="job-title">${job.title}</div>
      <div class="job-meta">
        ${meta.map((m) => `<span>${m}</span>`).join("")}
      </div>
      <div class="job-description">${description}</div>
      ${skillsHtml}
    `;

    resultsDiv.appendChild(card);
  });
}
