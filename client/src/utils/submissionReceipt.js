const RECEIPT_KEY = "wynn_submission_receipt";
const TRACKED_RECEIPT_KEY = "wynn_tracked_submission_receipt";

export function storeSubmissionReceipt(receipt) {
  const value = String(receipt || "").trim();
  if (!value) return false;

  try {
    sessionStorage.setItem(RECEIPT_KEY, value);
    return true;
  } catch {
    return false;
  }
}

export function getSubmissionReceipt() {
  try {
    return sessionStorage.getItem(RECEIPT_KEY) || "";
  } catch {
    return "";
  }
}

export function hasTrackedSubmissionReceipt(receipt) {
  try {
    return sessionStorage.getItem(TRACKED_RECEIPT_KEY) === receipt;
  } catch {
    return false;
  }
}

export function markSubmissionReceiptTracked(receipt) {
  try {
    sessionStorage.setItem(TRACKED_RECEIPT_KEY, receipt);
  } catch {
    // Conversion was still sent; storage failure must not break the page.
  }
}
