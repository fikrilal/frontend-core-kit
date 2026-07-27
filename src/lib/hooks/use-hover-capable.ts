"use client";

import { useEffect, useState } from "react";

/**
 * True only on devices with real hover (mouse / trackpad).
 * Touch fires sticky phantom :hover — gate hover lifts behind this.
 * From beui (https://beui.dev).
 */
export function useHoverCapable() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return canHover;
}
