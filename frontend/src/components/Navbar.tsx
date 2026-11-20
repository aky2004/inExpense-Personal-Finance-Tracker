import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Github,
  LogOut,
  Shield,
  User as UserIcon,
  Eye,
  Database,
  ExternalLink,
} from 'lucide-react';
import { NotificationModal } from './NotificationModal';

export const Navbar: React.FC = () => {
  const { user, logout, isReadOnly, isAdmin } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const location = useLocation();

  // Determine active section name for inExpense breadcrumb header
  const getSectionTitle = () => {
    if (location.pathname.startsWith('/accounts')) return 'Accounts & Balances';
    if (location.pathname.startsWith('/transactions')) return 'Transactions Ledger';
    if (location.pathname.startsWith('/import')) return 'Import CSV Ledger';
    if (location.pathname.startsWith('/admin/users')) return 'User Administration';
    if (location.pathname.startsWith('/docs')) return 'Technical Documentation';
    if (location.pathname.startsWith('/contact')) return 'Help & Support';
    return 'Dashboard & Cash Flow';
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0b0908]/90 backdrop-blur-md border-b border-[#24211d] px-4 sm:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile Logo & Desktop Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile brand indicator */}
        <Link to="/dashboard" className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563eb] to-[#3b82f6] text-white flex items-center justify-center font-black text-xs shadow-md shadow-[#2563eb]/30">
            in
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">
            in<span className="text-[#3b82f6]">Expense</span>
          </span>
        </Link>

        {/* Desktop Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-[#8c857b]">
          <span>App</span>
          <span>/</span>
          <span className="text-white font-bold">
            {getSectionTitle()}
          </span>
        </div>
      </div>

      {/* Right: Telemetry & Actions */}
      <div className="flex items-center gap-3">
        {/* Live System Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#141210] border border-[#24211d] text-[11px] font-mono text-[#8c857b]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4cc38a] animate-pulse" />
          <span className="text-white">PostgreSQL ACID</span>
          <span>•</span>
          <span className="text-[#3b82f6]">Redis Active</span>
        </div>

        {/* Role Pill */}
        {user && (
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${isAdmin
              ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
              : isReadOnly
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-[#4cc38a] dark:border-emerald-800/60'
              }`}
          >
            {isAdmin ? <Shield size={11} /> : isReadOnly ? <Eye size={11} /> : <UserIcon size={11} />}
            <span>{user.role}</span>
          </span>
        )}

        {/* GitHub Repository Link */}
        <a
          href="https://github.com/aky2004/Personal-Finance-Tracker"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl text-[#8c857b] hover:text-white hover:bg-[#1a1714] border border-[#24211d] transition-colors"
          title="GitHub Repository"
        >
          <Github size={16} />
        </a>

        {/* Notifications Modal Trigger */}
        <button
          onClick={() => setIsNotificationOpen(true)}
          aria-label="Notifications"
          title="View Notifications & System Telemetry"
          className="relative p-2 rounded-xl text-[#8c857b] hover:text-white hover:bg-[#1a1714] border border-[#24211d] transition-colors cursor-pointer group"
        >
          <Bell size={16} className="group-hover:text-[#3b82f6] transition-colors" />
          {/* Notification Counter Badge */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563eb] opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#2563eb] text-white text-[9px] font-black items-center justify-center">
              2
            </span>
          </span>
        </button>

        {/* Logout (Mobile) */}
        <button
          onClick={logout}
          aria-label="Logout"
          className="md:hidden p-2 rounded-xl text-[#ef6a57] hover:bg-[#1a1714] transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        userRole={user?.role}
      />
    </header>
  );
};
