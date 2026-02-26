// scripts/generate-sitemap.js
const fs = require("fs");
const path = require("path");

const subPageData = require("../src/data/subPageData");
const blogData = require("../src/data/blogData");

const DOMAIN = "https://www.wynntaxsolutions.com";

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

const allEntries = [
  ...staticPages.map(toEntry),
  ...subPageEntries,
  ...blogEntries,
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries.join("\n")}
</urlset>`;

const outputPath = path.resolve(__dirname, "..", "public", "sitemap.xml");
fs.writeFileSync(outputPath, sitemap, "utf-8");
console.log(`Sitemap generated: ${allEntries.length} URLs → ${outputPath}`);
