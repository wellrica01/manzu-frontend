import React from 'react';

export default function Notification({ message, type = 'info', onClose }) {
  if (!message) return null;
  const color = type === 'success' ? 'bg-green-100 text-green-800' : type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg ${color}`}>
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-lg font-bold">&times;</button>
      </div>
    </div>
  );
} 