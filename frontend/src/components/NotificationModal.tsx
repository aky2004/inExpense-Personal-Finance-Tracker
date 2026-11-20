import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  Database,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'system' | 'performance' | 'security' | 'finance';
  unread: boolean;
  link?: string;
  linkText?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  userRole = 'user',
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'system'>('all');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Rate Limiting Guard Active',
      message:
        'Tiered rate limits enforced: Auth (5 req/15m), Transactions (100 req/hr), Analytics (50 req/hr) protecting your session against abuse.',
      timestamp: 'Just now',
      type: 'security',
      unread: true,
      link: '/docs',
      linkText: 'Inspect limits',
    },
    {
      id: 'notif-2',
      title: 'Redis Analytics Cache Synchronized',
      message:
        'Analytical queries and category breakdowns are cached in Redis with a 15-minute TTL. Automatic cache invalidation triggers on ledger mutations.',
      timestamp: '12m ago',
      type: 'performance',
      unread: true,
      link: '/dashboard',
      linkText: 'View metrics',
    },
    {
      id: 'notif-3',
      title: `Session Role Authenticated: ${userRole.toUpperCase()}`,
      message:
        userRole === 'read-only'
          ? 'You are signed in with read-only privileges. Ledger queries and analytical visualizations are accessible, while write mutations are restricted.'
          : userRole === 'admin'
          ? 'You have administrative privileges. You can manage all transactions, categories, and promote/demote user roles at /admin/users.'
          : 'Standard user session active. Full relational ledger CRUD, multi-currency accounts, and personalized analytics are enabled.',
      timestamp: '45m ago',
      type: 'security',
      unread: false,
    },
    {
      id: 'notif-4',
      title: 'Base Currency Normalized to INR (₹)',
      message:
        'Indian Rupee (INR) is set as your primary ledger valuation base. Foreign transactions (USD, EUR, GBP) convert automatically at live exchange rates.',
      timestamp: '2h ago',
      type: 'finance',
      unread: false,
      link: '/accounts',
      linkText: 'Check balances',
    },
    {
      id: 'notif-5',
      title: 'PostgreSQL Relational Ledger Ready',
      message:
        'All account balances, transfers, and tagged transactions are safely committed with ACID transactional integrity.',
      timestamp: '1d ago',
      type: 'system',
      unread: false,
    },
  ]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => n.unread).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.unread;
    if (filter === 'system') return n.type === 'system' || n.type === 'security' || n.type === 'performance';
    return true;
  });

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const toggleReadStatus = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'security':
        return <Shield size={16} className="text-[#3b82f6]" />;
      case 'performance':
        return <Zap size={16} className="text-[#4cc38a]" />;
      case 'finance':
        return <TrendingUp size={16} className="text-[#06b6d4]" />;
      case 'system':
      default:
        return <Database size={16} className="text-[#f59e0b]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-6 p-3 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal / Slide Panel */}
      <div className="relative w-full max-w-md bg-[#141210] border border-[#24211d] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[88vh] z-10 transition-all mt-14 sm:mt-12 mr-0 sm:mr-2">
        {/* Header */}
        <div className="p-4 border-b border-[#24211d] flex items-center justify-between bg-[#141210]/95 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2563eb]/15 text-[#3b82f6] flex items-center justify-center border border-[#2563eb]/30">
              <Bell size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#2563eb] text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8c857b]">System telemetries &amp; activity updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title="Mark all as read"
                className="p-1.5 rounded-lg text-[#8c857b] hover:text-white hover:bg-[#1a1714] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck size={14} className="text-[#3b82f6]" />
                <span className="hidden sm:inline text-[11px]">Mark read</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="p-1.5 rounded-lg text-[#8c857b] hover:text-white hover:bg-[#1a1714] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-[#24211d] bg-[#0e0c0a] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#2563eb] text-white'
                  : 'text-[#8c857b] hover:text-white hover:bg-[#1a1714]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-[#2563eb] text-white'
                  : 'text-[#8c857b] hover:text-white hover:bg-[#1a1714]'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filter === 'system'
                  ? 'bg-[#2563eb] text-white'
                  : 'text-[#8c857b] hover:text-white hover:bg-[#1a1714]'
              }`}
            >
              System &amp; Security
            </button>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              title="Clear all notifications"
              className="text-[10px] font-semibold text-[#8c857b] hover:text-[#ef6a57] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={11} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#24211d] p-2 space-y-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1a1714] border border-[#24211d] text-[#8c857b] flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} className="text-[#4cc38a]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">All caught up!</p>
                <p className="text-xs text-[#8c857b]">
                  {filter === 'unread'
                    ? 'No unread notifications at the moment.'
                    : 'No notifications matching this filter.'}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map(item => (
              <div
                key={item.id}
                onClick={() => toggleReadStatus(item.id)}
                className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 group relative ${
                  item.unread
                    ? 'bg-[#1a1714]/80 hover:bg-[#1a1714] border border-[#2563eb]/30 shadow-xs'
                    : 'hover:bg-[#1a1714]/40 border border-transparent opacity-85'
                }`}
              >
                {/* Unread indicator dot */}
                {item.unread && (
                  <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-[#2563eb] ring-4 ring-[#2563eb]/20 animate-pulse" />
                )}

                {/* Type Icon */}
                <div className="w-8 h-8 rounded-xl bg-[#0b0908] border border-[#24211d] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#3b82f6] transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[11.5px] text-[#8c857b] leading-relaxed line-clamp-3">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[10px] text-[#8c857b]">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={10} />
                      {item.timestamp}
                    </span>

                    {item.link && (
                      <Link
                        to={item.link}
                        onClick={onClose}
                        className="text-[#3b82f6] hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <span>{item.linkText || 'Details'}</span>
                        <ArrowRight size={10} />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Dismiss action */}
                <button
                  onClick={e => removeNotification(item.id, e)}
                  title="Dismiss notification"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#8c857b] hover:text-[#ef6a57] hover:bg-[#24211d] transition-all shrink-0 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#24211d] bg-[#0e0c0a] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#8c857b]">
            Telemetry channel: <span className="font-mono text-white">live-sse</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[#1a1714] hover:bg-[#24211d] border border-[#24211d] text-white text-[11px] font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
