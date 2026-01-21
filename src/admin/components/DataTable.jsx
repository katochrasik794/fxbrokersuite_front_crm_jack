import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";

export default function DataTable({ columns, rows, data, pageSize=10 }) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState(null); // {key, dir}
  const [page, setPage] = useState(1);

  // Use either 'data' or 'rows' prop, with fallback to empty array
  const tableData = data || rows || [];

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    let out = tableData.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(lower))
    );
    if (sortBy) {
      out = [...out].sort((a,b) => {
        const av = a[sortBy.key], bv = b[sortBy.key];
        return sortBy.dir === "asc"
          ? String(av).localeCompare(String(bv), undefined, {numeric:true})
          : String(bv).localeCompare(String(av), undefined, {numeric:true});
      });
    }
    return out;
  }, [tableData, q, sortBy]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page-1)*pageSize;
  const slice = filtered.slice(start, start+pageSize);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 p-3">
        <input
          value={q}
          onChange={e=>{ setQ(e.target.value); setPage(1); }}
          placeholder="Search…"
          className="w-full rounded-lg bg-white/10 px-3 py-2 outline-none placeholder:text-slate-300"
        />
        <div className="text-sm text-slate-300">{total} results</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/10 text-left">
            <tr>
              {columns.map(col => (
                <th key={col.key}
                    onClick={()=>{
                      setSortBy(s=> s?.key===col.key
                        ? {key: col.key, dir: s.dir==="asc"?"desc":"asc"}
                        : {key: col.key, dir: "asc"});
                    }}
                    className="px-4 py-3 font-semibold cursor-pointer select-none">
                  {col.label}{sortBy?.key===col.key ? (sortBy.dir==="asc"?" ▲":" ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {slice.map((r,i)=>(
              <tr key={i} className="hover:bg-white/5">
                {columns.map(c=>(
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap">
                    {c.render ? c.render(r[c.key], r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {!slice.length && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Inbox size={18} />
                    <span>No data found</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3">
        <div className="text-xs text-slate-300">
          Page {page} / {pages}
        </div>
        <div className="flex gap-2">
          <button disabled={page===1}
            onClick={()=>setPage(p=>Math.max(1,p-1))}
            className="rounded-lg bg-white/10 px-3 py-1 disabled:opacity-40">Prev</button>
          <button disabled={page===pages}
            onClick={()=>setPage(p=>Math.min(pages,p+1))}
            className="rounded-lg bg-white/10 px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}

