import { chromium } from "playwright";
import { normalizeRemoteType } from "../utils/normalize_remote_type.js";
import amqp from "amqplib";

let connection;
let channel;

async function initRabbitMQ() {
  const url = "amqp://admin:hola1234_admin@localhost:5672";
  connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertQueue("scraped_jobs", { durable: true });
  console.log("RabbitMQ connected");
}

async function sendToQueue(jobData) {
  channel.sendToQueue("scraped_jobs", Buffer.from(JSON.stringify(jobData)), {
    persistent: true,
  });
  console.log(`Job sent to queue`);
}

async function safeNavigate(page, url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto(url, {
        waitUntil: "networkidle", // Espera a que la red esté inactiva
        timeout: 60000,
      });
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(3000);
      return true;
    } catch (error) {
      console.log(
        `Attempt ${attempt}/${maxRetries} failed for ${url}: ${error.message}`,
      );
      if (attempt === maxRetries) {
        throw error;
      }
      await page.waitForTimeout(2000 * attempt);
    }
  }
  return false;
}

(async () => {
  await initRabbitMQ();
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
  });
  const page = await context.newPage();
  await page.goto("https://www.ibm.com/careers/search");
  await page.waitForSelector(".bx--card-group__cards__col", { timeout: 60000 });

  let hasNextPage = true;
  let pageNumber = 1;
  const MAX_NUMBER_OF_PAGES = 1;

  while (hasNextPage) {
    // console.log(`Processing page ${pageNumber}...`);

    const jobs = await page.locator(".bx--card-group__cards__col").all();
    // console.log(`Found ${jobs.length} jobs on page ${pageNumber}`);

    const jobUrls = [];
    for (const job of jobs) {
      const title = await job.locator(".bx--card__heading").textContent();
      const url = await job.locator("a").getAttribute("href");

      if (url && title) {
        jobUrls.push({
          title: title.trim(),
          url: url.startsWith("http") ? url : `https://www.ibm.com${url}`,
        });
      }
    }

    // console.log(`Collected ${jobUrls.length} job URLs`);

    for (let i = 0; i < jobUrls.length; i++) {
      // for (let i = 0; i < 3; i++) {
      const jobInfo = jobUrls[i];
      // console.log(`[${i + 1}/${jobUrls.length}] Processing: ${jobInfo.title}`);

      try {
        // await page.goto(jobInfo.url, { waitUntil: "domcontentloaded" });
        await safeNavigate(page, jobInfo.url);
        await page.waitForTimeout(3000);

        const description = await page
          .locator("article.article--details")
          .first()
          .textContent()
          .catch(() => null);

        const countryField = page
          .locator(".article__content__view__field")
          .filter({ hasText: "Country" });
        const country = await countryField
          .locator(".article__content__view__field__value")
          .textContent()
          .catch(() => null);

        const remoteTypeField = page
          .locator(".article__content__view__field")
          .filter({ hasText: "Work arrangement" });
        const remoteType = await remoteTypeField
          .locator(".article__content__view__field__value")
          .textContent()
          .catch(() => null);

        const jobTypeField = page
          .locator(".article__content__view__field")
          .filter({ hasText: "Area of work" });
        const jobType = await jobTypeField
          .locator(".article__content__view__field__value")
          .textContent()
          .catch(() => null);

        const jobData = {
          title: jobInfo.title,
          description: description.trim(),
          country: country ? country.trim() : null,
          remote_type: normalizeRemoteType(remoteType),
          job_type: jobType ? jobType.trim() : null,
          url: jobInfo.url,
          company: "IBM",
        };

        //   const response = await fetch("http://localhost:3000/api/jobs", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(jobData),
        //   });
        //
        //   const result = await response.json();
        //
        //   if (result.success) {
        //     // console.log(`Job saved: ${result.data.job_id}`);
        //   } else {
        //     console.error(`Error saving job: ${result.error}`);
        //   }
        //   // console.log("Job data extracted:");
        //   console.log(JSON.stringify(jobData, null, 2));
        //   // console.log("---");
        await sendToQueue(jobData);
      } catch (error) {
        console.error(`Error processing ${jobInfo.url}:`, error.message);
      }
    }

    try {
      const nextButton = page.locator("#IBMAccessibleItemComponents-next");
      const isDisabled = await nextButton.getAttribute("disabled");

      if (isDisabled !== null) {
        hasNextPage = false;
      } else {
        await nextButton.click();
        await page.waitForTimeout(2000);
        pageNumber++;
      }
    } catch (error) {
      hasNextPage = false;
    }
  }

  await browser.close();
  if (channel) await channel.close();
  if (connection) await connection.close();
  // console.log("Scraping completed");
})();
