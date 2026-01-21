import ProTable from "../components/ProTable.jsx";

function fmtDateIso(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function ReportsBookPnL() {
  const columns = [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "executedAt", label: "Date", render: v => fmtDateIso(v) },
    { key: "book", label: "Book" },
    { key: "symbol", label: "Symbol" },
    { key: "side", label: "Side" },
    { key: "volume", label: "Volume" },
    { key: "openPnl", label: "Open PnL" },
    { key: "closedPnl", label: "Closed PnL" },
    { key: "netPnl", label: "Net PnL" },
  ];

  const rows = [];

  const kpis = [];
  const filters = {
    searchKeys: ["symbol", "book", "side"],
    selects: [
      { key: "book", label: "All Books", options: ["A-Book", "B-Book"] },
      { key: "side", label: "All Sides", options: ["Buy", "Sell"] },
    ],
    dateKey: "executedAt",
  };

  const cols = columns.map(c =>
    ["openPnl","closedPnl","netPnl"].includes(c.key)
      ? { ...c, render: (v) => `$${Number(v||0).toFixed(2)}` }
      : c
  );

  return (
    <ProTable
      title="Book PnL"
      kpis={kpis}
      rows={rows}
      columns={cols}
      filters={filters}
      pageSize={10}
      searchPlaceholder="Search symbol / book / side"
    />
  );
}
