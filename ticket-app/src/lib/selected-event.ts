"use client";

const COOKIE_NAME = "selectedEventId";

export function getSelectedEventId(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// Persists the pick and reloads: every admin/guardarropa page fetches its
// data on mount, so a full reload is the simplest way to make every page
// re-fetch under the new event without adding shared client state.
export function setSelectedEventId(id: string) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=31536000`;
  window.location.reload();
}
