// PageViewTracker.jsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function PageViewTracker() {
  const { pathname, search } = useLocation();
  const hasTrackedInitial = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.fbq) return;

    // Skip the first hydration PageView because index.html already sent one
    if (!hasTrackedInitial.current) {
      hasTrackedInitial.current = true;
      return;
    }

    window.fbq("track", "PageView");
    window.fbq("trackCustom", "VirtualPageView", { path: pathname + search });
  }, [pathname, search]);

  return null;
}
