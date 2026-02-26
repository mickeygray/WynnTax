import { Link } from "react-router-dom";
import useBlogData from "./useBlogData";
import SEO from "./SEO";

const TaxNews = () => {
  const { blogs } = useBlogData();
  const [featured, ...rest] = blogs;

  return (
    <div className="tax-news">
      <SEO
        title="Tax News & Insights | IRS Updates & Strategies | Wynn Tax Solutions"
        description="Stay informed with the latest IRS news, tax law changes, and expert analysis from the team at Wynn Tax Solutions."
        canonical="/tax-news"
      />
      <header className="tax-news__hero">
        <div className="tax-news__hero-bg">
          <img src="/images/contact-hero.png" alt="" aria-hidden="true" />
          <div className="tax-news__hero-gradient" />
        </div>
        <div className="tax-news__hero-content">
          <span className="tax-news__hero-label">Stay Informed</span>
          <h1>Tax News & Insights</h1>
          <p>
            Expert analysis and updates on tax relief, IRS policies, and
            financial strategies
          </p>
        </div>
      </header>

      <main className="tax-news__main">
        {featured && (
          <Link to={`/tax-news/${featured.id}`} className="tax-news__featured">
            <div className="tax-news__featured-image">
              <img src={featured.image} alt={featured.title} />
              <div className="tax-news__featured-overlay" />
            </div>
            <div className="tax-news__featured-content">
              <span className="tax-news__tag">Featured</span>
              <h2>{featured.title}</h2>
              <p>{featured.teaser}</p>
              <span className="tax-news__read-more">
                Read Article <span className="arrow">→</span>
              </span>
            </div>
          </Link>
        )}

        <div className="tax-news__grid">
          {rest.map((blog, index) => (
            <Link
              to={`/tax-news/${blog.id}`}
              key={blog.id}
              className="tax-news__card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="tax-news__card-image">
                <img src={blog.image} alt={blog.title} />
              </div>
              <div className="tax-news__card-content">
                <h3>{blog.title}</h3>
                <p>{blog.teaser}</p>
                <span className="tax-news__read-more">
                  Read More <span className="arrow">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TaxNews;
