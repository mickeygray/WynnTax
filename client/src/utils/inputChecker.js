// src/utils/inputChecker.js
import { Filter } from "bad-words";

/**
 * Lightweight "one import" input validator + content filter.
 * Phases: "name" | "question" | "email" | "phone"
 */

const BASE_FILTER = new Filter({ placeHolder: "*" });

// --- Add hate-speech / custom terms (short, not exhaustive) ---
// NOTE: keep this SHORT in code and expand privately if needed.
const HATE_WORDS = [
  // common slurs (trimmed list; expand in a private file if needed)
  "fag",
  "faggot",
  "dyke",
  "tranny",
  "chink",
  "gook",
  "wetback",
  "retard",
  "retarded",
  // obfuscations/variants
  "niqqer",
  "niqqa",
  "n1gger",
  "n1gga",
  "n1gg3r",
  "b1tch",
  "b!tch",
  "a$$",
  "a$$hole",
];

BASE_FILTER.addWords(...HATE_WORDS);

// Extra: check after de-obfuscation
function deobfuscate(s = "") {
  return s
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[!|1]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/0/g, "o")
    .replace(/\$/g, "s")
    .replace(/q/g, "g"); // common swap seen in some variants
}

// --- Email/phone regex ---
const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Accepts: (123) 456-7890, 123-456-7890, 1234567890, +1 123 456 7890
const PHONE_RE = /^(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?){2}\d{4}$/;

// --- Name rules: letters + spaces + apostrophes + hyphens only ---
const NAME_RE = /^[A-Za-z][A-Za-z' -]{0,62}[A-Za-z]$/;

// --- Simple gibberish heuristic ---
function isLikelyGibberish(s = "") {
  const t = s.toLowerCase().replace(/[^a-z]/g, "");

  if (t.length >= 20) {
    // repeated single character (e.g., "aaaaaaaaaaaaaa")
    if (/^(.)\1{9,}$/.test(t)) return true;
  }

  // No vowels in a long token (e.g., "xzlkvprtn")
  const tokens = t.split(/[^a-z]+/).filter(Boolean);
  if (tokens.some((tok) => tok.length >= 6 && !/[aeiou]/.test(tok)))
    return true;

  // keyboard-mash pattern (random consonant clusters)
  if (t.length >= 10 && /[bcdfghjklmnpqrstvwxyz]{6,}/.test(t)) return true;

  return false;
}

// Normalize whitespace
function normalize(s = "") {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Main checker
 * @param {Object} opts
 * @param {"name"|"question"|"email"|"phone"} opts.phase
 * @param {string} opts.value
 * @returns {{
 *   ok: boolean,
 *   reason?: string,
 *   cleaned?: string,
 *   type?: "email"|"phone"|"name"|"question"
 * }}
 */
export function inputChecker({ phase, value }) {
  const raw = String(value == null ? "" : value);
  const cleaned = normalize(raw);
  const lowered = cleaned.toLowerCase();
  const unleet = deobfuscate(lowered);

  console.log("[inputChecker] phase:", phase);
  console.log("[inputChecker] raw:", raw);
  console.log("[inputChecker] cleaned:", cleaned);
  console.log("[inputChecker] lowered:", lowered);
  console.log("[inputChecker] unleet:", unleet);
  // Profanity / hate speech first (for all phases)
  const profane =
    BASE_FILTER.isProfane(lowered) || BASE_FILTER.isProfane(unleet);
  console.log("[inputChecker] profane:", profane);
  if (profane) {
    return { ok: false, reason: "profanity_detected", cleaned, type: phase };
  }

  switch (phase) {
    case "name": {
      if (!cleaned) return { ok: false, reason: "empty_name" };
      if (!NAME_RE.test(cleaned)) {
        return {
          ok: false,
          reason: "invalid_name_format", // letters, spaces, apostrophes, hyphens only
          cleaned,
          type: "name",
        };
      }
      if (isLikelyGibberish(cleaned)) {
        console.log("[inputChecker:name] gibberish detected");
        return { ok: false, reason: "gibberish_name", cleaned, type: "name" };
      }
      return { ok: true, cleaned, type: "name" };
    }

    case "email": {
      if (!cleaned) return { ok: false, reason: "empty_email" };
      if (!EMAIL_RE.test(cleaned)) {
        return { ok: false, reason: "invalid_email", cleaned, type: "email" };
      }
      return { ok: true, cleaned, type: "email" };
    }

    case "phone": {
      if (!cleaned) return { ok: false, reason: "empty_phone" };
      if (!PHONE_RE.test(cleaned)) {
        return { ok: false, reason: "invalid_phone", cleaned, type: "phone" };
      }
      // Optional: normalize to digits-only + possible +country
      const digits = cleaned.replace(/[^\d+]/g, "");
      return { ok: true, cleaned: digits, type: "phone" };
    }

    case "question": {
      if (!cleaned) return { ok: false, reason: "empty_question" };
      // very short / low-info
      if (cleaned.length < 5) {
        return { ok: false, reason: "too_short", cleaned, type: "question" };
      }
      if (isLikelyGibberish(cleaned)) {
        return {
          ok: false,
          reason: "gibberish_question",
          cleaned,
          type: "question",
        };
      }
      return { ok: true, cleaned, type: "question" };
    }

    default:
      // If you call with an unknown phase, fall back to a basic profanity + gibberish check
      if (!cleaned) return { ok: false, reason: "empty_input", cleaned };
      if (isLikelyGibberish(cleaned)) {
        return { ok: false, reason: "gibberish_input", cleaned };
      }
      return { ok: true, cleaned };
  }
}
