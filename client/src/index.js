import React from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./App.css";

const container = document.getElementById("root");

if (container) {
  // If React Snap prerendered HTML exists, hydrate it
  if (container.hasChildNodes()) {
    hydrateRoot(
      container,
      <React.StrictMode>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </React.StrictMode>,
    );
  } else {
    // Otherwise render normally
    createRoot(container).render(
      <React.StrictMode>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </React.StrictMode>,
    );
  }
}
