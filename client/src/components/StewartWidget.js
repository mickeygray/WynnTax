// components/StewartWidget.jsx (simplified - no popups)
import React, { useEffect, useRef, useState } from "react";
import TaxStewart from "./TaxStewart";

export default function StewartWidget() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const overlayRef = useRef(null);

  const isHomePage =
    typeof window !== "undefined" && window.location.pathname === "/";
  const isDesktop = typeof window !== "undefined" && window.innerWidth > 768;

  // Show hint on desktop home page after delay (once)
  useEffect(() => {
    if (isHomePage && isDesktop && !hintDismissed && !open) {
      const timer = setTimeout(() => {
        setShowHint(true);
        // Auto-dismiss after 8 seconds
        setTimeout(() => setShowHint(false), 8000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHomePage, isDesktop, hintDismissed, open]);

  const handleStewartClick = () => {
    setShowHint(false);
    setHintDismissed(true);
    setOpen(true);
  };

  const dismissHint = () => {
    setShowHint(false);
    setHintDismissed(true);
  };

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent background scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const closeOnBackdrop = (e) => {
    if (e.target === overlayRef.current) setOpen(false);
  };

  return (
    <>
      {/* Stewart FAB + Hint (desktop only) */}
      {!open && (
        <div className="stewart-widget-container">
          {/* Hint tooltip - desktop only */}
          {showHint && isDesktop && (
            <div className="stewart-hint">
              <button className="stewart-hint-close" onClick={dismissHint}>
                ×
              </button>
              <p>Have a tax question?</p>
              <span>Ask Stewart for free expert guidance</span>
              <div className="stewart-hint-arrow"></div>
            </div>
          )}

          {/* Stewart button */}
          <button
            onClick={handleStewartClick}
            aria-label="Open Ask Stewart"
            className="stewart-fab"
          >
            <div className="stewart-fab-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.38 14.99 3.06 16.26L2 22L7.74 20.94C9.01 21.62 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="stewart-fab-text">Ask Stewart</span>
          </button>
        </div>
      )}

      {/* Stewart Modal */}
      {open && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          onMouseDown={closeOnBackdrop}
          className="stewart-modal-overlay"
        >
          <div className="stewart-modal">
            <div className="stewart-modal-header">
              <div className="stewart-modal-title">
                <div className="stewart-avatar">S</div>
                <div>
                  <div className="stewart-name">Ask Stewart</div>
                  <div className="stewart-subtitle">Tax education by Wynn</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="stewart-close">
                ✕
              </button>
            </div>
            <div className="stewart-modal-body">
              <TaxStewart />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
