import ProTable from "../components/ProTable.jsx";

function fmtDateIso(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function ReportsLPStatement() {
  const columns = [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "executedAt", label: "Date", render: v => fmtDateIso(v) },
    { key: "lp", label: "LP" },
    { key: "instrument", label: "Instrument" },
    { key: "side", label: "Side" },
    { key: "volume", label: "Volume" },
    { key: "price", label: "Price" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status", render: (v, _row, Badge) => (
      <Badge tone={v === 'Filled' ? 'green' : 'amber'}>{v}</Badge>
    ) },
  ];

  const rows = [];

  const filters = {
    searchKeys: ["lp", "instrument", "side"],
    selects: [
      { key: "lp", label: "All LPs", options: ["LP Alpha", "LP Beta"] },
      { key: "side", label: "All Sides", options: ["Buy", "Sell"] },
    ],
    dateKey: "executedAt",
  };

  const moneyCols = ["price", "amount"];
  const cols = columns.map(c => moneyCols.includes(c.key)
    ? { ...c, render: (v) => typeof v === 'number' ? `$${v.toFixed(2)}` : v }
    : c
  );

  return (
    <ProTable
      title="LP Statement"
      rows={rows}
      columns={cols}
      filters={filters}
      pageSize={10}
      searchPlaceholder="Search LP / instrument / side"
    />
  );
}
