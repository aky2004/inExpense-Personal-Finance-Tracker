import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { User, UserRole } from '../types';
import { Shield, Users, Mail, CheckCircle } from 'lucide-react';
import { formatINR } from '../utils/currency';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setMessage(`Updated account role to ${newRole}`);
      setTimeout(() => setMessage(null), 3000);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="text-[#3b82f6]" size={22} /> User Administration
          </h1>
          <p className="text-xs text-[#8c857b] mt-0.5">
            Admin console for account oversight and RBAC security role management
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-[#4cc38a]/10 border border-[#4cc38a]/30 text-[#4cc38a] rounded-xl text-xs flex items-center gap-2">
          <CheckCircle size={15} />
          <span>{message}</span>
        </div>
      )}

      <div className="bg-[#141210] border border-[#24211d] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 border-b border-[#24211d] flex items-center justify-between bg-[#1a1714]">
          <div className="flex items-center gap-2 font-bold text-xs text-white">
            <Users size={16} className="text-[#3b82f6]" />
            <span>Registered Accounts ({users.length})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a1714] text-[#8c857b] uppercase tracking-wider font-bold border-b border-[#24211d]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role (RBAC)</th>
                <th className="py-3 px-4 text-center">Transactions</th>
                <th className="py-3 px-4 text-right">Inflow / Outflow</th>
                <th className="py-3 px-4 text-center">Modify Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24211d]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8c857b]">
                    Loading accounts...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#1a1714]/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 text-[#8c857b] font-mono">
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} /> {u.email}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          u.role === 'admin'
                            ? 'bg-blue-950/40 text-blue-300 border-blue-800/60'
                            : u.role === 'read-only'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                            : 'bg-emerald-950/40 text-[#4cc38a] border-emerald-800/60'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-white">
                      {u.transaction_count || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs">
                      <span className="text-[#4cc38a] block">
                        +{formatINR(u.total_income || 0)}
                      </span>
                      <span className="text-[#ef6a57] block">
                        -{formatINR(u.total_expense || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="px-2.5 py-1 text-xs bg-[#0e0c0a] text-white border border-[#24211d] rounded-lg font-medium focus:outline-none focus:border-[#2563eb]"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="read-only">read-only</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
