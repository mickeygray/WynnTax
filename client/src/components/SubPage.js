import React from "react";
import { Link } from "react-router-dom";
import SEO from "./SEO";

const SubPage = ({ heroImage, heroTitle, breadcrumb, title, body }) => {
  const slug = breadcrumb
    .filter((b) => b.link)
    .map((b) => b.link)
    .pop();
  const canonical =
    slug ||
    "/" +
      breadcrumb
        .map((b) => b.label.toLowerCase().replace(/\s+/g, "-"))
        .slice(1)
        .join("/");

  return (
    <>
      <SEO
        title={`${title} | Wynn Tax Solutions`}
        description={body[0]?.substring(0, 155) + "..."}
        canonical={canonical}
      />
      {/* Hero Section */}
      <section
        className="subpage-hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="hero-overlay"></div>
        <div className="subpage-hero-content">
          <h1>{heroTitle}</h1>
          <nav className="breadcrumbs">
            {breadcrumb.map((item, index) => (
              <span key={index}>
                {item.link ? (
                  <Link to={item.link}>{item.label}</Link>
                ) : (
                  item.label
                )}
                {index < breadcrumb.length - 1 && " / "}
              </span>
            ))}
          </nav>
        </div>
      </section>

      <main className="subpage-container">
        <section className="subpage-content">
          <h2 className="page-title">{title}</h2>
          {body.map((paragraph, index) => (
            <p key={index} className="page-body">
              {paragraph}
            </p>
          ))}
        </section>
      </main>
    </>
  );
};

export default SubPage;
