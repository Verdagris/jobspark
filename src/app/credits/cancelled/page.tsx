"use client";

import { motion } from "framer-motion";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

const CreditsPurchaseCancelledPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-slate-600 mb-6">
            Your payment was cancelled. No charges were made to your account.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              You can try purchasing credits again at any time. Your account remains unchanged.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link href="/credits">
              <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="w-full border border-slate-200 text-slate-600 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreditsPurchaseCancelledPage;