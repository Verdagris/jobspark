"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowLeft, CheckCircle, Shield, Zap, AlertCircle, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useAuth } from "@/hooks/useAuth";

// --- Email Verification Success Component ---
const EmailVerificationSuccess = ({ email, onBackToLogin }: { email: string; onBackToLogin: () => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
        >
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email!</h2>
                <p className="text-slate-600 mb-4">
                    We've sent a verification link to:
                </p>
                <p className="font-semibold text-sky-600 bg-sky-50 px-4 py-2 rounded-lg border border-sky-200">
                    {email}
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-2">Next Steps:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Open your email inbox</li>
                            <li>Look for an email from JobSpark</li>
                            <li>Click the verification link</li>
                            <li>Return here to sign in</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div className="text-sm text-slate-500 space-y-2">
                <p>Didn't receive the email? Check your spam folder.</p>
                <p>The verification link will expire in 24 hours.</p>
            </div>

            <motion.button
                onClick={onBackToLogin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
            >
                Back to Sign In
            </motion.button>
        </motion.div>
    );
};

// --- Custom Floating Label Input ---
const FloatingLabelInput = ({ id, label, icon: Icon, error, ...props }: any) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHasValue(e.target.value !== "");
        if (props.onChange) props.onChange(e);
    };
    
    const isFloating = isFocused || hasValue;
    
    return (
        <div className="relative">
            <motion.label 
                htmlFor={id} 
                className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                animate={{ 
                    y: isFloating ? -26 : -10, 
                    scale: isFloating ? 0.85 : 1, 
                    color: error ? "#ef4444" : (isFocused ? "#0ea5e9" : "#64748b")
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {label}
            </motion.label>
            <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                error ? 'text-red-500' : (isFocused ? 'text-sky-500' : 'text-slate-400')
            }`} />
            <input 
                id={id} 
                onFocus={() => setIsFocused(true)} 
                onBlur={() => setIsFocused(false)} 
                onChange={handleInputChange}
                className={`w-full pl-12 pr-4 py-4 bg-transparent border-2 rounded-xl focus:outline-none transition-colors duration-200 text-slate-900 ${
                    error 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-slate-200 focus:border-sky-500'
                }`}
                {...props} 
            />
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-6 left-0 text-sm text-red-500 flex items-center gap-1"
                >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </motion.p>
            )}
        </div>
    );
};

// --- Animated Benefits Showcase ---
const benefits = [
    { icon: Zap, text: "AI-powered CV generation" },
    { icon: Shield, text: "Secure profile management" },
    { icon: CheckCircle, text: "Direct employer connections" }
];

const AnimatedBenefits = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => { 
            setActiveIndex(prev => (prev + 1) % benefits.length); 
        }, 3000);
        return () => clearInterval(interval);
    }, []);
    
    const CurrentBenefit = benefits[activeIndex];
    const Icon = CurrentBenefit.icon;
    
    return (
        <div className="flex flex-col gap-y-4 h-20">
             <AnimatePresence mode="wait">
                <motion.div 
                    key={activeIndex} 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
                    exit={{ opacity: 0, y: -15, transition: { duration: 0.4, ease: "easeInOut" } }} 
                    className="flex items-center space-x-4"
                >
                    <div className="p-3 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-lg shadow-md">
                        <Icon className="w-6 h-6 text-sky-500" />
                    </div>
                    <span className="text-slate-700 font-medium text-lg">{CurrentBenefit.text}</span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// --- Auth Page Content Component (wrapped in Suspense) ---
const AuthPageContent = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp, signIn, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for error parameters
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'callback_error':
          setErrors({ general: 'There was an error completing your sign in. Please try again.' });
          break;
        case 'unexpected_error':
          setErrors({ general: 'An unexpected error occurred. Please try again.' });
          break;
        default:
          setErrors({ general: 'An error occurred during authentication.' });
      }
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Full name is required';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setErrors({ general: 'Please check your email and click the verification link before signing in.' });
          } else if (error.message.includes('Invalid login credentials')) {
            setErrors({ general: 'Invalid email or password. Please check your credentials and try again.' });
          } else {
            setErrors({ general: error.message });
          }
        } else {
          router.push('/dashboard');
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          if (error.message.includes('already registered')) {
            setErrors({ general: 'An account with this email already exists. Please sign in instead.' });
          } else {
            setErrors({ general: error.message });
          }
        } else {
          // Show email verification screen
          setSignupEmail(formData.email);
          setShowEmailVerification(true);
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Commented out Google sign-in functionality
  /*
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrors({});
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google sign in error:', error);
        setErrors({ general: 'Failed to sign in with Google. Please try again.' });
        setIsLoading(false);
      }
      // Don't set loading to false here as the redirect will handle it
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setErrors({ general: 'Failed to sign in with Google. Please try again.' });
      setIsLoading(false);
    }
  };
  */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const handleBackToLogin = () => {
    setShowEmailVerification(false);
    setIsLogin(true);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50" />
      <div className="absolute inset-[-200%] -z-10 animate-spin-slow bg-[conic-gradient(from_90deg_at_50%_50%,#e0f2fe_0%,#a5b4fc_50%,#e0f2fe_100%)] opacity-30" />

      <main className="w-full max-w-7xl mx-auto z-10">
        <div className="flex flex-col lg:flex-row bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-400/20 overflow-hidden">
            {/* Left Side */}
            <div className="w-full lg:w-5/12 p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
                <motion.div 
                    initial={{ opacity: 0, x: -50 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.8, ease: "easeOut" }} 
                    className="max-w-md mx-auto lg:mx-0"
                >
                    <Link href="/" className="flex items-center space-x-3 mb-8 group">
                        <div className="p-2 border border-slate-200 rounded-full group-hover:bg-white transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </div>
                        <Sparkles className="w-8 h-8 text-sky-500" />
                        <span className="text-2xl font-bold text-slate-900">JobSpark</span>
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900 mb-4">
                        Your Career<br />
                        <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                            Starts Here
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                        Join thousands of professionals accelerating their careers with AI-powered tools.
                    </p>
                    <AnimatedBenefits />
                </motion.div>
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-7/12 p-8 lg:p-12 xl:p-16 bg-white/50 flex items-center justify-center">
                <motion.div className="w-full max-w-md" style={{ perspective: "1000px" }}>
                    <AnimatePresence mode="wait">
                        {showEmailVerification ? (
                            <motion.div
                                key="email-verification"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                            >
                                <EmailVerificationSuccess 
                                    email={signupEmail} 
                                    onBackToLogin={handleBackToLogin}
                                />
                            </motion.div>
                        ) : (
                            <motion.div 
                                key={isLogin ? "login" : "signup"} 
                                initial={{ rotateY: isLogin ? -90 : 90, opacity: 0 }} 
                                animate={{ rotateY: 0, opacity: 1 }}
                                exit={{ rotateY: isLogin ? 90 : -90, opacity: 0 }} 
                                transition={{ duration: 0.5, ease: "easeInOut" }} 
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                        {isLogin ? "Welcome Back" : "Create Account"}
                                    </h2>
                                    <p className="text-slate-600">
                                        {isLogin ? "Sign in to continue your journey" : "Start your career transformation today"}
                                    </p>
                                </div>
                                
                                {errors.general && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
                                    >
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm">{errors.general}</span>
                                    </motion.div>
                                )}
                                
                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-blue-800">
                                                <p className="font-semibold mb-1">Email Verification Required</p>
                                                <p>After signing up, we'll send you a verification email. Please check your inbox and click the link to activate your account.</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {!isLogin && (
                                        <FloatingLabelInput 
                                            id="name" 
                                            name="name"
                                            label="Full Name" 
                                            type="text" 
                                            icon={User}
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            error={errors.name}
                                            disabled={isLoading}
                                        />
                                    )}
                                    
                                    <FloatingLabelInput 
                                        id="email" 
                                        name="email"
                                        label="Email Address" 
                                        type="email" 
                                        icon={Mail}
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        error={errors.email}
                                        disabled={isLoading}
                                    />
                                    
                                    <div className="relative">
                                        <FloatingLabelInput 
                                            id="password" 
                                            name="password"
                                            label="Password" 
                                            type={showPassword ? "text" : "password"} 
                                            icon={Lock}
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            error={errors.password}
                                            disabled={isLoading}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)} 
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    
                                    {!isLogin && (
                                        <FloatingLabelInput 
                                            id="confirmPassword" 
                                            name="confirmPassword"
                                            label="Confirm Password" 
                                            type="password" 
                                            icon={Lock}
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            error={errors.confirmPassword}
                                            disabled={isLoading}
                                        />
                                    )}
                                    
                                    <motion.button 
                                        type="submit" 
                                        whileHover={{ scale: isLoading ? 1 : 1.02 }} 
                                        whileTap={{ scale: isLoading ? 1 : 0.98 }} 
                                        disabled={isLoading}
                                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-semibold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isLoading ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            isLogin ? "Sign In" : "Create Account"
                                        )}
                                    </motion.button>
                                    
                                    {/* Commented out Google Sign-in section */}
                                    {/*
                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-200" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-white text-slate-500">or</span>
                                        </div>
                                    </div>
                                    
                                    <motion.button 
                                        type="button" 
                                        onClick={handleGoogleSignIn}
                                        whileHover={{ scale: isLoading ? 1 : 1.02, backgroundColor: '#f8fafc' }} 
                                        whileTap={{ scale: isLoading ? 1 : 0.98 }} 
                                        disabled={isLoading}
                                        className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-medium hover:border-slate-300 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                                </svg>
                                                <span>Continue with Google</span>
                                            </>
                                        )}
                                    </motion.button>
                                    */}
                                    
                                    <p className="text-center pt-4 text-slate-600">
                                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setIsLogin(!isLogin);
                                                setErrors({});
                                                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                                            }} 
                                            className="ml-2 text-sky-500 hover:text-sky-600 font-semibold"
                                            disabled={isLoading}
                                        >
                                            {isLogin ? "Sign Up" : "Sign In"}
                                        </button>
                                    </p>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
      </main>
    </div>
  );
};

// --- Loading Component ---
const AuthPageLoading = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
        <span className="text-slate-600 font-medium">Loading...</span>
      </div>
    </div>
  );
};

// --- Main AuthPage Component ---
const AuthPage = () => {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <AuthPageContent />
    </Suspense>
  );
};

export default AuthPage;