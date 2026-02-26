import React from "react";
import { useParams } from "react-router-dom";
import useSubPageData from "./useSubPageData";
import SubPage from "./SubPage";

const SubPageWrapper = () => {
  const { category, slug } = useParams();
  const subPageData = useSubPageData();

  // Handle both return shapes: flat object or { pages } wrapper
  const pages =
    subPageData && typeof subPageData === "object" && subPageData.pages
      ? subPageData.pages
      : subPageData;

  const pageKey = `${category}/${slug}`;
  const pageData = pages[pageKey];

  if (!pageData) {
    return (
      <h1 style={{ textAlign: "center", marginTop: "50px" }}>Page Not Found</h1>
    );
  }

  return <SubPage {...pageData} />;
};

export default SubPageWrapper;
