import { captureUtmParams, getUtmParams } from "./utmTracking";

describe("UTM tracking", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/tax-lien-help");
  });

  it("preserves Google click IDs and campaign dimensions", () => {
    window.history.replaceState(
      {},
      "",
      "/tax-lien-help?gclid=click-123&utm_campaign=lien-search&utm_term=tax-help&utm_content=ad-a",
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
    window.history.replaceState({}, "", "/tax-lien-help?utm_source=google");
    captureUtmParams();

    window.history.replaceState({}, "", "/tax-lien-help?utm_source=facebook");
    captureUtmParams();

    expect(getUtmParams().utmSource).toBe("google");
  });
});
