import { Helmet } from "react-helmet-async";

const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  structuredData,
  noindex,
}) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={`https://wynntaxsolutions.com${canonical}`} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta
      property="og:url"
      content={`https://wynntaxsolutions.com${canonical}`}
    />
    <meta property="og:type" content="website" />
    <meta
      property="og:image"
      content={ogImage || "https://wynntaxsolutions.com/images/og-default.png"}
    />
    <meta property="og:site_name" content="Wynn Tax Solutions" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    {noindex && <meta name="robots" content="noindex, nofollow" />}
    {structuredData &&
      (Array.isArray(structuredData) ? (
        structuredData.map((sd, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(sd)}
          </script>
        ))
      ) : (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      ))}
  </Helmet>
);

export default SEO;
