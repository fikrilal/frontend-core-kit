import { describe, expect, it } from "vitest";

import { createLamaraApiClient } from "./client";

const loginInput = {
  email: "dante@example.com",
  password: "correct horse battery staple",
};

describe("createLamaraApiClient", () => {
  it("configures the OpenAPI client and preserves a request ID", async () => {
    let captured: Request | undefined;
    const client = createLamaraApiClient({
      baseUrl: "https://api.lamara.dev/",
      requestId: () => "frontend-request-id",
      fetch: (request) => {
        captured = request;
        return Promise.resolve(
          new Response(JSON.stringify({ data: { value: "ok" } }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      },
    });

    const result = await client.POST("/v1/auth/password/login", {
      body: loginInput,
      cache: "no-store",
      parseAs: "text",
    });

    expect(captured).toBeDefined();
    if (!captured) {
      throw new Error("Expected fetch to be called.");
    }

    expect(captured.url).toBe("https://api.lamara.dev/v1/auth/password/login");
    expect(captured.method).toBe("POST");
    expect(captured.cache).toBe("no-store");
    expect(captured.headers.get("accept")).toBe("application/json");
    expect(captured.headers.get("content-type")).toBe("application/json");
    expect(captured.headers.get("x-request-id")).toBe("frontend-request-id");
    expect(await captured.json()).toEqual(loginInput);
    expect(result.response.headers.get("x-request-id")).toBe(
      "frontend-request-id",
    );
  });
});
