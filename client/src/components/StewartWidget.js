// src/components/StewartWidget.jsx
import React, { useEffect, useRef, useState } from "react";
import TaxStewart from "./TaxStewart"; // your existing chat component

export default function StewartWidget() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent background scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev);
    }
  }, [open]);

  const closeOnBackdrop = (e) => {
    if (e.target === overlayRef.current) setOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Ask Stewart"
          style={styles.fab}
        >
          <span style={styles.fabDot} />
          <span>Ask Stewart</span>
        </button>
      )}

      {/* Modal */}
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
              {/* Your existing chat component goes here */}
              <TaxStewart />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  fab: {
    position: "fixed",
    right: 20,
    bottom: 20,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "16px 20px",
    borderRadius: 999,
    border: "none",
    width: "240px", // wider button
    height: "80px", // taller button
    cursor: "pointer",
    color: "#fff",
    fontSize: "1.2rem", // corrected from textSize
    fontWeight: 600,
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    background:
      "linear-gradient(135deg, #f97316 0%, #ec4899 40%, #8b5cf6 100%)",
    transition: "transform 120ms ease",
  },
  fabDot: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 0 0 6px rgba(255,255,255,0.25)",
    animation: "stewPulse 1.8s infinite ease-in-out",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    zIndex: 9998,
    display: "grid",
    placeItems: "end",
  },
  modal: {
    width: "min(720px, 96vw)",
    height: "min(80vh, 800px)",
    background: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    boxShadow: "0 -10px 30px rgba(0,0,0,0.2)",
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
  title: { fontSize: 25, fontWeight: 700, lineHeight: 1.1 },
  subtitle: { fontSize: 12, opacity: 0.9 },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
  },
  body: { height: "calc(100% - 64px)", overflow: "auto", background: "#fff" },
};
