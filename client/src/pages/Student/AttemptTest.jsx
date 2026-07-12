import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';
import {
  Timer,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Fullscreen,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const AttemptTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // format: { questionId: optionIndex }
  const [markedForReview, setMarkedForReview] = useState({}); // format: { questionId: boolean }
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerRef = useRef(null);

  // Fetch Test Details (clean paper: correct answers hidden)
  const { data: test, isLoading, isError } = useQuery({
    queryKey: ['attemptTest', id],
    queryFn: async () => {
      const res = await api.get(`/tests/${id}`);
      return res.data.data;
    },
    refetchOnWindowFocus: false
  });

  // Local storage auto-save recovery
  useEffect(() => {
    if (test) {
      const localAnswers = localStorage.getItem(`answers_${id}`);
      const localMarked = localStorage.getItem(`marked_${id}`);
      if (localAnswers) {
        try { setSelectedAnswers(JSON.parse(localAnswers)); } catch (e) {}
      }
      if (localMarked) {
        try { setMarkedForReview(JSON.parse(localMarked)); } catch (e) {}
      }

      // Initialize Timer (Check if time is already stored, otherwise set fresh duration)
      const storedTimeLeft = localStorage.getItem(`time_left_${id}`);
      if (storedTimeLeft) {
        setTimeLeft(parseInt(storedTimeLeft));
      } else {
        setTimeLeft(test.duration * 60);
      }
    }
  }, [test, id]);

  // Full Screen Request
  const requestFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Submit test handler
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Parse answers to backend format
    const formattedAnswers = test.questions.map(q => ({
      questionId: q._id,
      chosenOption: selectedAnswers[q._id] !== undefined ? selectedAnswers[q._id] : null
    }));

    try {
      const timeSpent = (test.duration * 60) - (timeLeft || 0);
      const res = await api.post(`/tests/${id}/submit`, {
        answers: formattedAnswers,
        timeTaken: Math.max(1, timeSpent)
      });

      // Clear local storage exam state cache
      localStorage.removeItem(`answers_${id}`);
      localStorage.removeItem(`marked_${id}`);
      localStorage.removeItem(`time_left_${id}`);

      toast.success('Exam submitted successfully!');
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Redirect to Result Page
      navigate(`/student/results/${res.data.data.resultId}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Submission failed. Please check internet connection.');
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  }, [test, id, selectedAnswers, timeLeft, isSubmitting, navigate, toast]);

  // Timer Countdown Effect
  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      clearInterval(timerRef.current);
      toast.warning('Time is up! Submitting exam...', 5000);
      handleSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const nextTime = prev - 1;
        localStorage.setItem(`time_left_${id}`, nextTime.toString());
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, id, handleSubmit, toast]);

  // Save selected option locally
  const selectOption = (questionId, optionIdx) => {
    const updated = { ...selectedAnswers, [questionId]: optionIdx };
    setSelectedAnswers(updated);
    localStorage.setItem(`answers_${id}`, JSON.stringify(updated));
  };

  // Toggle Marked for review
  const toggleMarkedReview = (questionId) => {
    const updated = { ...markedForReview, [questionId]: !markedForReview[questionId] };
    setMarkedForReview(updated);
    localStorage.setItem(`marked_${id}`, JSON.stringify(updated));
  };

  // Clear choice
  const clearChoice = (questionId) => {
    const updated = { ...selectedAnswers };
    delete updated[questionId];
    setSelectedAnswers(updated);
    localStorage.setItem(`answers_${id}`, JSON.stringify(updated));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <h3 className="font-bold text-lg">Loading Exam Paper...</h3>
        <p className="text-sm text-gray-500">Retrieving questions and rules.</p>
      </div>
    );
  }

  if (isError || !test) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Failed to load exam details</h3>
        <button onClick={() => navigate('/student/tests')} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const currentQuestion = test.questions[currentIdx];
  const qId = currentQuestion._id;

  // Formatting remaining time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft !== null && timeLeft <= 120; // 2 minutes or less

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative min-h-[80vh]">
      {/* Alert if not full screen */}
      {!isFullscreen && (
        <div className="lg:absolute lg:-top-16 lg:left-0 lg:right-0 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-xl p-3 flex items-center justify-between text-xs text-yellow-800 dark:text-yellow-400 mb-4 z-50">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-650 shrink-0" />
            For the best exam experience and to prevent distractions, please trigger Full Screen Mode.
          </span>
          <button
            onClick={requestFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-750 text-white font-bold rounded-lg shrink-0 transition-colors"
          >
            <Fullscreen className="w-3.5 h-3.5" /> Fullscreen
          </button>
        </div>
      )}

      {/* Left Area: Exam Question Workstation */}
      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        
        {/* Exam Workstation Header */}
        <div className="flex justify-between items-center border-b border-gray-150 dark:border-gray-850 pb-4 mb-6 gap-4">
          <div>
            <h2 className="font-extrabold text-base md:text-lg text-gray-850 dark:text-white truncate max-w-[280px] md:max-w-md">
              {test.title}
            </h2>
            <span className="text-xs text-gray-400">Class 10 Bihar Board Assessment</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Timer Banner */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold tracking-wider ${
              isLowTime
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 animate-pulse'
                : 'bg-gray-50 dark:bg-gray-850 border-gray-200 dark:border-gray-800 text-gray-650 dark:text-gray-300'
            }`}>
              <Timer className={`w-4 h-4 ${isLowTime ? 'text-rose-500' : 'text-gray-500'}`} />
              <span>{timeLeft !== null ? formatTime(timeLeft) : '00:00'}</span>
            </div>
            
            {/* Submit Shortcut */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-success-650 hover:bg-success-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-success-500/10 hover:shadow-lg transition-all"
            >
              Submit Exam
            </button>
          </div>
        </div>

        {/* Question Panel */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
            <span>Question {currentIdx + 1} of {test.questions.length}</span>
            <button
              onClick={() => toggleMarkedReview(qId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                markedForReview[qId]
                  ? 'bg-secondary-50 dark:bg-secondary-950/30 border-secondary-200 dark:border-secondary-900 text-secondary-600 dark:text-secondary-400'
                  : 'bg-transparent border-gray-200 dark:border-gray-800 text-gray-500'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${markedForReview[qId] ? 'fill-secondary-500 text-secondary-500' : ''}`} />
              {markedForReview[qId] ? 'Marked' : 'Mark For Review'}
            </button>
          </div>

          <h3 className="text-base font-bold text-gray-850 dark:text-white leading-relaxed">
            {currentQuestion.questionText}
          </h3>

          {/* Options list */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const charPrefix = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = selectedAnswers[qId] === idx;
              
              return (
                <button
                  key={idx}
                  onClick={() => selectOption(qId, idx)}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-start gap-4 ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/35 border-primary-500 dark:border-primary-500 text-primary-900 dark:text-primary-100 font-semibold ring-1 ring-primary-500/20'
                      : 'bg-gray-50/50 hover:bg-gray-50 dark:bg-gray-850/30 dark:hover:bg-gray-850 border-gray-150 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border ${
                    isSelected
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-550'
                  }`}>
                    {charPrefix}
                  </span>
                  <span className="flex-1 pt-0.5">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workstation Footer Controls */}
        <div className="flex justify-between items-center border-t border-gray-150 dark:border-gray-850 pt-6 mt-8 gap-4">
          <button
            onClick={() => clearChoice(qId)}
            className="text-xs font-bold text-danger-600 hover:underline px-2 py-1.5"
            disabled={selectedAnswers[qId] === undefined}
          >
            Clear Selected Option
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentIdx === test.questions.length - 1 ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 px-5 py-2 bg-success-650 hover:bg-success-700 text-white rounded-xl text-xs font-bold shadow-md shadow-success-500/10 hover:shadow-lg transition-all"
              >
                Review & Submit <CheckCircle2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(prev => Math.min(test.questions.length - 1, prev + 1))}
                className="flex items-center gap-1 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/10 hover:shadow-lg transition-all"
              >
                Save & Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Area: Question Grid Palette */}
      <div className="w-full lg:w-80 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col shrink-0">
        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-850 pb-3 mb-4">
          Exam Question Palette
        </h3>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 font-medium mb-6">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-success-500 rounded border border-success-600"></span> Answered
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-secondary-500 rounded border border-secondary-650"></span> Marked
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-danger-500 rounded border border-danger-650"></span> Unanswered
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"></span> Unvisited
          </div>
        </div>

        {/* Question Palette Buttons Grid */}
        <div className="grid grid-cols-5 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
          {test.questions.map((q, idx) => {
            const isCurrent = currentIdx === idx;
            const isAnswered = selectedAnswers[q._id] !== undefined;
            const isMarked = markedForReview[q._id] === true;
            
            // Determine button colors
            let btnClass = 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-750 text-gray-650 dark:text-gray-300';
            if (isAnswered && isMarked) {
              btnClass = 'bg-secondary-500 border-secondary-650 text-white';
            } else if (isAnswered) {
              btnClass = 'bg-success-500 border-success-650 text-white';
            } else if (isMarked) {
              btnClass = 'bg-secondary-500 border-secondary-650 text-white';
            } else if (isCurrent) {
              btnClass = 'bg-primary-50 border-primary-500 text-primary-600 border-2 dark:bg-primary-950/20';
            } else if (selectedAnswers[q._id] === undefined && idx < currentIdx) {
              btnClass = 'bg-danger-500 border-danger-600 text-white';
            }

            return (
              <button
                key={q._id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-10 h-10 rounded-xl font-extrabold text-xs flex items-center justify-center border transition-all ${btnClass} ${
                  isCurrent ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Summary Card Info */}
        <div className="border-t border-gray-150 dark:border-gray-850 pt-4 mt-6 text-xs text-gray-650 dark:text-gray-300 space-y-2">
          <div className="flex justify-between font-medium">
            <span>Total Questions:</span>
            <span className="font-extrabold">{test.questions.length}</span>
          </div>
          <div className="flex justify-between text-success-600 font-semibold">
            <span>Answered:</span>
            <span className="font-extrabold">
              {Object.keys(selectedAnswers).length}
            </span>
          </div>
          <div className="flex justify-between text-secondary-600 font-semibold">
            <span>Marked for Review:</span>
            <span className="font-extrabold">
              {Object.keys(markedForReview).filter(k => markedForReview[k]).length}
            </span>
          </div>
          <div className="flex justify-between text-danger-600 font-semibold">
            <span>Unanswered:</span>
            <span className="font-extrabold">
              {test.questions.length - Object.keys(selectedAnswers).length}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-150 dark:border-gray-800 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-success-50 dark:bg-success-950/20 text-success-600 rounded-full flex items-center justify-center mx-auto text-xl">
              📝
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-850 dark:text-white">Submit Exam Paper?</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                You have answered {Object.keys(selectedAnswers).length} out of {test.questions.length} questions.
                Once submitted, you cannot change your answers. Do you want to submit?
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 border border-gray-250 dark:border-gray-700 text-gray-650 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-850"
              >
                No, Review
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-success-650 hover:bg-success-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Yes, Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttemptTest;
