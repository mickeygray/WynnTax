import "./TaxArticlePreview.css";
import { useParams, Link } from "react-router-dom";
import useBlogData from "./useBlogData";
import SEO from "./SEO";
import { orgSchema, blogPostingSchema } from "../utils/structuredData";

const FALLBACK_HERO = "/images/hero-5.png";
const SITE_ORIGIN = "https://www.wynntaxsolutions.com";

const TaxNewsArticle = () => {
  const { id } = useParams();
  const { blogs, getBlogById } = useBlogData();
  const blog = getBlogById(id);

  if (!blog) return <p>Blog not found.</p>;

  const heroImage = blog.image || FALLBACK_HERO;
  const canonical = `/tax-news/${blog.id}`;
  const articleUrl = SITE_ORIGIN + canonical;
  const articleImage = blog.image ? new URL(blog.image, SITE_ORIGIN).href : undefined;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Tax News", item: SITE_ORIGIN + "/tax-news" },
      { "@type": "ListItem", position: 3, name: blog.contentTitle, item: articleUrl },
    ],
  };
  const tokens = (title) => new Set((title.toLowerCase().match(/[a-z]{5,}/g) || [])
    .filter((word) => !["about", "actually", "should", "before", "after", "which", "their"].includes(word)));
  const currentTokens = tokens(blog.title);
  const related = blogs.filter((other) => other.id !== id)
    .map((other) => ({ other, weight: [...tokens(other.title)].filter((token) => currentTokens.has(token)).length }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const parseText = (text) => {
    // Published body entries already contain block markup; avoid nesting it in a paragraph.
    if (/^\s*<(?:p|h[2-6]|ul|ol|blockquote|div)\b/i.test(text)) return text;
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
    <article className="tax-news-detail">
      <SEO
        title={`${blog.contentTitle} | Wynn Tax Solutions`}
        description={blog.teaser.substring(0, 155)}
        canonical={canonical}
        ogImage={articleImage}
        ogType="article"
        structuredData={[
          orgSchema,
          { ...blogPostingSchema(blog), image: articleImage, url: articleUrl,
            mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl } },
          breadcrumbSchema,
        ]}
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
          <nav className="tax-news-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link> <span>/</span>
            <Link to="/tax-news">Tax News</Link> <span>/</span>
            <span aria-current="page">{blog.title}</span>
          </nav>
        </div>
      </header>

      <div className="dynamic-article">
        <p className="tax-article-summary">{blog.teaser}</p>
        {blog.contentBody.map((paragraph, index) => (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: parseText(paragraph) }}
          />
        ))}
        {related.length > 0 && (
          <nav className="tax-article-related" aria-label="More tax articles">
            <h2>{related.some(({ weight }) => weight > 0) ? "Related reading" : "More from Tax News"}</h2>
            <ul>
              {related.map(({ other }) => (
                <li key={other.id}><Link to={`/tax-news/${other.id}`}>{other.title}</Link></li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </article>
  );
};

export default TaxNewsArticle;
