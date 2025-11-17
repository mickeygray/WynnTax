import React, { useEffect, useRef, useState } from "react";
import TaxStewart from "./TaxStewart";
import LandingPopupForm from "./LandingPopupForm";

export default function StewartWidget() {
  const [open, setOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [isCondensed, setIsCondensed] = useState(false);
  const [isAtHero, setIsAtHero] = useState(true);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [isReturningFromCondensed, setIsReturningFromCondensed] =
    useState(false);
  const [buttonVisible, setButtonVisible] = useState(true);
  const overlayRef = useRef(null);

  // ✅ Native route check (react-snap friendly)
  const isQualifyNowPage =
    typeof window !== "undefined" &&
    window.location.pathname === "/qualify-now";
  const isHomePage =
    typeof window !== "undefined" && window.location.pathname === "/";

  // Handle scroll to detect hero visibility
  useEffect(() => {
    if (!isHomePage) {
      setIsAtHero(false);
      setIsCondensed(true);
      return;
    }

    const handleScroll = () => {
      const heroVisible = window.scrollY < window.innerHeight * 0.7;
      setIsAtHero(heroVisible);

      if (window.scrollY > 200 && !open) {
        if (!isCondensed) {
          setIsCondensed(true);
          setIsReturningFromCondensed(false);
        }
      } else if (window.scrollY <= 200) {
        if (isCondensed) {
          setIsReturningFromCondensed(true);
        }
        setIsCondensed(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage, open, isCondensed]);

  // Reset states when navigating to home
  useEffect(() => {
    if (isHomePage) {
      const timer = setTimeout(() => {
        if (window.scrollY <= 200) {
          setIsCondensed(false);
          setIsAtHero(true);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsCondensed(true);
      setIsAtHero(false);
    }
  }, [isHomePage]);

  // ✅ Auto-open ONLY on home page, NOT on qualify-now
  useEffect(() => {
    if (!isQualifyNowPage && !hasAutoOpened && !isCondensed && isAtHero) {
      const timer = setTimeout(() => {
        setButtonVisible(false);
        setTimeout(() => {
          setOpen(true);
          setHasAutoOpened(true);
        }, 200);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasAutoOpened, isCondensed, isAtHero, isQualifyNowPage]);

  // Handle modal closing - show button with grow animation
  useEffect(() => {
    if (!open && hasAutoOpened) {
      const timer = setTimeout(() => {
        setButtonVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, hasAutoOpened]);

  const handleStewartClick = () => {
    setButtonVisible(false);
    setTimeout(() => {
      setOpen(true);
    }, 200);
  };

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConsultationOpen(false);
      }
    };
    if (open || consultationOpen) {
      window.addEventListener("keydown", onKey);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [open, consultationOpen]);

  // Prevent background scroll when open
  useEffect(() => {
    if (open || consultationOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      // ✅ Add class for CSS targeting
      document.body.classList.add("modal-open");
      return () => {
        document.body.style.overflow = prev;
        document.body.classList.remove("modal-open");
      };
    }
  }, [open, consultationOpen]);

  const closeOnBackdrop = (e) => {
    if (e.target === overlayRef.current) {
      setOpen(false);
      setConsultationOpen(false);
    }
  };

  return (
    <>
      {/* Floating Widgets Container */}
      {/* ✅ Hide entire container when ANY modal is open */}
      {!open && !consultationOpen && (
        <div
          className={`floating-widgets-container ${
            isAtHero ? "at-hero" : "at-bottom"
          }`}
        >
          {/* Free Consultation Button - Only show when not at hero */}
          {!isAtHero && (
            <button
              onClick={() => setConsultationOpen(true)}
              aria-label="Free Consultation"
              className={`consultation-float-btn ${
                isAtHero ? "hidden" : "visible"
              }`}
            >
              <i className="fa-solid fa-phone"></i>
              <span>FREE CONSULTATION</span>
            </button>
          )}

          {/* Stewart Button - Show when visible */}
          {buttonVisible && (
            <button
              onClick={handleStewartClick}
              aria-label="Open Ask Stewart"
              className={`stewart-fab ${
                isCondensed
                  ? "condensed"
                  : isReturningFromCondensed
                  ? "expanded condensed-to-expanded"
                  : "expanded"
              } ${!buttonVisible ? "shrinking" : "growing"}`}
              style={{
                animation: !buttonVisible
                  ? "shrinkAway 0.2s ease-out forwards"
                  : hasAutoOpened
                  ? "growIn 0.3s ease-out forwards"
                  : "none",
              }}
            >
              {isCondensed ? (
                <div className="stewart-bubble-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.38 14.99 3.06 16.26L2 22L7.74 20.94C9.01 21.62 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.69 20 9.45 19.66 8.37 19.07L8 18.87L4.87 19.63L5.63 16.5L5.43 16.13C4.84 15.05 4.5 13.81 4.5 12.5C4.5 7.81 8.31 4 13 4C17.69 4 21.5 7.81 21.5 12.5C21.5 17.19 17.69 21 13 21H12Z"
                      fill="white"
                    />
                  </svg>
                </div>
              ) : (
                <>
                  <span className="stewart-pulse-dot" />
                  <span>Ask Stewart</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Stewart Modal */}
      {open && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Ask Stewart chat"
          onMouseDown={closeOnBackdrop}
          style={styles.overlay}
        >
          <div style={styles.modal}>
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                <div style={styles.avatar}>S</div>
                <div>
                  <div style={styles.title}>Ask Stewart</div>
                  <div style={styles.subtitle}>Tax education by Wynn</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={styles.body}>
              <TaxStewart />
            </div>
          </div>
        </div>
      )}

      {/* Consultation Modal */}
      {consultationOpen && (
        <LandingPopupForm onClose={() => setConsultationOpen(false)} />
      )}
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    zIndex: 10000, // ✅ Higher z-index to ensure it's on top
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: "24px",
  },
  modal: {
    width: "min(480px, 90vw)",
    height: "min(65vh, 600px)",
    background: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    background:
      "linear-gradient(135deg, rgba(249,115,22,0.9), rgba(236,72,153,0.9), rgba(139,92,246,0.9))",
    color: "#fff",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    background: "rgba(255,255,255,0.2)",
  },
  title: { fontSize: 25, fontWeight: 700, lineHeight: 1.1, paddingTop: "5px" },
  subtitle: { fontSize: 12, opacity: 0.9 },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
  },
  body: {
    height: "calc(100% - 64px)",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
};
