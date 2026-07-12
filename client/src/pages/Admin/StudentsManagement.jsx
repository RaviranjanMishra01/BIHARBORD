import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';
import { DISTRICTS } from '../../constants';
import {
  Users,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  UserX,
  UserCheck,
  FileSpreadsheet,
  Download,
  Loader2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const StudentsManagement = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [isSuspended, setIsSuspended] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Bulk upload file state
  const [bulkFile, setBulkFile] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Forms state
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    password: '',
    rollNumber: '',
    schoolName: '',
    district: '',
    block: '',
    mobileNumber: '',
    parentName: '',
    parentMobile: ''
  });

  // Fetch Students query
  const { data: studentsResponse, isLoading, isError } = useQuery({
    queryKey: ['adminStudents', search, district, isSuspended, page],
    queryFn: async () => {
      const res = await api.get('/admin/students', {
        params: { search, district, isSuspended, page, limit }
      });
      return res.data;
    }
  });

  const students = studentsResponse?.data || [];
  const totalPages = studentsResponse?.pages || 1;

  // Toggle Suspension Mutation
  const toggleSuspendMutation = useMutation({
    mutationFn: async (id) => {
      return api.put(`/admin/students/${id}/suspend`);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['adminStudents']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Suspension toggle failed.');
    }
  });

  // Delete Student Mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/admin/students/${id}`);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['adminStudents']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete student.');
    }
  });

  // Create Student Mutation
  const addStudentMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/admin/students', payload);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      setShowAddModal(false);
      resetForm();
      queryClient.invalidateQueries(['adminStudents']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create student account.');
    }
  });

  // Update Student Mutation
  const editStudentMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return api.put(`/admin/students/${id}`, payload);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      setShowEditModal(false);
      setSelectedStudent(null);
      resetForm();
      queryClient.invalidateQueries(['adminStudents']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update student settings.');
    }
  });

  const resetForm = () => {
    setStudentForm({
      fullName: '',
      email: '',
      password: '',
      rollNumber: '',
      schoolName: '',
      district: '',
      block: '',
      mobileNumber: '',
      parentName: '',
      parentMobile: ''
    });
  };

  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setStudentForm({
      fullName: student.fullName || '',
      email: student.email || '',
      password: '', // do not display password
      rollNumber: student.rollNumber || '',
      schoolName: student.schoolName || '',
      district: student.district || '',
      block: student.block || '',
      mobileNumber: student.mobileNumber || '',
      parentName: student.parentName || '',
      parentMobile: student.parentMobile || ''
    });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!studentForm.fullName || !studentForm.email || !studentForm.password) {
      toast.error('Name, Email and Password are required');
      return;
    }
    addStudentMutation.mutate(studentForm);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const payload = { ...studentForm };
    if (!payload.password) delete payload.password; // Do not send empty password
    editStudentMutation.mutate({ id: selectedStudent._id, payload });
  };

  // Bulk Excel import
  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Please select an Excel file (.xlsx) first');
      return;
    }

    setIsBulkUploading(true);
    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      const res = await api.post('/admin/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message);
      setBulkFile(null);
      queryClient.invalidateQueries(['adminStudents']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk import failed.');
    } finally {
      setIsBulkUploading(false);
    }
  };

  // Excel template export helper
  const handleExportExcel = () => {
    window.open('/api/admin/students/export', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans">Students Management</h1>
          <p className="text-sm text-gray-500 mt-1">Add, edit, suspend, or bulk upload candidates database</p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Bulk Operations Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 shadow-sm items-center">
        {/* Upload Excel */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-250 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-xs font-semibold cursor-pointer text-gray-650 dark:text-gray-300">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>{bulkFile ? bulkFile.name : 'Choose Excel File'}</span>
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

        {/* Download Template / Export */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 border border-gray-250 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-gray-650 dark:text-gray-300"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative sm:col-span-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, roll, reg..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* District Filter */}
        <select
          value={district}
          onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none"
        >
          <option value="">All Districts</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Status Filter */}
        <select
          value={isSuspended}
          onChange={(e) => { setIsSuspended(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="false">Active Only</option>
          <option value="true">Suspended Only</option>
        </select>
      </div>

      {/* Students Data Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-gray-500">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-bold">Failed to load students roster.</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No candidates matched search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-855 border-b border-gray-150 dark:border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">BSEB Credentials</th>
                  <th className="px-6 py-4">School & Block</th>
                  <th className="px-6 py-4">Mobile Contacts</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-xs">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="block font-semibold text-sm text-gray-855 dark:text-white">{student.fullName}</span>
                      <span className="text-[10px] text-gray-450 block mt-0.5">{student.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-medium">Roll: {student.rollNumber || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-medium truncate max-w-[200px]">{student.schoolName || 'N/A'}</span>
                      <span className="text-[10px] text-gray-450 block mt-0.5">{student.block ? `${student.block}, ` : ''}{student.district}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-medium">Mob: {student.mobileNumber || 'N/A'}</span>
                      <span className="text-[10px] text-gray-450 block mt-0.5">Parent: {student.parentName || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        student.isSuspended
                          ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700'
                      }`}>
                        {student.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2.5">
                        <button
                          onClick={() => toggleSuspendMutation.mutate(student._id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            student.isSuspended
                              ? 'border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600'
                              : 'border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600'
                          }`}
                          title={student.isSuspended ? 'Activate Account' : 'Suspend Account'}
                        >
                          {student.isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 border border-gray-250 dark:border-gray-750 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${student.fullName}?`)) {
                              deleteStudentMutation.mutate(student._id);
                            }
                          }}
                          className="p-1.5 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-rose-600"
                          title="Delete Candidate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-150 dark:border-gray-850 flex justify-between items-center text-xs">
            <span className="text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-1 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="p-1 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modals */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}></div>
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-850 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-white">
                {showAddModal ? 'Register New Candidate' : 'Modify Candidate Profile'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Candidate Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={studentForm.fullName}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border rounded-lg text-xs focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={studentForm.email}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                {showAddModal && (
                  <div>
                    <label className="block mb-1">Login Password *</label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={studentForm.password}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block mb-1">Roll Number</label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={studentForm.rollNumber}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block mb-1">School Name</label>
                  <input
                    type="text"
                    name="schoolName"
                    value={studentForm.schoolName}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block mb-1">District</label>
                  <select
                    name="district"
                    value={studentForm.district}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs focus:ring-1"
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Block (प्रखंड)</label>
                  <input
                    type="text"
                    name="block"
                    value={studentForm.block}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs focus:ring-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Section</label>
                  <input
                    type="text"
                    name="section"
                    value={studentForm.section}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs focus:ring-1"
                  />
                </div>
                <div>
                  <label className="block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    name="mobileNumber"
                    value={studentForm.mobileNumber}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs focus:ring-1"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-850 pt-3 mt-4">
                <h4 className="font-bold text-primary-600 uppercase mb-2">Parents Contacts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Parent Name</label>
                    <input
                      type="text"
                      name="parentName"
                      value={studentForm.parentName}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Parent Mobile</label>
                    <input
                      type="text"
                      name="parentMobile"
                      value={studentForm.parentMobile}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-855 border rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

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
                  disabled={addStudentMutation.isPending || editStudentMutation.isPending}
                  className="px-5 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 flex items-center justify-center gap-1.5"
                >
                  {(addStudentMutation.isPending || editStudentMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {showAddModal ? 'Register student' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManagement;
