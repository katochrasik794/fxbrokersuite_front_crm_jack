import ProTable from "../components/ProTable.jsx";

function fmtDateIso(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

export default function ReportsProfitLoss() {
  const columns = [
    { key: "__index", label: "Sr No", sortable: false },
    { key: "day", label: "Date", render: v => fmtDateIso(v) },
    { key: "account", label: "Account" },
    { key: "deposits", label: "Deposits" },
    { key: "withdrawals", label: "Withdrawals" },
    { key: "pnl", label: "PnL" },
    { key: "fees", label: "Fees" },
    { key: "net", label: "Net" },
  ];

  const rows = [];

  const filters = {
    searchKeys: ["account"],
    dateKey: "day",
  };

  const moneyCols = ["deposits","withdrawals","pnl","fees","net"];
  const cols = columns.map(c => moneyCols.includes(c.key)
    ? { ...c, render: (v) => `$${Number(v||0).toFixed(2)}` }
    : c
  );

  return (
    <ProTable
      title="Profit & Loss"
      rows={rows}
      columns={cols}
      filters={filters}
      pageSize={10}
      searchPlaceholder="Search account"
    />
  );
}
