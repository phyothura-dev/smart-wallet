import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { seedNewUserData } from '../lib/seedData';
import { Mail, Lock, User, RefreshCw, Eye, EyeOff, CheckCircle, Chrome, Languages } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthProps {
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function Auth({ onShowToast }: AuthProps) {
  const { language, toggleLanguage, t } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('Ks');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [operationNotAllowedError, setOperationNotAllowedError] = useState(false);
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState(false);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onShowToast(t.auth.fillAllFields, 'error');
      return;
    }
    if (!validateEmail(email)) {
      onShowToast(t.auth.invalidEmail, 'error');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onShowToast(t.auth.welcomeBack, 'success');
    } catch (err: any) {
      let errMsg = t.auth.invalidCredential;
      if (err.code === 'auth/invalid-credential') {
        errMsg = t.auth.invalidCredential;
      } else if (err.code === 'auth/user-not-found') {
        errMsg = t.auth.userNotFound;
      } else if (err.code === 'auth/wrong-password') {
        errMsg = t.auth.wrongPassword;
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = t.auth.operationNotAllowed;
        setOperationNotAllowedError(true);
      } else if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        errMsg = "Unauthorized Domain: This hosting domain is not authorized in your Firebase Console.";
        setUnauthorizedDomainError(true);
      }
      onShowToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      onShowToast(t.auth.fillAllFields, 'error');
      return;
    }
    if (!validateEmail(email)) {
      onShowToast(t.auth.invalidEmail, 'error');
      return;
    }
    if (password.length < 6) {
      onShowToast(t.auth.passwordMinLength, 'error');
      return;
    }

    setLoading(true);
    try {
      // create firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // setup initial user data
      const avatarUrl = `https://api.dicebear.com/10.x/micah/svg?seed=${encodeURIComponent(fullName)}`;
      await seedNewUserData(user.uid, {
        fullName,
        email,
        photoURL: avatarUrl,
        currency,
      });

      onShowToast(t.auth.signUpSuccess, 'success');
    } catch (err: any) {
      let errMsg = t.auth.signUpError;
      if (err.code === 'auth/email-already-in-use') {
        errMsg = t.auth.emailInUse;
      } else if (err.code === 'auth/weak-password') {
        errMsg = t.auth.passwordMinLength;
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = t.auth.operationNotAllowed;
        setOperationNotAllowedError(true);
      } else if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        errMsg = "Unauthorized Domain: This hosting domain is not authorized in your Firebase Console.";
        setUnauthorizedDomainError(true);
      }
      onShowToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onShowToast(t.auth.welcomeBack, 'success');
    } catch (err: any) {
      let errMsg = `${t.auth.googleError} (${err.message || ''})`;
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        errMsg = "Unauthorized Domain: This hosting domain is not authorized in your Firebase Console.";
        setUnauthorizedDomainError(true);
      }
      onShowToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      onShowToast(t.auth.fillAllFields, 'error');
      return;
    }
    if (!validateEmail(email)) {
      onShowToast(t.auth.invalidEmail, 'error');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotSent(true);
      onShowToast(t.auth.resetSentSuccess, 'success');
    } catch {
      onShowToast(t.auth.resetFailed, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          id="btn-auth-lang-toggle"
          type="button"
          onClick={toggleLanguage}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
        >
          <Languages className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>{language === 'mm' ? 'MM' : 'EN'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <img
          src="/logo.png"
          alt="SmartWallet"
          className="h-16 w-16 object-contain mb-4 drop-shadow-sm rounded-2xl"
        />
        <h2 className="text-center text-2xl font-bold tracking-tight text-[#111827] dark:text-slate-100 font-sans">
          {mode === 'signin' && t.auth.signInTitle}
          {mode === 'signup' && t.auth.signUpTitle}
          {mode === 'forgot' && t.auth.forgotTitle}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          {mode === 'signin' && (
            <>
              {t.auth.orText}{' '}
              <button
                id="link-to-signup"
                onClick={() => {
                  setMode('signup');
                  setForgotSent(false);
                }}
                className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
              >
                {t.auth.createAccountLink}
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              {t.auth.alreadyHaveAccount}{' '}
              <button
                id="link-to-signin"
                onClick={() => setMode('signin')}
                className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
              >
                {t.auth.signInLink}
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <button
              id="link-back-to-signin"
              onClick={() => {
                setMode('signin');
                setForgotSent(false);
              }}
              className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
            >
              {t.auth.backToSignIn}
            </button>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          layout
          className="bg-white dark:bg-slate-900 py-8 px-6 border border-slate-200 dark:border-slate-800 rounded-xl sm:px-10 shadow-xs"
        >
          {operationNotAllowedError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-xs text-amber-800 leading-relaxed space-y-2">
              <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                <span>⚠️</span> ပြင်ဆင်သတ်မှတ်ရန် လိုအပ်သည်
              </p>
              <p>
                Firebase Authentication စနစ်တွင် Email/Password ဖွင့်ထားခြင်း မရှိသေးပါ။
              </p>
              <div className="border-t border-amber-200/60 my-2 pt-2">
                <p className="font-semibold text-amber-900 mb-1">မည်သို့ဖွင့်ရမည်နည်း-</p>
                <ol className="list-decimal pl-4 space-y-1 text-amber-900">
                  <li>Firebase Console သို့ သွားပါ</li>
                  <li>Build &gt; Authentication ကို ရွေးပါ</li>
                  <li>Sign-in method tab သို့ သွားပါ</li>
                  <li>Email/Password provider ကို ဖွင့်ပေးပါ</li>
                </ol>
              </div>
            </div>
          )}

          {unauthorizedDomainError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-6 text-xs text-rose-800 leading-relaxed space-y-2 col-span-full">
              <p className="font-semibold text-rose-900 flex items-center gap-1.5">
                <span>⚠️</span> Unauthorized Domain Configuration Required
              </p>
              <p>
                The hosting domain <code className="bg-rose-100 px-1 py-0.5 rounded text-rose-900 font-semibold">{window.location.hostname}</code> is not authorized in your Firebase Console for project <strong className="font-semibold">{auth.app.options.projectId || 'fintrack'}</strong>.
              </p>
              <div className="border-t border-rose-200/60 my-2 pt-2">
                <p className="font-semibold text-rose-950 mb-1">How to authorize this domain:</p>
                <ol className="list-decimal pl-4 space-y-1 text-rose-900">
                  <li>Open the <a href={`https://console.firebase.google.com/project/${auth.app.options.projectId || 'fintrack'}/authentication/providers`} target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-rose-950">Firebase Console</a>.</li>
                  <li>In the left sidebar, go to <strong>Build &gt; Authentication</strong>.</li>
                  <li>Select the <strong>Settings</strong> tab at the top.</li>
                  <li>Click on <strong>Authorized domains</strong> in the list.</li>
                  <li>Click <strong>Add domain</strong>, enter <code className="bg-rose-100 px-1 py-0.5 rounded font-mono font-semibold">{window.location.hostname}</code> (or <code className="bg-rose-100 px-1 py-0.5 rounded font-mono font-semibold">run.app</code> to cover all container runs), and click <strong>Add</strong>.</li>
                  <li>After adding, reload this page and try again!</li>
                </ol>
              </div>
            </div>
          )}

          {mode === 'forgot' && forgotSent ? (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 text-[#059669] mb-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-[#111827] dark:text-slate-100">{t.auth.checkEmailTitle}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {t.auth.checkEmailDesc} ({email})
              </p>
              <button
                id="btn-return-signin"
                onClick={() => {
                  setMode('signin');
                  setForgotSent(false);
                }}
                className="mt-6 w-full flex justify-center py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-colors cursor-pointer"
              >
                {t.auth.backToSignIn}
              </button>
            </div>
          ) : (
            <form
              id="auth-form"
              onSubmit={
                mode === 'signin'
                  ? handleSignIn
                  : mode === 'signup'
                  ? handleSignUp
                  : handleForgotPassword
              }
              className="space-y-5"
            >
              {mode === 'signup' && (
                <div>
                  <label htmlFor="full-name" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    {t.auth.fullNameLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="full-name"
                      name="fullName"
                      type="text"
                      required
                      placeholder={t.auth.fullNamePlaceholder}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  {t.auth.emailLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={t.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    {t.auth.passwordLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-800 transition-colors"
                    />
                    <button
                      id="toggle-show-password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signin' && (
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <button
                      id="btn-forgot-password-link"
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotSent(false);
                      }}
                      className="font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
                    >
                      {t.auth.forgotPasswordLink}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <button
                  id="btn-submit-auth"
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : mode === 'signin' ? (
                    t.auth.signInBtn
                  ) : mode === 'signup' ? (
                    t.auth.signUpBtn
                  ) : (
                    t.auth.sendResetBtn
                  )}
                </button>
              </div>

              {mode !== 'forgot' && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                      <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-medium">{t.auth.orContinueWith}</span>
                    </div>
                  </div>

                  <button
                    id="btn-google-auth"
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Chrome className="w-4 h-4 text-[#2563EB]" />
                    {t.auth.googleSignIn}
                  </button>
                </>
              )}
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
