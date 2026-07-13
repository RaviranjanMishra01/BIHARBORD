import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';
import { DIFFICULTY_LEVELS } from '../../constants';
import {
  Database,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Loader2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Braces
} from 'lucide-react';

const QuestionBank = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isJsonImporting, setIsJsonImporting] = useState(false);

  // Bulk file state
  const [bulkFile, setBulkFile] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Dynamic hierarchy state (subjects & chapters list)
  const [subjectsList, setSubjectsList] = useState([]);
  const [chaptersList, setChaptersList] = useState([]);

  // Question Form State
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    options: ['', '', '', ''], // Standard MCQ has 4 choices
    correctOption: 0,
    explanation: '',
    difficulty: 'medium',
    subject: '',
    chapter: '',
    imageUrl: ''
  });

  // Fetch subjects & chapters hierarchy
  useQuery({
    queryKey: ['hierarchyTree'],
    queryFn: async () => {
      const res = await api.get('/subjects/hierarchy');
      setSubjectsList(res.data.data);
      return res.data.data;
    }
  });

  // Dynamic chapter filtering based on chosen subject in the editor
  useEffect(() => {
    if (questionForm.subject) {
      const chosenSub = subjectsList.find(s => s._id === questionForm.subject);
      setChaptersList(chosenSub ? chosenSub.chapters : []);
    } else {
      setChaptersList([]);
    }
  }, [questionForm.subject, subjectsList]);

  // Fetch Questions list
  const { data: questionsResponse, isLoading, isError } = useQuery({
    queryKey: ['adminQuestions', search, subjectFilter, chapterFilter, difficultyFilter, page],
    queryFn: async () => {
      const res = await api.get('/questions', {
        params: {
          search,
          subject: subjectFilter,
          chapter: chapterFilter,
          difficulty: difficultyFilter,
          page,
          limit
        }
      });
      return res.data;
    }
  });

  const questions = questionsResponse?.data || [];
  const totalPages = questionsResponse?.pages || 1;

  // Create Question Mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/questions', payload);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      setShowAddModal(false);
      resetForm();
      queryClient.invalidateQueries(['adminQuestions']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add question');
    }
  });

  // Edit Question Mutation
  const editQuestionMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return api.put(`/questions/${id}`, payload);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      setShowEditModal(false);
      setSelectedQuestion(null);
      resetForm();
      queryClient.invalidateQueries(['adminQuestions']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update question');
    }
  });

  // Delete Question Mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/questions/${id}`);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['adminQuestions']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete question');
    }
  });

  const resetForm = () => {
    setQuestionForm({
      questionText: '',
      options: ['', '', '', ''],
      correctOption: 0,
      explanation: '',
      difficulty: 'medium',
      subject: '',
      chapter: '',
      imageUrl: ''
    });
  };

  const handleOpenEdit = (q) => {
    setSelectedQuestion(q);
    setQuestionForm({
      questionText: q.questionText || '',
      options: q.options ? [...q.options] : ['', '', '', ''],
      correctOption: q.correctOption !== undefined ? q.correctOption : 0,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      subject: q.subject?._id || q.subject || '',
      chapter: q.chapter?._id || q.chapter || '',
      imageUrl: q.imageUrl || ''
    });
    setShowEditModal(true);
  };

  const handleOptionChange = (idx, val) => {
    const updatedOptions = [...questionForm.options];
    updatedOptions[idx] = val;
    setQuestionForm({ ...questionForm, options: updatedOptions });
  };

  const handleFormChange = (e) => {
    setQuestionForm({ ...questionForm, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!questionForm.subject || !questionForm.chapter || !questionForm.questionText) {
      toast.error('Subject, Chapter and Question Text are required');
      return;
    }
    addQuestionMutation.mutate(questionForm);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editQuestionMutation.mutate({ id: selectedQuestion._id, payload: questionForm });
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Please choose an Excel file (.xlsx) first');
      return;
    }

    setIsBulkUploading(true);
    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      const res = await api.post('/questions/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message);
      setBulkFile(null);
      queryClient.invalidateQueries(['adminQuestions']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk upload failed.');
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleExportQuestions = () => {
    const params = new URLSearchParams();
    if (subjectFilter) params.append('subject', subjectFilter);
    if (chapterFilter) params.append('chapter', chapterFilter);
    if (difficultyFilter) params.append('difficulty', difficultyFilter);

    window.open(`/api/questions/export?${params.toString()}`, '_blank');
  };

  const handleJsonBulkImport = async () => {
    if (!jsonInput.trim()) {
      toast.error('Please paste a JSON array of questions');
      return;
    }

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(jsonInput);
    } catch (e) {
      toast.error('Invalid JSON format. Please verify syntax (missing commas, brackets, etc.)');
      return;
    }

    if (!Array.isArray(parsedQuestions)) {
      toast.error('The pasted JSON must be a JSON Array (wrapped in [ ... ])');
      return;
    }

    if (parsedQuestions.length === 0) {
      toast.error('The questions array is empty');
      return;
    }

    setIsJsonImporting(true);
    try {
      const res = await api.post('/questions/bulk-json', { questions: parsedQuestions });
      toast.success(res.data.message);
      if (res.data.errors && res.data.errors.length > 0) {
        toast.warning(`${res.data.errors.length} items failed to import. Check console/logs.`);
        console.warn('[Bulk JSON Errors]', res.data.errors);
      }
      setJsonInput('');
      setShowJsonModal(false);
      queryClient.invalidateQueries(['adminQuestions']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import JSON questions.');
    } finally {
      setIsJsonImporting(false);
    }
  };

  // Find active chapters for filtering based on selected subject in toolbar
  const toolbarChapters = subjectFilter
    ? subjectsList.find(s => s._id === subjectFilter)?.chapters || []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-1">Manage MCQs, upload Excel sheets, or export questions key</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJsonModal(true)}
            className="px-4 py-2.5 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-secondary-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Braces className="w-4.5 h-4.5" /> Bulk JSON Import
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add MCQ Question
          </button>
        </div>
      </div>

      {/* Bulk Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 shadow-sm items-center">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-255 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-xs font-semibold cursor-pointer text-gray-650 dark:text-gray-305">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>{bulkFile ? bulkFile.name : 'Choose Excel Sheet'}</span>
            <input
              type="file"
              accept=".xls,.xlsx"
              className="hidden"
              onChange={(e) => setBulkFile(e.target.files[0])}
            />
          </label>
          <button
            onClick={handleBulkUpload}
            disabled={!bulkFile || isBulkUploading}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-350 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            {isBulkUploading ? 'Uploading...' : 'Bulk Import'}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleExportQuestions}
            className="px-3 py-2 border border-gray-250 dark:border-gray-755 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-gray-655"
          >
            <Download className="w-4 h-4" /> Export Questions
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search questions..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1"
          />
        </div>

        {/* Subject */}
        <select
          value={subjectFilter}
          onChange={(e) => { setSubjectFilter(e.target.value); setChapterFilter(''); setPage(1); }}
          className="px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs"
        >
          <option value="">All Subjects</option>
          {subjectsList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>

        {/* Chapter */}
        <select
          value={chapterFilter}
          disabled={!subjectFilter}
          onChange={(e) => { setChapterFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs disabled:opacity-50"
        >
          <option value="">All Chapters</option>
          {toolbarChapters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        {/* Difficulty */}
        <select
          value={difficultyFilter}
          onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy (सरल)</option>
          <option value="medium">Medium (मध्यम)</option>
          <option value="hard">Hard (कठिन)</option>
        </select>
      </div>

      {/* Questions Data List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden p-6">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-gray-500">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-bold">Failed to load question details.</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No questions match search filters.
          </div>
        ) : (
          <div className="space-y-6 divide-y divide-gray-150 dark:divide-gray-800">
            {questions.map((q, qIndex) => (
              <div key={q._id} className="pt-6 first:pt-0 space-y-3">
                <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2.5 py-0.5 rounded">
                      {q.subject?.name}
                    </span>
                    <span className="text-gray-450">• {q.chapter?.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-extrabold ${
                    q.difficulty === 'easy'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                      : q.difficulty === 'medium'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-gray-850 dark:text-white leading-relaxed">
                  {(page - 1) * limit + qIndex + 1}. {q.questionText}
                </h3>

                {/* Options list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = oIdx === q.correctOption;
                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-300 text-emerald-800 dark:text-emerald-350 font-bold'
                            : 'bg-gray-50 dark:bg-gray-855 border-gray-150 dark:border-gray-800 text-gray-600 dark:text-gray-450'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-800 border'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="bg-gray-50 dark:bg-gray-855 p-3 rounded-xl text-xs text-gray-500 border border-gray-100 dark:border-gray-800">
                    <strong>Solution hal:</strong> {q.explanation}
                  </div>
                )}

                {/* Edit options */}
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="px-3.5 py-1.5 border border-gray-200 dark:border-gray-800 text-xs font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this question permanently?')) {
                        deleteQuestionMutation.mutate(q._id);
                      }
                    }}
                    className="px-3.5 py-1.5 border border-rose-250 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 text-xs font-bold rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pt-6 mt-6 border-t border-gray-150 dark:border-gray-850 flex justify-between items-center text-xs">
            <span className="text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-1.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-40"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="p-1.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-40"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modals */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}></div>
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-white">
                {showAddModal ? 'Add MCQ Question' : 'Modify Question Bank Element'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
              <div className="grid grid-cols-2 gap-4">
                {/* Subject Selector */}
                <div>
                  <label className="block mb-1">Subject *</label>
                  <select
                    name="subject"
                    required
                    value={questionForm.subject}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                  >
                    <option value="">Select Subject</option>
                    {subjectsList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Chapter Selector */}
                <div>
                  <label className="block mb-1">Chapter *</label>
                  <select
                    name="chapter"
                    required
                    disabled={!questionForm.subject}
                    value={questionForm.chapter}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs disabled:opacity-50"
                  >
                    <option value="">Select Chapter</option>
                    {chaptersList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Difficulty & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Difficulty Level</label>
                  <select
                    name="difficulty"
                    value={questionForm.difficulty}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                  >
                    <option value="easy">Easy (सरल)</option>
                    <option value="medium">Medium (मध्यम)</option>
                    <option value="hard">Hard (कठिन)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Question Image URL (Optional)</label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={questionForm.imageUrl}
                    onChange={handleFormChange}
                    placeholder="http://domain.com/photo.png"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block mb-1">Question Statement Text *</label>
                <textarea
                  name="questionText"
                  required
                  rows={2}
                  value={questionForm.questionText}
                  onChange={handleFormChange}
                  placeholder="Type Hindi/English question statement..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs focus:ring-1"
                />
              </div>

              {/* Options & Correct Answer Selection */}
              <div className="space-y-3">
                <label className="block uppercase tracking-wider text-[10px] text-gray-400 font-bold">
                  MCQ Options (Select the circular letter to mark it as the correct answer) *
                </label>
                <div className="space-y-2.5">
                  {questionForm.options.map((opt, idx) => {
                    const isCorrect = questionForm.correctOption === idx;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuestionForm({ ...questionForm, correctOption: idx })}
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all border shrink-0 ${
                            isCorrect 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-105' 
                              : 'bg-white dark:bg-gray-850 hover:bg-gray-100 text-gray-400 border-gray-250 dark:border-gray-700 hover:border-gray-400'
                          }`}
                          title="Mark as correct answer"
                        >
                          {isCorrect ? '✓' : String.fromCharCode(65 + idx)}
                        </button>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Enter Option Choice ${String.fromCharCode(65 + idx)}`}
                          className={`flex-1 px-3.5 py-2.5 border rounded-xl text-xs transition-all focus:outline-none focus:ring-2 ${
                            isCorrect 
                              ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-350 focus:border-emerald-500 focus:ring-emerald-500/20 font-semibold text-emerald-800 dark:text-emerald-300' 
                              : 'bg-gray-50 dark:bg-gray-855 border-gray-200 dark:border-gray-800 focus:border-primary-500 focus:ring-primary-500/20'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block mb-1">Teacher Solution Explanation (हल/स्पष्टीकरण)</label>
                <textarea
                  name="explanation"
                  rows={2}
                  value={questionForm.explanation}
                  onChange={handleFormChange}
                  placeholder="Explain why correct choice option is true..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                />
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-850 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addQuestionMutation.isPending || editQuestionMutation.isPending}
                  className="px-5 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 flex items-center justify-center gap-1.5"
                >
                  {(addQuestionMutation.isPending || editQuestionMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {showAddModal ? 'Create Question' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk JSON Import Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowJsonModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-gray-800 pb-3 mb-4 shrink-0">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-white flex items-center gap-1.5">
                <Braces className="w-5 h-5 text-secondary-500" /> Bulk JSON Questions Import
              </h3>
              <button onClick={() => setShowJsonModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 font-sans text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed">
                <p className="font-bold text-gray-855 dark:text-white">Instructions:</p>
                <p>1. Paste a valid JSON array of question objects.</p>
                <p>2. Subject and Chapter will be resolved by name and created dynamically if they don't exist.</p>
                <p>3. <strong>correctOption</strong> is the 0-based option index (e.g. 0 for option A, 1 for option B).</p>
                <details className="mt-2 group">
                  <summary className="font-bold text-primary-500 cursor-pointer hover:underline outline-none">
                    Show Sample Format
                  </summary>
                  <pre className="mt-2 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto text-[10px] leading-tight text-gray-700 dark:text-gray-300 font-mono">
{`[
  {
    "questionText": "The focal length of a spherical mirror of radius of curvature 20 cm is:",
    "options": ["20 cm", "10 cm", "40 cm", "5 cm"],
    "correctOption": 1,
    "explanation": "Focal length (f) = Radius of curvature (R) / 2 = 10 cm.",
    "difficulty": "medium",
    "subjectName": "Science",
    "chapterName": "Reflection of Light"
  }
]`}
                  </pre>
                </details>
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col min-h-[250px]">
                <label className="block font-bold text-gray-500">Paste JSON Array *</label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="[&#13;  {&#13;    &quot;questionText&quot;: &quot;...&quot;,&#13;    ...&#13;  }&#13;]"
                  className="w-full flex-1 p-3 bg-gray-50 dark:bg-gray-855 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-secondary-500"
                  style={{ minHeight: '220px' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-150 dark:border-gray-800 pt-4 mt-4 shrink-0">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleJsonBulkImport}
                disabled={isJsonImporting}
                className="px-5 py-2 bg-secondary-600 text-white rounded-xl font-bold hover:bg-secondary-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isJsonImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
