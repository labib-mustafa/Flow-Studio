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
              <img src="/assets/google-logos/google.png" className="w-5 h-5 object-contain" alt="Google Logo" />
            )}
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
};
