// hooks/useBlogData.js
import { useState } from "react";
import blogData from "../data/blogData";

const useBlogData = () => {
  const [blogs] = useState(blogData);
  const getBlogById = (id) => blogs.find((blog) => blog.id === id);
  return { blogs, getBlogById };
};

export default useBlogData;
