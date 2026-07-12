import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  Users,
  Database,
  CalendarDays,
  Percent,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  Flame,
  Award,
  Loader2,
  HelpCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const { data: statsResponse, isLoading, isError } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !statsResponse) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Failed to load admin stats</h3>
        <p className="text-sm text-gray-500 mt-1">Please check if the backend API server is running.</p>
      </div>
    );
  }

  const { counters, subjectAnalytics, weakSubjects, recentActivities, dailyAttempts, topStudents } = statsResponse;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-sans">Administrator Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of school metrics, exam analytics, and server logs</p>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-primary-50 dark:bg-primary-950/20 text-primary-650 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">Total Candidates</span>
            <span className="text-2xl font-black font-sans text-gray-850 dark:text-white">{counters.totalStudents}</span>
            <span className="text-[10px] font-bold text-success-600 block mt-0.5">{counters.activeStudents} Active this week</span>
          </div>
        </div>

        {/* Total Questions */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-secondary-50 dark:bg-secondary-950/20 text-secondary-655 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">Question Bank</span>
            <span className="text-2xl font-black font-sans text-gray-850 dark:text-white">{counters.totalQuestions} Qs</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Categorized by Chapter</span>
          </div>
        </div>

        {/* Total Tests */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-warning-50 dark:bg-warning-950/20 text-warning-650 rounded-xl">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">Exams Drafted</span>
            <span className="text-2xl font-black font-sans text-gray-850 dark:text-white">{counters.totalTests} Tests</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Including monthly mocks</span>
          </div>
        </div>

        {/* Pass Percentage */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-success-50 dark:bg-success-950/20 text-success-650 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">Avg Pass Rate</span>
            <span className="text-2xl font-black font-sans text-gray-850 dark:text-white">{counters.passPercentage}%</span>
            <span className="text-[10px] font-semibold text-gray-500 block mt-0.5">Average score: {counters.averagePercentage}%</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Active attempts Line Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-1.5"><TrendingUp className="w-5 h-5 text-primary-500" /> Daily Active Attempts</h3>
            <p className="text-xs text-gray-400">Total quiz completions recorded in last 7 days</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyAttempts} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="attempts" stroke="#2563eb" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject wise average scores Bar Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-1.5"><Award className="w-5 h-5 text-secondary-500" /> Subject Average Analytics</h3>
            <p className="text-xs text-gray-400">State average score percentages segmented by subject</p>
          </div>
          <div className="h-64">
            {subjectAnalytics.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No attempts logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAnalytics} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" />
                  <XAxis dataKey="subjectName" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="averagePercentage" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs & Weak Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Audit System Activity Logs */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-base flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-primary-550" /> Recent System Audit Logs
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-855 border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Operator User</th>
                  <th className="px-4 py-3">Logged Activity Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                {recentActivities.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(log.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-250">
                      {log.user ? log.user.fullName : 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-medium max-w-xs truncate">
                      {log.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Weak subjects & Top Students List */}
        <div className="space-y-6">
          {/* Weak Subjects list */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-danger-600 mb-4 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-danger-500" /> Weak Subjects Alert
            </h3>
            
            {weakSubjects.length === 0 ? (
              <p className="text-xs text-gray-500">All subjects averages are currently satisfying passing thresholds.</p>
            ) : (
              <div className="space-y-3">
                {weakSubjects.map((item, idx) => (
                  <div key={idx} className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{item.subjectName}</span>
                    <span className="font-extrabold text-rose-650">{item.averagePercentage}% Avg</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Students Leaderboard widget */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-success-650 mb-4 uppercase tracking-wider">
              🏆 Top Gaining Candidates
            </h3>

            {topStudents.length === 0 ? (
              <p className="text-xs text-gray-500">No scorecards logged yet.</p>
            ) : (
              <div className="space-y-3.5">
                {topStudents.map((student) => (
                  <div key={student.rank} className="flex justify-between items-center text-xs gap-3">
                    <div className="min-w-0">
                      <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">
                        #{student.rank}. {student.fullName}
                      </span>
                      <span className="text-[10px] text-gray-400 block truncate">{student.schoolName}</span>
                    </div>
                    <span className="font-extrabold text-primary-600 dark:text-primary-400 shrink-0">
                      {student.avgPercentage}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
