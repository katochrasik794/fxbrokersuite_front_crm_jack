// src/pages/admin/KycList.jsx
import { useEffect, useMemo, useState } from "react";
import ProTable from "../components/ProTable.jsx";
import Modal from "../components/Modal.jsx";
import { ShieldCheck, ShieldX, CheckCircle, XCircle } from "lucide-react";
import Swal from "sweetalert2";

function fmt(v) { if (!v) return "-"; const d = new Date(v); return isNaN(d) ? "-" : d.toLocaleString(); }

export default function KycList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(null); // {row,next}
  const [docFile, setDocFile] = useState(null);
  const [addrFile, setAddrFile] = useState(null);
  const [docLink, setDocLink] = useState("");
  const [addrLink, setAddrLink] = useState("");
  const BASE = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:5000/api";

  async function load() {
    setLoading(true); setErr("");
    try {
      const token = localStorage.getItem('adminToken');
      const [r, ru] = await Promise.all([
        fetch(`${BASE}/admin/kyc?limit=500`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${BASE}/admin/users/all?limit=500`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const data = await r.json();
      const users = await ru.json();
      if (!data?.ok) throw new Error(data?.error || 'Failed');
      const items = data.items || [];
      const fromKyc = items.map(k => ({
        id: k.id,
        userId: k.userId,
        name: k.User?.name || '-',
        email: k.User?.email || '-',
        country: k.User?.country || '-',
        isDocumentVerified: k.isDocumentVerified,
        isAddressVerified: k.isAddressVerified,
        verificationStatus: k.verificationStatus,
        documentReference: k.documentReference,
        addressReference: k.addressReference,
        documentSubmittedAt: k.documentSubmittedAt,
        addressSubmittedAt: k.addressSubmittedAt,
        createdAt: k.createdAt,
      }));
      let merged = fromKyc;
      if (users?.ok && Array.isArray(users.items)) {
        const present = new Set(items.map(it => it.userId));
        const synth = users.items
          .filter(u => !present.has(u.id))
          .map(u => ({
            id: `no-kyc-${u.id}`,
            userId: u.id,
            name: u.name || '-',
            email: u.email || '-',
            country: u.country || '-',
            isDocumentVerified: false,
            isAddressVerified: false,
            verificationStatus: 'pending',
            documentReference: null,
            addressReference: null,
            documentSubmittedAt: null,
            addressSubmittedAt: null,
            createdAt: u.createdAt || null,
          }));
        merged = [...synth, ...fromKyc];
      }
      setRows(merged);
    } catch (e) { setErr(e.message || String(e)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function applyChange(id, data) {
    const token = localStorage.getItem('adminToken');
    const r = await fetch(`${BASE}/admin/kyc/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.error || 'Failed');
  }

  async function onToggleStatus(row, next) {
    try {
      let documentReference = undefined;
      let addressReference = undefined;
      if (next) {
        // Optional upload of proofs when verifying
        if (docFile || addrFile) {
          const fd = new FormData();
          if (docFile) fd.append('document', docFile);
          if (addrFile) fd.append('address', addrFile);
          const token = localStorage.getItem('adminToken');
          const up = await fetch(`${BASE}/admin/uploads`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd
          });
          const uj = await up.json();
          if (uj?.ok) {
            documentReference = uj.files?.document || undefined;
            addressReference = uj.files?.address || undefined;
          }
        }
        if (!documentReference && docLink) documentReference = docLink;
        if (!addressReference && addrLink) addressReference = addrLink;
      }

      await applyChange(row.id, {
        verificationStatus: next ? 'approved' : 'pending',
        ...(documentReference ? { documentReference } : {}),
        ...(addressReference ? { addressReference } : {}),
      });
      setRows(list => list.map(it => it.id === row.id ? { ...it, verificationStatus: next ? 'approved' : 'pending', documentReference: documentReference || it.documentReference, addressReference: addressReference || it.addressReference } : it));
      setConfirm(null);
      setDocFile(null); setAddrFile(null); setDocLink(""); setAddrLink("");

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `KYC ${next ? 'approved' : 'unapproved'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      setConfirm(null);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: e.message || String(e)
      });
    }
  }

  async function onToggleDoc(row) {
    try {
      await applyChange(row.id, { isDocumentVerified: !row.isDocumentVerified });
      setRows(list => list.map(it => it.id === row.id ? { ...it, isDocumentVerified: !row.isDocumentVerified } : it));

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Document ${!row.isDocumentVerified ? 'verified' : 'unverified'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: e.message || String(e)
      });
    }
  }
  async function onToggleAddr(row) {
    try {
      await applyChange(row.id, { isAddressVerified: !row.isAddressVerified });
      setRows(list => list.map(it => it.id === row.id ? { ...it, isAddressVerified: !row.isAddressVerified } : it));

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Address ${!row.isAddressVerified ? 'verified' : 'unverified'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: e.message || String(e)
      });
    }
  }

  async function onRejectKyc(row) {
    try {
      await applyChange(row.id, {
        verificationStatus: 'rejected'
      });
      setRows(list => list.map(it => it.id === row.id ? { ...it, verificationStatus: 'rejected' } : it));

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'KYC rejected successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: e.message || String(e)
      });
    }
  }

  const columns = useMemo(() => [
    { key: '__index', label: 'Sr No', sortable: false },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'country', label: 'Country' },
    {
      key: 'isDocumentVerified', label: 'Doc', render: (v, row, Badge) => (
        <button onClick={() => onToggleDoc(row)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${v ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{v ? 'Yes' : 'No'}</button>
      )
    },
    {
      key: 'isAddressVerified', label: 'Addr', render: (v, row, Badge) => (
        <button onClick={() => onToggleAddr(row)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${v ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{v ? 'Yes' : 'No'}</button>
      )
    },
    {
      key: 'verificationStatus', label: 'Status', render: (v, row, Badge) => {
        let displayStatus = v;
        let badgeTone = 'amber';

        // Check lowercase for database consistency
        const status = String(v || '').toLowerCase();
        if (status === 'approved') {
          displayStatus = 'Verified';
          badgeTone = 'green';
        } else if (status === 'rejected') {
          displayStatus = 'Unverified';
          badgeTone = 'red';
        } else {
          displayStatus = 'Unverified';
          badgeTone = 'amber';
        }

        return <Badge tone={badgeTone}>{displayStatus}</Badge>;
      }
    },
    { key: 'documentSubmittedAt', label: 'Doc Submitted', render: (v, row) => row.documentReference ? <a className="text-violet-700 hover:underline" href={row.documentReference} target="_blank" rel="noreferrer">{fmt(v)}</a> : fmt(v) },
    { key: 'addressSubmittedAt', label: 'Addr Submitted', render: (v, row) => row.addressReference ? <a className="text-violet-700 hover:underline" href={row.addressReference} target="_blank" rel="noreferrer">{fmt(v)}</a> : fmt(v) },
    { key: 'createdAt', label: 'Created', render: fmt },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (v, row) => {
        // Check lowercase for database consistency
        const status = String(row.verificationStatus || '').toLowerCase();
        const isApproved = status === 'approved';

        return (
          <div className="flex items-center gap-3">
            {isApproved ? (
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => setConfirm({ row, next: false })}
                  className="h-8 px-3 rounded-md border border-amber-200 text-amber-700 hover:bg-amber-50 inline-flex items-center gap-1">
                  <ShieldX size={16} /> Unapprove
                </button>
                <span className="text-xs text-gray-500">Unapprove</span>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => setConfirm({ row, next: true })}
                    className="h-8 px-3 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 inline-flex items-center gap-1">
                    <CheckCircle size={16} /> Approve
                  </button>
                  <span className="text-xs text-gray-500">Approve</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => onRejectKyc(row)}
                    className="h-8 px-3 rounded-md border border-red-200 text-red-700 hover:bg-red-50 inline-flex items-center gap-1">
                    <XCircle size={16} /> Reject
                  </button>
                  <span className="text-xs text-gray-500">Reject</span>
                </div>
              </>
            )}
          </div>
        );
      }
    },
  ], []);

  const filters = useMemo(() => ({
    searchKeys: ['name', 'email', 'country', 'verificationStatus'],
    dateKey: 'createdAt',
  }), []);

  // Filter rows based on lowercase status for database consistency
  const verifiedRows = useMemo(() => rows.filter(r => {
    const status = String(r.verificationStatus || '').toLowerCase();
    return status === 'approved';
  }), [rows]);
  const unverifiedRows = useMemo(() => rows.filter(r => {
    const status = String(r.verificationStatus || '').toLowerCase();
    return status !== 'approved';
  }), [rows]);

  if (loading) return <div className="rounded-xl bg-white border border-gray-200 p-4">Loading KYC…</div>;
  if (err) return <div className="rounded-xl bg-white border border-rose-200 text-rose-700 p-4">{err}</div>;

  return (
    <>
      <ProTable title="Unverified KYC" rows={unverifiedRows} columns={columns} filters={filters}
        searchPlaceholder="Search name / email / country / status…" pageSize={10} />

      {/* Verified-only table */}
      <div className="mt-8">
        <ProTable title="Verified KYC" rows={verifiedRows} columns={columns} filters={{ searchKeys: ['name', 'email', 'country'], dateKey: 'createdAt' }}
          searchPlaceholder="Search verified name / email / country…" pageSize={10} />
      </div>

      {/* Approve Modal with optional proof uploads/links */}
      <Modal open={!!confirm} onClose={() => { setConfirm(null); setDocFile(null); setAddrFile(null); setDocLink(""); setAddrLink(""); }} title="Confirm KYC Status">
        {confirm && (
          <div className="space-y-5">
            <p>
              Do you want to {confirm.next ? 'approve' : 'unapprove'} KYC for <b>{confirm.row.email}</b>?
            </p>
            {confirm.next && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Identity Proof (Document)</div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-600 truncate max-w-[60%]">{docFile ? docFile.name : 'No file selected'}</div>
                    <label htmlFor="kyc-doc" className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-sm cursor-pointer">Choose file</label>
                    <input id="kyc-doc" type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setDocFile(e.target.files?.[0] || null)} />
                  </div>
                  <input type="text" placeholder="or paste document link" value={docLink} onChange={e => setDocLink(e.target.value)} className="mt-2 w-full rounded-md border border-gray-300 h-10 px-3" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Address Proof</div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-600 truncate max-w-[60%]">{addrFile ? addrFile.name : 'No file selected'}</div>
                    <label htmlFor="kyc-addr" className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-sm cursor-pointer">Choose file</label>
                    <input id="kyc-addr" type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setAddrFile(e.target.files?.[0] || null)} />
                  </div>
                  <input type="text" placeholder="or paste address link" value={addrLink} onChange={e => setAddrLink(e.target.value)} className="mt-2 w-full rounded-md border border-gray-300 h-10 px-3" />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setConfirm(null); setDocFile(null); setAddrFile(null); setDocLink(""); setAddrLink(""); }} className="px-4 h-10 rounded-md border">Cancel</button>
              <button onClick={() => onToggleStatus(confirm.row, confirm.next)} className={`px-4 h-10 rounded-md text-white ${confirm.next ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                {confirm.next ? 'Approve' : 'Unapprove'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* single modal only */}
    </>
  );
}
