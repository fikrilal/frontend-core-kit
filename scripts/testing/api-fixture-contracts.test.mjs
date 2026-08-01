import assert from "node:assert/strict";
import test from "node:test";

import {
  fixtureContracts,
  parseFixtureContract,
  tryParseFixtureContract,
} from "./api-fixture-contracts.mjs";

test("accepts a contract-valid password login request", () => {
  assert.deepEqual(
    parseFixtureContract(
      "password login request",
      fixtureContracts.loginRequest,
      {
        email: "user@example.com",
        password: "test-password",
      },
    ),
    { email: "user@example.com", password: "test-password" },
  );
});

test("returns no request data when an incoming fixture request is invalid", () => {
  assert.equal(
    tryParseFixtureContract(fixtureContracts.loginRequest, {
      email: "user@example.com",
      password: "",
    }),
    null,
  );
});

test("reports fixture drift without exposing payload values", () => {
  const secret = "must-not-appear";

  assert.throws(
    () =>
      parseFixtureContract(
        "password login request",
        fixtureContracts.loginRequest,
        {
          email: secret,
          password: "",
        },
      ),
    (error) => {
      assert(error instanceof Error);
      assert.equal(
        error.message,
        "Fixture contract violation at password login request.",
      );
      assert.doesNotMatch(error.message, new RegExp(secret));
      return true;
    },
  );
});
