import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { SiteTopbar } from "./site-topbar";

beforeAll(() => {
  class ResizeObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  Element.prototype.scrollIntoView = vi.fn();
});

describe("SiteTopbar", () => {
  it("shows Sign in when signed out", () => {
    render(<SiteTopbar signedIn={false} />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
    expect(
      screen.getByRole("button", { name: /Switch to (light|dark) theme/ }),
    ).toBeInTheDocument();
  });

  it("links directly to Dashboard via avatar link when signed in", () => {
    render(<SiteTopbar signedIn={true} userLabel="user@example.com" />);

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    expect(dashboardLink.textContent).toBe("U");
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });
});
