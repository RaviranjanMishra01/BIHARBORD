import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';
import {
  CalendarRange,
  Plus,
  Trash2,
  Settings,
  HelpCircle,
  Loader2,
  X,
  CheckCircle,
  FileText
} from 'lucide-react';

const TestManagement = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  // Dynamic subjects list
  const [subjectsList, setSubjectsList] = useState([]);
  const [chaptersList, setChaptersList] = useState([]);
  const [questionsPool, setQuestionsPool] = useState([]);

  // Test form state
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    subject: '',
    chapter: '',
    duration: 15,
    totalMarks: 40,
    passingMarks: 50, // default 50%
    negativeMarking: false,
    negativeMarkValue: 0,
    randomizeQuestions: false,
    randomizeOptions: false,
    scheduledFor: '',
    availableUntil: '',
    status: 'draft',
    questions: [] // Selected Question IDs
  });

  // Fetch subjects & chapters hierarchy
  useQuery({
    queryKey: ['hierarchyTreeTests'],
    queryFn: async () => {
      const res = await api.get('/subjects/hierarchy');
      setSubjectsList(res.data.data);
      return res.data.data;
    }
  });

  // Fetch Tests list (Admin view)
  const { data: tests = [], isLoading, isError } = useQuery({
    queryKey: ['adminTestsList'],
    queryFn: async () => {
      const res = await api.get('/tests/admin/all');
      return res.data.data;
    }
  });

  // Dynamic chapter list filtering based on subject in forms editor
  useEffect(() => {
    if (testForm.subject) {
      const sub = subjectsList.find(s => s._id === testForm.subject);
      setChaptersList(sub ? sub.chapters : []);
    } else {
      setChaptersList([]);
    }
  }, [testForm.subject, subjectsList]);

  // Fetch Questions Pool matching subject (to select which ones to bind to test)
  useEffect(() => {
    const fetchQuestionsPool = async () => {
      if (!testForm.subject) {
        setQuestionsPool([]);
        return;
      }
      try {
        const res = await api.get('/questions', {
          params: {
            subject: testForm.subject,
            chapter: testForm.chapter || undefined,
            limit: 100 // fetch a large pool to choose from
          }
        });
        setQuestionsPool(res.data.data || []);
      } catch (e) {
        console.error("Error fetching questions pool: ", e);
      }
    };

    fetchQuestionsPool();
  }, [testForm.subject, testForm.chapter]);

  // Create Test Mutation
  const addTestMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/tests/admin/create', payload);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      setShowAddModal(false);
      resetForm();
      queryClient.invalidateQueries(['adminTestsList']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create test');
    }
  });

  // Edit Test Mutation
  const editTestMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return api.put(`/tests/admin/${id}`, payload);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      setShowEditModal(false);
      setSelectedTest(null);
      resetForm();
      queryClient.invalidateQueries(['adminTestsList']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update test rules');
    }
  });

  // Delete Test Mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/tests/admin/${id}`);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['adminTestsList']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete test');
    }
  });

  const resetForm = () => {
    setTestForm({
      title: '',
      description: '',
      subject: '',
      chapter: '',
      duration: 15,
      totalMarks: 40,
      passingMarks: 50,
      negativeMarking: false,
      negativeMarkValue: 0,
      randomizeQuestions: false,
      randomizeOptions: false,
      scheduledFor: '',
      availableUntil: '',
      status: 'draft',
      questions: []
    });
  };

  const handleOpenEdit = (t) => {
    setSelectedTest(t);
    setTestForm({
      title: t.title || '',
      description: t.description || '',
      subject: t.subject?._id || t.subject || '',
      chapter: t.chapter?._id || t.chapter || '',
      duration: t.duration || 15,
      totalMarks: t.totalMarks || 40,
      passingMarks: t.passingMarks || 50,
      negativeMarking: t.negativeMarking || false,
      negativeMarkValue: t.negativeMarkValue || 0,
      randomizeQuestions: t.randomizeQuestions || false,
      randomizeOptions: t.randomizeOptions || false,
      scheduledFor: t.scheduledFor ? new Date(t.scheduledFor).toISOString().slice(0, 16) : '',
      availableUntil: t.availableUntil ? new Date(t.availableUntil).toISOString().slice(0, 16) : '',
      status: t.status || 'draft',
      questions: t.questions ? t.questions.map(q => q._id || q) : []
    });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setTestForm({ ...testForm, [e.target.name]: val });
  };

  // Toggle question selection from pool grid
  const toggleSelectQuestion = (qId) => {
    const isSelected = testForm.questions.includes(qId);
    let updated;
    if (isSelected) {
      updated = testForm.questions.filter(id => id !== qId);
    } else {
      updated = [...testForm.questions, qId];
    }
    setTestForm({ ...testForm, questions: updated });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!testForm.subject || !testForm.title || testForm.questions.length === 0) {
      toast.error('Subject, Title and at least 1 Question selection are required');
      return;
    }
    addTestMutation.mutate(testForm);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editTestMutation.mutate({ id: selectedTest._id, payload: testForm });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-sans">Exams & Test Management</h1>
          <p className="text-sm text-gray-500 mt-1">Configure matric exams, passing rules, timing parameters</p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Exam Paper
        </button>
      </div>

      {/* Tests lists grid */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden p-6">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-gray-500">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-bold">Failed to load exam templates.</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No exams configured yet. Click "Create Exam Paper" to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test) => (
              <div
                key={test._id}
                className="p-5 border border-gray-150 dark:border-gray-800 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase bg-secondary-100 dark:bg-secondary-950/40 text-secondary-700 dark:text-secondary-400 px-2.5 py-0.5 rounded">
                      {test.subject?.name}
                    </span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      test.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-yellow-50 text-yellow-750'
                    }`}>
                      {test.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-gray-850 dark:text-white leading-tight mb-2">
                    {test.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-4">{test.description}</p>
                  
                  {/* details */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-650 bg-gray-50 dark:bg-gray-855 p-3 rounded-xl mb-4">
                    <div>⏱️ {test.duration} minutes</div>
                    <div>📝 {test.questions?.length} Questions</div>
                    <div>💯 {test.totalMarks} Marks</div>
                    <div>🎯 Pass Score: {test.passingMarks}%</div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-850">
                  <button
                    onClick={() => handleOpenEdit(test)}
                    className="px-3.5 py-1.5 border border-gray-250 dark:border-gray-750 text-xs font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850"
                  >
                    Edit Rules
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this exam configuration?')) {
                        deleteTestMutation.mutate(test._id);
                      }
                    }}
                    className="px-3.5 py-1.5 border border-rose-250 text-rose-650 text-xs font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modals */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}></div>
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-white">
                {showAddModal ? 'Create Exam Paper' : 'Modify Exam Settings'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
              
              {/* Step 1: Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Exam Paper Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={testForm.title}
                    onChange={handleFormChange}
                    placeholder="Mathematics Chapter Test 1"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1">Subject *</label>
                  <select
                    name="subject"
                    required
                    value={testForm.subject}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                  >
                    <option value="">Select Subject</option>
                    {subjectsList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1">Exam Description</label>
                  <input
                    type="text"
                    name="description"
                    value={testForm.description}
                    onChange={handleFormChange}
                    placeholder="Brief syllabus guidelines..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1">Chapter Constraint (Null for Full Syllabus)</label>
                  <select
                    name="chapter"
                    disabled={!testForm.subject}
                    value={testForm.chapter}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs disabled:opacity-50"
                  >
                    <option value="">Full Syllabus Exam</option>
                    {chaptersList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    name="status"
                    value={testForm.status}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs font-bold"
                  >
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Live for students)</option>
                  </select>
                </div>
              </div>

              {/* Step 2: Scoring & Timing Settings */}
              <div className="border-t border-gray-100 dark:border-gray-850 pt-3 mt-4">
                <h4 className="font-bold text-primary-600 uppercase mb-2 flex items-center gap-1">
                  <Settings className="w-4 h-4" /> Scoring & Timing Parameters
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block mb-1">Duration (Mins) *</label>
                    <input
                      type="number"
                      name="duration"
                      required
                      min={1}
                      value={testForm.duration}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Total Marks *</label>
                    <input
                      type="number"
                      name="totalMarks"
                      required
                      min={1}
                      value={testForm.totalMarks}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Passing Score (%) *</label>
                    <input
                      type="number"
                      name="passingMarks"
                      required
                      min={10}
                      max={100}
                      value={testForm.passingMarks}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                    />
                  </div>
                  
                  {/* Negative marking block */}
                  <div>
                    <label className="block mb-1">Negative Marking?</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        name="negativeMarking"
                        checked={testForm.negativeMarking}
                        onChange={handleFormChange}
                        className="w-4 h-4 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span>Enable</span>
                    </div>
                  </div>
                </div>

                {testForm.negativeMarking && (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block mb-1">Negative Deduction Score (marks per wrong MCQ)</label>
                      <input
                        type="number"
                        name="negativeMarkValue"
                        step="0.05"
                        min="0"
                        value={testForm.negativeMarkValue}
                        onChange={handleFormChange}
                        placeholder="e.g. 0.25"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Date scheduling limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Scheduled Available Start Date (Optional)</label>
                  <input
                    type="datetime-local"
                    name="scheduledFor"
                    value={testForm.scheduledFor}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1">Expiry Available End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    name="availableUntil"
                    value={testForm.availableUntil}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Step 4: Question Pool Selection */}
              <div className="border-t border-gray-100 dark:border-gray-850 pt-3 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-primary-600 uppercase flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Select Questions from Bank ({testForm.questions.length} Selected)
                  </h4>
                  <span className="text-[10px] text-gray-450 block">Select matching subject to load question list</span>
                </div>
                <div className="border border-gray-200 dark:border-gray-800 rounded-2xl max-h-60 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-855/30">
                  {questionsPool.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      No questions found. Please select a Subject above to populate the question pool.
                    </div>
                  ) : (
                    questionsPool.map((q, idx) => {
                      const isChecked = testForm.questions.includes(q._id);
                      return (
                        <div
                          key={q._id}
                          onClick={() => toggleSelectQuestion(q._id)}
                          className={`flex items-center justify-between gap-4 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isChecked 
                              ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10' 
                              : 'border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed line-clamp-2 ${isChecked ? 'font-bold text-gray-850 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                              {idx + 1}. {q.questionText}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                q.difficulty === 'easy' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                  : q.difficulty === 'medium' 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' 
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                              }`}>
                                {q.difficulty}
                              </span>
                              {q.chapter?.name && <span className="text-[9px] text-gray-400 font-semibold">• {q.chapter.name}</span>}
                            </div>
                          </div>
                          
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                            isChecked 
                              ? 'bg-emerald-600 border-emerald-600 text-white scale-105 shadow-sm' 
                              : 'border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800'
                          }`}>
                            {isChecked && <span className="text-[10px] font-bold">✓</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Submit panel */}
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
                  disabled={addTestMutation.isPending || editTestMutation.isPending}
                  className="px-5 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 flex items-center justify-center gap-1.5"
                >
                  {(addTestMutation.isPending || editTestMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {showAddModal ? 'Create Exam' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;
