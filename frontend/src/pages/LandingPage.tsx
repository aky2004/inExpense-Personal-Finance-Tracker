import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AuthModal } from '../components/AuthModal';
import api from '../api/client';
import {
  Wallet,
  ArrowRight,
  Zap,
  Shield,
  PieChart as PieIcon,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  Database,
  Lock,
  Sun,
  Moon,
  ExternalLink,
  CheckCircle2,
  User,
  Eye,
  Cpu,
  ArrowUpRight,
  Calendar,
  CreditCard,
  Sliders,
  Target,
  Github,
  Flame,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Activity,
  ChevronDown,
  CheckSquare,
  Users,
  LogOut,
} from 'lucide-react';

interface LandingPageProps {
  initialAuthModalOpen?: boolean;
  initialAuthModalMode?: 'login' | 'register';
  initialEmail?: string;
  initialPassword?: string;
  onModalClose?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  initialAuthModalOpen = false,
  initialAuthModalMode = 'login',
  initialEmail = '',
  initialPassword = '',
  onModalClose,
}) => {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Auth Modal State (Modal Form)
  const [authModalOpen, setAuthModalOpen] = useState(initialAuthModalOpen);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>(initialAuthModalMode);
  const [authModalEmail, setAuthModalEmail] = useState(initialEmail);
  const [authModalPassword, setAuthModalPassword] = useState(initialPassword);

  useEffect(() => {
    if (initialAuthModalOpen) {
      setAuthModalOpen(true);
      setAuthModalMode(initialAuthModalMode);
      if (initialEmail) setAuthModalEmail(initialEmail);
      if (initialPassword) setAuthModalPassword(initialPassword);
    }
  }, [initialAuthModalOpen, initialAuthModalMode, initialEmail, initialPassword]);

  const handleOpenLoginWithCredentials = (email: string = '', pass: string = '') => {
    setAuthModalEmail(email);
    setAuthModalPassword(pass);
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  // Active FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  // Interactive spending pace toggle
  const [spendingPaceMode, setSpendingPaceMode] = useState<'month' | 'avg'>('avg');

  const handleCloseModal = () => {
    setAuthModalOpen(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  const faqs = [
    {
      q: 'How does Redis caching work and when is it invalidated?',
      a: 'Analytical computations (monthly trends, category distributions, net cashflow) are cached in Redis for 15 minutes (900s), and the category list is cached for 1 hour (3600s). Whenever any transaction is created, updated, or deleted, the backend triggers invalidateUserAnalytics(userId) atomically, flushing Redis cache keys for that user to ensure immediate data freshness on subsequent reads.',
      badge: 'Redis 15m / 1h TTL',
    },
    {
      q: 'What are the three RBAC roles and what permissions do they have?',
      a: 'The system enforces 3 distinct roles: (1) Admin has global oversight to view and manage all transactions, categories, and promote/demote user roles at /admin/users. (2) Standard User can perform full CRUD on their own transactions and view personal analytics. (3) Read-Only has view-only access; write endpoints (POST, PUT, DELETE) are rejected with 403 Forbidden, and frontend mutation buttons are visually disabled.',
      badge: '3-Tier RBAC',
    },
    {
      q: 'What rate limits are enforced across the API?',
      a: 'To prevent brute-forcing and resource exhaustion, express-rate-limit enforces tiered windows: Authentication routes (/api/auth/*) allow 5 requests per 15 minutes; Transaction routes allow 100 requests per hour; and Analytics routes allow 50 requests per hour. Responses include standard rate limit headers.',
      badge: 'express-rate-limit',
    },
    {
      q: 'How does Windowed Virtual Scrolling prevent browser lag?',
      a: 'Rather than rendering thousands of DOM elements which slows down browsers, our virtual scrolling engine computes the current scroll container offset and renders only the ~12-15 rows currently visible in the user viewport. This allows the application to handle 50,000+ financial records smoothly at 60 FPS.',
      badge: 'Virtual DOM 60 FPS',
    },
    {
      q: 'How is transactional financial data secured in the database?',
      a: 'The backend connects to PostgreSQL using parameterized SQL queries ($1, $2, ...) to completely eliminate SQL injection vectors. Foreign keys and composite indexes on (user_id, date DESC) ensure relational integrity and high-throughput query execution. Passwords are salted and hashed using bcryptjs.',
      badge: 'PostgreSQL ACID',
    },
    {
      q: 'Where can I inspect and test the interactive API endpoints?',
      a: 'A complete OpenAPI 3.0 specification is available at http://localhost:5001/api/docs. Developers can test endpoints directly in the browser, review request and response schemas, and execute authenticated calls using JWT bearer tokens.',
      badge: 'Swagger OpenAPI 3.0',
    },
  ];


  return (
    <div className="min-h-screen bg-[#0b0908] text-[#f2efe9] selection:bg-[#2563eb] selection:text-white font-sans transition-colors duration-200">
      
      {/* 1. Header Navigation (inExpense Style - Streamlined) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0908]/90 border-b border-[#24211d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white font-black text-xs shadow-md shadow-[#2563eb]/30">
              in
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              in<span className="text-[#3b82f6]">Expense</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#8c857b]">
            <a href="#how-it-works" className="hover:text-[#3b82f6] transition-colors">
              How It Works
            </a>
            <a href="#faq" className="hover:text-[#3b82f6] transition-colors">
              FAQ
            </a>
            <Link to="/docs" className="hover:text-[#3b82f6] transition-colors">
              Docs
            </Link>
            <Link to="/contact" className="hover:text-[#3b82f6] transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
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
                  onClick={() => handleOpenLoginWithCredentials()}
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
              <button
                type="button"
                onClick={() => handleOpenLoginWithCredentials()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-all cursor-pointer"
              >
                <span>Login</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. SECTION: LIVE DEMO (Project Telemetry Showcase) */}
      <section id="live-demo" className="pt-16 pb-24 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-[#2563eb]/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#3b82f6] tracking-wider uppercase bg-[#2563eb]/10 border border-[#2563eb]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
            LIVE DEMO
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Click around a real account
          </h1>

          <p className="max-w-xl mx-auto text-sm text-[#8c857b] leading-relaxed">
            The demo opens a full account with seeded PostgreSQL transactions and live Redis cache invalidation. No signup needed.
          </p>

          {/* inExpense Browser Window Mockup */}
          <div className="pt-8 max-w-6xl mx-auto text-left">
            <div className="rounded-2xl border border-[#24211d] bg-[#141210] shadow-2xl overflow-hidden">
              {/* Browser bar */}
              <div className="h-10 px-4 bg-[#1a1714] border-b border-[#24211d] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef6a57]" />
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <div className="w-3 h-3 rounded-full bg-[#4cc38a]" />
                  <div className="ml-4 px-3 py-1 rounded-md bg-[#0b0908] text-[11px] font-mono text-[#8c857b] border border-[#24211d] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4cc38a]" />
                    http://localhost:5173/dashboard
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#8c857b]">
                  <span className="px-2 py-0.5 rounded bg-[#4cc38a]/10 text-[#4cc38a] border border-[#4cc38a]/30">
                    X-Cache: HIT (0.6ms)
                  </span>
                </div>
              </div>

              {/* App Layout Inside Window */}
              <div className="flex flex-col lg:flex-row">
                {/* Mini Sidebar matching our actual App Routes */}
                <div className="hidden lg:flex w-16 bg-[#100e0c] border-r border-[#24211d] py-5 flex-col items-center justify-between">
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-bold text-xs">
                      in
                    </div>
                    {/* Dashboard route icon */}
                    <button
                      type="button"
                      onClick={() => handleOpenLoginWithCredentials()}
                      title="Sign in to view live dashboard"
                      className="p-2 rounded-lg bg-[#2563eb]/20 text-[#3b82f6] cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Activity size={18} />
                    </button>
                    {/* Transactions route icon */}
                    <button
                      type="button"
                      onClick={() => handleOpenLoginWithCredentials()}
                      title="Sign in to view transactions ledger"
                      className="p-2 rounded-lg text-[#8c857b] hover:text-white cursor-pointer hover:scale-105 transition-transform"
                    >
                      <CreditCard size={18} />
                    </button>
                    {/* User Directory icon */}
                    <button
                      type="button"
                      onClick={() => handleOpenLoginWithCredentials('admin@finance.com', 'AdminPassword123!')}
                      title="Sign in as Admin to manage users"
                      className="p-2 rounded-lg text-[#8c857b] hover:text-white cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Users size={18} />
                    </button>
                    {/* Analytics icon */}
                    <div className="p-2 rounded-lg text-[#8c857b] hover:text-white">
                      <PieIcon size={18} />
                    </div>
                  </div>
                  <div className="text-[#8c857b] hover:text-white">
                    <Sliders size={18} />
                  </div>
                </div>

                {/* Dashboard Grid Content */}
                <div className="flex-1 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Card 1: Balance Trend */}
                  <div className="p-5 rounded-2xl bg-[#1a1714] border border-[#24211d] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#8c857b]">
                        <span>Balance trend</span>
                        <span className="px-2 py-0.5 rounded bg-[#24211d] text-white text-[10px]">Total ▾</span>
                      </div>
                      <Sliders size={13} className="text-[#8c857b]" />
                    </div>
                    <div>
                      <div className="text-2xl font-black font-mono text-white tracking-tight">
                        ₹1,45,250.00
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="text-[#8c857b] font-mono">POSTGRESQL SEEDED</span>
                        <span className="text-[#4cc38a] font-mono font-bold">+₹28,500 +2.1%</span>
                      </div>
                    </div>
                    {/* Visual Waveform SVG */}
                    <div className="h-20 w-full pt-2">
                      <svg viewBox="0 0 300 70" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,45 Q30,40 60,50 T120,30 T180,35 T240,25 T300,30 L300,70 L0,70 Z"
                          fill="url(#gradBlue)"
                        />
                        <path
                          d="M0,45 Q30,40 60,50 T120,30 T180,35 T240,25 T300,30"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2.5"
                        />
                        <circle cx="60" cy="50" r="3.5" fill="#ef6a57" />
                        <circle cx="120" cy="30" r="3.5" fill="#4cc38a" />
                        <circle cx="180" cy="35" r="3.5" fill="#ef6a57" />
                        <circle cx="240" cy="25" r="3.5" fill="#4cc38a" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 2: Cash Flow */}
                  <div className="p-5 rounded-2xl bg-[#1a1714] border border-[#24211d] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#8c857b] flex items-center gap-1.5">
                        <span>Cash flow</span>
                        <span className="text-[10px] text-[#8c857b]">ⓘ</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#8c857b]">
                        <ArrowUpRight size={13} />
                        <Sliders size={13} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black font-mono text-[#4cc38a] tracking-tight">
                          +₹98,750.00
                        </span>
                        <span className="text-[11px] font-mono text-[#4cc38a] font-bold">↗ +68.1% net</span>
                      </div>
                      <div className="text-[11px] text-[#8c857b] font-mono mt-0.5">CURRENT FISCAL CYCLE</div>
                    </div>

                    {/* Segmented Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="h-2 w-full rounded-full bg-[#24211d] flex overflow-hidden">
                        <div className="w-[68%] bg-[#4cc38a]" />
                        <div className="w-[32%] bg-[#ef6a57]" />
                      </div>
                      <div className="grid grid-cols-3 text-[10px] font-mono pt-1">
                        <div>
                          <span className="text-[#8c857b] block">INCOME</span>
                          <span className="text-[#4cc38a] font-bold">₹1,45,000.00</span>
                        </div>
                        <div>
                          <span className="text-[#8c857b] block">EXPENSES</span>
                          <span className="text-[#ef6a57] font-bold">₹46,250.00</span>
                        </div>
                        <div>
                          <span className="text-[#8c857b] block">SAVED</span>
                          <span className="text-[#4cc38a] font-bold">68.1%</span>
                        </div>
                      </div>
                    </div>

                    {/* Mini periods bar chart */}
                    <div className="flex items-end justify-between h-12 pt-1 border-t border-[#24211d]">
                      {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((m, i) => (
                        <div key={m} className="flex flex-col items-center gap-1">
                          <div
                            className="w-4 rounded bg-[#4cc38a]/80"
                            style={{ height: `${20 + i * 5}px` }}
                          />
                          <span className="text-[9px] text-[#8c857b]">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3: Spending Pace */}
                  <div className="p-5 rounded-2xl bg-[#1a1714] border border-[#24211d] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8c857b]">Spending pace</span>
                      <div className="flex items-center gap-1 bg-[#1a1714] border border-[#24211d] p-0.5 rounded-lg text-[10px]">
                        <button
                          onClick={() => setSpendingPaceMode('month')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            spendingPaceMode === 'month'
                              ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                              : 'text-[#8c857b] hover:text-[#0f172a] dark:hover:text-white'
                          }`}
                        >
                          vs last mo
                        </button>
                        <button
                          onClick={() => setSpendingPaceMode('avg')}
                          className={`px-2 py-0.5 rounded transition-all ${
                            spendingPaceMode === 'avg'
                              ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                              : 'text-[#8c857b] hover:text-[#0f172a] dark:hover:text-white'
                          }`}
                        >
                          vs 3-mo avg
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#8c857b]">Spent this period</div>
                      <div className="text-2xl font-black font-mono text-white tracking-tight">
                        ₹32,450.00
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#8c857b]">On track for ~₹46,000</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#4cc38a]/10 text-[#4cc38a] font-bold">
                          -12% vs last mo
                        </span>
                      </div>
                    </div>
                    <div className="h-16 pt-2">
                      <svg viewBox="0 0 300 60" className="w-full h-full">
                        <path d="M0,50 Q100,45 150,30" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                        <path d="M150,30 Q220,20 300,15" fill="none" stroke="#4cc38a" strokeWidth="2" strokeDasharray="4 4" />
                        <path d="M0,45 Q150,35 300,20" fill="none" stroke="#48423b" strokeWidth="1.5" />
                        <circle cx="150" cy="30" r="3.5" fill="#3b82f6" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#8c857b]">
                      <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#3b82f6]" /> This month</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#4cc38a] border-b border-dashed" /> Forecast</span>
                    </div>
                  </div>

                  {/* Card 4: Top Category Outflow */}
                  <div className="p-5 rounded-2xl bg-[#1a1714] border border-[#24211d] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8c857b]">Top Outflow: Housing</span>
                      <ArrowUpRight size={13} className="text-[#8c857b]" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-[#ef6a57]">-₹32,000.00</span>
                        <span className="text-[11px] text-[#8c857b] font-mono">22.1% of income</span>
                      </div>
                      <div className="text-[11px] text-[#8c857b] mt-1">Rent &amp; Lease • Monthly Reoccurring</div>
                    </div>
                  </div>

                  {/* Card 5: Total Expenses Structure */}
                  <div className="p-5 rounded-2xl bg-[#1a1714] border border-[#24211d] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8c857b]">Expenses structure</span>
                      <Sliders size={13} className="text-[#8c857b]" />
                    </div>
                    <div>
                      <div className="text-2xl font-black font-mono text-[#ef6a57]">-₹46,250.00</div>
                      <div className="text-[11px] text-[#4cc38a] font-bold mt-1">Healthy Outflow Coverage</div>
                    </div>
                  </div>

                  {/* Card 6: Savings Rate & Financial Health */}
                  <div className="p-5 rounded-2xl bg-[#1a1714] border border-[#24211d] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8c857b]">Savings Rate</span>
                      <ArrowUpRight size={13} className="text-[#8c857b]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#3b82f6] font-mono font-bold">
                        <Flame size={14} /> FINANCIAL HEALTH
                      </div>
                      <div className="text-xl font-black font-mono text-[#4cc38a] mt-1">64.7% Saved</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Launch inside Mockup */}
              <div className="p-4 bg-[#1a1714] border-t border-[#24211d] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-[#8c857b]">
                  Sign in with pre-configured demo credentials via authentication dialog:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenLoginWithCredentials('admin@finance.com', 'AdminPassword123!')}
                    className="px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold transition-all text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Launch Admin</span>
                    <ArrowRight size={12} />
                  </button>
                  <button
                    onClick={() => handleOpenLoginWithCredentials('user@finance.com', 'UserPassword123!')}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-[#24211d] dark:hover:bg-[#322e28] text-slate-900 dark:text-white font-bold transition-all text-xs cursor-pointer"
                  >
                    Standard User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: HOW IT WORKS (Project Flow Diagram) */}
      <section id="how-it-works" className="py-24 border-t border-[#24211d] bg-[#0e0c0a] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-left max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3b82f6] tracking-wider uppercase">
              <span>HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              From raw ledger entries to real-time analytics
            </h2>
            <p className="text-sm text-[#8c857b] leading-relaxed">
              Every financial transaction is validated against cryptographic RBAC claims, stored in PostgreSQL ACID tables, and cached with Redis for sub-millisecond retrieval.
            </p>
          </div>

          {/* Diagram Flow: Ledger -> Engine -> Settled Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: User Ledger Entries */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs font-bold text-[#8c857b] uppercase tracking-wider mb-2">
                User Ledger Entries
              </div>
              
              <div className="p-3.5 rounded-xl bg-[#141210] border border-[#24211d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#4cc38a]/20 text-[#4cc38a] flex items-center justify-center text-xs font-bold">
                    💼
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">TechBridge Corp Salary</div>
                    <div className="text-[10px] font-mono text-[#8c857b]">Category: Salary • Income</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#4cc38a]">+₹1,45,000.00</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141210] border border-[#24211d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#ef6a57]/20 text-[#ef6a57] flex items-center justify-center text-xs font-bold">
                    🏠
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Prestige Estates Rent</div>
                    <div className="text-[10px] font-mono text-[#8c857b]">Category: Housing • Expense</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#ef6a57]">-₹32,000.00</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141210] border border-[#24211d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#4cc38a]/20 text-[#4cc38a] flex items-center justify-center text-xs font-bold">
                    💻
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Global Client Contract ($500 USD)</div>
                    <div className="text-[10px] font-mono text-[#8c857b]">Category: Freelance • Auto-converted to INR</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#4cc38a]">+₹41,750.00</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141210] border border-[#24211d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#ef6a57]/20 text-[#ef6a57] flex items-center justify-center text-xs font-bold">
                    🛒
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Blinkit &amp; Zepto Essentials</div>
                    <div className="text-[10px] font-mono text-[#8c857b]">Category: Food • Expense</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#ef6a57]">-₹5,450.00</span>
              </div>

              <div className="text-[11px] text-[#8c857b] pt-1 italic">
                Actual relational records seeded in PostgreSQL personal_finance DB.
              </div>
            </div>

            {/* Center: Processing Engine */}
            <div className="lg:col-span-4">
              <div className="text-xs font-bold text-[#8c857b] uppercase tracking-wider mb-2 text-center lg:text-left">
                Processing &amp; Cache Engine
              </div>
              <div className="p-6 rounded-2xl bg-[#141210] border border-[#2563eb]/40 shadow-xl shadow-[#2563eb]/10 space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-bold text-xs">
                    in
                  </div>
                  <span className="font-extrabold text-sm text-white">Node.js + Redis Core</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-4 h-4 rounded-full bg-[#2563eb] flex items-center justify-center text-[10px] text-white">
                      ✓
                    </div>
                    <span>JWT Signature &amp; RBAC Verification</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-4 h-4 rounded-full bg-[#2563eb] flex items-center justify-center text-[10px] text-white">
                      ✓
                    </div>
                    <span>Parametric SQL (SQLi Guard)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-4 h-4 rounded-full bg-[#2563eb] flex items-center justify-center text-[10px] text-white">
                      ✓
                    </div>
                    <span>Atomic Redis Cache Invalidation</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-4 h-4 rounded-full bg-[#2563eb] flex items-center justify-center text-[10px] text-white">
                      ✓
                    </div>
                    <span>15-min In-Memory Aggregations</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#2563eb]/20 text-[11px] font-mono text-[#3b82f6] flex items-center justify-between">
                  <span>Latency: ~0.8ms</span>
                  <span className="text-[#4cc38a]">X-Cache: HIT</span>
                </div>
              </div>
            </div>

            {/* Right: Settled Analytics */}
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs font-bold text-[#8c857b] uppercase tracking-wider mb-2">
                Settled Analytics &amp; KPIs
              </div>
              <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Real-Time Overview</span>
                  <div className="w-5 h-5 rounded-full bg-[#4cc38a] flex items-center justify-center text-[11px] text-black font-black">
                    ✓
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-[#1a1714] border border-[#24211d]">
                    <div className="text-[11px] text-[#8c857b]">Net Cash Flow</div>
                    <div className="text-lg font-black font-mono text-white mt-0.5">+₹98,750.00</div>
                    <div className="text-[10px] text-[#4cc38a] font-mono mt-1">+68.1% Saved</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#1a1714] border border-[#24211d] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8c857b]">Inflow</span>
                      <span className="text-[#4cc38a] font-mono font-bold">+₹1,45,000</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8c857b]">Outflow</span>
                      <span className="text-[#ef6a57] font-mono font-bold">-₹46,250</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#24211d] text-center">
                  <div className="p-2 rounded-lg bg-[#1a1714]">
                    <span className="text-[10px] text-[#8c857b] block">Categories</span>
                    <span className="text-xs font-mono font-bold text-white">11 Active</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#1a1714]">
                    <span className="text-[10px] text-[#8c857b] block">Cache TTL</span>
                    <span className="text-xs font-mono font-bold text-[#3b82f6]">900s</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#1a1714]">
                    <span className="text-[10px] text-[#8c857b] block">Rate Limit</span>
                    <span className="text-xs font-mono font-bold text-[#4cc38a]">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: AUTOMATION & SECURITY (Architecture Engine) */}
      <section id="automation" className="py-24 border-t border-[#24211d] bg-[#0b0908] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-left max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3b82f6] tracking-wider uppercase">
              <span>SYSTEM ENGINE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              High performance built into every layer
            </h2>
            <p className="text-sm text-[#8c857b] leading-relaxed">
              Every request is governed by automated caching, RBAC role validation, and multi-tier rate limiting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Automated Cache Invalidation */}
            <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-5">
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#1a1714] border border-[#24211d] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8c857b]">POST /api/transactions</span>
                  <span className="text-[#8c857b]">→</span>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4cc38a]" /> PostgreSQL Write
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#4cc38a]/10 text-[#4cc38a] text-[10px] font-bold">
                    ACID Commit
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#1a1714] border border-[#24211d] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8c857b]">invalidateUserAnalytics(id)</span>
                  <span className="text-[#8c857b]">→</span>
                  <span className="text-[#3b82f6] font-bold flex items-center gap-1.5">
                    <RefreshCw size={12} /> Redis Flush
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2563eb]/20 text-[#3b82f6] text-[10px] font-bold">
                    Purged
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#1a1714] border border-[#24211d] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8c857b]">GET /api/analytics/overview</span>
                  <span className="text-[#8c857b]">→</span>
                  <span className="text-white font-bold">Fresh Re-compute</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#4cc38a]/10 text-[#4cc38a] text-[10px] font-bold">
                    Re-cached 15m
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap size={16} className="text-[#3b82f6]" /> Automated Cache Invalidation
                </h3>
                <p className="text-xs text-[#8c857b] mt-1 leading-relaxed">
                  Write once, invalidate atomically. Any transaction create, edit, or delete automatically purges Redis keys for that user, guaranteeing no stale read lag.
                </p>
              </div>
            </div>

            {/* Card 2: Cryptographic RBAC Guards */}
            <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-5">
              <div className="p-5 rounded-xl bg-[#1a1714] border border-[#24211d] space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#8c857b] uppercase text-[10px] font-bold w-12">WHEN</span>
                  <span className="px-2.5 py-1 rounded bg-[#24211d] text-white">Role === 'read-only'</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8c857b] uppercase text-[10px] font-bold w-12">THEN</span>
                  <span className="px-2.5 py-1 rounded bg-[#24211d] text-[#ef6a57]">requireCanMutate rejects with 403 Forbidden</span>
                </div>
                <div className="pt-2 text-[11px] text-[#4cc38a] flex items-center gap-1.5">
                  <Check size={13} /> Evaluated via signed JWT claims on every HTTP request
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield size={16} className="text-[#3b82f6]" /> Role-Based Access Control
                </h3>
                <p className="text-xs text-[#8c857b] mt-1 leading-relaxed">
                  Decide once how roles behave. Administrators oversee all users and global data; Standard users mutate personal records; Read-only users have mutation actions blocked.
                </p>
              </div>
            </div>

            {/* Card 3: Tiered Rate Limiting Protection */}
            <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-5">
              <div className="p-4 rounded-xl bg-[#1a1714] border border-[#24211d] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8c857b] flex items-center gap-1.5">🛡️ Auth Routes</span>
                  <span className="font-mono text-[#f59e0b] font-bold">5 requests / 15 mins</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8c857b] flex items-center gap-1.5">💳 Transaction Routes</span>
                  <span className="font-mono text-[#4cc38a] font-bold">100 requests / hour</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8c857b] flex items-center gap-1.5">📊 Analytics Routes</span>
                  <span className="font-mono text-[#3b82f6] font-bold">50 requests / hour</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock size={16} className="text-[#3b82f6]" /> Tiered Rate Limiting
                </h3>
                <p className="text-xs text-[#8c857b] mt-1 leading-relaxed">
                  Guards the API against brute-force attacks and resource exhaustion via `express-rate-limit` window thresholds.
                </p>
              </div>
            </div>

            {/* Card 4: Virtual Scrolling Window Engine */}
            <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-5">
              <div className="p-4 rounded-xl bg-[#1a1714] border border-[#24211d] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono pb-1 border-b border-[#24211d]">
                  <span className="text-[#8c857b]">Ledger Virtual Engine</span>
                  <span className="text-[#4cc38a] font-bold">60 FPS Smooth Scroll</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white">Dataset Capacity</span>
                  <span className="font-mono text-white">50,000+ rows</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white">Active DOM Nodes</span>
                  <span className="font-mono text-[#3b82f6]">Only visible rows</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-[#3b82f6]" /> Windowed Virtual Scrolling
                </h3>
                <p className="text-xs text-[#8c857b] mt-1 leading-relaxed">
                  Only the transactions currently inside the viewport are rendered in the DOM, eliminating browser lag and memory bloat.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom 2 Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#2563eb]/20 text-[#3b82f6]">
                <PieIcon size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">3 Recharts Visualizations</div>
                <div className="text-[11px] text-[#8c857b]">Category Pie, Monthly Trends Line, and Income vs Expense Bar charts styled in inExpense colors.</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#2563eb]/20 text-[#3b82f6]">
                <FileSpreadsheet size={16} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">OpenAPI 3.0 Documentation</div>
                <div className="text-[11px] text-[#8c857b]">Every REST endpoint documented with request schemas and interactive try-it-out mode at `/api/docs`.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: FAQ (Frequently Asked Questions) */}
      <section id="faq" className="py-24 border-t border-[#24211d] bg-[#0e0c0a] relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#3b82f6] tracking-wider uppercase bg-[#2563eb]/10 border border-[#2563eb]/20">
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Got questions? We've got answers.
            </h2>
            <p className="text-sm text-[#8c857b] leading-relaxed">
              Everything you need to know about our PostgreSQL ledger, Redis sub-millisecond caching, rate limits, and RBAC security.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-[#141210] border-[#2563eb]/50 shadow-xl shadow-[#2563eb]/5'
                      : 'bg-[#141210]/60 border-[#24211d] hover:border-[#38332c]'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 transition-colors"
                  >
                    <span className="font-bold text-sm sm:text-base text-white flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#2563eb] flex-shrink-0" />
                      {faq.q}
                    </span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="hidden sm:inline-block text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#24211d] text-slate-700 dark:text-[#8c857b] border border-slate-200 dark:border-[#322e28]">
                        {faq.badge}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-lg bg-[#1a1714] border border-[#24211d] flex items-center justify-center text-[#8c857b] transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-white' : ''
                        }`}
                      >
                        <ChevronDown size={15} />
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 text-xs sm:text-sm text-[#8c857b] leading-relaxed border-t border-[#24211d]/60 font-sans">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Help Footer inside FAQ */}
          <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2563eb]/20 text-[#3b82f6] flex items-center justify-center font-bold">
                ?
              </div>
              <div>
                <div className="text-white font-bold">Still have questions?</div>
                <div className="text-[#8c857b]">Check out our comprehensive technical documentation or contact support.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/docs"
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-[#24211d] dark:hover:bg-[#322e28] text-slate-900 dark:text-white font-bold transition-all text-xs"
              >
                Read Docs
              </Link>
              <Link
                to="/contact"
                className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold transition-all text-xs"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Standard Compact Enterprise Footer */}
      <footer className="border-t border-[#24211d] bg-[#0b0908] py-8 sm:py-10">
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

          {/* Compact 4-Column Directory (Standard 3 rows per column) */}
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
                  <a href="#faq" className="hover:text-white transition-colors">
                    Technical FAQ
                  </a>
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
                  type="button"
                  onClick={() => handleOpenLoginWithCredentials('admin@finance.com', 'AdminPassword123!')}
                  className="text-left text-[#8c857b] hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="text-blue-400 font-bold">Admin</span>
                  <span>Login ↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenLoginWithCredentials('user@finance.com', 'UserPassword123!')}
                  className="text-left text-[#8c857b] hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="text-[#4cc38a] font-bold">Standard User</span>
                  <span>Login ↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenLoginWithCredentials('readonly@finance.com', 'ReadOnlyPassword123!')}
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

      {/* Auth Modal (Modal Form) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseModal}
        defaultMode={authModalMode}
        initialEmail={authModalEmail}
        initialPassword={authModalPassword}
      />
    </div>
  );
};

export default LandingPage;