'use client';
import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Dialog({ 
  open, 
  onClose, 
  title, 
  children, 
  size = "md",
  showCloseButton = true,
  closeOnClickOutside = true,
  className = ""
}) {
  useEffect(() => {
    if (!open) return;
    
    // Prevent body scroll when dialog is open
    document.body.style.overflow = 'hidden';
    
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    
    window.addEventListener("keydown", handleKey);
    
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  // Size variants
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
    full: "max-w-[95vw]"
  };

  const handleBackdropClick = (e) => {
    if (closeOnClickOutside) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`
          bg-white rounded-lg shadow-2xl w-full border border-gray-200 relative
          transform transition-all duration-200 scale-100
          ${sizeClasses[size]}
          ${className}
        `}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-xl border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            {title && (
              <h2 
                id="dialog-title"
                className="text-xl font-semibold text-gray-900 pr-8"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}