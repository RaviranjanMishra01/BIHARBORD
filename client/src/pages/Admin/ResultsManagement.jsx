import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';
import {
  ClipboardCheck,
  Search,
  Printer,
  ChevronRight,
  Loader2,
  HelpCircle,
  X,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import * as xlsx from 'xlsx';

const ResultsManagement = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  // Modal to inspect result details
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState(null);

  // Fetch all results query
  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ['adminResultsList'],
    queryFn: async () => {
      const res = await api.get('/admin/results');
      return res.data.data;
    }
  });

  // Fetch specific result details if modal is open
  const { data: resultDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['adminResultDetail', selectedResultId],
    queryFn: async () => {
      if (!selectedResultId) return null;
      const res = await api.get(`/students/results/${selectedResultId}`);
      return res.data.data;
    },
    enabled: !!selectedResultId
  });

  // Local Filter Logic
  const filteredResults = results.filter(r => {
    const studentName = r.student?.fullName || '';
    const studentRoll = r.student?.rollNumber || '';
    const testTitle = r.test?.title || '';
    const matchSearch =
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      studentRoll.toLowerCase().includes(search.toLowerCase()) ||
      testTitle.toLowerCase().includes(search.toLowerCase());

    const matchSubject = !subjectFilter || r.test?.subject?.toString() === subjectFilter || r.test?.subject?._id === subjectFilter;

    return matchSearch && matchSubject;
  });

  // Excel exporter
  const handleExportExcel = () => {
    if (filteredResults.length === 0) {
      toast.error('No results to export');
      return;
    }

    const data = filteredResults.map((r, index) => ({
      'S.No': index + 1,
      'Candidate Name': r.student?.fullName || 'Deleted Student',
      'Roll Number': r.student?.rollNumber || 'N/A',
      'Exam Title': r.test?.title || 'Class Quiz',
      'Score Gained': r.score,
      'Total Marks': r.test?.totalMarks || 40,
      'Percentage': `${r.percentage}%`,
      'Status': r.status.toUpperCase(),
      'Attempt Date': new Date(r.attemptedAt).toLocaleDateString('en-IN')
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Results');
    xlsx.writeFile(workbook, 'admin_results_export.xlsx');
    toast.success('Results spreadsheet downloaded!');
  };

  const handleOpenDetail = (id) => {
    setSelectedResultId(id);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans">Student Result Sheets</h1>
          <p className="text-sm text-gray-500 mt-1">Review student score reports, download spreadsheet tallies, print files</p>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <FileSpreadsheet className="w-4 h-4" /> Download Results Sheet
        </button>
      </div>

      {/* Search Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, roll, test..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1"
          />
        </div>
      </div>

      {/* Results Data Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-gray-500">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-bold">Failed to load result sheets.</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No result sheets matched criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-855 border-b border-gray-150 dark:border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">Candidate Name</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Exam Paper</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-xs">
                {filteredResults.map((result) => (
                  <tr key={result._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="block font-semibold text-sm text-gray-855 dark:text-white">
                        {result.student?.fullName || 'Deleted Student'}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{result.student?.email}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-250">
                      {result.student?.rollNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-semibold text-gray-850 dark:text-white truncate max-w-[220px]">
                        {result.test?.title || 'Deleted Test'}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        Attempted on {new Date(result.attemptedAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="block font-bold">{result.score} / {result.test?.totalMarks || 40}</span>
                      <span className="text-[10px] text-gray-400">{result.percentage}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        result.status === 'passed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(result._id)}
                        className="px-3 py-1.5 border border-gray-250 dark:border-gray-750 hover:bg-gray-50 dark:hover:bg-gray-850 text-xs font-semibold rounded-lg flex items-center gap-1 ml-auto"
                      >
                        Inspect Sheet <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Result sheet inspect modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-855 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary-550" /> Score Sheet Inspection
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="py-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : !resultDetail ? (
              <div className="py-8 text-center text-gray-500">Result information was removed.</div>
            ) : (
              <div className="space-y-6 text-xs text-gray-650">
                
                {/* Scorecard banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-855 p-4 rounded-2xl border text-center font-bold">
                  <div>
                    <span className="block text-[10px] text-gray-400 uppercase">Student Gained</span>
                    <span className="text-sm font-black text-gray-800 dark:text-white mt-1 block">
                      {resultDetail.score} / {resultDetail.test?.totalMarks}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 uppercase">Percentage</span>
                    <span className="text-sm font-black text-gray-800 dark:text-white mt-1 block">
                      {resultDetail.percentage}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 uppercase">Time Gained</span>
                    <span className="text-sm font-black text-gray-800 dark:text-white mt-1 block">
                      {Math.floor(resultDetail.timeTaken / 60)}m {resultDetail.timeTaken % 60}s
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 uppercase">Result Status</span>
                    <span className={`text-sm font-black mt-1 block uppercase ${
                      resultDetail.status === 'passed' ? 'text-success-600' : 'text-danger-650'
                    }`}>
                      {resultDetail.status}
                    </span>
                  </div>
                </div>

                {/* Inspect Solutions Checklist */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm uppercase text-primary-650 border-b pb-1">
                    Submitted Answer Sheet
                  </h4>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {resultDetail.answers.map((ans, idx) => {
                      const q = ans.question;
                      if (!q) return null;
                      
                      const isCorrect = ans.isCorrect;
                      const isSkipped = ans.isSkipped;
                      
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 border rounded-xl space-y-2 ${
                            isSkipped
                              ? 'border-gray-250 bg-gray-50/50'
                              : isCorrect
                                ? 'border-emerald-350 bg-emerald-50/10'
                                : 'border-rose-350 bg-rose-50/10'
                          }`}
                        >
                          <div className="flex justify-between font-bold uppercase text-[9px] text-gray-400">
                            <span>Question {idx + 1}</span>
                            <span className={isSkipped ? 'text-gray-500' : isCorrect ? 'text-success-600' : 'text-danger-600'}>
                              {isSkipped ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          
                          <p className="font-bold text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                            {q.questionText}
                          </p>

                          <div className="flex flex-col sm:flex-row gap-2 text-[10px] pt-1">
                            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              Student Answer: <strong className="text-gray-700 dark:text-gray-250">
                                {ans.chosenOption !== null ? String.fromCharCode(65 + ans.chosenOption) : 'None'}
                              </strong>
                            </span>
                            <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 px-2 py-1 rounded">
                              Correct Key: <strong>{String.fromCharCode(65 + q.correctOption)}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-gray-850">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Print Sheet Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsManagement;
