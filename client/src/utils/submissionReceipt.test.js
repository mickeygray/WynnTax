import {
  getSubmissionReceipt,
  hasTrackedSubmissionReceipt,
  markSubmissionReceiptTracked,
  storeSubmissionReceipt,
} from "./submissionReceipt";

describe("submission receipt", () => {
  beforeEach(() => sessionStorage.clear());

  it("stores a server receipt and tracks it only after conversion fires", () => {
    expect(storeSubmissionReceipt("receipt-1")).toBe(true);
    expect(getSubmissionReceipt()).toBe("receipt-1");
    expect(hasTrackedSubmissionReceipt("receipt-1")).toBe(false);

    markSubmissionReceiptTracked("receipt-1");

    expect(hasTrackedSubmissionReceipt("receipt-1")).toBe(true);
    expect(hasTrackedSubmissionReceipt("receipt-2")).toBe(false);
  });
});
