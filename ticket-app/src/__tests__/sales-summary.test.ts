import {
  aggregateBuyers,
  downloadBuyersCSV,
  downloadBuyersTXT,
  type Sale,
} from "@/lib/sales-summary";

describe("sales-summary", () => {
  const sales: Sale[] = [
    { id: "1", buyerName: "Juan Pérez", codeWord: "lombriz roja del monte", qrToken: "aaaa-111", ticketCount: 2, used: false, usedAt: null, createdAt: "2026-05-29" },
    { id: "2", buyerName: "Ana Ruiz", codeWord: "marmota azul de la esquina", qrToken: "bbbb-222", ticketCount: 1, used: true, usedAt: "2026-05-30", createdAt: "2026-05-29" },
    { id: "3", buyerName: "Juan Pérez", codeWord: "capibara verde de la terraza", qrToken: "cccc-333", ticketCount: 1, used: false, usedAt: null, createdAt: "2026-05-30" },
  ];

  it("aggregates ticket counts and validation codes by buyer name", () => {
    expect(aggregateBuyers(sales)).toEqual([
      { buyerName: "Ana Ruiz", ticketCount: 1, codes: ["marmota azul de la esquina 222"] },
      {
        buyerName: "Juan Pérez",
        ticketCount: 3,
        codes: ["lombriz roja del monte 111", "capibara verde de la terraza 333"],
      },
    ]);
  });

  it("triggers CSV download with aggregated buyers", () => {
    const mockClick = vi.fn();
    const mockLink = {
      setAttribute: vi.fn(),
      click: mockClick,
    };

    vi.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as unknown as Node);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink as unknown as Node);

    downloadBuyersCSV(aggregateBuyers(sales));

    expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "lista_compradores.csv");
    expect(mockClick).toHaveBeenCalled();
  });

  it("triggers TXT download with aggregated buyers", () => {
    const mockClick = vi.fn();
    const mockLink = {
      setAttribute: vi.fn(),
      click: mockClick,
    };

    vi.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as unknown as Node);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink as unknown as Node);

    downloadBuyersTXT(aggregateBuyers(sales));

    expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "lista_compradores.txt");
    expect(mockClick).toHaveBeenCalled();
  });
});
