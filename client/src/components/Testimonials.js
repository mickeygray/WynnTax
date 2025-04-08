import React from "react";
// Importing CSS for styling

const testimonials = [
  {
    quote:
      "I went to Wynn Tax Solutions in order to finish my tax problem. I had a few different people try to complete my issues with the IRS, but all they did was push paper around and keep me guessing. The Wynn Tax Solutions really went to work straight away, got me a deal I could afford, and made the whole thing an understandable process.",
    author: "Rex W.",
  },
  {
    quote:
      "The Best!!! Excellent service and follow-through. Very thoughtful staff, and they kept me updated. Any situations that came up were handled immediately. They were able to do what I thought could never be done. Thank you, Wynn Tax Solutions!",
    author: "Cassie V.",
  },
  {
    quote:
      "When you receive a letter in the mail that has 'IRS' on it – you tend to lose a lot of sleep and sometimes don’t even open the envelope! I’ve had that experience, and after making contact, I have to tell you, I slept better.",
    author: "Blanche S.",
  },
  {
    quote:
      "GREAT JOB!!! Wynn Tax Solutions was able to release my wage garnishment within days. This is a fantastic company. If you have any tax issues, please give them a call!!!!!",
    author: "Jack M.",
  },
];

const Testimonials = () => {
  return (
    <section className="testimonials-section">
      {/* Parallax Background */}
      <div className="parallax-background"></div>

      <div className="testimonials-content">
        <h2 className="testimonials-title">Client’s Feedback</h2>
        <p className="testimonials-description">
          <strong>Wynn Tax Solutions</strong> has been serving proven and
          transparent tax relief and resolution services to individuals and
          businesses across California and beyond. See what our clients are
          saying.
        </p>

        {/* Testimonials Grid */}
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <p className="testimonial-quote">“{testimonial.quote}”</p>
              <p className="testimonial-author">– {testimonial.author}</p>
            </div>
          ))}
        </div>

        {/* Read More Testimonials */}
      </div>
    </section>
  );
};

export default Testimonials;
