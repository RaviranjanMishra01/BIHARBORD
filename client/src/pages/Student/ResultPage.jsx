import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { CheckCircle2, XCircle, ArrowLeft, Printer, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

const ResultPage = () => {
  const { id } = useParams();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['studentResult', id],
    queryFn: async () => {
      const res = await api.get(`/students/results/${id}`);
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div className="w-48 h-48 bg-gray-200 dark:bg-gray-800 rounded-full mb-4"></div>
        <div className="w-56 h-8 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
        <div className="w-40 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Failed to load result details</h3>
        <Link to="/student/dashboard" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">
          Go Dashboard
        </Link>
      </div>
    );
  }

  const { test, score, percentage, status, timeTaken, answers = [] } = result;

  const correctCount = answers.filter(a => a.isCorrect).length;
  const skippedCount = answers.filter(a => a.isSkipped).length;
  const wrongCount = answers.length - correctCount - skippedCount;

  // Format time taken (in seconds) to mm:ss
  const formatTimeSpent = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  // Recharts Chart Data
  const chartData = [
    {
      name: 'Score',
      value: percentage,
      fill: status === 'passed' ? '#10b981' : '#f43f5e'
    }
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back button */}
      <div>
        <Link to="/student/tests" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to My Tests
        </Link>
      </div>

      {/* Main Scorecard container */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 dark:border-gray-850 pb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-850 dark:text-white leading-tight">
              {test?.title || 'Assessment Scorecard'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">Class 10 Bihar Board Assessment Sheet</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-transparent border border-gray-250 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Scorecard
            </button>
          </div>
        </div>

        {/* Circular Progress Gauge & Performance tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-4">
          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="90%"
                barSize={15}
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar minAngle={15} background clockWise={false} dataKey="value" />
              </RadialBarChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute text-center">
              <span className="block text-3xl font-extrabold font-sans leading-none">{percentage}%</span>
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mt-1 block">
                Total Score
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`p-4 rounded-2xl flex items-center gap-3.5 border ${
              status === 'passed'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-350'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-350'
            }`}>
              {status === 'passed' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-500 shrink-0" />
              )}
              <div>
                <h3 className="font-extrabold text-base leading-tight">
                  {status === 'passed' ? 'Passed Examination (उत्तीर्ण)' : 'Failed (अनुत्तीर्ण)'}
                </h3>
                <p className="text-xs text-opacity-80 mt-1">
                  {status === 'passed'
                    ? 'Congratulations! You performed excellent on this assessment.'
                    : 'Study hard and review the answers key. Try practicing weak chapters.'}
                </p>
              </div>
            </div>

            {/* General scoring metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="block text-gray-405 text-[10px] uppercase font-bold mb-1">Score Gained</span>
                <span className="text-sm font-bold text-gray-850 dark:text-white">{score} / {test?.totalMarks} Marks</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="block text-gray-405 text-[10px] uppercase font-bold mb-1">Time Elapsed</span>
                <span className="text-sm font-bold text-gray-850 dark:text-white">{formatTimeSpent(timeTaken)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Counter Blocks grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-b border-gray-150 dark:border-gray-850 py-6">
          <div className="text-center">
            <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full inline-block mb-1"></span>
            <span className="block text-xs text-gray-400 font-bold uppercase">Correct Answers</span>
            <span className="text-lg font-bold text-gray-850 dark:text-white mt-1 block">{correctCount} Questions</span>
          </div>
          <div className="text-center">
            <span className="w-3.5 h-3.5 bg-rose-500 rounded-full inline-block mb-1"></span>
            <span className="block text-xs text-gray-400 font-bold uppercase">Wrong Answers</span>
            <span className="text-lg font-bold text-gray-850 dark:text-white mt-1 block">{wrongCount} Questions</span>
          </div>
          <div className="text-center">
            <span className="w-3.5 h-3.5 bg-gray-300 dark:bg-gray-700 rounded-full inline-block mb-1"></span>
            <span className="block text-xs text-gray-400 font-bold uppercase">Skipped / Left</span>
            <span className="text-lg font-bold text-gray-850 dark:text-white mt-1 block">{skippedCount} Questions</span>
          </div>
        </div>

        {/* Solution Review Trigger footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="w-4 h-4 text-gray-450 shrink-0" />
            <span>Passed criteria is {test?.passingMarks}% score out of total marks.</span>
          </div>

          <Link
            to={`/student/results/${id}/review`}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" /> Review Solutions & Explanations
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResultPage;
