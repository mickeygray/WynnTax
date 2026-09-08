import { renderHook, waitFor } from "@testing-library/react";
import { useTrustedForm } from "./useTrustedForm";

describe("useTrustedForm", () => {
  afterEach(() => {
    document.getElementById("trustedform-script")?.remove();
  });

  it("replaces an insecure prerendered script with the HTTPS endpoint", async () => {
    const staleScript = document.createElement("script");
    staleScript.id = "trustedform-script";
    staleScript.src = "http://api.trustedform.com/trustedform.js";
    document.body.appendChild(staleScript);

    const { unmount } = renderHook(() => useTrustedForm());

    await waitFor(() => {
      expect(document.getElementById("trustedform-script")?.src).toMatch(
        /^https:\/\/api\.trustedform\.com\/trustedform\.js\?/,
      );
    });

    unmount();
  });
});
