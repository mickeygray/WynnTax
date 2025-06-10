import { Link } from "react-router-dom";
import useBlogData from "./useBlogData";

const TaxNews = () => {
  const { blogs } = useBlogData();

  return (
    <div className="tax-news-container">
      {/* Hero with overlay */}
      <header
        className="tax-news-hero"
        style={{
          backgroundImage: `url("/images/contact-hero.png")`,
        }}
      >
        <div className="tax-news-overlay"></div>
        <div className="tax-news-content">
          <h1>Tax News</h1>
          <nav className="tax-news-breadcrumbs">
            <Link to="/">Home</Link> <span>/</span> <span>Tax News</span>
          </nav>
        </div>
      </header>

      {/* Blog Grid */}
      <div className="tax-news-content-container">
        <div className="tax-news-grid">
          {blogs.map((blog) => (
            <div key={blog.id} className="tax-news-card">
              <img src={blog.image} alt={blog.title} />
              <h2>{blog.title}</h2>
              <p>{blog.teaser}</p>
              <Link to={`/tax-news/${blog.id}`} className="read-more">
                Read More
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaxNews;
