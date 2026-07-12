import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Flame,
  Trophy,
  Activity,
  Award,
  BookOpen,
  ChevronRight,
  ArrowRight,
  Bell,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const StudentDashboard = () => {
  // Fetch Dashboard Stats
  const { data: dashResponse, isLoading, isError } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const res = await api.get('/students/dashboard');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Metric Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
          ))}
        </div>
        {/* Main Grid Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[450px] bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
          <div className="h-[450px] bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !dashResponse) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-xl max-w-lg mx-auto">
        <HelpCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-850 dark:text-white">Connection Timeout</h3>
        <p className="text-sm text-gray-500 mt-2">We couldn't load your scorecard. Please verify MongoDB server is running.</p>
      </div>
    );
  }

  const { profile, rank, streak, todayTests, overallStats, recentResults, notifications } = dashResponse;

  return (
    <div className="space-y-8">
      {/* Welcome Banner Card with Glassmorphic Elements */}
      <div className="relative bg-gradient-to-tr from-primary-600 via-primary-700 to-secondary-700 rounded-3xl p-8 text-white overflow-hidden shadow-xl shadow-primary-500/10">
        {/* Abstract glowing shapes */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-secondary-500/20 rounded-full blur-2xl"></div>

        <div className="relative z-10 space-y-4 max-w-xl">
          <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 dark:bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            Bihar Board Matric Prep
          </span>
          <h1 className="text-3xl md:text-4xl font-black font-sans leading-tight">
            नमस्ते, {profile.fullName}!
          </h1>
          <p className="text-primary-100 text-sm md:text-base leading-relaxed font-medium">
            Your metrics are looking solid today. Jump into your daily practice assessments to maintain your streak and claim a higher rank.
          </p>
        </div>
      </div>

      {/* Metrics Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Streak Counter */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="p-4 bg-warning-50 dark:bg-warning-950/20 text-warning-600 rounded-2xl">
            <Flame className="w-7 h-7 fill-warning-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Activity Streak</span>
            <span className="text-2xl font-black text-gray-850 dark:text-white font-sans mt-0.5 block">{streak} Days</span>
          </div>
        </motion.div>

        {/* State Rank */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="p-4 bg-primary-50 dark:bg-primary-950/20 text-primary-600 rounded-2xl">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Bihar Rank</span>
            <span className="text-2xl font-black text-gray-850 dark:text-white font-sans mt-0.5 block">#{rank}</span>
          </div>
        </motion.div>

        {/* Average Percentage */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="p-4 bg-success-50 dark:bg-success-950/20 text-success-600 rounded-2xl">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Avg Score</span>
            <span className="text-2xl font-black text-gray-850 dark:text-white font-sans mt-0.5 block">{overallStats.avgScore}%</span>
          </div>
        </motion.div>

        {/* Tests Completed */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="p-4 bg-secondary-50 dark:bg-secondary-950/20 text-secondary-650 rounded-2xl">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Tests Taken</span>
            <span className="text-2xl font-black text-gray-850 dark:text-white font-sans mt-0.5 block">{overallStats.totalAttempted}</span>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Left is assessments/results, Right is announcements/badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Assessments list) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Daily assessments list */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-xl font-sans text-gray-850 dark:text-white">Active Tests Today</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Practice quizzes covering Class 10 Bihar Board syllabus</p>
              </div>
              <Link
                to="/student/tests"
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {todayTests.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-850/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-805">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-250">Assessments Complete</h4>
                <p className="text-xs text-gray-500 mt-1">Excellent! You have attempted all tests available for today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayTests.map((test) => (
                  <div
                    key={test._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50/50 dark:bg-gray-855/20 border border-gray-150 dark:border-gray-800 rounded-2xl gap-4 hover:border-primary-350 hover:bg-white dark:hover:bg-gray-900 transition-all shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 px-2.5 py-1 rounded-full border border-primary-200/20">
                          {test.subject?.name}
                        </span>
                        {test.chapter && (
                          <span className="text-[10px] font-semibold text-gray-450 truncate max-w-[200px]">
                            • {test.chapter?.name}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-gray-850 dark:text-white mt-2 leading-snug">{test.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 font-medium">
                        <span>⏱️ {test.duration} mins</span>
                        <span>• {test.questions?.length} Questions</span>
                        <span>• {test.totalMarks} Marks</span>
                      </div>
                    </div>

                    <Link
                      to={`/student/attempt/${test._id}`}
                      className="px-4.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 self-start sm:self-center shrink-0"
                    >
                      Start Assessment <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quiz Attempts */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-lg text-gray-850 dark:text-white mb-6">Recent Quiz Submissions</h3>
            
            {recentResults.length === 0 ? (
              <div className="text-center py-10 text-gray-450 text-xs">
                No exam attempts recorded yet. Begin by taking a test.
              </div>
            ) : (
              <div className="divide-y divide-gray-150 dark:divide-gray-800">
                {recentResults.map((result) => (
                  <div key={result._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm truncate text-gray-855 dark:text-white">{result.test?.title || 'Class Quiz'}</h4>
                      <span className="text-[10px] text-gray-400 block mt-1">
                        Attempted on {new Date(result.attemptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="block text-sm font-bold text-gray-800 dark:text-white">{result.score} Marks</span>
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-black uppercase ${
                          result.status === 'passed' ? 'text-success-600' : 'text-danger-600'
                        }`}>
                          {result.status === 'passed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {result.status}
                        </span>
                      </div>
                      <Link
                        to={`/student/results/${result._id}`}
                        className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
                        title="View Score Sheet"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notices & Achievements */}
        <div className="space-y-6">
          
          {/* Notice Board */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-lg text-gray-855 dark:text-white mb-5 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-550" /> Portal Announcements
            </h3>
            
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-500 py-4">No active announcements currently.</p>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif._id} className="p-4 bg-gray-50/50 dark:bg-gray-855/20 border border-gray-150 dark:border-gray-800 rounded-2xl">
                    <h4 className="font-bold text-xs text-gray-850 dark:text-white">{notif.title}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[9px] text-gray-400 font-medium mt-2 block">
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Badges Panel (Pure database-driven) */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-150 dark:border-gray-800/60 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-lg text-gray-855 dark:text-white mb-5 flex items-center gap-2">
              <Award className="w-5 h-5 text-warning-550" /> Earned Achievements
            </h3>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              {profile.badges && profile.badges.length > 0 ? (
                profile.badges.map((badge) => {
                  let emoji = '🏅';
                  if (badge === 'Pioneer') emoji = '🥇';
                  if (badge === 'Streak King') emoji = '🔥';
                  if (badge === 'Centurion') emoji = '💯';
                  return (
                    <div key={badge} className="space-y-1">
                      <div className="w-12 h-12 bg-warning-50 dark:bg-warning-950/20 text-warning-600 rounded-full flex items-center justify-center mx-auto text-xl border border-warning-250/20" title={badge}>
                        {emoji}
                      </div>
                      <span className="text-[10px] font-bold block text-gray-650 dark:text-gray-300">{badge}</span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 text-center py-6 text-gray-400 text-xs">
                  No badges unlocked yet. Score high in quizzes to earn them!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
