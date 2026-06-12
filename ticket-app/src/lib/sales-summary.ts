export interface Sale {
  id: string;
  buyerName: string;
  codeWord: string;
  price?: number;
  ticketCount: number;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
}

export interface BuyerSummary {
  buyerName: string;
  ticketCount: number;
}

export function aggregateBuyers(sales: Sale[]): BuyerSummary[] {
  const totals = new Map<string, number>();

  for (const sale of sales) {
    const name = sale.buyerName.trim();
    totals.set(name, (totals.get(name) ?? 0) + sale.ticketCount);
  }

  return Array.from(totals.entries())
    .map(([buyerName, ticketCount]) => ({ buyerName, ticketCount }))
    .sort((a, b) => a.buyerName.localeCompare(b.buyerName, "es"));
}

export function downloadBuyersCSV(buyers: BuyerSummary[]) {
  const csvRows = ["Nombre,Entradas"];
  buyers.forEach(({ buyerName, ticketCount }) => {
    const escapedName = buyerName.replace(/"/g, '""');
    csvRows.push(`"${escapedName}",${ticketCount}`);
  });

  triggerDownload(
    "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n"),
    "lista_compradores.csv"
  );
}

export function downloadBuyersTXT(buyers: BuyerSummary[]) {
  const txtRows = buyers.map(({ buyerName, ticketCount }) => `${buyerName}: ${ticketCount}`);
  triggerDownload(
    "data:text/plain;charset=utf-8,\uFEFF" + txtRows.join("\n"),
    "lista_compradores.txt"
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
