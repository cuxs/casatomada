export interface Sale {
  id: string;
  buyerName: string;
  codeWord: string;
  qrToken: string;
  price?: number;
  ticketCount: number;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
}

export interface BuyerSummary {
  buyerName: string;
  ticketCount: number;
  codes: string[];
}

// The "c\u00F3digo" a buyer needs to validate their entry at the door: their
// palabra clave plus the last 3 characters of their QR token.
function validationCode(sale: Sale): string {
  return `${sale.codeWord} ${sale.qrToken.slice(-3).toUpperCase()}`;
}

export function aggregateBuyers(sales: Sale[]): BuyerSummary[] {
  const totals = new Map<string, { ticketCount: number; codes: string[] }>();

  for (const sale of sales) {
    const name = sale.buyerName.trim();
    const entry = totals.get(name) ?? { ticketCount: 0, codes: [] };
    entry.ticketCount += sale.ticketCount;
    entry.codes.push(validationCode(sale));
    totals.set(name, entry);
  }

  return Array.from(totals.entries())
    .map(([buyerName, { ticketCount, codes }]) => ({
      buyerName,
      ticketCount,
      codes,
    }))
    .sort((a, b) => a.buyerName.localeCompare(b.buyerName, "es"));
}

export function downloadBuyersCSV(buyers: BuyerSummary[]) {
  const csvRows = ["Nombre,Entradas,C\u00F3digo"];
  buyers.forEach(({ buyerName, ticketCount, codes }) => {
    const escapedName = buyerName.replace(/"/g, '""');
    const escapedCodes = codes.join(" / ").replace(/"/g, '""');
    csvRows.push(`"${escapedName}",${ticketCount},"${escapedCodes}"`);
  });

  triggerDownload(
    `data:text/csv;charset=utf-8,\uFEFF${csvRows.join("\n")}`,
    "lista_compradores.csv",
  );
}

export function downloadBuyersTXT(buyers: BuyerSummary[]) {
  const txtRows = buyers.map(
    ({ buyerName, ticketCount, codes }) =>
      `${buyerName}: ${ticketCount} \u2014 ${codes.join(" / ")}`,
  );
  triggerDownload(
    `data:text/plain;charset=utf-8,\uFEFF${txtRows.join("\n")}`,
    "lista_compradores.txt",
  );
}

function triggerDownload(content: string, filename: string) {
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(content));
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
