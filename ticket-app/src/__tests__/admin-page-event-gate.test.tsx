import { render, screen } from "@testing-library/react";
import { cookies } from "next/headers";
import { listEvents } from "@/lib/events";
import AdminPage from "../app/admin/page";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/events", () => ({
  listEvents: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const oneEvent = [
  {
    id: "1",
    name: "Único evento",
    date: new Date("2026-07-10"),
    active: true,
    ended: false,
    createdAt: new Date("2026-01-01"),
  },
];

describe("AdminPage event gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
  });

  it("shows the event picker instead of the dashboard when there is no selectedEventId cookie", async () => {
    vi.mocked(listEvents).mockResolvedValueOnce(oneEvent as never);
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    render(await AdminPage());

    expect(screen.getByText("Elegí un evento")).toBeInTheDocument();
    expect(screen.queryByText("Panel")).not.toBeInTheDocument();
  });

  it("shows the event picker when the cookie references an event that no longer exists", async () => {
    vi.mocked(listEvents).mockResolvedValueOnce(oneEvent as never);
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn().mockReturnValue({ value: "stale-id" }),
    } as never);

    render(await AdminPage());

    expect(screen.getByText("Elegí un evento")).toBeInTheDocument();
  });

  it("shows the dashboard directly when the cookie matches an existing event", async () => {
    vi.mocked(listEvents).mockResolvedValueOnce(oneEvent as never);
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn().mockReturnValue({ value: "1" }),
    } as never);

    render(await AdminPage());

    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(screen.queryByText("Elegí un evento")).not.toBeInTheDocument();
  });

  it("shows the 'no events' message in the picker when there are none at all", async () => {
    vi.mocked(listEvents).mockResolvedValueOnce([]);
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    render(await AdminPage());

    expect(screen.getByText("No hay eventos todavía")).toBeInTheDocument();
  });
});
