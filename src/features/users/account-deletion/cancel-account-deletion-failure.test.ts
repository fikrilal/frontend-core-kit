import { describe, expect, it } from "vitest";

import { mapCancelAccountDeletionFailure } from "./cancel-account-deletion-failure";

describe("mapCancelAccountDeletionFailure", () => {
  it("always maps to unavailable", () => {
    expect(mapCancelAccountDeletionFailure()).toBe("unavailable");
  });
});
