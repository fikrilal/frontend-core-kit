import { describe, expect, it } from "vitest";

import { mapClearProfileImageFailure } from "./clear-profile-image-failure";

describe("mapClearProfileImageFailure", () => {
  it("always maps to unavailable", () => {
    expect(mapClearProfileImageFailure()).toBe("unavailable");
  });
});
