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

test("accepts a contract-valid password registration request", () => {
  assert.deepEqual(
    parseFixtureContract(
      "password registration request",
      fixtureContracts.registerRequest,
      {
        email: "new-user@example.com",
        password: "test-password-10",
      },
    ),
    {
      email: "new-user@example.com",
      password: "test-password-10",
    },
  );
});

test("accepts a contract-valid password reset request", () => {
  assert.deepEqual(
    parseFixtureContract(
      "password reset request",
      fixtureContracts.resetRequest,
      { email: "user@example.com" },
    ),
    { email: "user@example.com" },
  );
  assert.equal(
    parseFixtureContract(
      "password reset response",
      fixtureContracts.resetResponse,
      undefined,
    ),
    undefined,
  );
});

test("accepts a contract-valid password reset confirmation", () => {
  assert.deepEqual(
    parseFixtureContract(
      "password reset confirmation request",
      fixtureContracts.resetConfirmRequest,
      { token: "reset-token", newPassword: "new-password-10" },
    ),
    { token: "reset-token", newPassword: "new-password-10" },
  );
  assert.equal(
    parseFixtureContract(
      "password reset confirmation response",
      fixtureContracts.resetConfirmResponse,
      undefined,
    ),
    undefined,
  );
});

test("rejects a malformed password reset confirmation request", () => {
  assert.equal(
    tryParseFixtureContract(fixtureContracts.resetConfirmRequest, {
      token: "reset-token",
      newPassword: "short",
    }),
    null,
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
