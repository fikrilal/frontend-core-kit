import { describe, expect, it } from "vitest";

import { mapProfileImageUrlFailure } from "./profile-image-url-failure";

describe("mapProfileImageUrlFailure", () => {
  it("always maps to unavailable", () => {
    expect(mapProfileImageUrlFailure()).toBe("unavailable");
  });
});
