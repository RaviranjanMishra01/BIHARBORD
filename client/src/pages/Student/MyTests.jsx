import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { GraduationCap, Calendar, CheckCircle2, ChevronRight, HelpCircle, FileClock } from 'lucide-react';

const MyTests = () => {
  const [activeTab, setActiveTab] = useState('available');

  const { data: testsData, isLoading, isError } = useQuery({
    queryKey: ['studentTests'],
    queryFn: async () => {
      const res = await api.get('/tests/student');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 border-b pb-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-28 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Failed to load tests</h3>
        <p className="text-sm text-gray-500 mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  const { available = [], upcoming = [], completed = [] } = testsData || {};

  const getListByTab = () => {
    switch (activeTab) {
      case 'upcoming': return upcoming;
      case 'completed': return completed;
      default: return available;
    }
  };

  const currentList = getListByTab();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sans">Exam Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Browse and attempt mock tests aligned with Bihar Board Syllabus</p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'available'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Available Tests ({available.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'upcoming'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Upcoming Tests ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'completed'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Completed Tests ({completed.length})
        </button>
      </div>

      {/* Content Lists */}
      {currentList.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl">
          <FileClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-gray-850 dark:text-white">No tests found</h3>
          <p className="text-sm text-gray-500 mt-1">There are no tests in this category at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentList.map((test) => (
            <div
              key={test._id}
              className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all border-l-4 border-l-primary-500"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 px-2.5 py-0.5 rounded">
                    {test.subject?.name}
                  </span>
                  {test.chapter && (
                    <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-650 dark:text-gray-300 px-2 py-0.5 rounded max-w-[150px] truncate">
                      {test.chapter?.name}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-gray-850 dark:text-white mb-2 leading-tight">{test.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{test.description}</p>
                
                {/* Meta details */}
                <div className="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl text-center text-xs text-gray-650 dark:text-gray-300 mb-6">
                  <div>
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">Duration</span>
                    <span className="font-bold">{test.duration} Min</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">Questions</span>
                    <span className="font-bold">{test.questions?.length || 0} Qs</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">Total Marks</span>
                    <span className="font-bold">{test.totalMarks} Pts</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons based on status */}
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-850 pt-4 gap-4">
                {activeTab === 'available' && (
                  <>
                    <span className="text-[11px] text-gray-500 font-medium">⏱️ Negative marking: {test.negativeMarking ? 'Yes' : 'No'}</span>
                    <Link
                      to={`/student/attempt/${test._id}`}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/10 hover:shadow-lg transition-all"
                    >
                      Start Test
                    </Link>
                  </>
                )}

                {activeTab === 'upcoming' && (
                  <>
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary-500" />
                      Starts: {new Date(test.scheduledFor).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="px-3 py-1 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 rounded-full text-[10px] font-bold uppercase">
                      Scheduled
                    </span>
                  </>
                )}

                {activeTab === 'completed' && (
                  <>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Your Performance</span>
                      <span className={`text-sm font-bold flex items-center gap-1 ${
                        test.userResult?.status === 'passed' ? 'text-success-650' : 'text-danger-650'
                      }`}>
                        {test.userResult?.score} Pts ({test.userResult?.status === 'passed' ? 'Passed' : 'Failed'})
                      </span>
                    </div>
                    <Link
                      to={`/student/results/${test.userResult?._id || test.userResult?.id || ''}`} // wait, populate result id if it returns
                      className="px-3.5 py-1.5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      Review Answers <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTests;
