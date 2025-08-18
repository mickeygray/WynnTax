// PageViewTracker.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function PageViewTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
      // Optional: helpful for debugging route-level page views
      window.fbq("trackCustom", "VirtualPageView", { path: pathname + search });
    }
  }, [pathname, search]);

  return null; // no UI
}
