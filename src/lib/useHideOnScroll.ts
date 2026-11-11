"use client";

import { useEffect, useState } from "react";

/**
 * Returns true while the user scrolls down past `offset`, false as soon as
 * they scroll up. Used to tuck the sticky filter bar away on small screens
 * so it doesn't eat reading space, and bring it back the moment it's wanted.
 */
export function useHideOnScroll(offset = 160, tolerance = 6) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        if (Math.abs(delta) < tolerance) return;
        setHidden(delta > 0 && y > offset);
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [offset, tolerance]);

  return hidden;
}
