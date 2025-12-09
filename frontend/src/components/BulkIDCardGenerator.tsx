// src/components/BulkIDCardGenerator.tsx
import React, { useState } from 'react';
import { Printer, Download, X, Check, Users } from 'lucide-react';
import { type StudentType, bulkGenerateIDCards } from '../api/api';

interface BulkIDCardGeneratorProps {
  students: StudentType[];
  onClose: () => void;
}

const BulkIDCardGenerator: React.FC<BulkIDCardGeneratorProps> = ({ students, onClose }) => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'multiple'>('pdf');

  const toggleStudent = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id!).filter(Boolean));
    }
  };

  const handleGenerate = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setLoading(true);
    try {
      const blob = await bulkGenerateIDCards(selectedStudents);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student_id_cards_${new Date().getTime()}${
        format === 'multiple' ? '_individual' : ''
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert(`Successfully generated ${selectedStudents.length} ID card(s)`);
      onClose();
    } catch (error) {
      console.error('Error generating bulk ID cards:', error);
      alert('Failed to generate ID cards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Bulk ID Card Generator</h2>
            <p className="text-sm text-gray-600">Generate ID cards for multiple students</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('pdf')}
                className={`p-3 border rounded-lg text-center transition ${
                  format === 'pdf'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium mb-1">Single PDF</div>
                <div className="text-xs text-gray-600">All ID cards in one file</div>
              </button>
              <button
                onClick={() => setFormat('multiple')}
                className={`p-3 border rounded-lg text-center transition ${
                  format === 'multiple'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium mb-1">Individual Files</div>
                <div className="text-xs text-gray-600">Separate files for each student</div>
              </button>
            </div>
          </div>

          {/* Selection Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {selectedStudents.length} of {students.length} selected
              </span>
            </div>
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Student List */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Select
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Registration No
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Course
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr 
                      key={student.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedStudents.includes(student.id!) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleStudent(student.id!)}
                    >
                      <td className="px-3 py-2">
                        <div className={`w-5 h-5 border rounded flex items-center justify-center ${
                          selectedStudents.includes(student.id!)
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedStudents.includes(student.id!) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-gray-900">
                          {student.full_name_english}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-green-600 font-medium">
                          {student.registration_no}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-gray-600">
                          {student.course_name || 'Not assigned'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preview Note */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              Each ID card will include: Student photo, registration number, personal details, 
              course information, center details, and a unique QR code for attendance tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || selectedStudents.length === 0}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                {format === 'pdf' ? (
                  <Printer className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  Generate {selectedStudents.length} ID Card{selectedStudents.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkIDCardGenerator;