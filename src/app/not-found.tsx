import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div data-testid="not-found-page" className="min-h-screen bg-[#F8F8F7] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E6E6E3] p-8 text-center space-y-4">
        <div className="text-4xl font-bold text-[#191918]">404</div>
        <h1 className="text-lg font-semibold text-[#191918]">Page not found</h1>
        <p className="text-xs text-[#6B6B68]">
          The resource or workspace route you requested could not be found.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium"
        >
          Return to Workspace
        </Link>
      </div>
    </div>
  );
}
