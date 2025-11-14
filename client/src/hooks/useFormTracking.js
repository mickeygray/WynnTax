// hooks/useFormTracking.js
import { useEffect, useRef } from "react";

/**
 * Simple form tracking hook
 * Saves form data to backend as user types (debounced)
 * Does NOT restore - just captures for analytics/abandonment tracking
 *
 * @param {Object} formData - The form data to track
 * @param {string} formType - Identifier for the form (e.g., "contact-us", "landing-popup")
 * @param {boolean} enabled - Whether tracking is enabled (disable after submit)
 */
export function useFormTracking(formData, formType, enabled = true) {
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: wait 2 seconds after last change
    saveTimeoutRef.current = setTimeout(() => {
      const dataToSave = {
        formType,
        formData,
        timestamp: Date.now(),
      };

      // Only save if something changed
      const dataStr = JSON.stringify(dataToSave);
      if (dataStr === lastSavedRef.current) {
        return;
      }

      // Save to backend
      fetch("/api/track-form-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: dataStr,
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.ok) {
            lastSavedRef.current = dataStr;
            console.log(`[FORM-TRACK] ${formType} data saved`);
          }
        })
        .catch((err) => {
          console.error(`[FORM-TRACK] ${formType} failed:`, err);
        });
    }, 2000); // 2 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, formType, enabled]);
}

/**
 * Track form abandonment when user leaves
 * Call this in beforeunload event
 */
export function trackFormAbandon(formType, formData) {
  // Use sendBeacon for reliable fire-and-forget
  const data = JSON.stringify({
    formType,
    formData,
    abandoned: true,
    timestamp: Date.now(),
  });

  navigator.sendBeacon("/api/track-form-input", data);
  console.log(`[FORM-TRACK] ${formType} abandonment tracked`);
}
