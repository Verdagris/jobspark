"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  CreditCard, 
  Zap, 
  Star, 
  Check, 
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Award,
  RefreshCw,
  FileText,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getUserCredits, getCreditTransactions, CREDIT_PACKAGES, CREDIT_COSTS, formatCredits, formatPrice, getCreditsPerRand } from "@/lib/credits";

const CreditsPage = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    const loadCreditsData = async () => {
      if (!user) return;
      
      try {
        const [creditsData, transactionsData] = await Promise.all([
          getUserCredits(user.id),
          getCreditTransactions(user.id, 10)
        ]);
        
        setCredits(creditsData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error loading credits data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCreditsData();
  }, [user]);

  const handlePurchase = async (packageId: string) => {
    if (!user || !credits) return;
    
    setPurchasing(packageId);
    
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || 'User'
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentData && data.paymentUrl) {
        // Create a form and submit to PayFast
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentUrl;
        form.style.display = 'none';

        // Add all payment data as hidden inputs
        Object.entries(data.paymentData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        console.error('Payment initiation failed:', data);
        alert('Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const refreshBalance = async () => {
    if (!user) return;
    
    try {
      const creditsData = await getUserCredits(user.id);
      setCredits(creditsData);
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
          <span className="text-slate-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  const currentBalance = credits?.credits_balance || 0;
  const interviewsAvailable = Math.floor(currentBalance / CREDIT_COSTS.INTERVIEW_SESSION);
  const cvsAvailable = Math.floor(currentBalance / CREDIT_COSTS.CV_GENERATION);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <Sparkles className="w-8 h-8 text-sky-500" />
                <span className="text-2xl font-bold text-slate-900">JobSpark</span>
              </div>
              <div className="h-8 w-px bg-slate-200 mx-4" />
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Credits</h1>
                  <p className="text-sm text-slate-600">Manage your interview credits</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={refreshBalance}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-8 text-white mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Credit Balance</h2>
              <div className="flex items-center space-x-2">
                <Zap className="w-8 h-8" />
                <span className="text-4xl font-bold">
                  {formatCredits(currentBalance)}
                </span>
                <span className="text-xl opacity-80">credits</span>
              </div>
              <p className="mt-2 opacity-90">
                Interview practice: {CREDIT_COSTS.INTERVIEW_SESSION} credits • CV generation: {CREDIT_COSTS.CV_GENERATION} credits
              </p>
            </div>
            <div className="text-right space-y-4">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="w-5 h-5" />
                  <p className="text-sm opacity-80">Interviews Available</p>
                </div>
                <p className="text-2xl font-bold">{interviewsAvailable}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5" />
                  <p className="text-sm opacity-80">CVs Available</p>
                </div>
                <p className="text-2xl font-bold">{cvsAvailable}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Credit Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Purchase Credits</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {CREDIT_PACKAGES.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={`relative bg-white rounded-xl border-2 p-6 hover:shadow-lg transition-all ${
                  pkg.popular 
                    ? 'border-green-500 shadow-lg' 
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Zap className="w-8 h-8 text-green-500" />
                    <span className="text-3xl font-bold text-slate-900">
                      {formatCredits(pkg.credits)}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-slate-900">
                      {formatPrice(pkg.price)}
                    </span>
                    <p className="text-sm text-slate-500 mt-1">
                      {getCreditsPerRand(pkg.credits, pkg.price).toFixed(0)} credits per rand
                    </p>
                  </div>
                  
                  <p className="text-slate-600 mb-6">{pkg.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{Math.floor(pkg.credits / CREDIT_COSTS.INTERVIEW_SESSION)} interview sessions</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{Math.floor(pkg.credits / CREDIT_COSTS.CV_GENERATION)} CV generations</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Never expires</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Instant activation</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasing === pkg.id}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                      pkg.popular
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {purchasing === pkg.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Purchase Credits</span>
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Payment Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Secure Payment with PayFast</h3>
              <p className="text-blue-800 text-sm mb-3">
                Your payment is processed securely by PayFast, South Africa's leading payment gateway. 
                We support all major South African banks and payment methods.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Instant Bank Transfer</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Credit Cards</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Debit Cards</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">SnapScan</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-8 mb-8"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6">Why Choose Credits?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Secure Payments</h4>
              <p className="text-sm text-slate-600">
                Powered by PayFast, South Africa's trusted payment gateway
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Never Expire</h4>
              <p className="text-sm text-slate-600">
                Your credits never expire, use them at your own pace
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Better Value</h4>
              <p className="text-sm text-slate-600">
                Larger packages offer better value per credit
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-slate-200 p-8"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.transaction_type === 'purchase' ? 'bg-green-100' :
                      transaction.transaction_type === 'usage' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      {transaction.transaction_type === 'purchase' ? (
                        <CreditCard className={`w-5 h-5 text-green-600`} />
                      ) : transaction.transaction_type === 'usage' ? (
                        <Zap className={`w-5 h-5 text-red-600`} />
                      ) : (
                        <Award className={`w-5 h-5 text-blue-600`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{transaction.description}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.credits_amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.credits_amount > 0 ? '+' : ''}{formatCredits(transaction.credits_amount)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreditsPage;