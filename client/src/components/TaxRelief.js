import React from "react";

const TaxRelief = () => {
  return (
    <div className="tax-relief-page">
      {/* Hero Section */}
      <section
        className="tax-relief-hero"
        style={{
          backgroundImage: `url("/images/hero-5.jpg")`,
        }}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Tax Relief</h1>
          <nav className="breadcrumbs">
            <a href="/">Home</a> <span>/</span> <span>Tax Relief</span>
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <main className="tax-relief-content">
        <section className="intro">
          <h1 className="blue-title">Tax Relief Solutions You Can Trust</h1>
          <p>
            Dealing with tax issues can feel overwhelming, but you’re not alone.
            At <strong>Wynn Tax Solutions</strong>, we specialize in providing
            personalized tax relief services that help individuals and
            businesses resolve their tax challenges efficiently and effectively.
          </p>
        </section>

        <section className="help-section">
          <h1 className="blue-title">
            Struggling With Tax Problems? We’re Here to Help
          </h1>
          <p>
            If you owe back taxes, are facing IRS penalties, or have received a
            notice of intent to levy, our experienced team is here to guide you
            through the process. We work closely with the IRS on your behalf to
            find a resolution that fits your situation and helps you regain
            financial stability.
          </p>
        </section>

        <section className="tax-relief-services">
          {" "}
          <h1 className="blue-title">Our Tax Relief Services</h1>
          <p>
            Our comprehensive tax relief services are designed to address a wide
            range of tax issues, including:
          </p>
          {/* Tax Consultation */}
          <h2 className="blue-subtitle">✔ Tax Consultation</h2>
          <p>
            Navigating the complexities of taxes can be overwhelming, but our
            <a href="/tax-relief/tax-consultation"> tax consultation</a>{" "}
            services are here to help. At <strong>Wynn Tax Solutions</strong>,
            we offer personalized guidance to address your unique tax needs,
            whether you’re an individual or a business.
          </p>
          <p>
            Our experienced tax professionals take the time to understand your
            financial situation, identify potential challenges, and provide
            clear, actionable solutions. Whether you need advice on tax
            planning, understanding IRS notices, or managing your liabilities,
            we’re here to ensure you have the information and strategies needed
            to move forward confidently.
          </p>
          <p>
            <strong>Don’t let tax concerns hold you back.</strong> Schedule a
            tax consultation with us today and take the first step toward
            financial clarity and peace of mind.
          </p>
          {/* Tax Preparation */}
          <h2 className="blue-subtitle">✔ Tax Preparation</h2>
          <p>
            Filing taxes doesn’t have to be stressful.{" "}
            <strong>Wynn Tax Solutions</strong>
            offers professional
            <a href="/tax-relief/tax-preparation"> tax preparation</a> services
            designed to simplify the process and maximize your savings.
          </p>
          <p>
            We stay up to date with the latest tax laws and deductions to ensure
            you take advantage of every opportunity available to you. From
            simple individual returns to complex business filings, we handle the
            details so you can focus on what matters most.
          </p>
          <p>
            <strong>Make tax season worry-free</strong> by trusting your tax
            preparation to <strong>Wynn Tax Solutions</strong>. Contact us today
            to get started.
          </p>
          {/* Tax Settlement */}
          <h2 className="blue-subtitle">✔ Tax Settlement</h2>
          <p>
            If you’re facing tax debt or struggling to resolve a dispute with
            the IRS, our
            <a href="/tax-relief/tax-settlement"> tax settlement services</a>
            are here to help. At <strong>Wynn Tax Solutions</strong>, we
            specialize in negotiating with the IRS on your behalf to reach a
            resolution that works for you.
          </p>
          <p>
            Our team has extensive experience securing favorable outcomes for
            clients, including installment agreements, offers in compromise,
            penalty abatements, and more. We understand how stressful tax debt
            can be, and we’re committed to providing you with a clear path
            forward to regain financial stability.
          </p>
          <p>
            <strong>Take control of your tax debt today.</strong> Contact us to
            learn more about our tax settlement services and how we can help you
            achieve the relief you deserve.
          </p>
          <p>
            With years of experience helping clients across the United States,
            we know how to tackle the most complex tax problems. Our team is
            committed to providing honest, transparent, and effective solutions
            so you can focus on what matters most.
          </p>
          <p>
            <strong>
              Take the first step toward resolving your tax issues.
            </strong>
            <a href="/contact-us"> Contact us</a> today to learn how we can help
            you achieve financial peace of mind.
          </p>
        </section>
      </main>
    </div>
  );
};

export default TaxRelief;
