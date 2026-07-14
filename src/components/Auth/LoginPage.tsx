import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { Layers, Mail } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncGmail, setSyncGmail] = useState(false);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (syncGmail) {
        googleProvider.addScope('https://mail.google.com/');
      }
      const result = await signInWithPopup(auth, googleProvider);
      
      if (syncGmail) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential && credential.accessToken) {
          setAccessToken(credential.accessToken);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1069ff] rounded-full mix-blend-screen filter blur-[150px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#8b5cf6] rounded-full mix-blend-screen filter blur-[180px] opacity-20"></div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl flex flex-col items-center">
          
          <div className="w-16 h-16 bg-gradient-to-br from-[#1069ff] to-[#8b5cf6] rounded-2xl shadow-lg flex items-center justify-center mb-6">
            <Layers className="text-white w-8 h-8" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Welcome to Flow Studio</h1>
          <p className="text-slate-400 text-center mb-8 text-[15px]">Sign in to manage your projects, leads, and emails seamlessly.</p>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          <div className="w-full mb-6">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
              <div className="flex-shrink-0 mt-0.5">
                <input 
                  type="checkbox" 
                  checked={syncGmail}
                  onChange={(e) => setSyncGmail(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/20 text-[#1069ff] focus:ring-[#1069ff] focus:ring-offset-0 cursor-pointer"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#8b5cf6]" />
                  Enable Gmail Integration
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Import drafts, read inboxes, and sync sent emails without needing an App Password.
                </p>
              </div>
            </label>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl p-4 font-bold text-[15px] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
};
