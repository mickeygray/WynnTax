const fs = require("fs");
const http = require("http");
const path = require("path");
const puppeteer = require("puppeteer");

const buildDir = path.resolve(__dirname, "..", "build");
const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

let apiMode = "failure";
let lastLeadPayload = null;

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, "http://localhost");
  if (requestUrl.pathname === "/api/lead-form" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      lastLeadPayload = JSON.parse(body || "{}");
      res.writeHead(apiMode === "success" ? 200 : 502, {
        "Content-Type": "application/json",
      });
      res.end(
        JSON.stringify(
          apiMode === "success"
            ? { submissionReceipt: "smoke-receipt" }
            : { error: "mock_failure" },
        ),
      );
    });
    return;
  }

  const relative = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
  const candidate = path.resolve(buildDir, relative);
  if (candidate.startsWith(buildDir) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    serveFile(res, candidate);
    return;
  }
  serveFile(res, path.join(buildDir, "index.html"));
});

async function completeForm(page) {
  await page.select('select[name="debtAmount"]', "10000-25000");
  await page.click(".lp-form__option");
  await page.click(".lp-form__btn");
  await page.type('input[name="name"]', "Smoke Test");
  await page.type('input[name="phone"]', "5555550100");
  await page.type('input[name="email"]', "smoke@example.com");
  await page.click('.lp-form__consent input[type="checkbox"]');
  await page.click('.lp-form__btn--submit');
}

function conversionCount(page) {
  return page.evaluate(() =>
    (window.dataLayer || []).filter(
      (entry) => entry?.[0] === "event" && entry?.[1] === "conversion",
    ).length,
  );
}

function analyticsEventCount(page, eventName) {
  return page.evaluate(
    (name) =>
      (window.dataLayer || []).filter(
        (entry) =>
          (entry?.[0] === "event" && entry?.[1] === name) ||
          entry?.event === name,
      ).length,
    eventName,
  );
}

async function run() {
  if (!fs.existsSync(path.join(buildDir, "index.html"))) {
    throw new Error("Build output is missing. Run npm run build first.");
  }

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const origin = `http://127.0.0.1:${port}`;
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.url().startsWith(origin)) request.continue();
      else request.abort();
    });

    await page.goto(`${origin}/thank-you`, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => window.location.pathname === "/tax-lien-help");
    if ((await conversionCount(page)) !== 0) {
      throw new Error("Direct thank-you visit fired a conversion");
    }
    await page.evaluate(() => sessionStorage.clear());

    apiMode = "failure";
    await page.goto(`${origin}/tax-lien-help?gclid=smoke-click&utm_campaign=smoke`, {
      waitUntil: "networkidle0",
    });
    const headState = await page.evaluate(() => ({
      descriptions: document.querySelectorAll('meta[name="description"]').length,
      robots: Array.from(document.querySelectorAll('meta[name="robots"]')).map(
        (tag) => tag.content,
      ),
      directGtagLoaders: document.querySelectorAll(
        'script[src*="googletagmanager.com/gtag/js"]',
      ).length,
      hasAnalyticsQueue: typeof window.gtag === "function",
    }));
    if (headState.descriptions !== 1) {
      throw new Error("Paid landing page has duplicate meta descriptions");
    }
    if (
      headState.robots.length !== 1 ||
      headState.robots[0] !== "noindex, nofollow"
    ) {
      throw new Error("Paid landing page has conflicting robots directives");
    }
    if (headState.directGtagLoaders !== 1 || !headState.hasAnalyticsQueue) {
      throw new Error("Analytics does not have exactly one gtag bootstrap");
    }

    await page.evaluate(() => {
      const phoneLink = document.querySelector(".lp__header-phone");
      phoneLink.addEventListener("click", (event) => event.preventDefault(), {
        once: true,
      });
      phoneLink.click();
    });
    if ((await analyticsEventCount(page, "contact")) !== 1) {
      throw new Error("Paid phone click was not tracked");
    }

    await completeForm(page);
    await page.waitForSelector(".lp-form__error");
    if ((await analyticsEventCount(page, "paid_form_start")) !== 1) {
      throw new Error("Paid form start was not tracked exactly once");
    }
    if ((await analyticsEventCount(page, "paid_form_step_complete")) !== 1) {
      throw new Error("Paid form step completion was not tracked");
    }
    if ((await analyticsEventCount(page, "paid_lead_submit_error")) !== 1) {
      throw new Error("Paid form failure was not tracked");
    }
    if (new URL(page.url()).pathname !== "/tax-lien-help") {
      throw new Error("Failed submission left the form page");
    }
    if ((await conversionCount(page)) !== 0) {
      throw new Error("Failed submission fired a conversion");
    }

    apiMode = "success";
    await page.click('.lp-form__btn--submit');
    await page.waitForFunction(() => window.location.pathname === "/thank-you");
    await page.waitForFunction(() =>
      (window.dataLayer || []).some(
        (entry) => entry?.[0] === "event" && entry?.[1] === "conversion",
      ),
    );
    if ((await analyticsEventCount(page, "generate_lead")) !== 1) {
      throw new Error("Accepted lead was not tracked in analytics");
    }
    if (lastLeadPayload?.utm?.gclid !== "smoke-click") {
      throw new Error("Google click ID was not included in the lead payload");
    }
    if (lastLeadPayload?.consentGiven !== true) {
      throw new Error("Consent flag was not included in the lead payload");
    }

    await page.reload({ waitUntil: "networkidle0" });
    if ((await conversionCount(page)) !== 0) {
      throw new Error("Thank-you refresh fired a duplicate conversion");
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  process.stdout.write("Google funnel smoke test passed.\n");
}

run().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  server.close(() => process.exit(1));
});
