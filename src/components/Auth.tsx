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
import { Mail, Lock, User, RefreshCw, Eye, EyeOff, CheckCircle, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function Auth({ onShowToast }: AuthProps) {
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
      onShowToast('ကျေးဇူးပြု၍ အချက်အလက်အားလုံး ပြည့်စုံစွာ ဖြည့်သွင်းပေးပါ။', 'error');
      return;
    }
    if (!validateEmail(email)) {
      onShowToast('မှန်ကန်သော အီးမေးလ်လိပ်စာ ရိုက်ထည့်ပေးပါ။', 'error');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onShowToast('ပြန်လည်ကြိုဆိုပါသည်!', 'success');
    } catch (err: any) {
      let errMsg = 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။';
      if (err.code === 'auth/invalid-credential') {
        errMsg = 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။';
      } else if (err.code === 'auth/user-not-found') {
        errMsg = 'ဤအီးမေးလ်ဖြင့် အကောင့်ဖွင့်ထားခြင်း မရှိပါ။';
      } else if (err.code === 'auth/wrong-password') {
        errMsg = 'စကားဝှက် မှားယွင်းနေပါသည်။';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'အကောင့်ဝင်ရောက်ခွင့် ပိတ်ထားပါသည်။';
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
      onShowToast('ကျေးဇူးပြု၍ အချက်အလက်အားလုံး ပြည့်စုံစွာ ဖြည့်သွင်းပေးပါ။', 'error');
      return;
    }
    if (!validateEmail(email)) {
      onShowToast('မှန်ကန်သော အီးမေးလ်လိပ်စာ ရိုက်ထည့်ပေးပါ။', 'error');
      return;
    }
    if (password.length < 6) {
      onShowToast('စကားဝှက်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။', 'error');
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

      onShowToast('အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ ကြိုဆိုပါသည်!', 'success');
    } catch (err: any) {
      let errMsg = 'အကောင့်ဖွင့်ရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'ဤအီးမေးလ်ဖြင့် အကောင့်ဖွင့်ပြီးသားဖြစ်ပါသည်။';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'စကားဝှက်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'အကောင့်ဖွင့်ခြင်း ပိတ်ထားပါသည်။';
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
      onShowToast('ပြန်လည်ကြိုဆိုပါသည်!', 'success');
    } catch (err: any) {
      let errMsg = `Google အကောင့်ဖြင့် ဝင်ရောက်ခြင်း မအောင်မြင်ပါ (${err.message || 'အမှားဖြစ်ပေါ်ခဲ့ပါသည်'})`;
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
      onShowToast('ကျေးဇူးပြု၍ အချက်အလက်အားလုံး ပြည့်စုံစွာ ဖြည့်သွင်းပေးပါ။', 'error');
      return;
    }
    if (!validateEmail(email)) {
      onShowToast('မှန်ကန်သော အီးမေးလ်လိပ်စာ ရိုက်ထည့်ပေးပါ။', 'error');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotSent(true);
      onShowToast('စကားဝှက်ပြန်လည်သတ်မှတ်ရန် လင့်ခ်ကို အီးမေးလ်သို့ ပေးပို့ပြီးပါပြီ။', 'success');
    } catch {
      onShowToast('စကားဝှက်ပြန်လည်သတ်မှတ်ခြင်း မအောင်မြင်ပါ။', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <img
          src="/logo.png"
          alt="SmartWallet"
          className="h-16 w-16 object-contain mb-4 drop-shadow-sm rounded-2xl"
        />
        <h2 className="text-center text-2xl font-bold tracking-tight text-[#111827] font-sans">
          {mode === 'signin' && 'အကောင့်ဝင်ရောက်ပါ'}
          {mode === 'signup' && 'အကောင့်အသစ်ဖွင့်ပါ'}
          {mode === 'forgot' && 'စကားဝှက် ပြန်ယူပါ'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          {mode === 'signin' && (
            <>
              သို့မဟုတ်{' '}
              <button
                id="link-to-signup"
                onClick={() => {
                  setMode('signup');
                  setForgotSent(false);
                }}
                className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
              >
                အကောင့်အသစ်ဖွင့်မည်
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              အကောင့်ရှိပြီးသားဖြစ်ပါက{' '}
              <button
                id="link-to-signin"
                onClick={() => setMode('signin')}
                className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
              >
                အကောင့်ဝင်ပါ
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
              အကောင့်ဝင်ရန် ပြန်သွားမည်
            </button>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          layout
          className="bg-white py-8 px-6 border border-slate-200 rounded-xl sm:px-10 shadow-xs"
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
              <h3 className="text-base font-semibold text-[#111827]">အီးမေးလ်ကို စစ်ဆေးပါ</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                စကားဝှက် ပြန်လည်သတ်မှတ်ရန် လင့်ခ်ကို {email} သို့ ပေးပို့လိုက်ပါပြီ။
              </p>
              <button
                id="btn-return-signin"
                onClick={() => {
                  setMode('signin');
                  setForgotSent(false);
                }}
                className="mt-6 w-full flex justify-center py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-colors cursor-pointer"
              >
                အကောင့်ဝင်ရန် ပြန်သွားမည်
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
                    အမည် အပြည့်အစုံ
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
                      placeholder="ဦးမောင်မောင်"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm focus:ring-1 focus:ring-blue-500 bg-white transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  အီးမေးလ်
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
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm focus:ring-1 focus:ring-blue-500 bg-white transition-colors"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    စကားဝှက်
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
                      className="block w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm focus:ring-1 focus:ring-blue-500 bg-white transition-colors"
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
                      စကားဝှက် မေ့နေပါသလား?
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
                    'အကောင့်ဝင်မည်'
                  ) : mode === 'signup' ? (
                    'အကောင့်ဖွင့်မည်'
                  ) : (
                    'လင့်ခ် ပေးပို့မည်'
                  )}
                </button>
              </div>

              {mode !== 'forgot' && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                      <span className="bg-white px-2 text-slate-400 font-medium">အခြားနည်းလမ်းဖြင့် ဝင်မည်</span>
                    </div>
                  </div>

                  <button
                    id="btn-google-auth"
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Chrome className="w-4 h-4 text-[#2563EB]" />
                    Google ဖြင့် ဝင်ရောက်မည်
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
