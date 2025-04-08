import React from "react";
import { useParams } from "react-router-dom";
import useSubPageData from "./useSubPageData";
import SubPage from "./SubPage";

const SubPageWrapper = () => {
  const { category, slug } = useParams(); // Get the route param
  const pages = useSubPageData();
  const pageKey = `${category}/${slug}`;

  const pageData = pages[pageKey];

  // If page data is not found, return a 404 page
  if (!pageData) {
    return (
      <h1 style={{ textAlign: "center", marginTop: "50px" }}>Page Not Found</h1>
    );
  }

  return <SubPage {...pageData} />;
};

export default SubPageWrapper;
