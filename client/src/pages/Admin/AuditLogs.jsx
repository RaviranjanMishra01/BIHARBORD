import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  Activity,
  Search,
  Loader2,
  HelpCircle,
  Clock,
  Laptop,
  MapPin,
  CircleDot
} from 'lucide-react';

const AuditLogs = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch audit logs query
  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminAuditLogs', search, page],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', {
        params: { search: search.trim(), page, limit }
      });
      return res.data.data;
    }
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sans">User Login Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review candidate session histories, IP locations, browser user-agents, and session durations
        </p>
      </div>

      {/* Filter Row */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // reset to page 1 on new search
          }}
          placeholder="Search by student name, email, or device..."
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-gray-500">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-bold">Failed to load system audit logs.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No session logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-855 border-b border-gray-150 dark:border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Browser & OS</th>
                  <th className="px-6 py-4">IP & Location</th>
                  <th className="px-6 py-4">Login Time</th>
                  <th className="px-6 py-4">Logout Time / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-xs">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                    {/* User profile */}
                    <td className="px-6 py-4">
                      <span className="block font-semibold text-sm text-gray-855 dark:text-white">
                        {log.user?.fullName || 'Deleted Account'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-400">{log.user?.email}</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          log.user?.role === 'admin'
                            ? 'bg-secondary-50 dark:bg-secondary-950/20 text-secondary-600'
                            : 'bg-primary-50 dark:bg-primary-950/20 text-primary-600'
                        }`}>
                          {log.user?.role}
                        </span>
                      </div>
                    </td>

                    {/* Device / User Agent */}
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-250">
                      <div className="flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{log.device || 'Unknown Web Browser'}</span>
                      </div>
                    </td>

                    {/* IP and Geolocation */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <span className="block font-bold">{log.ipAddress || '127.0.0.1'}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{log.location || 'Patna, Bihar'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Login Timestamp */}
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDateTime(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Logout Timestamp / Status */}
                    <td className="px-6 py-4">
                      {log.logoutAt ? (
                        <span className="text-gray-550 dark:text-gray-400 block">
                          Logged out at {formatDateTime(log.logoutAt)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/20 animate-pulse">
                          <CircleDot className="w-3.5 h-3.5 fill-emerald-600" />
                          Active Session
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Row */}
        {pages > 1 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-855 border-t border-gray-150 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Showing Page {page} of {pages} ({total} entries total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded text-xs font-bold disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1 border rounded text-xs font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
