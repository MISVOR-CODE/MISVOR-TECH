import { describe, expect, it } from "vitest";
import { robotHref } from "@/lib/site";

describe("robotHref", () => {
  it("points at the robot project and carries the language", () => {
    expect(robotHref("es", "https://ai.misvor.com")).toBe("https://ai.misvor.com/?lang=es");
  });

  it("keeps a path and drops any old lang parameter", () => {
    expect(robotHref("fr", "https://example.com/robot?lang=en&x=1")).toBe("https://example.com/robot?lang=fr&x=1");
  });

  it("falls back to the default address when the variable is unset or blank", () => {
    expect(robotHref("en", undefined)).toBe("https://misvor-ai.pages.dev/?lang=en");
    expect(robotHref("en", "   ")).toBe("https://misvor-ai.pages.dev/?lang=en");
  });
});
