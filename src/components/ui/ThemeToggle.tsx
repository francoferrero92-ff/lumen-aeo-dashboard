"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { SegmentedControl } from "./SegmentedControl";

type Pref = "light" | "dark" | "system";
const KEY = "lumen-theme";

function apply(pref: Pref) {
  const dark =
    pref === "dark" ||
    (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.themePref = pref;
  window.dispatchEvent(new Event("lumen-theme"));
}

const subscribe = (cb: () => void) => {
  window.addEventListener("lumen-theme", cb);
  return () => window.removeEventListener("lumen-theme", cb);
};
const getSnapshot = () =>
  (document.documentElement.dataset.themePref as Pref) ?? "system";
const getServerSnapshot = (): Pref => "system";

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getSnapshot() === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const set = useCallback((next: Pref) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable: theme still applies for this session */
    }
    apply(next);
  }, []);

  return (
    <SegmentedControl
      label="Theme"
      size="sm"
      value={pref}
      onChange={set}
      options={[
        { value: "light", label: <Sun size={14} />, ariaLabel: "Light theme" },
        { value: "dark", label: <Moon size={14} />, ariaLabel: "Dark theme" },
        { value: "system", label: <Monitor size={14} />, ariaLabel: "System theme" },
      ]}
    />
  );
}
