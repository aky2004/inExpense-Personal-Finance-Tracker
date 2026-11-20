import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { firebaseAuth, googleAuthProvider } from '../config/firebase';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { X, Shield, User, Eye } from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  initialEmail?: string;
  initialPassword?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  initialEmail = '',
  initialPassword = '',
}) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setMode(defaultMode);
    if (initialEmail) setEmail(initialEmail);
    if (initialPassword) setPassword(initialPassword);
    setError(null);
  }, [defaultMode, isOpen, initialEmail, initialPassword]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.token, res.data.user);
      } else {
        const res = await api.post('/auth/register', { name, email, password, role });
        login(res.data.token, res.data.user);
      }
      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      const res = await api.post('/auth/google', { idToken });
      login(res.data.token, res.data.user);
      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed or dismissed the popup window
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized in Firebase Console. Please add "localhost" to Authorized Domains in Firebase Authentication Settings.');
        return;
      }
      setError(err.response?.data?.error || err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside to close backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-[420px] rounded-3xl bg-[#141210] border border-[#24211d] p-7 sm:p-9 shadow-2xl z-10 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-[#8c857b] hover:text-white hover:bg-[#1a1714] transition-colors"
          aria-label="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <h2 className="text-2xl font-black text-white text-center mb-6 tracking-tight">
          {mode === 'login' ? 'Log in to account' : 'Create an account'}
        </h2>

        {error && (
          <div className="p-3 mb-5 bg-[#ef6a57]/10 border border-[#ef6a57]/30 text-[#ef6a57] rounded-xl text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Single Sign In with Google */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1a1714] hover:bg-[#221e1a] border border-[#2e2a25] text-white text-xs font-semibold flex items-center justify-center gap-3 transition-all hover:border-[#423c34] active:scale-[0.99] disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>
              {googleLoading
                ? 'Authenticating...'
                : mode === 'login'
                ? 'Sign in with Google'
                : 'Sign up with Google'}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#24211d]"></div>
          </div>
          <div className="relative flex justify-center text-[11px]">
            <span className="px-3 bg-[#141210] text-[#8c857b]">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[#8c857b]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0c0a] border border-[#24211d] text-xs text-white placeholder-[#524b42] focus:outline-none focus:border-[#2563eb] transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-[#8c857b]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0c0a] border border-[#24211d] text-xs text-white placeholder-[#524b42] focus:outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#8c857b]">
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/contact');
                  }}
                  className="text-[11px] text-[#8c857b] hover:text-[#3b82f6] transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0c0a] border border-[#24211d] text-xs text-white placeholder-[#524b42] focus:outline-none focus:border-[#2563eb] transition-colors"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[#8c857b]">
                Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    role === 'user'
                      ? 'bg-emerald-950/60 border-[#4cc38a] text-[#4cc38a]'
                      : 'bg-[#1a1714] border-[#24211d] text-[#8c857b]'
                  }`}
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    role === 'admin'
                      ? 'bg-blue-950/60 border-blue-500 text-blue-400'
                      : 'bg-[#1a1714] border-[#24211d] text-[#8c857b]'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRole('read-only')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    role === 'read-only'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-400'
                      : 'bg-[#1a1714] border-[#24211d] text-[#8c857b]'
                  }`}
                >
                  Read-Only
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs transition-all shadow-md shadow-[#2563eb]/20 active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        {/* Switcher */}
        <p className="text-center text-xs text-[#8c857b] mt-6">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-[#3b82f6] hover:underline font-bold"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-[#3b82f6] hover:underline font-bold"
              >
                Log in
              </button>
            </>
          )}
        </p>

        {/* One-Click Quick Demo Autofill Bar */}
        {mode === 'login' && (
          <div className="mt-6 pt-5 border-t border-[#24211d] text-left space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c857b] block">
              Quick Test Autofill (RBAC):
            </span>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@finance.com', 'AdminPassword123!')}
                className="py-1 px-2 rounded-lg bg-[#1a1714] border border-[#24211d] hover:border-blue-500/50 text-blue-400 text-center transition-all truncate"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('user@finance.com', 'UserPassword123!')}
                className="py-1 px-2 rounded-lg bg-[#1a1714] border border-[#24211d] hover:border-emerald-500/50 text-[#4cc38a] text-center transition-all truncate"
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('readonly@finance.com', 'ReadOnlyPassword123!')}
                className="py-1 px-2 rounded-lg bg-[#1a1714] border border-[#24211d] hover:border-amber-500/50 text-amber-400 text-center transition-all truncate"
              >
                Read-Only
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;