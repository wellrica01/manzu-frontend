import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

/**
 * ErrorState Component
 * Displays error message with helpful actions when prescription loading fails
 * 
 * @param {Object} props
 * @param {string} props.error - Error message to display
 */
export const ErrorState = ({ error }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 flex items-center justify-center">
      <Card className="relative bg-white/98 backdrop-blur-xl border-2 border-red-500/30 rounded-3xl shadow-2xl overflow-hidden max-w-lg mx-auto">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/15 to-transparent rounded-bl-full" />
        
        <div className="relative p-10 text-center">
          {/* Error icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 mb-6 shadow-2xl">
            <AlertCircle className="h-10 w-10 text-white" strokeWidth={2.5} aria-hidden="true" />
          </div>

          {/* Error heading */}
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-4">
            Unable to Load
          </h2>

          {/* Error message */}
          <p className="text-red-600 text-base font-medium mb-4" role="alert">
            {error}
          </p>

          {/* Help text with links */}
          <p className="text-gray-600 text-sm mt-2">
            Please check your prescription link or{' '}
            <Link
              href="/prescription/upload"
              className="text-[#225F91] hover:text-[#1A4971] underline font-semibold transition-colors"
              aria-label="Upload new prescription"
            >
              upload a new prescription
            </Link>
            . Contact{' '}
            <Link
              href="/support"
              className="text-[#225F91] hover:text-[#1A4971] underline font-semibold transition-colors"
              aria-label="Contact support"
            >
              support
            </Link>{' '}
            for help.
          </p>
        </div>
      </Card>
    </div>
  );
};

// Default exports for easier importing
export default ErrorState;