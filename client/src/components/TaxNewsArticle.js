import { useParams, Link } from "react-router-dom";
import useBlogData from "./useBlogData";

const TaxNewsArticle = () => {
  const { id } = useParams();
  const { getBlogById } = useBlogData();
  const blog = getBlogById(id);

  if (!blog) return <p>Blog not found.</p>;

  // Function to parse text with custom styles
  const parseText = (text) => {
    let parsed = text;

    // Convert ## to <h2>
    parsed = parsed.replace(/##\s*(.*?)\n/g, "<h2>$1</h2>");

    // Convert ### to <h3>
    parsed = parsed.replace(/###\s*(.*?)\n/g, "<h3>$1</h3>");

    // Convert unordered lists: lines starting with *
    parsed = parsed.replace(/(?:^|\n)\*(.*?)\n/g, "<li>$1</li>");
    parsed = parsed.replace(/<li>(.*?)<\/li>(?!<li>)/g, "<ul>$&</ul>");

    // Convert links [text](url)
    parsed = parsed.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Convert bold text **text**
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert italic text _text_ or *text*
    parsed = parsed.replace(/(?:\_|\*)(.*?)\1/g, "<em>$1</em>");

    // Wrap text in paragraphs for content separated by double new lines
    parsed = parsed.replace(/\n\n/g, "</p><p>");
    parsed = `<p>${parsed}</p>`;

    return parsed;
  };

  return (
    <div className="tax-news-detail">
      {/* Hero with overlay */}
      <header
        className="tax-news-hero"
        style={{ backgroundImage: `url(${blog.image})` }}
      >
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

      {/* Blog Content */}
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
