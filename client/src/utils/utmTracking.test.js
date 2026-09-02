import { captureUtmParams, getUtmParams } from "./utmTracking";

describe("UTM tracking", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/qualify-now");
  });

  it("preserves Google click IDs and campaign dimensions", () => {
    window.history.replaceState(
      {},
      "",
      "/qualify-now?gclid=click-123&utm_campaign=lien-search&utm_term=tax-help&utm_content=ad-a",
    );

    captureUtmParams();

    expect(getUtmParams()).toMatchObject({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "lien-search",
      utmTerm: "tax-help",
      utmContent: "ad-a",
      gclid: "click-123",
    });
  });

  it("keeps the first touch for the browser session", () => {
    window.history.replaceState({}, "", "/qualify-now?utm_source=google");
    captureUtmParams();

    window.history.replaceState({}, "", "/qualify-now?utm_source=facebook");
    captureUtmParams();

    expect(getUtmParams().utmSource).toBe("google");
  });
});
