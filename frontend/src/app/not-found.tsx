"use client";

import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <AlertCircle size={48} className="text-red-600" />
        </div>

        {/* Content */}
        <h1 className="text-5xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-2xl font-semibold text-gray-800 mb-3">Page Not Found</p>
        <p className="text-gray-600 mb-8 leading-relaxed">
          We couldn't find the page you're looking for. It may have been moved or removed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition shadow-md"
          >
            <Home size={18} />
            Go to Home
          </Link>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition"
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">Need help?</p>
          <div className="space-y-2">
            <Link href="/help" className="block text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              View Help & Resources
            </Link>
            <a href="mailto:support@mhchat.app" className="block text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
