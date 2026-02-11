/**
 * utils/irsLogicsService.js
 *
 * IRS Logics CaseFile API service.
 *
 * Flow:
 *   1. Route receives form data + utm from client
 *   2. resolveUtm() merges client UTM with Referer header fallback
 *   3. buildCasePayload() maps form fields → Logics API schema
 *   4. createLogicsCase() POSTs to Logics, awaits response, strips CaseID
 *   5. Route uses returned CaseID in the notification email
 *
 * Env vars:
 *   WYNN_LOGICS_API_URL  — API endpoint (defaults to https://taxag.irslogics.com/publicapi/V4/Case/CaseFile)
 *   WYNN_LOGICS_API_KEY  — Basic Auth username (API Key from Security → API Key)
 *   WYNN_LOGICS_SECRET   — Basic Auth password (Secret Token from Settings → Integrations)
 */

const IRS_LOGICS_URL =
  process.env.WYNN_LOGICS_API_URL ||
  "https://taxag.irslogics.com/publicapi/V4/Case/CaseFile";

/* -------------------------------------------------------------------------- */
/*                         UTM → StatusID Mapping                             */
/* -------------------------------------------------------------------------- */

const SOURCE_STATUS_MAP = {
  google: 34,
  gclid: 34,
  facebook: 35,
  fb: 35,
  instagram: 35,
  ig: 35,
  meta: 35,
  fbclid: 35,
  tiktok: 36,
  tt: 36,
  ttclid: 36,
};

const DEFAULT_STATUS_ID = 37; // VF Digital

function resolveStatusId({ utmSource, referrerUrl } = {}) {
  console.log("[LOGICS:resolveStatusId] Input:", {
    utmSource,
    referrerUrl: referrerUrl?.slice(0, 100),
  });

  if (utmSource) {
    const key = utmSource.toLowerCase().trim();
    if (SOURCE_STATUS_MAP[key] !== undefined) {
      console.log(
        "[LOGICS:resolveStatusId] Matched utm_source:",
        key,
        "→ StatusID:",
        SOURCE_STATUS_MAP[key],
      );
      return SOURCE_STATUS_MAP[key];
    }
  }
  if (referrerUrl) {
    const url = referrerUrl.toLowerCase();
    if (url.includes("gclid=")) {
      console.log("[LOGICS:resolveStatusId] Found gclid → 34");
      return 34;
    }
    if (url.includes("fbclid=")) {
      console.log("[LOGICS:resolveStatusId] Found fbclid → 35");
      return 35;
    }
    if (url.includes("ttclid=")) {
      console.log("[LOGICS:resolveStatusId] Found ttclid → 36");
      return 36;
    }
  }

  console.log(
    "[LOGICS:resolveStatusId] No match — defaulting to:",
    DEFAULT_STATUS_ID,
  );
  return DEFAULT_STATUS_ID;
}

const SOURCE_NAMES = {
  34: "VF Google",
  35: "VF Face/Insta",
  36: "VF TikTok",
  37: "VF Digital",
};

/* -------------------------------------------------------------------------- */
/*                  Merge Client UTM + Backend Referer Fallback               */
/* -------------------------------------------------------------------------- */

function resolveUtm(clientUtm, req) {
  console.log("[LOGICS:resolveUtm] Client UTM received:", clientUtm);

  const referer = req?.headers?.referer || req?.headers?.referrer || "";
  console.log("[LOGICS:resolveUtm] Referer header:", referer || "(none)");

  let backendSource = "";
  let backendMedium = "";
  let backendCampaign = "";

  if (referer) {
    try {
      const p = new URL(referer).searchParams;
      backendSource = p.get("utm_source") || "";
      backendMedium = p.get("utm_medium") || "";
      backendCampaign = p.get("utm_campaign") || "";
      if (!backendSource) {
        if (p.get("gclid")) backendSource = "google";
        else if (p.get("fbclid")) backendSource = "facebook";
        else if (p.get("ttclid")) backendSource = "tiktok";
      }
      console.log("[LOGICS:resolveUtm] Parsed from Referer:", {
        backendSource,
        backendMedium,
        backendCampaign,
      });
    } catch (e) {
      console.log("[LOGICS:resolveUtm] Failed to parse Referer:", e.message);
    }
  }

  const resolved = {
    utmSource: clientUtm?.utmSource || backendSource, // TODO: remove "facebook" default after local testing
    utmMedium: clientUtm?.utmMedium || backendMedium,
    utmCampaign: clientUtm?.utmCampaign || backendCampaign,
    referrerUrl: clientUtm?.referrerUrl || referer,
  };

  console.log("[LOGICS:resolveUtm] Final resolved UTM:", resolved);
  return resolved;
}

/* -------------------------------------------------------------------------- */
/*                          Field Mappers                                     */
/* -------------------------------------------------------------------------- */

const TAX_PROBLEM_MAP = {
  "back-taxes": "CANT_PAY_UNPAID_TAXES",
  "unpaid-taxes": "CANT_PAY_UNPAID_TAXES",
  "balance-due": "CANT_PAY_UNPAID_TAXES",
  levy: "BANK_ACCOUNT_LEVY",
  "bank-levy": "BANK_ACCOUNT_LEVY",
  lien: "LIEN_FILED",
  "tax-lien": "LIEN_FILED",
  garnishment: "WAGE_GARNISHMENT",
  "wage-garnishment": "WAGE_GARNISHMENT",
  audit: "RECEIVED_AUDIT_NOTICE",
  "irs-notice": "RECEIVED_IRS_LETTER",
  "irs-letter": "RECEIVED_IRS_LETTER",
  "innocent-spouse": "INNOCENT_SPOUSE",
  "unfiled-returns": "CANT_PAY_UNPAID_TAXES",
  "penalty-abatement": "UNPAID_PENALTIES_AND_INTEREST",
  "id-theft": "ID_THEFT",
  other: "OTHER",
};

function mapTaxProblem(issues = []) {
  if (!Array.isArray(issues) || !issues.length) return undefined;
  for (const i of issues) {
    const val = TAX_PROBLEM_MAP[String(i).toLowerCase().trim()];
    if (val) return val;
  }
  return undefined;
}

function mapTaxType(filerType) {
  if (!filerType) return undefined;
  const f = String(filerType).toLowerCase();
  if (f.includes("business") && f.includes("personal"))
    return "Personal and Business";
  if (f.includes("business")) return "Business";
  if (f.includes("payroll")) return "Payrol and Other";
  return "Personal";
}

function mapTaxAgency(taxScope) {
  if (!taxScope) return undefined;
  const s = String(taxScope).toLowerCase();
  if (s.includes("both") || (s.includes("federal") && s.includes("state")))
    return "FEDERAL,STATE";
  if (s.includes("state")) return "STATE";
  return "FEDERAL";
}

function formatPhone(phone) {
  if (!phone) return undefined;
  let d = String(phone).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length !== 10) return undefined;
  return `(${d.slice(0, 3)})${d.slice(3, 6)}-${d.slice(6)}`;
}

/* -------------------------------------------------------------------------- */
/*                       Build CaseFile Payload                               */
/* -------------------------------------------------------------------------- */

function buildCasePayload(data, utm = {}) {
  console.log("[LOGICS:buildPayload] ── START ─────────────────────────");
  console.log("[LOGICS:buildPayload] Input data keys:", Object.keys(data));
  console.log(
    "[LOGICS:buildPayload] Input data:",
    JSON.stringify(data).slice(0, 500),
  );
  console.log("[LOGICS:buildPayload] UTM:", utm);

  const sourceStatusId = resolveStatusId(utm); // Used for SourceName only

  const nameParts = (data.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName =
    nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

  console.log("[LOGICS:buildPayload] Name split:", { firstName, lastName });

  const payload = {
    LastName: lastName,
    FirstName: firstName,
    StatusID: 2, // Always 2 for new cases
    ProductID: 1,
  };

  if (data.email) payload.Email = data.email;
  const phone = formatPhone(data.phone);
  if (phone) {
    payload.CellPhone = phone;
    console.log(
      "[LOGICS:buildPayload] Phone formatted:",
      data.phone,
      "→",
      phone,
    );
  } else if (data.phone) {
    console.log("[LOGICS:buildPayload] ⚠ Phone failed to format:", data.phone);
  }
  if (data.state) payload.State = data.state.toUpperCase().slice(0, 2);

  const taxProblem = mapTaxProblem(data.issues);
  if (taxProblem) {
    payload.TaxProblem = taxProblem;
    console.log(
      "[LOGICS:buildPayload] TaxProblem:",
      data.issues,
      "→",
      taxProblem,
    );
  }

  const taxType = mapTaxType(data.filerType);
  if (taxType) {
    payload.TAX_RELIEF_TAX_TYPE = taxType;
    console.log("[LOGICS:buildPayload] TaxType:", data.filerType, "→", taxType);
  }

  const taxAgency = mapTaxAgency(data.taxScope);
  if (taxAgency) {
    payload.TAX_RELIEF_TAX_AGENCY = taxAgency;
    console.log(
      "[LOGICS:buildPayload] TaxAgency:",
      data.taxScope,
      "→",
      taxAgency,
    );
  }

  if (data.balanceBand) {
    // Logics expects a numeric amount, not a range like "50000-100000"
    // Extract the lower bound number from the range string
    const match = String(data.balanceBand).replace(/[,$]/g, "").match(/\d+/);
    if (match) {
      payload.TAX_RELIEF_TAX_AMOUNT = match[0];
    }
  }

  // Notes
  const notes = [];
  if (data.message) notes.push(String(data.message).slice(0, 500));
  if (data.intakeSummary) notes.push(`Intake: ${data.intakeSummary}`);
  if (data.aiSummary)
    notes.push(`AI Summary: ${String(data.aiSummary).slice(0, 400)}`);
  if (data.noticeType) notes.push(`Notice: ${data.noticeType}`);
  if (utm.utmSource) notes.push(`Source: ${utm.utmSource}`);
  if (utm.utmCampaign) notes.push(`Campaign: ${utm.utmCampaign}`);
  if (notes.length) payload.Notes = notes.join(" | ");

  // SourceName — map directly from utm_source value
  const SOURCE_NAME_MAP = {
    google: "VF Google",
    gclid: "VF Google",
    facebook: "VF Face/Insta",
    fb: "VF Face/Insta",
    instagram: "VF Face/Insta",
    ig: "VF Face/Insta",
    meta: "VF Face/Insta",
    fbclid: "VF Face/Insta",
    tiktok: "VF TikTok",
    tt: "VF TikTok",
    ttclid: "VF TikTok",
  };
  const utmKey = (utm.utmSource || "").toLowerCase().trim();
  payload.SourceName = SOURCE_NAME_MAP[utmKey] || "VF Digital";

  if (data.phone) payload.SMSPermit = "true";

  payload.DuplicateCheck = "Email,CellPhone,FirstName,LastName";

  console.log(
    "[LOGICS:buildPayload] Final payload:",
    JSON.stringify(payload, null, 2),
  );
  console.log("[LOGICS:buildPayload] ── END ───────────────────────────");
  return payload;
}

/* -------------------------------------------------------------------------- */
/*                     POST to Logics → Return CaseID                         */
/* -------------------------------------------------------------------------- */

async function createLogicsCase(casePayload) {
  const apiKey = process.env.WYNN_LOGICS_API_KEY;
  const secret = process.env.WYNN_LOGICS_SECRET;

  console.log("[LOGICS:createCase] ══════════════════════════════════════");
  console.log("[LOGICS:createCase] API URL:", IRS_LOGICS_URL);
  console.log(
    "[LOGICS:createCase] API Key present:",
    !!apiKey,
    "(length:",
    apiKey?.length || 0,
    ")",
  );
  console.log(
    "[LOGICS:createCase] Secret present:",
    !!secret,
    "(length:",
    secret?.length || 0,
    ")",
  );

  if (!apiKey || !secret) {
    console.error("[LOGICS:createCase] ✗ ABORT — Missing API credentials");
    return {
      ok: false,
      caseId: null,
      error: "Missing IRS Logics API credentials",
    };
  }

  try {
    const basicAuth = Buffer.from(`${apiKey}:${secret}`).toString("base64");
    console.log(
      "[LOGICS:createCase] Auth: Basic",
      basicAuth.slice(0, 12) + "...",
    );
    console.log(
      "[LOGICS:createCase] Request body:",
      JSON.stringify(casePayload),
    );

    console.log("[LOGICS:createCase] ▶ Sending POST...");
    const startTime = Date.now();

    const response = await fetch(IRS_LOGICS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(casePayload),
    });

    const elapsed = Date.now() - startTime;
    console.log("[LOGICS:createCase] ◀ Response in", elapsed, "ms");
    console.log(
      "[LOGICS:createCase] HTTP:",
      response.status,
      response.statusText,
    );

    // Log response headers
    const respHeaders = {};
    response.headers.forEach((val, key) => {
      respHeaders[key] = val;
    });
    console.log(
      "[LOGICS:createCase] Response headers:",
      JSON.stringify(respHeaders),
    );

    const text = await response.text();
    console.log("[LOGICS:createCase] Raw body:", text.slice(0, 1000));

    let parsed;
    try {
      parsed = JSON.parse(text);
      console.log(
        "[LOGICS:createCase] Parsed JSON:",
        JSON.stringify(parsed, null, 2),
      );
    } catch (parseErr) {
      console.error(
        "[LOGICS:createCase] ⚠ JSON parse failed:",
        parseErr.message,
      );
      parsed = { raw: text };
    }

    if (!response.ok) {
      const errorMsg = parsed?.Message || parsed?.message || text.slice(0, 200);
      console.error(
        "[LOGICS:createCase] ✗ API error:",
        response.status,
        errorMsg,
      );
      console.log("[LOGICS:createCase] ══ END (FAILED) ══════════════════");
      return {
        ok: false,
        caseId: null,
        status: response.status,
        error: errorMsg,
        data: parsed,
      };
    }

    // Strip CaseID from response: { "Data": { "CaseID": 101613 } }
    const caseId =
      parsed?.Data?.CaseID ?? parsed?.data?.CaseID ?? parsed?.CaseID ?? null;

    console.log("[LOGICS:createCase] ✓ CaseID:", caseId);
    console.log("[LOGICS:createCase] ══ END (SUCCESS) ═════════════════");

    return { ok: true, caseId, data: parsed };
  } catch (err) {
    console.error("[LOGICS:createCase] ✗ Exception:", err.message);
    console.error("[LOGICS:createCase] Stack:", err.stack);
    console.log("[LOGICS:createCase] ══ END (EXCEPTION) ═══════════════");
    return { ok: false, caseId: null, error: err.message };
  }
}

/* -------------------------------------------------------------------------- */
/*                              Exports                                       */
/* -------------------------------------------------------------------------- */

module.exports = {
  resolveUtm,
  resolveStatusId,
  buildCasePayload,
  createLogicsCase,
  formatPhone,
  SOURCE_NAMES,
  DEFAULT_STATUS_ID,
};
