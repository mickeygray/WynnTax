import { useParams, Link } from "react-router-dom";
import useBlogData from "./useBlogData";
import SEO from "./SEO";
import { orgSchema, blogPostingSchema } from "../utils/structuredData";

const FALLBACK_HERO = "/images/hero-5.png";

const TaxNewsArticle = () => {
  const { id } = useParams();
  const { getBlogById } = useBlogData();
  const blog = getBlogById(id);

  if (!blog) return <p>Blog not found.</p>;

  const heroImage = blog.image || FALLBACK_HERO;

  const parseText = (text) => {
    let parsed = text;
    // Headings
    parsed = parsed.replace(/###\s*(.*?)\n/g, "<h4>$1</h4>");
    parsed = parsed.replace(/##\s*(.*?)\n/g, "<h3>$1</h3>");
    // Lists
    parsed = parsed.replace(/(?:^|\n)\*(.*?)\n/g, "<li>$1</li>");
    parsed = parsed.replace(/<li>(.*?)<\/li>(?!<li>)/g, "<ul>$&</ul>");
    // Links
    parsed = parsed.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    // Bold & italic
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    parsed = parsed.replace(/(?:\_|\*)(.*?)\1/g, "<em>$1</em>");
    // Paragraphs
    parsed = parsed.replace(/\n\n/g, "</p><p>");
    parsed = `<p>${parsed}</p>`;
    return parsed;
  };

  return (
    <div className="tax-news-detail">
      <SEO
        title={`${blog.contentTitle} | Wynn Tax Solutions`}
        description={blog.teaser.substring(0, 155)}
        canonical={`/tax-news/${blog.id}`}
        ogImage={`https://wynntaxsolutions.com${blog.image}`}
        structuredData={[orgSchema, blogPostingSchema(blog)]}
      />

      {/* Hero with gradient overlay and fixed height */}
      <header className="tax-news-hero">
        <div
          className="tax-news-hero-bg"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        <div className="tax-news-overlay"></div>
        <div className="tax-news-content">
          <h1>{blog.contentTitle}</h1>
          <nav className="tax-news-breadcrumbs">
            <Link to="/">Home</Link> <span>/</span>
            <Link to="/tax-news">Tax News</Link> <span>/</span>
            <span>{blog.title}</span>
          </nav>
        </div>
      </header>

      <div className="dynamic-article">
        <h2>{blog.contentTitle}</h2>
        {blog.contentBody.map((paragraph, index) => (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: parseText(paragraph) }}
          />
        ))}
      </div>
    </div>
  );
};

export default TaxNewsArticle;
