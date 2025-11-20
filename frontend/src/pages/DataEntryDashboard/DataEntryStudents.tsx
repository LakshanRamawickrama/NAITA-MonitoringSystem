// StudentDataEntry.tsx - Complete version with backend integration
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload, Edit, Trash2, User, Clock, Save, X, Eye, MapPin } from 'lucide-react';
import { 
  type StudentType, 
  type EducationalQualificationType,
  fetchStudents, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  exportStudents,
  importStudents,
  getUserDistrict,
  getUserRole
} from '../../api/api';

const StudentDataEntry: React.FC = () => {
  const [students, setStudents] = useState<StudentType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentType | null>(null);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [userDistrict, setUserDistrict] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  
  const [formData, setFormData] = useState<Partial<StudentType>>({
    full_name_english: '',
    full_name_sinhala: '',
    name_with_initials: '',
    gender: 'Male',
    date_of_birth: '',
    nic_id: '',
    address_line: '',
    district: '',
    divisional_secretariat: '',
    grama_niladhari_division: '',
    village: '',
    residence_type: '',
    mobile_no: '',
    email: '',
    ol_results: [],
    al_results: [],
    training_received: false,
    training_provider: '',
    course_vocation_name: '',
    training_duration: '',
    training_nature: 'Initial',
    training_establishment: '',
    training_placement_preference: '1st',
    registration_no: '',
    date_of_application: new Date().toISOString().split('T')[0],
  });

  const [newOlSubject, setNewOlSubject] = useState('');
  const [newOlGrade, setNewOlGrade] = useState('');
  const [newOlYear, setNewOlYear] = useState('');
  const [newAlSubject, setNewAlSubject] = useState('');
  const [newAlGrade, setNewAlGrade] = useState('');
  const [newAlYear, setNewAlYear] = useState('');

  // Load user info and students
  useEffect(() => {
    const loadUserInfo = () => {
      setUserDistrict(getUserDistrict());
      setUserRole(getUserRole());
      
      // Auto-set district for data entry officers in form
      if (getUserRole() === 'data_entry' && getUserDistrict()) {
        setFormData(prev => ({
          ...prev,
          district: getUserDistrict()
        }));
      }
    };

    loadUserInfo();
    loadStudents();
  }, []);

  // Fetch students from backend
  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await fetchStudents(searchTerm);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Error loading students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingStudent && editingStudent.id) {
        // Update existing student
        const updatedStudent = await updateStudent(editingStudent.id, formData);
        setStudents(students.map(student => 
          student.id === editingStudent.id ? updatedStudent : student
        ));
      } else {
        // Add new student
        const newStudent = await createStudent(formData);
        setStudents([...students, newStudent]);
      }

      resetForm();
      setShowForm(false);
      setEditingStudent(null);
    } catch (error: any) {
      console.error('Error saving student:', error);
      alert(error.response?.data?.detail || 'Error saving student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await deleteStudent(id);
      setStudents(students.filter(student => student.id !== id));
    } catch (error: any) {
      console.error('Error deleting student:', error);
      alert(error.response?.data?.detail || 'Error deleting student. Please try again.');
    }
  };

  const handleEdit = (student: StudentType) => {
    setFormData({
      ...student,
      ol_results: student.ol_results || [],
      al_results: student.al_results || [],
    });
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleViewDetails = (student: StudentType) => {
    setSelectedStudent(student);
    setShowDetails(true);
  };

  const resetForm = () => {
    setFormData({
      full_name_english: '',
      full_name_sinhala: '',
      name_with_initials: '',
      gender: 'Male',
      date_of_birth: '',
      nic_id: '',
      address_line: '',
      district: userRole === 'data_entry' ? getUserDistrict() : '',
      divisional_secretariat: '',
      grama_niladhari_division: '',
      village: '',
      residence_type: '',
      mobile_no: '',
      email: '',
      ol_results: [],
      al_results: [],
      training_received: false,
      training_provider: '',
      course_vocation_name: '',
      training_duration: '',
      training_nature: 'Initial',
      training_establishment: '',
      training_placement_preference: '1st',
      registration_no: '',
      date_of_application: new Date().toISOString().split('T')[0],
    });
    setEditingStudent(null);
  };

  const addOlResult = () => {
    if (newOlSubject && newOlGrade && newOlYear) {
      const newResult: EducationalQualificationType = {
        subject: newOlSubject,
        grade: newOlGrade,
        year: parseInt(newOlYear),
        type: 'OL'
      };
      
      setFormData(prev => ({
        ...prev,
        ol_results: [...(prev.ol_results || []), newResult]
      }));
      setNewOlSubject('');
      setNewOlGrade('');
      setNewOlYear('');
    }
  };

  const addAlResult = () => {
    if (newAlSubject && newAlGrade && newAlYear) {
      const newResult: EducationalQualificationType = {
        subject: newAlSubject,
        grade: newAlGrade,
        year: parseInt(newAlYear),
        type: 'AL'
      };
      
      setFormData(prev => ({
        ...prev,
        al_results: [...(prev.al_results || []), newResult]
      }));
      setNewAlSubject('');
      setNewAlGrade('');
      setNewAlYear('');
    }
  };

  const removeOlResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ol_results: (prev.ol_results || []).filter((_, i) => i !== index)
    }));
  };

  const removeAlResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      al_results: (prev.al_results || []).filter((_, i) => i !== index)
    }));
  };

  const handleExport = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      const blob = await exportStudents(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `students.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting students:', error);
      alert('Error exporting students. Please try again.');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportLoading(true);
      const result = await importStudents(file);
      
      if (result.errors.length > 0) {
        alert(`Imported ${result.imported} students with ${result.errors.length} errors. Check console for details.`);
        console.error('Import errors:', result.errors);
      } else {
        alert(`Successfully imported ${result.imported} students`);
      }
      
      // Reload students
      loadStudents();
      
      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error importing students:', error);
      alert(error.response?.data?.detail || 'Error importing students. Please try again.');
    } finally {
      setImportLoading(false);
    }
  };

  const filteredStudents = students; // Already filtered by backend

  const recentStudents = [...students]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with District Info */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Data Entry</h1>
            <p className="text-gray-600">Manage student records and information</p>
            {userDistrict && (
              <div className="flex items-center mt-1 text-sm text-green-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span>District: {userDistrict}</span>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => handleExport('csv')}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <label className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{importLoading ? 'Importing...' : 'Import'}</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                disabled={importLoading}
              />
            </label>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Student Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name (English) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.full_name_english || ''}
                          onChange={(e) => setFormData({ ...formData, full_name_english: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name (Sinhala/Tamil) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.full_name_sinhala || ''}
                          onChange={(e) => setFormData({ ...formData, full_name_sinhala: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name with Initials *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name_with_initials || ''}
                          onChange={(e) => setFormData({ ...formData, name_with_initials: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender *
                        </label>
                        <select
                          value={formData.gender || 'Male'}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.date_of_birth || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NIC/ID Card No. *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nic_id || ''}
                          onChange={(e) => setFormData({ ...formData, nic_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line
                        </label>
                        <input
                          type="text"
                          value={formData.address_line || ''}
                          onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          District {userRole === 'data_entry' && '(Auto-set)'}
                        </label>
                        <input
                          type="text"
                          value={formData.district || ''}
                          onChange={(e) => {
                            if (userRole !== 'data_entry') {
                              setFormData({ ...formData, district: e.target.value })
                            }
                          }}
                          readOnly={userRole === 'data_entry'}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            userRole === 'data_entry' ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        />
                        {userRole === 'data_entry' && (
                          <p className="text-xs text-gray-500 mt-1">
                            District is automatically set to your assigned district
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Divisional Secretariat
                        </label>
                        <input
                          type="text"
                          value={formData.divisional_secretariat || ''}
                          onChange={(e) => setFormData({ ...formData, divisional_secretariat: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grama Niladhari Division
                        </label>
                        <input
                          type="text"
                          value={formData.grama_niladhari_division || ''}
                          onChange={(e) => setFormData({ ...formData, grama_niladhari_division: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Village
                        </label>
                        <input
                          type="text"
                          value={formData.village || ''}
                          onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Residence Type
                        </label>
                        <input
                          type="text"
                          value={formData.residence_type || ''}
                          onChange={(e) => setFormData({ ...formData, residence_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile No. *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.mobile_no || ''}
                          onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Application Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Application Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registration No. *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.registration_no || ''}
                          onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Auto-generated if left empty"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to auto-generate registration number
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Application *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.date_of_application || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_application: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Educational Qualifications */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Educational Qualifications</h3>
                    
                    {/* O/L Results */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-3">G.C.E. O/L Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Subject"
                          value={newOlSubject}
                          onChange={(e) => setNewOlSubject(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="Grade"
                          value={newOlGrade}
                          onChange={(e) => setNewOlGrade(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="Year"
                            value={newOlYear}
                            onChange={(e) => setNewOlYear(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <button
                            type="button"
                            onClick={addOlResult}
                            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(formData.ol_results || []).map((result, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span>{result.subject} - {result.grade} ({result.year})</span>
                            <button
                              type="button"
                              onClick={() => removeOlResult(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* A/L Results */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">G.C.E. A/L Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Subject"
                          value={newAlSubject}
                          onChange={(e) => setNewAlSubject(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="Grade"
                          value={newAlGrade}
                          onChange={(e) => setNewAlGrade(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="Year"
                            value={newAlYear}
                            onChange={(e) => setNewAlYear(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <button
                            type="button"
                            onClick={addAlResult}
                            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(formData.al_results || []).map((result, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span>{result.subject} - {result.grade} ({result.year})</span>
                            <button
                              type="button"
                              onClick={() => removeAlResult(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Training Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Training Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.training_received || false}
                          onChange={(e) => setFormData({ ...formData, training_received: e.target.checked })}
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Training Received
                        </label>
                      </div>
                      
                      {(formData.training_received) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Training Provider
                            </label>
                            <input
                              type="text"
                              value={formData.training_provider || ''}
                              onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Course/Vocation Name
                            </label>
                            <input
                              type="text"
                              value={formData.course_vocation_name || ''}
                              onChange={(e) => setFormData({ ...formData, course_vocation_name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={formData.training_duration || ''}
                              onChange={(e) => setFormData({ ...formData, training_duration: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nature of Training
                            </label>
                            <select
                              value={formData.training_nature || 'Initial'}
                              onChange={(e) => setFormData({ ...formData, training_nature: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="Initial">Initial</option>
                              <option value="Further">Further</option>
                              <option value="Re-training">Re-training</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Training Establishment
                            </label>
                            <input
                              type="text"
                              value={formData.training_establishment || ''}
                              onChange={(e) => setFormData({ ...formData, training_establishment: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Placement Preference
                            </label>
                            <select
                              value={formData.training_placement_preference || '1st'}
                              onChange={(e) => setFormData({ ...formData, training_placement_preference: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="1st">1st Preference</option>
                              <option value="2nd">2nd Preference</option>
                              <option value="3rd">3rd Preference</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loading ? 'Saving...' : (editingStudent ? 'Update' : 'Save')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Student Details Modal */}
        {showDetails && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Student Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Application Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Application Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration No.</label>
                        <p className="text-lg font-bold text-green-600">{selectedStudent.registration_no}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Application</label>
                        <p className="text-gray-900">{selectedStudent.date_of_application}</p>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (English)</label>
                        <p className="text-gray-900">{selectedStudent.full_name_english}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Sinhala/Tamil)</label>
                        <p className="text-gray-900">{selectedStudent.full_name_sinhala}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name with Initials</label>
                        <p className="text-gray-900">{selectedStudent.name_with_initials}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <p className="text-gray-900">{selectedStudent.gender}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <p className="text-gray-900">{selectedStudent.date_of_birth}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NIC/ID Card No.</label>
                        <p className="text-gray-900">{selectedStudent.nic_id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line</label>
                        <p className="text-gray-900">{selectedStudent.address_line}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                        <p className="text-gray-900">{selectedStudent.district}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Divisional Secretariat</label>
                        <p className="text-gray-900">{selectedStudent.divisional_secretariat}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grama Niladhari Division</label>
                        <p className="text-gray-900">{selectedStudent.grama_niladhari_division}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                        <p className="text-gray-900">{selectedStudent.village}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Residence Type</label>
                        <p className="text-gray-900">{selectedStudent.residence_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No.</label>
                        <p className="text-gray-900">{selectedStudent.mobile_no}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{selectedStudent.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Educational Qualifications */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Educational Qualifications</h3>
                    
                    {/* O/L Results */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-3">G.C.E. O/L Results</h4>
                      <div className="space-y-2">
                        {selectedStudent.ol_results.map((result, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span>{result.subject} - {result.grade} ({result.year})</span>
                          </div>
                        ))}
                        {selectedStudent.ol_results.length === 0 && (
                          <p className="text-gray-500 text-sm">No O/L results recorded</p>
                        )}
                      </div>
                    </div>

                    {/* A/L Results */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">G.C.E. A/L Results</h4>
                      <div className="space-y-2">
                        {selectedStudent.al_results.map((result, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span>{result.subject} - {result.grade} ({result.year})</span>
                          </div>
                        ))}
                        {selectedStudent.al_results.length === 0 && (
                          <p className="text-gray-500 text-sm">No A/L results recorded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Training Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Training Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <label className="text-sm font-medium text-gray-700 mr-2">Training Received:</label>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedStudent.training_received ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedStudent.training_received ? 'Yes' : 'No'}
                        </span>
                      </div>
                      
                      {selectedStudent.training_received && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Training Provider</label>
                            <p className="text-gray-900">{selectedStudent.training_provider}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course/Vocation Name</label>
                            <p className="text-gray-900">{selectedStudent.course_vocation_name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                            <p className="text-gray-900">{selectedStudent.training_duration}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Training</label>
                            <p className="text-gray-900">{selectedStudent.training_nature}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Training Establishment</label>
                            <p className="text-gray-900">{selectedStudent.training_establishment}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Placement Preference</label>
                            <p className="text-gray-900">{selectedStudent.training_placement_preference} Preference</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, NIC, initials, district, or registration no..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Recent Records */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-green-600" />
            Recent Records
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recentStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between hover:shadow-md transition cursor-pointer"
                onClick={() => handleViewDetails(student)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{student.full_name_english}</p>
                    <p className="text-sm text-gray-500">{student.registration_no}</p>
                    <p className="text-xs text-gray-400">{student.nic_id}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  student.training_received ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {student.training_received ? 'Trained' : 'Not Trained'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration & Student Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Education
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Training & Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-green-600">{student.registration_no}</div>
                          <div className="text-sm font-medium text-gray-900">{student.full_name_english}</div>
                          <div className="text-xs text-gray-500">{student.name_with_initials}</div>
                          <div className="text-xs text-gray-400">NIC: {student.nic_id}</div>
                          <div className="text-xs text-gray-400">Gender: {student.gender} | DOB: {student.date_of_birth}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{student.mobile_no}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{student.district}</div>
                      <div className="text-xs text-gray-500">{student.divisional_secretariat}</div>
                      <div className="text-xs text-gray-400">{student.village}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        O/L: {student.ol_results.length} subjects
                      </div>
                      <div className="text-sm text-gray-900">
                        A/L: {student.al_results.length} subjects
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.training_received
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.training_received ? (
                            <>
                              <span>Trained</span>
                              <div className="text-xs ml-1">({student.course_vocation_name})</div>
                            </>
                          ) : (
                            'Not Trained'
                          )}
                        </span>
                      </div>
                      {student.training_received && (
                        <div className="text-xs text-gray-500 mb-1">
                          {student.training_provider} • {student.training_duration}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        Applied: {student.date_of_application}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewDetails(student)}
                          className="text-blue-600 hover:text-blue-900 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(student)}
                          className="text-green-600 hover:text-green-900 transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => student.id && handleDelete(student.id)}
                          className="text-red-600 hover:text-red-900 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-6">
                      {loading ? 'Loading...' : 'No student records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDataEntry;