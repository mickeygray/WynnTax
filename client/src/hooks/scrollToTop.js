import { useEffect } from "react";

export default function ScrollToTop() {
  useEffect(() => {
    const onRouteChange = () => {
      window.scrollTo(0, 0);
    };

    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPush.apply(this, args);
      onRouteChange();
    };

    window.history.replaceState = function (...args) {
      originalReplace.apply(this, args);
      onRouteChange();
    };

    window.addEventListener("popstate", onRouteChange);

    return () => {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
      window.removeEventListener("popstate", onRouteChange);
    };
  }, []);

  return null;
}
