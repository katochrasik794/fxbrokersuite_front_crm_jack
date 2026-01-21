export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-6xl rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="text-lg font-semibold">{title}</div>
            <button onClick={onClose} className="rounded-lg px-3 py-1.5 bg-gray-100 hover:bg-gray-200">Close</button>
          </div>
          <div className="p-5 max-h-[70vh] overflow-auto">{children}</div>
          {footer && (
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


