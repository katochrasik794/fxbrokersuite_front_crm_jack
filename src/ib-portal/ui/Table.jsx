import React, { useMemo, useState } from 'react';
import { Inbox, Download, FileText, FileSpreadsheet } from 'lucide-react';
import Button from './Button';

// Pre-import jspdf and jspdf-autotable to ensure they're loaded
let jsPDFLib = null;
let autoTableLoaded = false;

// Load libraries on first use
const loadPDFLibs = async () => {
  if (!jsPDFLib) {
    try {
      const jsPDFModule = await import('jspdf');
      jsPDFLib = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule;

      if (!autoTableLoaded) {
        await import('jspdf-autotable');
        autoTableLoaded = true;
      }
    } catch (error) {
      console.error('Failed to load PDF libraries:', error);
      throw error;
    }
  }
  return jsPDFLib;
};

/**
 * Enhanced Table component with filtering, sorting, pagination, and export
 * 
 * @param {Object} props
 * @param {string} props.title - Table title
 * @param {Array} props.kpis - KPI cards to display above table
 * @param {Array} props.rows - Data rows
 * @param {Array} props.columns - Column definitions [{key, label, render?, sortable?}]
 * @param {Object} props.filters - Filter configuration
 * @param {Array} props.filters.searchKeys - Keys to search in
 * @param {Array} props.filters.selects - Select filters [{key, label, options}]
 * @param {string} props.filters.dateKey - Date field key for date range filtering
 * @param {number} props.pageSize - Items per page (default: 10)
 * @param {string} props.searchPlaceholder - Search input placeholder
 * @param {Function} props.onResetAll - Callback when reset all is clicked
 * @param {Function} props.onClearDates - Callback when clear dates is clicked
 */
function Table({
  title,
  kpis = [],
  rows = [],
  data = [], // Support both 'rows' and 'data' props
  columns = [],
  filters,
  pageSize = 10,
  searchPlaceholder = "Search...",
  onResetAll,
  onClearDates,
  loading = false,
  loadingComponent,
  hideFilters = false,
  hidePagination = false,
}) {
  // Use data prop if provided, otherwise use rows
  const tableRows = data.length > 0 ? data : rows;
  const [q, setQ] = useState("");
  const [selects, setSelects] = useState(
    Object.fromEntries((filters?.selects || []).map(s => [s.key, ""]))
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState(null); // {key, dir}
  const [page, setPage] = useState(1);

  function resetAll() {
    setQ("");
    setSelects(Object.fromEntries((filters?.selects || []).map(s => [s.key, ""])));
    setFrom("");
    setTo("");
    setSortBy(null);
    setPage(1);
    if (typeof onResetAll === "function") {
      onResetAll();
    }
  }

  function clearDates() {
    setFrom("");
    setTo("");
    setPage(1);
    if (typeof onClearDates === "function") {
      onClearDates();
    }
  }

  const filtered = useMemo(() => {
    let out = [...tableRows];

    // text search across keys
    if (q) {
      const lower = q.toLowerCase();
      out = out.filter(r => {
        const searchKeys = filters?.searchKeys || Object.keys(r);
        return searchKeys.some(k => {
          // Handle nested keys like 'applicant.name'
          const keys = k.split('.');
          let value = r;
          for (const key of keys) {
            value = value?.[key];
            if (value === undefined || value === null) break;
          }
          return String(value ?? "").toLowerCase().includes(lower);
        });
      });
    }

    // selects
    for (const [k, v] of Object.entries(selects)) {
      if (v) out = out.filter(r => String(r[k]) === v);
    }

    // date range
    if (filters?.dateKey && (from || to)) {
      const fk = Date.parse(from || "1970-01-01");
      const tk = Date.parse(to || "2999-12-31");
      out = out.filter(r => {
        const t = Date.parse(r[filters.dateKey]);
        return t >= fk && t <= tk;
      });
    }

    // sort
    if (sortBy) {
      const { key, dir } = sortBy;
      out.sort((a, b) => {
        const av = a[key], bv = b[key];
        if (typeof av === "number" && typeof bv === "number") return dir === "asc" ? av - bv : bv - av;
        return dir === "asc"
          ? String(av).localeCompare(String(bv), undefined, { numeric: true })
          : String(bv).localeCompare(String(av), undefined, { numeric: true });
      });
    }
    return out;
  }, [tableRows, q, selects, from, to, sortBy, filters]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const slice = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const baseIndex = (page - 1) * pageSize;

  // Automatically add SR No column if not present
  const hasIndexColumn = columns.some(col => col.key === '__index' || col.key === 'sr_no' || col.key === 'srNo');
  const displayColumns = hasIndexColumn
    ? columns
    : [{ key: '__index', label: 'SR No', sortable: false }, ...columns];

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const jsPDF = await loadPDFLibs();
      const doc = new jsPDF();
      const tableData = filtered.map((row, idx) => {
        return displayColumns.map(col => {
          if (col.key === '__index') return idx + 1;
          const content = col.render ? col.render(row[col.key], row, idx) : row[col.key];
          // Extract text from React elements
          if (typeof content === 'object' && content?.props?.children) {
            const extractText = (node) => {
              if (typeof node === 'string' || typeof node === 'number') return String(node);
              if (Array.isArray(node)) return node.map(extractText).join(' ');
              if (node?.props?.children) return extractText(node.props.children);
              return '';
            };
            return extractText(content).replace(/[^\w\s]/gi, '').trim();
          }
          return String(content || '');
        });
      });

      const headers = displayColumns.map(col => col.label);

      if (doc.autoTable && typeof doc.autoTable === 'function') {
        doc.autoTable({
          head: [headers],
          body: tableData,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [200, 243, 0], textColor: [8, 20, 40], fontStyle: 'bold' }, // IB theme colors
          margin: { top: 20 },
          startY: 20
        });
      } else {
        let yPos = 20;
        doc.setFontSize(10);
        doc.text(headers.join(' | '), 10, yPos);
        yPos += 10;

        tableData.forEach((row) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(8);
          const rowText = row.map(cell => String(cell || '').substring(0, 30)).join(' | ');
          doc.text(rowText, 10, yPos, { maxWidth: 190 });
          yPos += 8;
        });
      }

      doc.save(`${title || 'table'}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      // Fallback: Create CSV download instead
      const csvContent = [
        displayColumns.map(col => col.label).join(','),
        ...filtered.map((row, idx) => {
          return displayColumns.map(col => {
            if (col.key === '__index') return idx + 1;
            const content = col.render ? col.render(row[col.key], row, idx) : row[col.key];
            let text = '';
            if (typeof content === 'object' && content?.props?.children) {
              const extractText = (node) => {
                if (typeof node === 'string' || typeof node === 'number') return String(node);
                if (Array.isArray(node)) return node.map(extractText).join(' ');
                if (node?.props?.children) return extractText(node.props.children);
                return '';
              };
              text = extractText(content).replace(/[^\w\s]/gi, '').trim();
            } else {
              text = String(content || '');
            }
            return `"${text.replace(/"/g, '""')}"`;
          }).join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'table'}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      alert('PDF export failed. Downloaded CSV file instead.');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    import('xlsx').then((XLSX) => {
      const worksheetData = [
        displayColumns.map(col => col.label),
        ...filtered.map((row, idx) => {
          return displayColumns.map(col => {
            if (col.key === '__index') return idx + 1;
            const content = col.render ? col.render(row[col.key], row, idx) : row[col.key];
            if (typeof content === 'object' && content?.props?.children) {
              return String(content.props.children).replace(/[^\w\s]/gi, '');
            }
            return String(content || '');
          });
        })
      ];

      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `${title || 'table'}-${new Date().toISOString().split('T')[0]}.xlsx`);
    }).catch(err => {
      console.error('Error exporting Excel:', err);
      alert('Excel export failed. Please install xlsx: npm install xlsx');
    });
  };

  return (
    <div className="space-y-4">
      {title && (
        <div className="px-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
      )}
      {/* KPI cards */}
      {!!kpis.length && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis}
        </div>
      )}

      {/* Table with merged filters */}
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200">
        {/* Filters - merged with table */}
        {!hideFilters && (
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
            <div className="flex flex-col lg:flex-row gap-2 items-center">
              {/* Search Input */}
              <div className="flex-1 w-full lg:w-auto">
                <input
                  value={q}
                  onChange={e => { setQ(e.target.value); setPage(1); }}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 h-[40px] outline-none focus:ring-2 focus:ring-ib-500 focus:border-ib-500 transition-all"
                />
              </div>

              {/* Select Filters + (optional) Date Filters */}
              <div className="flex flex-wrap gap-2">
                {(filters?.selects || []).map((s, i) => (
                  <select
                    key={i}
                    value={selects[s.key]}
                    onChange={e => { setSelects(v => ({ ...v, [s.key]: e.target.value })); setPage(1); }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 h-[40px] min-w-[120px] text-sm focus:ring-2 focus:ring-ib-500 focus:border-ib-500 transition-all"
                  >
                    <option value="">{s.label}</option>
                    {s.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ))}

                {/* Date Inputs */}
                {filters?.dateKey && (
                  <div className="flex items-center gap-0 border-2 border-gray-300 bg-white rounded-lg h-[40px] px-2 focus-within:ring-2 focus-within:ring-ib-500 focus-within:border-ib-500 transition-all">
                    <span className="text-gray-400 px-1">
                      <FileText size={14} className="opacity-50" />
                    </span>
                    <input
                      type="date"
                      value={from}
                      onChange={e => { setFrom(e.target.value); setPage(1); }}
                      className="bg-transparent border-none px-1 py-1 text-sm outline-none w-[120px] cursor-pointer text-black"
                      title="From Date"
                    />
                    <span className="text-gray-300 mx-1">|</span>
                    <input
                      type="date"
                      value={to}
                      onChange={e => { setTo(e.target.value); setPage(1); }}
                      className="bg-transparent border-none px-1 py-1 text-sm outline-none w-[120px] cursor-pointer text-black"
                      title="To Date"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearDates}
                  className="h-[40px] px-3 !text-xs"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={resetAll}
                  className="h-[40px] px-3 !text-xs"
                >
                  Reset
                </Button>
                <div className="w-[1px] h-6 bg-gray-300 mx-1 self-center" />
                <Button
                  variant="outline"
                  size="sm"
                  icon={FileText}
                  onClick={exportToPDF}
                  className="h-[40px] px-3 !text-xs"
                >
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={FileSpreadsheet}
                  onClick={exportToExcel}
                  className="h-[40px] px-3 !text-xs"
                >
                  Excel
                </Button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .ib-table-scroll-wrapper {
            width: 100%;
            position: relative;
          }
          .ib-table-scroll-container {
            width: 100%;
            overflow-x: auto !important;
            overflow-y: visible !important;
            scrollbar-width: thin !important;
            scrollbar-color: #94a3b8 #f1f5f9 !important;
            -ms-overflow-style: scrollbar !important;
            display: block !important;
            -webkit-overflow-scrolling: touch;
          }
          .ib-table-scroll-container::-webkit-scrollbar {
            height: 14px !important;
            display: block !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }
          .ib-table-scroll-container::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 0;
            border-top: 1px solid #e2e8f0;
            display: block !important;
          }
          .ib-table-scroll-container::-webkit-scrollbar-thumb {
            background: #94a3b8 !important;
            border-radius: 7px;
            border: 2px solid #f1f5f9;
            min-width: 20px;
            display: block !important;
          }
          .ib-table-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #64748b !important;
          }
          .ib-table-scroll-container table {
            width: auto !important;
            min-width: 100%;
            table-layout: auto;
          }
          .ib-table-scroll-container th,
          .ib-table-scroll-container td {
            padding: 0.75rem 1rem !important;
            white-space: nowrap !important;
          }
          .ib-table-scroll-container th {
            white-space: nowrap !important;
          }
          .ib-table-scroll-container td {
            white-space: nowrap !important;
          }
          @media (max-width: 768px) {
            .ib-table-scroll-container th,
            .ib-table-scroll-container td {
              font-size: 0.75rem;
              padding: 0.5rem 0.75rem !important;
            }
          }
        `}</style>
        <div className="ib-table-scroll-wrapper">
          <div className="ib-table-scroll-container">
            <table className="text-sm" style={{ tableLayout: 'auto', width: 'auto', minWidth: '100%' }}>
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-[1]">
                <tr>
                  {displayColumns.map(col => (
                    <th key={col.key}
                      onClick={() => {
                        if (col.key === '__index' || col.sortable === false) return;
                        setSortBy(s => s?.key === col.key
                          ? { key: col.key, dir: s.dir === "asc" ? "desc" : "asc" }
                          : { key: col.key, dir: "asc" });
                      }}
                      className={`px-3 py-2 text-xs font-semibold text-black select-none whitespace-nowrap text-center border-r border-gray-200 last:border-r-0 ${col.key === '__index' || col.sortable === false ? '' : 'cursor-pointer hover:bg-ib-50 transition-colors'}`}>
                      {col.label}{sortBy?.key === col.key ? (sortBy.dir === "asc" ? " ▲" : " ▼") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={displayColumns.length} className="px-6 py-12 text-center bg-gray-50">
                      {loadingComponent || (
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="flex space-x-2">
                            <div className="w-3 h-3 bg-ib-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-3 h-3 bg-ib-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-3 h-3 bg-ib-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <p className="text-sm text-gray-600">Loading data...</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  <>
                    {slice.map((r, i) => (
                      <tr key={i} className="hover:bg-ib-50 transition-colors">
                        {displayColumns.map(c => {
                          const content = c.key === '__index'
                            ? (baseIndex + i + 1)
                            : (c.render ? c.render(r[c.key], r, baseIndex + i) : r[c.key]);
                          return (
                            <td key={c.key} className="px-3 py-2 text-xs whitespace-nowrap text-center border-r border-gray-100 last:border-r-0 text-black">
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {!slice.length && (
                      <tr>
                        <td colSpan={displayColumns.length} className="px-6 py-12 text-center text-gray-500 bg-gray-50">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <Inbox size={18} />
                            <span>No data found</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!hidePagination && (
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
            <div className="text-sm text-black font-medium">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-ib-500 text-black hover:bg-ib-50 focus:ring-2 focus:ring-ib-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                « First
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-ib-500 text-black hover:bg-ib-50 focus:ring-2 focus:ring-ib-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ‹ Prev
              </button>
              <span className="rounded-lg border border-ib-500 bg-ib-500 text-dark-base px-4 py-2 text-sm font-medium">
                {page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-ib-500 text-black hover:bg-ib-50 focus:ring-2 focus:ring-ib-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next ›
              </button>
              <button
                onClick={() => setPage(pages)}
                disabled={page === pages}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-ib-500 text-black hover:bg-ib-50 focus:ring-2 focus:ring-ib-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Last »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Table;
