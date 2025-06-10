import React, { useState } from "react";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "What services do you offer?",
    answer:
      "We offer a wide range of tax services, including tax preparation, tax consultation, tax resolution, tax negotiation, and protection plans. Whether you need help with IRS notices, tax debt settlement, or proactive planning, we have the expertise to assist you.",
  },
  {
    question: "How does the tax resolution process work?",
    answer:
      "The process begins with a consultation to understand your tax issues and financial situation. From there, we identify the best resolution options, such as installment agreements, penalty abatements, or offers in compromise. We handle communication with the IRS on your behalf and work to secure the most favorable outcome.",
  },
  {
    question:
      "What is the difference between tax resolution and tax negotiation?",
    answer:
      "Tax resolution refers to the overall process of resolving tax debt or disputes with the IRS, while tax negotiation focuses specifically on working with the IRS to establish payment plans, reduce penalties, or settle for less than the full amount owed. Both aim to provide relief and financial stability.",
  },
  {
    question: "How long does it take to resolve tax debt?",
    answer:
      "The time frame for resolving tax debt varies depending on the complexity of your case and the resolution method. Some cases may be resolved in a few weeks, while others can take several months.",
  },
  {
    question: "Can you help with state tax issues?",
    answer:
      "Yes, we can assist with state tax issues, including back taxes, liens, and penalties. Our team is experienced in dealing with both federal and state tax authorities.",
  },
  {
    question: "What is a Tax Protection Plan, and which one should I choose?",
    answer:
      "Our Tax Protection Plans provide proactive support and peace of mind by covering services such as audit defense, IRS communication, and tax planning. We offer Standard, Premium, and Professional plans, each providing different levels of coverage. We can help you select the plan that best fits your needs.",
  },
  {
    question: "Will you represent me in an IRS audit?",
    answer:
      "Yes, we provide full audit representation to protect your rights and ensure your case is handled properly.",
  },
  {
    question: "What is an Offer in Compromise, and how do I qualify?",
    answer:
      "An Offer in Compromise allows taxpayers to settle their tax debt for less than the full amount owed. Eligibility depends on your financial situation and ability to pay.",
  },
  {
    question: "How do I get started?",
    answer:
      "Getting started is easy. Reach out to us to schedule a consultation, and we’ll review your situation, answer any questions, and recommend the best solutions to resolve your tax challenges.",
  },
];

const TaxFaqs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="tax-faqs-page">
      {/* Hero Section */}
      <section
        className="faq-hero-section"
        aria-label="Page Title Bar"
        style={{
          backgroundImage: `url("/images/hero-2.png")`,
        }}
      >
        <div className="faq-hero-content">
          <h1 className="faq-hero-title">Tax FAQs</h1>
          <nav className="breadcrumb">
            <ol>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>Tax FAQs</li>
            </ol>
          </nav>
        </div>
      </section>

      {/* FAQ Section */}
      <div className="faq-container">
        <div className="faq-section">
          <h2 className="faq-header">Frequently Asked Questions</h2>
          <p className="faq-description">
            At Wynn Tax Solutions, we understand that navigating tax challenges
            can be confusing. Below, you’ll find answers to some of the most
            common questions we receive. If you don’t see your question listed,
            feel free to <Link to="/contact">contact us</Link> for more
            information.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${openIndex === index ? "open" : ""}`}
              onClick={() => toggleFAQ(index)}
            >
              <h3>
                <i className="fa fa-question-circle" aria-hidden="true"></i>{" "}
                {faq.question}
                <span className="toggle-icon">
                  {openIndex === index ? "−" : "+"}
                </span>
              </h3>
              {openIndex === index && (
                <p className="faq-answer">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="faq-contact">
        <h3>Still have questions?</h3>
        <p>
          Contact us for a personalized consultation. Our experts are here to
          help you navigate your tax challenges.
        </p>
        <Link to="/contact-us" className="contact-button">
          Contact Us
        </Link>
      </div>
    </div>
  );
};

export default TaxFaqs;
