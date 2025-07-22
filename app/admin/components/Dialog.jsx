import React, { useEffect } from "react";

export default function Dialog({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md border border-gray-200 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white pb-2">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
          {title && <h2 className="text-xl font-bold mb-4 pr-8">{title}</h2>}
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          {children}
        </div>
      </div>
    </div>
  );
} 