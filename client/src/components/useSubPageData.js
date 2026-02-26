// hooks/useSubPageData.js
import { useState, useEffect } from "react";
import subPageData from "../data/subPageData";
const useSubPageData = () => {
  const [pages] = useState(subPageData);
  const getSubPage = (slug) => pages[slug];
  return { pages, getSubPage };
};

export default useSubPageData;
