// hooks/useAutoSaveProgress.js
import { useEffect, useRef } from "react";

/**
 * Hook to automatically save Tax Stewart progress to backend cookie
 * Debounces saves to avoid excessive API calls
 */
export function useAutoSaveProgress(form, phase, enabled = true) {
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: wait 2 seconds after last change before saving
    saveTimeoutRef.current = setTimeout(() => {
      const dataToSave = {
        ...form,
        lastPhase: phase,
        startedAt: form.startedAt || Date.now(),
      };

      // Only save if something changed
      const dataStr = JSON.stringify(dataToSave);
      if (dataStr === lastSavedRef.current) {
        return;
      }

      // Save to backend
      fetch("/api/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: dataStr,
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.ok) {
            lastSavedRef.current = dataStr;
            console.log("[AUTO-SAVE] Progress saved:", phase);
          }
        })
        .catch((err) => {
          console.error("[AUTO-SAVE] Failed:", err);
        });
    }, 2000); // 2 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, phase, enabled]);
}

/**
 * Function to restore progress on component mount
 */
export async function restoreProgress() {
  try {
    const response = await fetch("/api/restore-progress", {
      credentials: "include",
    });

    const result = await response.json();

    if (result.ok && result.hasProgress) {
      return result.data;
    }

    return null;
  } catch (error) {
    console.error("[RESTORE] Failed:", error);
    return null;
  }
}
