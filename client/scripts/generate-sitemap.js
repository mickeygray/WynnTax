// scripts/generate-sitemap.js
const fs = require("fs");
const path = require("path");

const subPageData = require("../src/data/subPageData");
const blogData = require("../src/data/blogData");

const DOMAIN = "https://www.wynntaxsolutions.com";

const states = [
  "alabama",
  "alaska",
  "arizona",
  "arkansas",
  "california",
  "colorado",
  "connecticut",
  "delaware",
  "florida",
  "georgia",
  "hawaii",
  "idaho",
  "illinois",
  "indiana",
  "iowa",
  "kansas",
  "kentucky",
  "louisiana",
  "maine",
  "maryland",
  "massachusetts",
  "michigan",
  "minnesota",
  "mississippi",
  "missouri",
  "montana",
  "nebraska",
  "nevada",
  "new-hampshire",
  "new-jersey",
  "new-mexico",
  "new-york",
  "north-carolina",
  "north-dakota",
  "ohio",
  "oklahoma",
  "oregon",
  "pennsylvania",
  "rhode-island",
  "south-carolina",
  "south-dakota",
  "tennessee",
  "texas",
  "utah",
  "vermont",
  "virginia",
  "washington",
  "west-virginia",
  "wisconsin",
  "wyoming",
  "district-of-columbia",
];

const staticPages = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/our-tax-services", priority: "0.8", changefreq: "monthly" },
  { loc: "/about-us", priority: "0.7", changefreq: "monthly" },
  { loc: "/contact-us", priority: "0.7", changefreq: "monthly" },
  { loc: "/tax-faqs", priority: "0.7", changefreq: "monthly" },
  { loc: "/tax-news", priority: "0.8", changefreq: "weekly" },
  { loc: "/tax-relief", priority: "0.8", changefreq: "monthly" },
  { loc: "/tax-resolution", priority: "0.8", changefreq: "monthly" },
  { loc: "/tax-negotiation", priority: "0.8", changefreq: "monthly" },
  { loc: "/tax-protection-plans", priority: "0.7", changefreq: "monthly" },
  { loc: "/state-tax-guide", priority: "0.8", changefreq: "monthly" },
  { loc: "/privacy-policy", priority: "0.2", changefreq: "yearly" },
  { loc: "/terms-of-service", priority: "0.2", changefreq: "yearly" },
];

const toEntry = ({ loc, priority, changefreq }) =>
  `  <url>
    <loc>${DOMAIN}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const subPageEntries = Object.keys(subPageData).map((slug) =>
  toEntry({ loc: `/${slug}`, priority: "0.6", changefreq: "monthly" }),
);

const blogEntries = blogData.map((blog) =>
  toEntry({
    loc: `/tax-news/${blog.id}`,
    priority: "0.6",
    changefreq: "monthly",
  }),
);

const stateEntries = states.map((s) =>
  toEntry({
    loc: `/state-tax-guide/state-income-tax-help-${s}`,
    priority: "0.6",
    changefreq: "monthly",
  }),
);

const allEntries = [
  ...staticPages.map(toEntry),
  ...subPageEntries,
  ...blogEntries,
  ...stateEntries,
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries.join("\n")}
</urlset>`;

const outputPath = path.resolve(__dirname, "..", "public", "sitemap.xml");
fs.writeFileSync(outputPath, sitemap, "utf-8");
console.log(`Sitemap generated: ${allEntries.length} URLs → ${outputPath}`);
