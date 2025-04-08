import React from "react";
import { Link } from "react-router-dom";

const SubPage = ({ heroImage, heroTitle, breadcrumb, title, body }) => {
  return (
    <>
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

      {/* Breadcrumb */}

      <main className="subpage-container">
        {/* Page Title & Body Copy */}
        <section className="subpage-content">
          <h1 className="page-title">{title}</h1>
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
