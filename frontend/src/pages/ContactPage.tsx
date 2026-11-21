import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Wallet,
  ArrowRight,
  Sun,
  Moon,
  Github,
  Mail,
  MessageSquare,
  HelpCircle,
  Code2,
  ExternalLink,
  CheckCircle2,
  Send,
  LifeBuoy,
  Shield,
  Zap,
  Clock,
  LogOut,
  User,
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoToLoginWithCredentials = (email: string, pass: string) => {
    navigate('/login', { state: { email, pass } });
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Technical Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill out all required fields.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0908] text-[#f2efe9] selection:bg-[#2563eb] selection:text-white font-sans flex flex-col">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0908]/90 border-b border-[#24211d] h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white font-black text-xs shadow-md shadow-[#2563eb]/30">
              in
            </div>
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#3b82f6] transition-colors">
              in<span className="text-[#3b82f6]">Expense</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#8c857b]">
            <Link to="/#how-it-works" className="hover:text-[#3b82f6] transition-colors">
              How It Works
            </Link>
            <Link to="/#faq" className="hover:text-[#3b82f6] transition-colors">
              FAQ
            </Link>
            <Link to="/docs" className="hover:text-[#3b82f6] transition-colors">
              Docs
            </Link>
            <Link to="/contact" className="text-[#3b82f6] font-bold">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl text-[#8c857b] hover:text-white hover:bg-[#1a1714] transition-colors"
            >
              {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            <a
              href="https://github.com/aky2004/Personal-Finance-Tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-[#8c857b] hover:text-white hover:bg-[#1a1714] transition-colors"
              title="GitHub Repository"
            >
              <Github size={17} />
            </a>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGoToLoginWithCredentials('', '')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#8c857b] hover:text-white hover:bg-[#1a1714] border border-[#24211d] transition-colors cursor-pointer"
                  title="Switch user role or log in as another user"
                >
                  <User size={12} />
                  <span>Switch</span>
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-all"
                >
                  <span>Dashboard</span>
                  <ArrowRight size={13} />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-xl text-xs text-[#8c857b] hover:text-[#ef6a57] hover:bg-[#1a1714] border border-[#24211d] transition-colors cursor-pointer"
                  title="Logout current session"
                  aria-label="Logout"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-all"
              >
                <span>Login</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Help & Support Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#3b82f6] tracking-wider uppercase bg-[#2563eb]/10 border border-[#2563eb]/20">
            <LifeBuoy size={14} /> HELP CENTER &amp; SUPPORT
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            How can we assist you today?
          </h1>
          <p className="text-sm text-[#8c857b] leading-relaxed">
            Have questions about system setup, Redis caching, RBAC role permissions, or the PostgreSQL database schema? Reach out below or check out our developer resources.
          </p>
        </div>

        {/* 3 Quick Resource Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/docs"
            className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] hover:border-[#2563eb]/50 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/20 text-[#3b82f6] flex items-center justify-center group-hover:scale-105 transition-transform">
              <HelpCircle size={20} />
            </div>
            <h3 className="font-bold text-white text-base flex items-center justify-between">
              <span>Technical Documentation</span>
              <ArrowRight size={14} className="text-[#8c857b] group-hover:text-white transition-colors" />
            </h3>
            <p className="text-xs text-[#8c857b] leading-relaxed">
              Read comprehensive guides on JWT authentication, Redis 15m/1h cache invalidation, and database migrations.
            </p>
          </Link>

          <a
            href={`http://localhost:5001/api/docs?theme=${theme}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] hover:border-[#2563eb]/50 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-950/60 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Code2 size={20} />
            </div>
            <h3 className="font-bold text-white text-base flex items-center justify-between">
              <span>Interactive Swagger API</span>
              <ExternalLink size={14} className="text-[#8c857b] group-hover:text-white transition-colors" />
            </h3>
            <p className="text-xs text-[#8c857b] leading-relaxed">
              Test all REST endpoints in real time, view request/response schemas, and explore rate limits in Swagger UI.
            </p>
          </a>

          <a
            href="https://github.com/aky2004/Personal-Finance-Tracker/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] hover:border-[#2563eb]/50 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-[#4cc38a] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Github size={20} />
            </div>
            <h3 className="font-bold text-white text-base flex items-center justify-between">
              <span>GitHub Issue Tracker</span>
              <ExternalLink size={14} className="text-[#8c857b] group-hover:text-white transition-colors" />
            </h3>
            <p className="text-xs text-[#8c857b] leading-relaxed">
              Submit bug reports, feature requests, or inspect latest commit histories and release tags.
            </p>
          </a>
        </div>

        {/* Contact Form & Support Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Form */}
          <div className="lg:col-span-7 p-8 rounded-2xl bg-[#141210] border border-[#24211d] shadow-2xl">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#4cc38a]/20 text-[#4cc38a] mx-auto flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white">Message Received!</h3>
                <p className="text-xs text-[#8c857b] max-w-md mx-auto leading-relaxed">
                  Thank you for contacting inExpense Support. We have logged your request under ticket <span className="font-mono text-white font-bold">#IN-{Math.floor(1000 + Math.random() * 9000)}</span>.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', category: 'Technical Inquiry', message: '' });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#24211d] hover:bg-[#322e28] text-white text-xs font-bold transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white">Send a Message</h2>
                  <p className="text-xs text-[#8c857b] mt-1">
                    Fill out the form below and our team will get back to you shortly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8c857b]">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white placeholder-[#8c857b] focus:outline-none focus:border-[#2563eb] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8c857b]">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white placeholder-[#8c857b] focus:outline-none focus:border-[#2563eb] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#8c857b]">Topic / Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white focus:outline-none focus:border-[#2563eb] transition-colors font-mono"
                  >
                    <option value="Technical Inquiry">Technical Inquiry &amp; Architecture</option>
                    <option value="Bug Report">Bug Report &amp; Issue</option>
                    <option value="RBAC Question">RBAC &amp; Permission Access</option>
                    <option value="Feature Feedback">Feature Feedback &amp; Suggestions</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#8c857b]">Message *</label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe how we can help you with your inquiry..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1714] border border-[#24211d] text-xs text-white placeholder-[#8c857b] focus:outline-none focus:border-[#2563eb] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-[#2563eb]/20"
                >
                  <Send size={14} />
                  <span>Submit Message</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Info Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-[#3b82f6]" /> Engineering Response SLA
              </h3>
              <p className="text-xs text-[#8c857b] leading-relaxed">
                Our team responds to all technical and assignment inquiries within 24 hours. For urgent test runs, see the one-click demo credentials below.
              </p>
              <div className="p-3 rounded-xl bg-[#1a1714] border border-[#24211d] space-y-1.5 font-mono text-xs">
                <div className="text-[#8c857b]">Default Demo Credentials:</div>
                <div className="text-white">Admin: <span className="text-blue-400">admin@finance.com</span></div>
                <div className="text-white">User: <span className="text-[#4cc38a]">user@finance.com</span></div>
                <div className="text-white">Read-Only: <span className="text-amber-400">readonly@finance.com</span></div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-[#3b82f6]" /> Security &amp; Rate Limits
              </h3>
              <p className="text-xs text-[#8c857b] leading-relaxed">
                Contact submissions are guarded by rate limiters to prevent automated spam and protect application server resources.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Standard Compact Enterprise Footer (Consistent with Landing Page) */}
      <footer className="border-t border-[#24211d] bg-[#0b0908] py-8 sm:py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-7">
          {/* Top Row: Brand & Live System Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#24211d]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white font-black text-xs shadow-md shadow-[#2563eb]/30">
                in
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">
                in<span className="text-[#3b82f6]">Expense</span>
              </span>
              <span className="text-[#8c857b] text-xs hidden sm:inline">•</span>
              <span className="text-xs text-[#8c857b]">Personal Finance Tracker</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#141210] border border-[#24211d] text-[11px] font-mono text-[#8c857b]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cc38a] animate-pulse" />
                <span className="text-white">API Online</span>
                <span>•</span>
                <span className="text-[#3b82f6]">Redis Active</span>
              </div>
              <a
                href="http://localhost:5001/api/health"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-[#8c857b] hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>/api/health</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Compact 4-Column Directory */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
            {/* Column 1: Core Navigation */}
            <div className="space-y-2.5">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Platform</div>
              <ul className="space-y-1.5 text-[#8c857b]">
                <li>
                  <Link to={isAuthenticated ? '/dashboard' : '/login'} className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to={isAuthenticated ? '/transactions' : '/login'} className="hover:text-white transition-colors">
                    Transactions Ledger
                  </Link>
                </li>
                <li>
                  <Link to="/#faq" className="hover:text-white transition-colors">
                    Technical FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Developer & Specs */}
            <div className="space-y-2.5">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Documentation</div>
              <ul className="space-y-1.5 text-[#8c857b]">
                <li>
                  <Link to="/docs" className="hover:text-white transition-colors">
                    Docs &amp; Architecture
                  </Link>
                </li>
                <li>
                  <a
                    href={`http://localhost:5001/api/docs?theme=${theme}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>Swagger OpenAPI</span>
                    <ExternalLink size={10} />
                  </a>
                </li>
                <li>
                  <Link to="/docs" className="hover:text-white transition-colors">
                    RBAC &amp; Rate Limits
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div className="space-y-2.5">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Support</div>
              <ul className="space-y-1.5 text-[#8c857b]">
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Help Center &amp; Contact
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/aky2004/Personal-Finance-Tracker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink size={10} />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/aky2004/Personal-Finance-Tracker/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>Report an Issue</span>
                    <ExternalLink size={10} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Quick Demo Sign-in */}
            <div className="space-y-2.5">
              <div className="font-bold text-white uppercase tracking-wider text-[11px]">Demo Launch</div>
              <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                <button
                  onClick={() => handleGoToLoginWithCredentials('admin@finance.com', 'AdminPassword123!')}
                  className="text-left text-[#8c857b] hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="text-blue-400 font-bold">Admin</span>
                  <span>Login ↗</span>
                </button>
                <button
                  onClick={() => handleGoToLoginWithCredentials('user@finance.com', 'UserPassword123!')}
                  className="text-left text-[#8c857b] hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="text-[#4cc38a] font-bold">Standard User</span>
                  <span>Login ↗</span>
                </button>
                <button
                  onClick={() => handleGoToLoginWithCredentials('readonly@finance.com', 'ReadOnlyPassword123!')}
                  className="text-left text-[#8c857b] hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="text-amber-400 font-bold">Read-Only</span>
                  <span>Login ↗</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
