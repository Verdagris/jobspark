"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft, Zap, Sparkles } from "lucide-react";
import Link from "next/link";

const CreditsPurchaseSuccessPage = () => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-slate-600 mb-6">
            Your credits have been added to your account. You can now continue practicing your interview skills!
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-green-700">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Credits activated instantly</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 mb-6">
            Redirecting to dashboard in {countdown} seconds...
          </p>
          
          <div className="space-y-3">
            <Link href="/dashboard">
              <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Go to Dashboard
              </button>
            </Link>
            <Link href="/interview-practice">
              <button className="w-full border border-slate-200 text-slate-600 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
                Start Practicing
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreditsPurchaseSuccessPage;