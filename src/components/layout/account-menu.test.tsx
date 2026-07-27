import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { AccountMenu } from "./account-menu";

beforeAll(() => {
  class ResizeObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  Element.prototype.scrollIntoView = vi.fn();
});

describe("AccountMenu", () => {
  it("shows initials trigger and opens profile, settings, devices, and sign-out menu", async () => {
    const user = userEvent.setup();
    const signOutAction = vi.fn().mockResolvedValue(undefined);

    render(
      <AccountMenu
        userLabel="Ahmad Fikril Al Muzakki"
        lastSyncAt={null}
        signOutAction={signOutAction}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Account menu" });
    expect(trigger.textContent).toBe("AF");

    await user.click(trigger);

    expect(await screen.findByText("Ahmad Fikril Al Muzakki")).toBeTruthy();
    expect(screen.getByText("Never synced")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Profile" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("menuitem", { name: "Devices" })).toHaveAttribute(
      "href",
      "/devices",
    );

    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(signOutAction).toHaveBeenCalledTimes(1);
  });

  it("falls back to a generic label and email initial", () => {
    render(
      <AccountMenu
        userLabel="fikri@example.com"
        lastSyncAt={null}
        signOutAction={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Account menu" });
    expect(trigger.textContent).toBe("F");
  });
});
