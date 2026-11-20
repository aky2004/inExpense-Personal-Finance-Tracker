import React, { useRef, useState, useMemo, memo } from 'react';
import { Transaction } from '../types';
import {
  formatINR,
  formatAmountWithCurrency,
  convertToINR,
} from '../utils/currency';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  Tag,
  CreditCard,
  Trash2,
  Edit2,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  transactions: Transaction[];
  itemHeight?: number;
  height?: number;
  isReadOnly: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
}

export const VirtualTransactionList: React.FC<Props> = memo(({
  transactions,
  itemHeight = 68,
  height = 540,
  isReadOnly,
  onEdit,
  onDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalCount = transactions.length;
  const totalHeight = totalCount * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const overscan = 5;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(height / itemHeight) + 2 * overscan;
    const end = Math.min(totalCount, start + visibleCount);
    const offset = start * itemHeight;

    return { startIndex: start, endIndex: end, offsetY: offset };
  }, [scrollTop, itemHeight, height, totalCount]);

  const visibleTransactions = useMemo(() => {
    return transactions.slice(startIndex, endIndex);
  }, [transactions, startIndex, endIndex]);

  if (totalCount === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-[#8c857b] bg-[#141210] border border-[#24211d] rounded-2xl">
        <p className="text-xs">No transactions match your current filters</p>
      </div>
    );
  }

  return (
    <div className="border border-[#24211d] rounded-2xl overflow-hidden bg-[#141210] shadow-2xl">
      <div className="px-5 py-3.5 bg-[#1a1714] border-b border-[#24211d] flex justify-between items-center text-xs font-bold text-[#8c857b] uppercase tracking-wider">
        <span>Virtualized Stream ({totalCount.toLocaleString()} total • {visibleTransactions.length} active in DOM at 60 FPS)</span>
        {isReadOnly && (
          <span className="flex items-center gap-1.5 text-amber-400 font-semibold normal-case">
            <ShieldAlert size={14} /> Read-Only Mode
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ height, overflowY: 'auto', position: 'relative' }}
        className="divide-y divide-[#24211d]"
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
            }}
          >
            {visibleTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              return (
                <div
                  key={tx.id}
                  style={{ height: itemHeight }}
                  className="px-5 flex items-center justify-between hover:bg-[#1a1714]/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isIncome
                          ? 'bg-[#4cc38a]/10 text-[#4cc38a] border-[#4cc38a]/20'
                          : isTransfer
                          ? 'bg-[#2563eb]/10 text-[#3b82f6] border-[#2563eb]/20'
                          : 'bg-[#ef6a57]/10 text-[#ef6a57] border-[#ef6a57]/20'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft size={17} />
                      ) : isTransfer ? (
                        <ArrowLeftRight size={17} />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                        <span>{tx.payee || tx.description || (isIncome ? 'Income' : isTransfer ? 'Transfer' : 'Expense')}</span>
                        {tx.account && (
                          <span className="text-[10px] text-[#8c857b] font-normal flex items-center gap-0.5">
                            • <CreditCard size={10} /> {tx.account}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#8c857b] mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar size={11} />
                          {tx.date}
                        </span>
                        {tx.category_name && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold border"
                            style={{
                              backgroundColor: `${tx.category_color || '#2563eb'}15`,
                              color: tx.category_color || '#3b82f6',
                              borderColor: `${tx.category_color || '#2563eb'}35`,
                            }}
                          >
                            <Tag size={9} />
                            {tx.category_name}
                          </span>
                        )}
                        {tx.tags && tx.tags.length > 0 && (
                          <span className="text-[9px] text-[#3b82f6] font-mono">
                            #{tx.tags[0]}
                            {tx.tags.length > 1 ? ` +${tx.tags.length - 1}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-xs sm:text-sm block ${
                          isIncome ? 'text-[#4cc38a]' : isTransfer ? 'text-[#3b82f6]' : 'text-[#ef6a57]'
                        }`}
                      >
                        {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                        {formatAmountWithCurrency(tx.amount, tx.currency || 'INR').formattedNative}
                      </span>
                      {tx.currency && tx.currency !== 'INR' && (
                        <span className="block text-[10px] text-[#8c857b] font-mono font-normal">
                          ≈ {formatINR(tx.amount_inr || convertToINR(tx.amount, tx.currency))}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(tx)}
                        disabled={isReadOnly}
                        title={isReadOnly ? 'Read-only users cannot edit' : 'Edit Transaction'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isReadOnly
                            ? 'opacity-25 cursor-not-allowed text-[#8c857b]'
                            : 'text-[#8c857b] hover:text-[#3b82f6] hover:bg-[#1a1714]'
                        }`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(tx.id)}
                        disabled={isReadOnly}
                        title={isReadOnly ? 'Read-only users cannot delete' : 'Delete Transaction'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isReadOnly
                            ? 'opacity-25 cursor-not-allowed text-[#8c857b]'
                            : 'text-[#8c857b] hover:text-[#ef6a57] hover:bg-[#1a1714]'
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

VirtualTransactionList.displayName = 'VirtualTransactionList';
