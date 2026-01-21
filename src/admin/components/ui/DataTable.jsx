import { useMemo, useState, useRef } from "react";
import {
  Search, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight,
  FileDown, FileJson, Copy as CopyIcon
} from "lucide-react";

/**
 * columns: [{ header: "ID", accessor: "id", type: "text"|"number"|"date", render?: (row)=>node }]
 * data:    array of objects
 */
export default function DataTable({
  columns = [],
  data = [],
  initialPageSize = 10,
  title = "Table",
}) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState({ key: null, dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Numeric filter
  const numberCols = columns.filter(c => c.type === "number");
  const [numCol, setNumCol] = useState(numberCols[0]?.accessor || "");
  const [minVal, setMinVal] = useState("");
  const [maxVal, setMaxVal] = useState("");

  // Date filter
  const dateCols = columns.filter(c => c.type === "date");
  const [dateCol, setDateCol] = useState(dateCols[0]?.accessor || "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const resetFilters = () => {
    setQuery("");
    setNumCol(numberCols[0]?.accessor || "");
    setMinVal("");
    setMaxVal("");
    setDateCol(dateCols[0]?.accessor || "");
    setFromDate("");
    setToDate("");
    setSortBy({ key: null, dir: "asc" });
    setPage(1);
    setPageSize(initialPageSize);
  };

  // Filtering & sorting
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(row => {
      // global search
      const passQ = !q || columns.some(c => {
        const v = row[c.accessor];
        return String(v ?? "").toLowerCase().includes(q);
      });

      // number range
      let passNum = true;
      if (numCol) {
        const v = Number(row[numCol]);
        const minOk = minVal === "" || (!Number.isNaN(v) && v >= Number(minVal));
        const maxOk = maxVal === "" || (!Number.isNaN(v) && v <= Number(maxVal));
        passNum = minOk && maxOk;
      }

      // date range
      let passDate = true;
      if (dateCol && (fromDate || toDate)) {
        const v = row[dateCol] ? new Date(row[dateCol]) : null;
        const fromOk = !fromDate || (v && v >= new Date(fromDate));
        const toOk   = !toDate   || (v && v <= new Date(toDate));
        passDate = fromOk && toOk;
      }

      return passQ && passNum && passDate;
    });
  }, [data, columns, query, numCol, minVal, maxVal, dateCol, fromDate, toDate]);

  const sorted = useMemo(() => {
    if (!sortBy.key) return filtered;
    const col = columns.find(c => c.accessor === sortBy.key);
    const dir = sortBy.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortBy.key], bv = b[sortBy.key];
      if (col?.type === "number") return (Number(av) - Number(bv)) * dir;
      if (col?.type === "date")   return (new Date(av) - new Date(bv)) * dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }, [filtered, sortBy, columns]);

  // Pagination
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);
  const sliceStart = (currentPage - 1) * pageSize;
  const paged = sorted.slice(sliceStart, sliceStart + pageSize);

  const setSort = (key) => {
    setPage(1);
    setSortBy((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  };

  // Exports
  const toCSV = (rows) => {
    const headers = columns.map(c => c.header);
    const body = rows.map(r =>
      columns.map(c => {
        const val = r[c.accessor];
        const v = (val ?? "").toString().replace(/"/g, '""');
        return `"${v}"`;
      }).join(",")
    );
    return [headers.join(","), ...body].join("\n");
  };
  const download = (filename, content, type = "text/csv;charset=utf-8;") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  const exportCSV  = () => download(`${title.replace(/\s+/g,"_").toLowerCase()}_export.csv`, toCSV(sorted));
  const exportJSON = () => download(`${title.replace(/\s+/g,"_").toLowerCase()}_export.json`, JSON.stringify(sorted, null, 2), "application/json");
  const copyJSON   = async () => { await navigator.clipboard.writeText(JSON.stringify(sorted)); };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 p-2">
            <SlidersHorizontal className="h-5 w-5 text-cyan-700" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className="ml-2 text-xs text-gray-500">{total} results</span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <label className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search..."
              className="w-48 sm:w-64 bg-transparent outline-none text-sm"
            />
          </label>

          {/* Export */}
          <div className="flex items-center gap-1">
            <button onClick={exportCSV} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
              <FileDown className="h-4 w-4" /> CSV
            </button>
            <button onClick={exportJSON} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
              <FileJson className="h-4 w-4" /> JSON
            </button>
            <button onClick={copyJSON} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
              <CopyIcon className="h-4 w-4" /> Copy
            </button>
          </div>

          <button onClick={resetFilters} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="grid gap-3 border-y border-gray-100 p-4 md:grid-cols-3">
        {/* Number range */}
        <div className="flex items-center gap-2">
          <span className="dt-label min-w-[90px]">Number</span>
          <select value={numCol} onChange={(e)=>{setNumCol(e.target.value); setPage(1);}} className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm">
            <option value="">(none)</option>
            {numberCols.map(c => <option key={c.accessor} value={c.accessor}>{c.header}</option>)}
          </select>
          <input value={minVal} onChange={e=>{setMinVal(e.target.value); setPage(1);}} placeholder="min" className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"/>
          <input value={maxVal} onChange={e=>{setMaxVal(e.target.value); setPage(1);}} placeholder="max" className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"/>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <span className="dt-label min-w-[90px]">Date</span>
          <select value={dateCol} onChange={(e)=>{setDateCol(e.target.value); setPage(1);}} className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm">
            <option value="">(none)</option>
            {dateCols.map(c => <option key={c.accessor} value={c.accessor}>{c.header}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={e=>{setFromDate(e.target.value); setPage(1);}} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"/>
          <input type="date" value={toDate}   onChange={e=>{setToDate(e.target.value); setPage(1);}}   className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm"/>
        </div>

        {/* Page size */}
        <div className="flex items-center gap-2">
          <span className="dt-label min-w-[90px]">Page size</span>
          <select value={pageSize} onChange={(e)=>{setPageSize(Number(e.target.value)); setPage(1);}} className="w-28 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm">
            {[5,10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {columns.map(c => (
                  <th key={c.accessor} className="px-4 py-3 text-left font-medium">
                    <button
                      onClick={() => setSort(c.accessor)}
                      className="inline-flex items-center gap-1 hover:text-gray-900"
                      title="Sort"
                    >
                      <span>{c.header}</span>
                      {sortBy.key === c.accessor && (
                        <span className="text-xs">{sortBy.dir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-900">
              {paged.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col.accessor} className="px-4 py-3">
                      {col.render ? col.render(row) : String(row[col.accessor] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={columns.length}>No results</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: row cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {paged.map((row, i) => (
          <div key={i} className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {columns.map(col => (
                <div key={col.accessor}>
                  <div className="dt-label">{col.header}</div>
                  <div className="text-gray-900">
                    {col.render ? col.render(row) : String(row[col.accessor] ?? "")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {paged.length === 0 && (
          <div className="p-6 text-center text-gray-500">No results</div>
        )}
      </div>

      {/* Footer / Pagination */}
      <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">
          Showing <span className="font-medium">{Math.min(total, sliceStart + 1)}</span>–
          <span className="font-medium">{Math.min(total, sliceStart + paged.length)}</span> of{" "}
          <span className="font-medium">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <div className="text-sm">
            Page <span className="font-semibold">{currentPage}</span> / {pages}
          </div>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={currentPage === pages}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

