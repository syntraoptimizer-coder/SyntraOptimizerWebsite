"use client";
import { useEffect } from "react";

/** Text fields stay fully usable — typing, selecting, cut/copy/paste inside them. Only page content
 *  is protected, otherwise sign-in and the checkout forms would be unusable. */
function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest("input, textarea, select, [contenteditable='true']") !== null)
  );
}

/**
 * Makes page content non-copyable: no selection, no copy/cut, no context menu, no dragging images or
 * links out. Mirrors DesktopGuards in the desktop app so both surfaces behave the same.
 *
 * This deters casual copying, nothing more — the text still ships in the HTML, so view-source, reader
 * mode or JavaScript turned off all get past it. It is not a content-protection mechanism.
 *
 * Deliberately NOT blocked: the async clipboard API, so the "copy hardware ID" button in DeviceCard
 * keeps working; and devtools shortcuts, which would only annoy people without protecting anything.
 */
export default function CopyGuard() {
  useEffect(() => {
    const block = (event: Event) => {
      if (!isEditable(event.target)) event.preventDefault();
    };
    const events = ["copy", "cut", "contextmenu", "dragstart", "selectstart"] as const;
    events.forEach((name) => document.addEventListener(name, block));
    return () => events.forEach((name) => document.removeEventListener(name, block));
  }, []);
  return null;
}
