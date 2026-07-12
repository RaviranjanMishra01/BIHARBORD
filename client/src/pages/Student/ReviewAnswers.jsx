import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';

const ReviewAnswers = () => {
  const { id } = useParams();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['studentResultReview', id],
    queryFn: async () => {
      const res = await api.get(`/students/results/${id}`);
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <h3 className="font-bold text-lg">Loading Solutions Sheet...</h3>
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Failed to load solutions</h3>
        <Link to={`/student/results/${id}`} className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">
          Go Back
        </Link>
      </div>
    );
  }

  const { test, answers = [] } = result;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back button */}
      <div>
        <Link to={`/student/results/${id}`} className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Scorecard
        </Link>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-850 dark:text-white leading-tight">
          Review Solutions: {test?.title}
        </h1>
        <p className="text-xs text-gray-500 mt-1">Examine incorrect answers and read explanations key below</p>
      </div>

      {/* Solutions List */}
      <div className="space-y-6">
        {answers.map((ans, index) => {
          const q = ans.question;
          
          if (!q) {
            return (
              <div key={index} className="p-4 bg-gray-100 rounded-xl text-xs text-gray-500">
                Question was deleted from Question Bank.
              </div>
            );
          }

          const isCorrect = ans.isCorrect;
          const isSkipped = ans.isSkipped;
          const chosenOption = ans.chosenOption;
          const correctOption = q.correctOption;

          return (
            <div
              key={q._id}
              className={`bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4 border-l-4 ${
                isSkipped
                  ? 'border-l-gray-300 dark:border-l-gray-700'
                  : isCorrect
                    ? 'border-l-emerald-500'
                    : 'border-l-rose-500'
              }`}
            >
              {/* Question Header Status */}
              <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider">
                <span className="text-gray-400">Question {index + 1}</span>
                
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] ${
                  isSkipped
                    ? 'bg-gray-100 dark:bg-gray-855 text-gray-600 dark:text-gray-400'
                    : isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450'
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455'
                }`}>
                  {isSkipped ? (
                    <>❔ SKIPPED</>
                  ) : isCorrect ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> CORRECT
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-500" /> INCORRECT
                    </>
                  )}
                </span>
              </div>

              {/* Question Text */}
              <h3 className="font-bold text-sm md:text-base text-gray-850 dark:text-white leading-relaxed">
                {q.questionText}
              </h3>

              {/* Options list with custom highlighting */}
              <div className="space-y-2 pt-2">
                {q.options.map((option, oIdx) => {
                  const charPrefix = String.fromCharCode(65 + oIdx);
                  const isCorrectKey = oIdx === correctOption;
                  const isChosenWrongKey = oIdx === chosenOption && !isCorrect;

                  // Styling determinations
                  let optStyle = 'bg-gray-50 dark:bg-gray-855 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300';
                  let charStyle = 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500';

                  if (isCorrectKey) {
                    optStyle = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-semibold';
                    charStyle = 'bg-emerald-600 border-emerald-650 text-white';
                  } else if (isChosenWrongKey) {
                    optStyle = 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-900 dark:text-rose-350';
                    charStyle = 'bg-rose-600 border-rose-650 text-white';
                  }

                  return (
                    <div
                      key={oIdx}
                      className={`p-3.5 rounded-xl border text-xs md:text-sm flex items-start gap-4 transition-all ${optStyle}`}
                    >
                      <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-extrabold border shrink-0 ${charStyle}`}>
                        {charPrefix}
                      </span>
                      <span className="flex-1 pt-0.5">{option}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {q.explanation && (
                <div className="bg-primary-50/50 dark:bg-primary-950/10 border border-primary-100 dark:border-primary-900/60 p-4 rounded-xl space-y-1.5 mt-4">
                  <h4 className="text-xs font-bold text-primary-750 dark:text-primary-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-primary-500" /> Explanation (हल):
                  </h4>
                  <p className="text-xs md:text-sm text-gray-650 dark:text-gray-300 leading-relaxed pl-5.5">
                    {q.explanation}
                  </p>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewAnswers;
