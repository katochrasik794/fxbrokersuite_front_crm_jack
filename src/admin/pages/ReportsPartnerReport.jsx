import ProTable from "../components/ProTable.jsx";

function fmtDateIso(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

export default function ReportsPartnerReport() {
  const columns = [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "day", label: "Date", render: v => fmtDateIso(v) },
    { key: "partner", label: "Partner" },
    { key: "clients", label: "Clients" },
    { key: "trades", label: "Trades" },
    { key: "commission", label: "Commission" },
    { key: "payout", label: "Payout" },
  ];

  const rows = [];

  const filters = {
    searchKeys: ["partner"],
    dateKey: "day",
  };

  const moneyCols = ["commission","payout"];
  const cols = columns.map(c => moneyCols.includes(c.key)
    ? { ...c, render: (v) => `$${Number(v||0).toFixed(2)}` }
    : c
  );

  return (
    <ProTable
      title="Partner Report"
      rows={rows}
      columns={cols}
      filters={filters}
      pageSize={10}
      searchPlaceholder="Search partner"
    />
  );
}
