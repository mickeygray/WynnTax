import React from "react";
import { Link } from "react-router-dom";
import SEO from "./SEO";
import { serviceSchema } from "../utils/structuredData";
import "./ServiceDetailPreview.css";

const brand = "Wynn Tax Solutions";
const baseUrl = "https://www.wynntaxsolutions.com";

const categoryLabels = {
  "tax-relief": "Tax Relief",
  "tax-resolution": "Tax Resolution",
  "tax-negotiation": "Tax Negotiation",
};

const summaries = {
  "tax-consultation": "Use a tax consultation to explain what happened, identify the records or notices that matter, and decide what to address first.",
  "tax-preparation": "Need to file an individual or business return? Start by identifying which years need attention and gathering the records for each return.",
  "tax-settlement": "If you are exploring ways to resolve tax debt, start with the amount owed, the tax years involved, and the notices you have received.",
  "tax-representation": "Tax representation can help you understand what an agency is asking for and organize the records needed to respond.",
  "dealing-with-the-irs": "Start with the notice in front of you: identify the tax year, what the IRS is asking for, and the response date.",
  "irs-innocent-spouse": "If you are concerned about tax debt from a joint return, review the return and any IRS correspondence before exploring whether relief may apply.",
  "state-tax-relief": "A state tax issue starts with the state agency and notice involved. Gather the relevant filings and notices before comparing your options.",
  "statute-of-limitations": "Tax deadlines can depend on which action and tax year are at issue. Gather the relevant dates and notices before drawing a conclusion.",
  "tax-prep-and-planning": "Tax preparation addresses what you need to file. Tax planning looks ahead at decisions and records that may affect future returns.",
  "unified-tax-returns": "When several returns or filings need attention, start by listing the entities, tax years, and jurisdictions involved.",
  "irs-tax-discharge": "Before assuming a tax debt can be discharged, gather the return, assessment, and payment history for the tax years involved.",
  "payroll-tax-relief": "For a payroll tax problem, identify the quarters involved and gather filings, deposit records, and agency notices.",
  "wage-garnishment-relief": "If wages are being withheld, start by confirming which agency issued the notice, which debt it relates to, and what dates it lists.",
  "currently-not-collectible": "If you cannot afford to pay an IRS balance, gather your income and essential expenses before asking about currently not collectible status.",
  "irs-installment-plans": "An installment plan is a way to pay a tax balance over time. Review the balance and what you can realistically pay each month before choosing a next step.",
  "penalty-abatement": "If you were charged a tax penalty, identify the penalty and the tax period on the notice before exploring whether relief might apply.",
  "offer-in-compromise": "An offer in compromise is a request to settle an IRS debt for less than the full balance. Before considering it, gather current information about income, expenses, assets, and the debt.",
};

function summaryFor(slug, body, title) {
  const firstParagraph = body.find((paragraph) => typeof paragraph === "string" && paragraph.trim());
  return summaries[slug] || firstParagraph?.trim() || title;
}

const SubPage = ({ heroImage, heroTitle, title, body = [], category, slug }) => {
  const canonical = `/${category}/${slug}/`;
  const categoryLabel = categoryLabels[category] || "Tax Services";
  const categoryPath = categoryLabels[category] ? `/${category}/` : "/our-tax-services";
  const pageTitle = title || heroTitle;
  const summary = summaryFor(slug, body, pageTitle);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: categoryLabel, path: categoryPath },
    { name: pageTitle, path: canonical },
  ];
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: `${baseUrl}${path}`,
    })),
  };

  return (
    <main className="service-detail">
      <SEO
        title={`${pageTitle} | ${brand}`}
        description={summary}
        canonical={canonical}
        structuredData={[serviceSchema(pageTitle, summary, categoryLabel), breadcrumb]}
      />
      <header
        className="service-detail__hero"
        style={heroImage ? { "--service-detail-image": `url("${heroImage}")` } : undefined}
      >
        <div className="service-detail__inner">
          <nav className="service-detail__breadcrumbs" aria-label="Breadcrumb">
            <ol>
              {crumbs.map(({ name, path }, index) => (
                <li key={path}>
                  {index === crumbs.length - 1 ? (
                    <span aria-current="page">{name}</span>
                  ) : (
                    <Link to={path}>{name}</Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <p className="service-detail__eyebrow">{categoryLabel}</p>
          <h1>{pageTitle}</h1>
          <p className="service-detail__summary">{summary}</p>
          <Link className="service-detail__button" to="/contact-us">
            Talk to our tax team
          </Link>
        </div>
      </header>

      <div className="service-detail__inner service-detail__content">
        <section className="service-detail__copy" aria-labelledby="service-detail-overview">
          <h2 id="service-detail-overview">What to know</h2>
          {body.filter((paragraph) => paragraph !== summary).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>
        <aside className="service-detail__next" aria-labelledby="service-detail-next">
          <h2 id="service-detail-next">Not sure where to start?</h2>
          <p>Tell us what happened and which tax years or notices are involved.</p>
          <Link className="service-detail__button" to="/contact-us">
            Contact {brand}
          </Link>
          <Link className="service-detail__text-link" to={categoryPath}>
            Explore {categoryLabel.toLowerCase()} services
          </Link>
          <Link className="service-detail__text-link" to="/tax-news">
            Read our tax guides
          </Link>
        </aside>
      </div>
    </main>
  );
};

export default SubPage;
