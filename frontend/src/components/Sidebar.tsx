import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  FileSpreadsheet,
  UploadCloud,
  Users,
  BookOpen,
  Shield,
  ShieldAlert,
  LogOut,
  Sun,
  Moon,
  ExternalLink,
  HelpCircle,
  FileText,
  User as UserIcon,
  Eye,
  Sliders,
  ChevronRight,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout, isAdmin, isReadOnly } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
      ? 'bg-[#2563eb]/15 text-[#3b82f6] border border-[#2563eb]/30 font-bold shadow-xs'
      : 'text-[#8c857b] hover:bg-[#1a1714] hover:text-white border border-transparent'
    }`;

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <aside className="w-64 h-screen sticky top-0 hidden md:flex flex-col justify-between bg-[#100e0c] border-r border-[#24211d] p-4 shrink-0 transition-colors">
      {/* 1. Brand Logo Header */}
      <div className="space-y-6">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-1 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white font-black text-xs shadow-md shadow-[#2563eb]/30 group-hover:scale-105 transition-transform">
            in
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white">
              in<span className="text-[#3b82f6]">Expense</span>
            </span>
            <span className="text-[10px] text-[#8c857b] -mt-1 font-mono">
              Finance Tracker
            </span>
          </div>
        </Link>

        {/* Read-Only Status Notice */}
        {isReadOnly && (
          <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-xl text-[11px] text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert size={14} className="text-amber-400" />
              <span>Read-Only Mode</span>
            </div>
            <p className="leading-tight opacity-90 text-[10px] text-[#8c857b]">
              Viewing transactions and analytics without mutation privileges.
            </p>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <NavLink to="/dashboard" className={navClass}>
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/accounts" className={navClass}>
            <Wallet size={17} />
            <span>Accounts</span>
          </NavLink>

          <NavLink to="/transactions" className={navClass}>
            <CreditCard size={17} />
            <span>Transactions</span>
          </NavLink>

          <NavLink to="/import" className={navClass}>
            <FileSpreadsheet size={17} />
            <span>Import CSV</span>
          </NavLink>

          {isAdmin && (
            <NavLink to="/admin/users" className={navClass}>
              <Users size={17} />
              <span>User Management</span>
            </NavLink>
          )}

          <div className="pt-3 pb-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8c857b]">
              Resources
            </span>
          </div>

          <NavLink to="/docs" className={navClass}>
            <FileText size={17} />
            <span>Documentation</span>
          </NavLink>

          <NavLink to="/contact" className={navClass}>
            <HelpCircle size={17} />
            <span>Help &amp; Support</span>
          </NavLink>

          <a
            href={`http://localhost:5001/api/docs?theme=${theme}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#8c857b] hover:bg-[#1a1714] hover:text-white border border-transparent transition-all"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={17} />
              <span>Swagger API</span>
            </div>
            <ExternalLink size={12} className="opacity-60" />
          </a>
        </nav>
      </div>

      {/* 2. Bottom User Profile & Controls (inExpense Obsidian Style) */}
      <div className="border-t border-[#24211d] pt-3 space-y-2">
        {user && (
          <div className="p-2.5 rounded-xl bg-[#141210] border border-[#24211d] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#2563eb]/20 text-[#3b82f6] flex items-center justify-center font-bold text-xs shrink-0 border border-[#2563eb]/30">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user.name}
                </p>
                <span
                  className={`inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${isAdmin
                    ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                    : isReadOnly
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-[#4cc38a] dark:border-emerald-800/60'
                    }`}
                >
                  {isAdmin ? <Shield size={9} /> : isReadOnly ? <Eye size={9} /> : <UserIcon size={9} />}
                  {user.role}
                </span>
              </div>
            </div>

            {/* Quick Actions: Theme Toggle & Logout */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="p-1.5 rounded-lg text-[#8c857b] hover:text-white hover:bg-[#1a1714] transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-[#3b82f6]" />}
              </button>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-[#ef6a57] hover:bg-[#1a1714] transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
