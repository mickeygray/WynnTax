import React from "react";

const TaxResolution = () => {
  return (
    <div className="tax-resolution-page">
      {/* Hero Section */}
      <section
        className="tax-resolution-hero"
        style={{
          backgroundImage: `url("/images/hero-13.jpg")`,
        }}
      >
        <div className="tax-resolution-overlay"></div>
        <div className="tax-resolution-content">
          <h1>Tax Resolution</h1>
          <nav className="tax-resolution-breadcrumbs">
            <a href="/">Home</a> <span>/</span> <span>Tax Resolution</span>
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <main className="tax-resolution-main">
        <section className="tax-resolution-intro">
          <h1 className="tax-resolution-title">
            Tax Resolution Services You Can Count On
          </h1>
          <p>
            Dealing with tax challenges can feel like an uphill battle, but{" "}
            <strong>Wynn Tax Solutions</strong> is here to help. Our tax
            resolution services are designed to provide expert guidance and
            comprehensive solutions, so you can resolve your tax issues and
            regain financial peace of mind.
          </p>
        </section>

        <section className="tax-resolution-services">
          <h1 className="tax-resolution-title">Our Tax Resolution Services</h1>
          <p>
            We offer a range of services to help you navigate tax issues,
            including:
          </p>

          {/* Tax Representation */}
          <h2 className="tax-resolution-subtitle">✔ Tax Representation</h2>
          <p>
            When you’re facing the IRS, having professional
            <a href="/tax-resolution/tax-representation">
              {" "}
              tax representation
            </a>{" "}
            can make all the difference. Our team acts as your advocate,
            communicating with the IRS on your behalf, protecting your rights,
            and working to achieve the best possible resolution for your case.
          </p>

          {/* Dealing with the IRS */}
          <h2 className="tax-resolution-subtitle">✔ Dealing with the IRS</h2>
          <p>
            Responding to IRS notices, audits, or collection efforts can be
            stressful and confusing. We simplify the process by managing all
            communications with the IRS, ensuring that your case is handled
            efficiently and effectively, so you don’t have to face it alone.
          </p>

          {/* Innocent Spouse Relief */}
          <h2 className="tax-resolution-subtitle">✔ Innocent Spouse Relief</h2>
          <p>
            If you’re being unfairly held responsible for a spouse’s or
            ex-spouse’s tax debt, you may qualify for
            <a href="/tax-resolution/irs-innocent-spouse">
              {" "}
              Innocent Spouse Relief
            </a>
            . Our experts will assess your situation and guide you through the
            process of applying for relief, helping to protect your financial
            future.
          </p>

          {/* State Tax Relief */}
          <h2 className="tax-resolution-subtitle">✔ State Tax Relief</h2>
          <p>
            Tax issues aren’t limited to the IRS. If you’re dealing with state
            tax problems, we can help you navigate the unique rules and
            requirements of your state’s tax authority. From negotiating
            settlements to resolving back taxes, we’ll work to find the best
            solution.
          </p>

          {/* Statute of Limitations */}
          <h2 className="tax-resolution-subtitle">✔ Statute of Limitations</h2>
          <p>
            Tax debt doesn’t last forever. If your tax liabilities are
            approaching their expiration date under the
            <a href="/tax-resolution/statute-of-limitations">
              {" "}
              statute of limitations
            </a>
            , we’ll ensure you’re informed of your rights and options to avoid
            unnecessary payments or collections.
          </p>

          {/* Tax Preparation and Planning */}
          <h2 className="tax-resolution-subtitle">
            ✔ Tax Preparation and Planning
          </h2>
          <p>
            Proper
            <a href="/tax-resolution/tax-prep-and-planning">
              {" "}
              tax preparation and planning
            </a>
            are key to avoiding future issues. We help you stay ahead of tax
            obligations by providing accurate filing services and strategic
            planning that minimizes liabilities and maximizes savings.
          </p>

          {/* Unified Tax Returns */}
          <h2 className="tax-resolution-subtitle">✔ Unified Tax Returns</h2>
          <p>
            If you need to consolidate multiple tax filings or correct errors
            from past returns, our
            <a href="/tax-resolution/unified-tax-returns">
              {" "}
              unified tax return
            </a>{" "}
            services streamline the process, ensuring all filings are accurate
            and compliant with tax laws.
          </p>

          {/* IRS Tax Discharge */}
          <h2 className="tax-resolution-subtitle">✔ IRS Tax Discharge</h2>
          <p>
            Certain tax debts may be eligible for discharge through bankruptcy
            or other resolution methods. We’ll evaluate your case and determine
            if an
            <a href="/tax-resolution/irs-tax-discharge">
              {" "}
              IRS tax discharge
            </a>{" "}
            is a viable option for your situation, helping you achieve lasting
            relief.
          </p>

          {/* Payroll Tax Relief */}
          <h2 className="tax-resolution-subtitle">✔ Payroll Tax Relief</h2>
          <p>
            Unpaid payroll taxes can lead to significant penalties and IRS
            action. We’ll work with you to resolve payroll tax issues quickly,
            protecting your business from further liabilities and keeping your
            operations running smoothly.
          </p>

          {/* Wage Garnishment Relief */}
          <h2 className="tax-resolution-subtitle">✔ Wage Garnishment Relief</h2>
          <p>
            If the IRS is garnishing your wages, it’s time to take action. Our
            <a href="/tax-resolution/wage-garnishment-relief">
              {" "}
              wage garnishment relief
            </a>{" "}
            services focus on negotiating with the IRS to reduce or eliminate
            garnishments, so you can regain control of your income.
          </p>

          <p>
            <strong>
              Take the first step toward resolving your tax challenges.
            </strong>
            <a href="/contact-us"> Contact Wynn Tax Solutions</a> today to learn
            more about our tax resolution services and how we can help you
            achieve financial freedom. We’re here to help!
          </p>
        </section>
      </main>
    </div>
  );
};

export default TaxResolution;
