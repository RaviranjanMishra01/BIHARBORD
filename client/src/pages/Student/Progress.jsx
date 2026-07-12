import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Lightbulb,
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
import { motion } from 'framer-motion';

const Progress = () => {
  const { data: progressData, isLoading, isError } = useQuery({
    queryKey: ['studentProgressData'],
    queryFn: async () => {
      const res = await api.get('/students/progress');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <h3 className="font-bold text-lg">Drawing performance graphs...</h3>
      </div>
    );
  }

  if (isError || !progressData) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Failed to load progress details</h3>
        <p className="text-sm text-gray-500">Please attempt some tests first to populate graphs.</p>
      </div>
    );
  }

  const { history = [], subjectProgress = [] } = progressData;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-sans">Progress Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Detailed statistical visualization of your academic growth</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 shadow-sm space-y-4"
        >
          <div>
            <h3 className="font-bold text-base flex items-center gap-1.5 text-gray-850 dark:text-white">
              <TrendingUp className="w-5 h-5 text-primary-550" /> Test Score Growth
            </h3>
            <p className="text-xs text-gray-400">Score percentages over last 10 quiz attempts</p>
          </div>
          
          <div className="h-64">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No attempts logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800/50" />
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 shadow-sm space-y-4"
        >
          <div>
            <h3 className="font-bold text-base flex items-center gap-1.5 text-gray-850 dark:text-white">
              <BookOpen className="w-5 h-5 text-secondary-550" /> Subject-wise Performance
            </h3>
            <p className="text-xs text-gray-400">Average score percentages gained by subject</p>
          </div>
          
          <div className="h-64">
            {subjectProgress.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No subject progress logged.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectProgress} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800/50" />
                  <XAxis dataKey="subjectName" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="averageScore" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Subject Performance Breakdown Lists */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-6 border-b border-gray-100 dark:border-gray-850 pb-3 text-gray-850 dark:text-white">
          Course Catalog Checklist
        </h3>

        {subjectProgress.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">Attempt quizzes to populate chapter insights.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjectProgress.map((item, idx) => (
              <div key={idx} className="p-5 bg-gray-50/50 dark:bg-gray-855/20 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-850 dark:text-white">{item.subjectName}</span>
                  <span className="text-xs bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 font-bold px-3 py-1 rounded-full border border-primary-250/20">
                    {item.averageScore}% Avg
                  </span>
                </div>
                
                <div className="flex gap-4 text-xs text-gray-400 font-medium">
                  <span>Attempts: <strong className="text-gray-700 dark:text-gray-250">{item.testsAttempted}</strong></span>
                </div>

                {/* Database-backed Chapter Insight Card */}
                <div className="space-y-2.5 border-t border-gray-200 dark:border-gray-800 pt-3.5 text-xs">
                  {item.strongChapters && item.strongChapters.length > 0 ? (
                    <div className="flex items-start gap-1.5 text-success-600 font-semibold leading-normal">
                      <Lightbulb className="w-4 h-4 text-success-500 shrink-0 mt-0.5" />
                      <span>Strong: {item.strongChapters.join(', ')}</span>
                    </div>
                  ) : null}
                  {item.weakChapters && item.weakChapters.length > 0 ? (
                    <div className="flex items-start gap-1.5 text-danger-600 font-semibold leading-normal">
                      <AlertTriangle className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />
                      <span>Weak: {item.weakChapters.join(', ')}</span>
                    </div>
                  ) : null}
                  {(!item.strongChapters || item.strongChapters.length === 0) &&
                   (!item.weakChapters || item.weakChapters.length === 0) ? (
                    <div className="text-gray-400 text-[10px] italic">
                      No chapter performance insights logged yet. Pass or fail assessments to register chapters.
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;
