import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
  Database,
  Lock,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  Sun,
  Moon,
  Github,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Code2,
  Server,
  KeyRound,
  LogOut,
  User,
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  category: string;
}

export const DocsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<string>('what-is-inexpense');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Collapsible category accordion state
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    'getting-started': true,
    'rbac': true,
    'performance': true,
    'ledger': true,
    'analytics': true,
    'api-ref': true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const navItems = [
    {
      category: 'Getting started',
      catId: 'getting-started',
      items: [
        { id: 'what-is-inexpense', title: 'What is inExpense?' },
        { id: 'quick-start', title: 'Quick Start & Installation' },
        { id: 'tech-stack', title: 'Architecture & Tech Stack' },
        { id: 'database-schema', title: 'Database Schema & Migrations' },
      ],
    },
    {
      category: 'Authentication & RBAC',
      catId: 'rbac',
      items: [
        { id: 'rbac-overview', title: 'Role-Based Access Control (RBAC)' },
        { id: 'jwt-auth', title: 'JWT Claims & Auth Middleware' },
        { id: 'security-matrix', title: 'Permissions & Security Matrix' },
      ],
    },
    {
      category: 'Caching & Performance',
      catId: 'performance',
      items: [
        { id: 'redis-strategy', title: 'Redis In-Memory Caching (15m / 1h)' },
        { id: 'cache-invalidation', title: 'Cache Invalidation Lifecycle' },
        { id: 'rate-limiting', title: 'Tiered Rate Limiting' },
        { id: 'virtual-scrolling', title: 'Virtual Scrolling Engine (60 FPS)' },
      ],
    },
    {
      category: 'Transactions & Ledger',
      catId: 'ledger',
      items: [
        { id: 'transactions-crud', title: 'Transaction CRUD & Ledger' },
        { id: 'categories-management', title: 'Categories & Data Flow' },
        { id: 'search-filter', title: 'Search, Filter & Sorting' },
      ],
    },
    {
      category: 'Analytics & Visualizations',
      catId: 'analytics',
      items: [
        { id: 'dashboard-analytics', title: 'Dashboard & Recharts Suite' },
        { id: 'telemetry-headers', title: 'Live Cache Telemetry (X-Cache)' },
      ],
    },
    {
      category: 'API & Developer Reference',
      catId: 'api-ref',
      items: [
        { id: 'swagger-docs', title: 'Swagger / OpenAPI 3.0 Specs' },
        { id: 'demo-accounts', title: 'Seed Data & Demo Accounts' },
        { id: 'environment-vars', title: 'Environment Configuration' },
      ],
    },
  ];

  const filteredNavItems = navItems
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-[#0b0908] text-[#f2efe9] selection:bg-[#2563eb] selection:text-white font-sans flex flex-col">
      {/* 1. TOP DOCS NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0908]/90 border-b border-[#24211d] h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white font-black text-xs shadow-md shadow-[#2563eb]/30">
                in
              </div>
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#3b82f6] transition-colors">
                in<span className="text-[#3b82f6]">Expense</span>
              </span>
            </Link>
          </div>

          {/* Search Bar (Mockup with live filter) */}
          <div className="hidden sm:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c857b]"
              />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-12 py-1.5 rounded-xl bg-[#141210] border border-[#24211d] text-xs text-white placeholder-[#8c857b] focus:outline-none focus:border-[#2563eb] transition-colors font-mono"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#24211d] text-[#8c857b] border border-[#322e28]">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Links & Action */}
          <div className="flex items-center gap-3 text-xs">
            <a
              href={`http://localhost:5001/api/docs?theme=${theme}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141210] border border-[#24211d] text-[#8c857b] hover:text-white transition-colors"
            >
              <Code2 size={13} className="text-[#3b82f6]" />
              <span>Swagger UI</span>
              <ExternalLink size={10} />
            </a>

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
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#8c857b] hover:text-white hover:bg-[#1a1714] border border-[#24211d] transition-colors"
                  title="Switch user role or log in as another user"
                >
                  <User size={12} />
                  <span>Switch</span>
                </Link>
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

      {/* 2. THREE-COLUMN DOCS BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex">
        {/* LEFT SIDEBAR: Table of Contents / Categories */}
        <aside className="w-64 flex-shrink-0 hidden md:block py-8 pr-6 border-r border-[#24211d] sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="space-y-6">
            {filteredNavItems.map(group => (
              <div key={group.catId} className="space-y-1.5">
                <button
                  onClick={() => toggleCategory(group.catId)}
                  className="w-full flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider px-2 py-1 hover:text-[#3b82f6] transition-colors"
                >
                  <span>{group.category}</span>
                  {expandedCategories[group.catId] ? (
                    <ChevronDown size={14} className="text-[#8c857b]" />
                  ) : (
                    <ChevronRight size={14} className="text-[#8c857b]" />
                  )}
                </button>

                {expandedCategories[group.catId] && (
                  <div className="space-y-0.5 pl-1 pt-1">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveArticle(item.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                          activeArticle === item.id
                            ? 'bg-[#2563eb]/20 text-[#3b82f6] font-bold border border-[#2563eb]/40'
                            : 'text-[#8c857b] hover:text-white hover:bg-[#141210]'
                        }`}
                      >
                        <span className="truncate">{item.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 py-8 px-4 sm:px-8 lg:px-12 max-w-4xl min-w-0">
          {/* ARTICLE: What is inExpense? */}
          {activeArticle === 'what-is-inexpense' && (
            <article className="space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono text-[#3b82f6] bg-[#2563eb]/10 border border-[#2563eb]/20">
                  Getting Started • Overview
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  What is inExpense?
                </h1>
                <p className="text-base text-[#8c857b] leading-relaxed">
                  inExpense is an enterprise-grade full-stack wealth and expense management system. Built strictly according to the <strong>TechBridge</strong> technical specifications, it provides high-frequency financial tracking with sub-millisecond Redis cache invalidation, tiered rate limiting, and cryptographic Role-Based Access Control (RBAC).
                </p>
              </div>

              {/* Architectural Highlights Hero Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2563eb]/20 text-[#3b82f6] flex items-center justify-center font-bold">
                    <Zap size={16} />
                  </div>
                  <h3 className="font-bold text-white text-sm">PostgreSQL + Redis Caching</h3>
                  <p className="text-xs text-[#8c857b]">
                    Aggregations and categories cached for 15 minutes and 1 hour. Automated invalidation flushes Redis on every transaction CRUD mutation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/60 text-[#4cc38a] flex items-center justify-center font-bold">
                    <Shield size={16} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Three Strict RBAC Roles</h3>
                  <p className="text-xs text-[#8c857b]">
                    `admin`, `user`, and `read-only` roles. Evaluated via JWT payload claims and backend middleware, returning 403 Forbidden on unauthorized writes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center font-bold">
                    <Lock size={16} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Tiered Rate Limiting</h3>
                  <p className="text-xs text-[#8c857b]">
                    Configured via `express-rate-limit`: Auth routes (5 req/15m), Transactions (100 req/h), and Analytics (50 req/h).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/60 text-blue-400 flex items-center justify-center font-bold">
                    <Layers size={16} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Windowed Virtual Scrolling</h3>
                  <p className="text-xs text-[#8c857b]">
                    Windowed list calculations render only rows in visible viewports, keeping memory overhead minimal even with 50,000+ entries.
                  </p>
                </div>
              </div>

              {/* Code Snippet / Quick Launch */}
              <div className="space-y-3 pt-4">
                <h2 className="text-xl font-bold text-white">System Architecture Overview</h2>
                <p className="text-xs text-[#8c857b] leading-relaxed">
                  The application is partitioned into two isolated runtime stacks: an Express.js backend exposing RESTful endpoints with OpenAPI 3.0 specs, and a React 18 frontend leveraging Tailwind CSS, Recharts, and React Router v6.
                </p>

                <div className="rounded-xl bg-[#141210] border border-[#24211d] overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#1a1714] border-b border-[#24211d] flex items-center justify-between text-xs font-mono text-[#8c857b]">
                    <span>stack-architecture.md</span>
                    <button
                      onClick={() => copyToClipboard('React 18 -> Express.js API -> Redis Cache (15m/1h) -> PostgreSQL 15+', 'arch')}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      {copiedCode === 'arch' ? <Check size={12} className="text-[#4cc38a]" /> : <Copy size={12} />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-[#3b82f6] overflow-x-auto leading-relaxed">
{`Client Browser (React 18 + Vite + Tailwind CSS)
   │
   ├── REST Requests (with JWT Bearer tokens)
   ▼
Node.js + Express.js API Server (:5001)
   │
   ├── [Rate Limiter] (5 req/15m Auth, 100/hr Trans, 50/hr Analytics)
   ├── [JWT Auth & RBAC Middleware] (admin | user | read-only)
   ├── [Redis Service] (Hit/Miss cache layer with 15m/1h TTLs)
   │     └── HIT: Return sub-millisecond JSON (X-Cache: HIT)
   │     └── MISS: Query PostgreSQL, write to Redis, return (X-Cache: MISS)
   ▼
PostgreSQL Database (:5432)
   ├── users (id, email, password_hash, role, created_at)
   ├── categories (id, name, type, color, icon)
   └── transactions (id, user_id, category_id, amount, type, date, note)`}
                  </pre>
                </div>
              </div>
            </article>
          )}

          {/* ARTICLE: Quick Start */}
          {activeArticle === 'quick-start' && (
            <article className="space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono text-[#3b82f6] bg-[#2563eb]/10 border border-[#2563eb]/20">
                  Getting Started • Setup
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Quick Start & Local Run Guide
                </h1>
                <p className="text-sm text-[#8c857b] leading-relaxed">
                  Follow these instructions to start the backend and frontend dev servers with PostgreSQL and Redis.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xs font-mono">1</span>
                  Start Required Daemons
                </h3>
                <div className="rounded-xl bg-[#141210] border border-[#24211d] p-4 font-mono text-xs text-[#3b82f6] space-y-1">
                  <div># Start Redis</div>
                  <div className="text-white">brew services start redis</div>
                  <div className="pt-2 text-[#8c857b]"># Verify Redis responds with PONG</div>
                  <div className="text-white">redis-cli ping</div>
                </div>

                <h3 className="text-lg font-bold text-white flex items-center gap-2 pt-4">
                  <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xs font-mono">2</span>
                  Run Migrations & Seed Database
                </h3>
                <div className="rounded-xl bg-[#141210] border border-[#24211d] p-4 font-mono text-xs text-[#3b82f6] space-y-1">
                  <div>cd backend</div>
                  <div className="text-white">npm run migrate</div>
                  <div className="text-white">npm run seed</div>
                </div>

                <h3 className="text-lg font-bold text-white flex items-center gap-2 pt-4">
                  <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xs font-mono">3</span>
                  Start Backend & Frontend
                </h3>
                <div className="rounded-xl bg-[#141210] border border-[#24211d] p-4 font-mono text-xs text-[#3b82f6] space-y-2">
                  <div className="text-[#8c857b]"># Terminal 1: Backend</div>
                  <div className="text-white">cd backend && npm run dev</div>
                  <div className="text-[#8c857b] pt-2"># Terminal 2: Frontend</div>
                  <div className="text-white">cd frontend && npm run dev</div>
                </div>
              </div>
            </article>
          )}

          {/* ARTICLE: RBAC Overview */}
          {activeArticle === 'rbac-overview' && (
            <article className="space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono text-[#3b82f6] bg-[#2563eb]/10 border border-[#2563eb]/20">
                  Authentication & RBAC
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Role-Based Access Control (RBAC)
                </h1>
                <p className="text-sm text-[#8c857b] leading-relaxed">
                  The application implements a 3-tier Role-Based Access Control architecture backed by cryptographic JSON Web Tokens (JWT).
                </p>
              </div>

              {/* Roles Table */}
              <div className="rounded-xl bg-[#141210] border border-[#24211d] overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#1a1714] border-b border-[#24211d] text-[#8c857b]">
                    <tr>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Transactions CRUD</th>
                      <th className="p-3.5">Analytics</th>
                      <th className="p-3.5">User Management</th>
                      <th className="p-3.5">Client Behavior</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#24211d] text-white">
                    <tr>
                      <td className="p-3.5 font-bold text-blue-400">admin</td>
                      <td className="p-3.5 text-[#4cc38a]">Full (Own + All)</td>
                      <td className="p-3.5 text-[#4cc38a]">Full Access</td>
                      <td className="p-3.5 text-[#4cc38a]">Full (/admin/users)</td>
                      <td className="p-3.5 text-[#8c857b]">Unrestricted</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-[#4cc38a]">user</td>
                      <td className="p-3.5 text-[#4cc38a]">Own Records Only</td>
                      <td className="p-3.5 text-[#4cc38a]">Personal Analytics</td>
                      <td className="p-3.5 text-[#ef6a57]">Forbidden (403)</td>
                      <td className="p-3.5 text-[#8c857b]">Standard UI</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-amber-400">read-only</td>
                      <td className="p-3.5 text-[#ef6a57]">Read Only (403 on write)</td>
                      <td className="p-3.5 text-[#4cc38a]">View Only</td>
                      <td className="p-3.5 text-[#ef6a57]">Forbidden (403)</td>
                      <td className="p-3.5 text-amber-400">Buttons Disabled</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Implementation Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Middleware Enforcement</h3>
                <p className="text-xs text-[#8c857b] leading-relaxed">
                  Endpoints that perform mutations (`POST /api/transactions`, `PUT /api/transactions/:id`, `DELETE /api/transactions/:id`) are gated by the `requireCanMutate` middleware. When a `read-only` token attempts to submit an edit or delete, the backend rejects it with `403 Forbidden` and an explicit security message.
                </p>
              </div>
            </article>
          )}

          {/* ARTICLE: Redis Strategy */}
          {activeArticle === 'redis-strategy' && (
            <article className="space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono text-[#3b82f6] bg-[#2563eb]/10 border border-[#2563eb]/20">
                  Performance & Caching
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Redis Caching Architecture (15m & 1h TTL)
                </h1>
                <p className="text-sm text-[#8c857b] leading-relaxed">
                  Aggregated analytical calculations (monthly trends, category distributions, income/expense totals) are compute-heavy. Redis provides in-memory sub-millisecond retrieval with explicit automated invalidation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] space-y-2">
                  <div className="text-xs font-mono text-[#8c857b]">TTL: 900 seconds (15 min)</div>
                  <h3 className="text-sm font-bold text-white">Analytics Overview & Breakdown</h3>
                  <p className="text-xs text-[#8c857b]">
                    Keys: analytics:overview:[userId], analytics:categories:[userId], analytics:trends:[userId].
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141210] border border-[#24211d] space-y-2">
                  <div className="text-xs font-mono text-[#8c857b]">TTL: 3600 seconds (1 hour)</div>
                  <h3 className="text-sm font-bold text-white">Category Taxonomy Cache</h3>
                  <p className="text-xs text-[#8c857b]">
                    Keys: `categories:all`. Shared across sessions to avoid redundant database reads.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-lg font-bold text-white">Cache Invalidation Trigger</h3>
                <p className="text-xs text-[#8c857b] leading-relaxed">
                  Whenever any transaction is created, updated, or deleted, `invalidateUserAnalytics(userId)` is executed. This uses Redis pattern matching to atomically flush all cached analytic entries for that user, ensuring immediate data consistency on subsequent reads.
                </p>
              </div>
            </article>
          )}

          {/* ARTICLE: Fallback / Default for Other Topics */}
          {activeArticle !== 'what-is-inexpense' &&
            activeArticle !== 'quick-start' &&
            activeArticle !== 'rbac-overview' &&
            activeArticle !== 'redis-strategy' && (
              <article className="space-y-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono text-[#3b82f6] bg-[#2563eb]/10 border border-[#2563eb]/20">
                  Documentation Reference
                </div>
                <h1 className="text-3xl font-extrabold text-white">
                  {navItems.flatMap(g => g.items).find(i => i.id === activeArticle)?.title || 'Documentation Topic'}
                </h1>
                <p className="text-sm text-[#8c857b] leading-relaxed">
                  This section details the design, configuration, and implementation of this component in the inExpense application.
                </p>

                <div className="p-6 rounded-2xl bg-[#141210] border border-[#24211d] space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[#4cc38a]" />
                    <span className="font-bold text-white text-sm">Specification Compliance</span>
                  </div>
                  <p className="text-xs text-[#8c857b] leading-relaxed">
                    Designed according to the TechBridge assignment requirements. All endpoints are verified with unit tests and documented with OpenAPI 3.0 annotations available at `/api/docs`.
                  </p>
                  <div className="pt-2">
                    <a
                      href={`http://localhost:5001/api/docs?theme=${theme}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] transition-colors"
                    >
                      <span>Explore in Swagger UI</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </article>
            )}
        </main>

        {/* RIGHT SIDEBAR: "On this page" TOC */}
        <aside className="w-56 flex-shrink-0 hidden lg:block py-8 pl-6 border-l border-[#24211d] sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              On this page
            </div>
            <ul className="space-y-2 text-xs text-[#8c857b]">
              <li>
                <button
                  onClick={() => setActiveArticle('what-is-inexpense')}
                  className={`hover:text-white text-left transition-colors ${
                    activeArticle === 'what-is-inexpense' ? 'text-[#3b82f6] font-bold' : ''
                  }`}
                >
                  Overview & Purpose
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveArticle('tech-stack')}
                  className={`hover:text-white text-left transition-colors ${
                    activeArticle === 'tech-stack' ? 'text-[#3b82f6] font-bold' : ''
                  }`}
                >
                  Tech Stack & Architecture
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveArticle('rbac-overview')}
                  className={`hover:text-white text-left transition-colors ${
                    activeArticle === 'rbac-overview' ? 'text-[#3b82f6] font-bold' : ''
                  }`}
                >
                  RBAC Roles & Matrix
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveArticle('redis-strategy')}
                  className={`hover:text-white text-left transition-colors ${
                    activeArticle === 'redis-strategy' ? 'text-[#3b82f6] font-bold' : ''
                  }`}
                >
                  Redis Caching (15m/1h)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveArticle('quick-start')}
                  className={`hover:text-white text-left transition-colors ${
                    activeArticle === 'quick-start' ? 'text-[#3b82f6] font-bold' : ''
                  }`}
                >
                  Quick Start & Run
                </button>
              </li>
              <li>
                <a
                  href={`http://localhost:5001/api/docs?theme=${theme}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  Swagger OpenAPI <ExternalLink size={10} />
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DocsPage;
