import { fireEvent, render, screen } from "@testing-library/react";
import EventPicker from "../app/admin/_components/event-picker";

const mockReload = vi.fn();

Object.defineProperty(window, "location", {
  value: { reload: mockReload },
  writable: true,
});

function clearSelectedEventCookie() {
  document.cookie =
    "selectedEventId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

const events = [
  {
    id: "1",
    name: "Casa Tomada Diciembre",
    date: "2026-12-01",
    active: false,
    ended: false,
  },
  {
    id: "2",
    name: "Casa Tomada Aniversario",
    date: "2026-07-10",
    active: true,
    ended: false,
  },
];

describe("EventPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSelectedEventCookie();
  });

  it("shows a message and no event list when there are no events", () => {
    render(<EventPicker events={[]} />);

    expect(screen.getByText("No hay eventos todavía")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("defaults the selection to the active event and marks it", () => {
    render(<EventPicker events={events} />);

    expect(
      screen.getByRole("radio", { name: /Casa Tomada Aniversario/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Casa Tomada Diciembre/ }),
    ).not.toBeChecked();
  });

  it("lets the user pick a different event before continuing", () => {
    render(<EventPicker events={events} />);

    fireEvent.click(
      screen.getByRole("radio", { name: /Casa Tomada Diciembre/ }),
    );

    expect(
      screen.getByRole("radio", { name: /Casa Tomada Diciembre/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Casa Tomada Aniversario/ }),
    ).not.toBeChecked();
  });

  it("persists the selection and reloads when 'Siguiente' is clicked", () => {
    render(<EventPicker events={events} />);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(document.cookie).toContain("selectedEventId=2");
    expect(mockReload).toHaveBeenCalled();
  });

  it("persists the newly picked event, not the default, after switching selection", () => {
    render(<EventPicker events={events} />);

    fireEvent.click(
      screen.getByRole("radio", { name: /Casa Tomada Diciembre/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(document.cookie).toContain("selectedEventId=1");
  });
});
