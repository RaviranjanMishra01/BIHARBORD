import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import { Trophy, Flame, ShieldAlert, Award, Star, Loader2, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Leaderboard = () => {
  const currentUserId = useSelector((state) => state.auth.user?._id);

  const { data: leaderboard = [], isLoading, isError } = useQuery({
    queryKey: ['studentLeaderboard'],
    queryFn: async () => {
      const res = await api.get('/students/leaderboard');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <h3 className="font-bold text-lg">Ranking Candidates...</h3>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Failed to load leaderboard</h3>
        <p className="text-sm text-gray-500">Please try again later.</p>
      </div>
    );
  }

  // Split podium (top 3) vs rest
  const podiumList = leaderboard.slice(0, 3);
  const restList = leaderboard.slice(3);

  // Helper for rank medallions
  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-sans">State Leaderboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time standings of Bihar Board Class 10 candidates based on average scores</p>
      </div>

      {/* Top 3 Podium (Visual block) */}
      {podiumList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
          {/* Rank 2 (left side of podium on desktop, but let's sort logically or place visually) */}
          {podiumList[1] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 text-center order-2 md:order-1 relative shadow-sm border-t-4 border-t-slate-300 md:h-[200px] flex flex-col justify-center"
            >
              <span className="text-3xl absolute top-4 left-4">{getMedalEmoji(2)}</span>
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3 text-slate-700 dark:text-slate-300 ring-2 ring-slate-300">
                {podiumList[1].fullName.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="font-bold text-sm truncate text-gray-850 dark:text-white">{podiumList[1].fullName}</h3>
              <p className="text-[10px] text-gray-400 truncate mt-1">{podiumList[1].schoolName}</p>
              <span className="text-base font-extrabold text-slate-700 dark:text-slate-300 mt-2 block">{podiumList[1].avgPercentage}%</span>
            </motion.div>
          )}

          {/* Rank 1 (highest podium, center) */}
          {podiumList[0] && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-900 rounded-2xl p-6 text-center order-1 md:order-2 relative shadow-lg border-t-4 border-t-amber-400 md:h-[230px] flex flex-col justify-center"
            >
              <span className="text-4xl absolute top-4 left-4">{getMedalEmoji(1)}</span>
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-3 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400 relative">
                {podiumList[0].fullName.slice(0, 2).toUpperCase()}
                <Star className="w-5 h-5 fill-amber-400 text-amber-400 absolute -top-1 -right-1" />
              </div>
              <h3 className="font-extrabold text-base truncate text-gray-850 dark:text-white">{podiumList[0].fullName}</h3>
              <p className="text-[10px] text-gray-400 truncate mt-1">{podiumList[0].schoolName}</p>
              <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-2 block">{podiumList[0].avgPercentage}%</span>
            </motion.div>
          )}

          {/* Rank 3 (right side, lowest podium) */}
          {podiumList[2] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 text-center order-3 relative shadow-sm border-t-4 border-t-orange-350 md:h-[180px] flex flex-col justify-center"
            >
              <span className="text-3xl absolute top-4 left-4">{getMedalEmoji(3)}</span>
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/20 rounded-full flex items-center justify-center font-bold text-base mx-auto mb-3 text-orange-700 dark:text-orange-300 ring-2 ring-orange-350">
                {podiumList[2].fullName.slice(0, 2).toUpperCase()}
              </div>
              <h3 className="font-bold text-sm truncate text-gray-850 dark:text-white">{podiumList[2].fullName}</h3>
              <p className="text-[10px] text-gray-400 truncate mt-1">{podiumList[2].schoolName}</p>
              <span className="text-base font-extrabold text-orange-600 dark:text-orange-450 mt-2 block">{podiumList[2].avgPercentage}%</span>
            </motion.div>
          )}
        </div>
      )}

      {/* Main standings board */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-150 dark:border-gray-850">
          <h3 className="font-bold text-lg">General Standings</h3>
        </div>

        {restList.length === 0 && podiumList.length <= 3 ? (
          <div className="p-6 text-center text-xs text-gray-450">
            No further candidates ranked currently. Perform assessments to qualify.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-850 border-b border-gray-150 dark:border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Candidate Name</th>
                  <th className="px-6 py-4">School & District</th>
                  <th className="px-6 py-4 text-center">Streak</th>
                  <th className="px-6 py-4 text-center">Exams Passed</th>
                  <th className="px-6 py-4 text-right">Avg Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-xs">
                {restList.map((student) => {
                  const isSelf = student.userId.toString() === currentUserId?.toString();
                  return (
                    <tr
                      key={student.userId}
                      className={`hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors ${
                        isSelf ? 'bg-primary-50/30 dark:bg-primary-950/10 font-bold' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-gray-550">
                        #{student.rank}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-600 dark:text-gray-400">
                            {student.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="block text-sm font-semibold">{student.fullName}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-primary-100 text-primary-750 px-1.5 py-0.5 rounded font-bold uppercase">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-medium truncate max-w-[200px]">{student.schoolName}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{student.district || 'Bihar'}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-warning-600">
                        <span className="inline-flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-warning-600" /> {student.streak}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold">
                        {student.passedCount} / {student.testsTaken}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-sm text-gray-850 dark:text-white">
                        {student.avgPercentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
