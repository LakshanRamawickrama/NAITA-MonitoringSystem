// src/components/BulkIDCardGenerator.tsx
import React, { useState, useMemo, useRef } from 'react';
import { Printer, Download, X, Check, Search } from 'lucide-react';
import { type StudentType } from '../api/api';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { CardFront, CardBack } from './StudentIDCard';

interface BulkIDCardGeneratorProps {
  students: StudentType[];
  onClose: () => void;
}

const BulkIDCardGenerator: React.FC<BulkIDCardGeneratorProps> = ({ students, onClose }) => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [format, setFormat] = useState<'grid' | 'zip'>('grid');

  // Filters
  const [courseFilter, setCourseFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Hidden Render Ref
  const renderAreaRef = useRef<HTMLDivElement>(null);

  // State for the currently processing card
  const [processingStudent, setProcessingStudent] = useState<StudentType | null>(null);
  const [processingStep, setProcessingStep] = useState<'idle' | 'front' | 'back'>('idle');

  // Extract unique filter options
  const courses = useMemo(() => Array.from(new Set(students.map(s => s.course_name).filter(Boolean))), [students]);
  const districts = useMemo(() => Array.from(new Set(students.map(s => s.district).filter(Boolean))), [students]);
  const centers = useMemo(() => Array.from(new Set(students.map(s => s.center_name).filter(Boolean))), [students]);

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchCourse = !courseFilter || student.course_name === courseFilter;
      const matchDistrict = !districtFilter || student.district === districtFilter;
      const matchCenter = !centerFilter || student.center_name === centerFilter;
      const matchSearch = !searchQuery ||
        student.full_name_english.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.registration_no?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCourse && matchDistrict && matchCenter && matchSearch;
    });
  }, [students, courseFilter, districtFilter, centerFilter, searchQuery]);

  // Selection Logic
  const toggleStudent = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAll = () => {
    const filteredIds = filteredStudents.map(s => s.id!).filter(Boolean);
    const allSelected = filteredIds.every(id => selectedStudents.includes(id));

    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudents(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Helper: Generate QR Data (Duplicated/Shared logic)
  const generateQRData = (student: StudentType) => {
    return JSON.stringify({
      student_id: student.id!,
      registration_no: student.registration_no,
      full_name: student.full_name_english,
      nic_id: student.nic_id,
      course_name: student.course_name || 'Not assigned',
      center_name: student.center_name || 'Not assigned',
      enrollment_status: student.enrollment_status || 'Pending',
      timestamp: new Date().toISOString()
    });
  };

  const waitForRender = () => new Promise(resolve => setTimeout(resolve, 300)); // Wait for generic render/image load

  const handleGenerate = async () => {
    const studentsToProcess = students.filter(s => selectedStudents.includes(s.id!));
    if (studentsToProcess.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: studentsToProcess.length });

    try {
      if (format === 'grid') {
        const doc = new jsPDF('p', 'mm', 'a4'); // Portrait
        const cardWidth = 85.6;
        const cardHeight = 54;
        const startX = 10;
        const startY = 10;
        const gapY = 10;
        const gapX = 5;

        // Process loop
        let row = 0;

        for (let i = 0; i < studentsToProcess.length; i++) {
          const student = studentsToProcess[i];
          setProgress({ current: i + 1, total: studentsToProcess.length });

          // 1. Mount Front
          setProcessingStudent(student);
          setProcessingStep('front');
          await waitForRender();

          const frontNode = document.getElementById('bulk-render-front');
          if (!frontNode) throw new Error('Render node missing');
          const frontCanvas = await html2canvas(frontNode, { scale: 3, useCORS: true, logging: false });
          const frontImg = frontCanvas.toDataURL('image/png');

          // 2. Mount Back
          setProcessingStep('back');
          await waitForRender();

          const backNode = document.getElementById('bulk-render-back');
          if (!backNode) throw new Error('Render node missing');
          const backCanvas = await html2canvas(backNode, { scale: 3, useCORS: true, logging: false });
          const backImg = backCanvas.toDataURL('image/png');

          // 3. Add to PDF
          if (i > 0 && row === 0) doc.addPage();

          const currentY = startY + (row * (cardHeight + gapY));

          doc.addImage(frontImg, 'PNG', startX, currentY, cardWidth, cardHeight);
          doc.addImage(backImg, 'PNG', startX + cardWidth + gapX, currentY, cardWidth, cardHeight);

          row++;
          if (row >= 4) row = 0;
        }

        doc.save(`naita_bulk_ids_grid_${new Date().getTime()}.pdf`);

      } else {
        // ZIP Format
        const zip = new JSZip();

        for (let i = 0; i < studentsToProcess.length; i++) {
          const student = studentsToProcess[i];
          setProgress({ current: i + 1, total: studentsToProcess.length });

          const doc = new jsPDF('l', 'mm', 'a4');

          // Capture Front
          setProcessingStudent(student);
          setProcessingStep('front');
          await waitForRender();

          const frontNode = document.getElementById('bulk-render-front');
          if (!frontNode) continue;
          const frontCanvas = await html2canvas(frontNode, { scale: 3, useCORS: true, logging: false });
          const frontImg = frontCanvas.toDataURL('image/png');

          // Capture Back
          setProcessingStep('back');
          await waitForRender();
          const backNode = document.getElementById('bulk-render-back');
          if (!backNode) continue;
          const backCanvas = await html2canvas(backNode, { scale: 3, useCORS: true, logging: false });
          const backImg = backCanvas.toDataURL('image/png');

          // Add to PDF
          // Centered on A4 Landscape
          const cardWidth = 85.6;
          const cardHeight = 54;
          const startX = (297 - (cardWidth * 2 + 10)) / 2;
          const startY = (210 - cardHeight) / 2;

          doc.addImage(frontImg, 'PNG', startX, startY, cardWidth, cardHeight);
          doc.addImage(backImg, 'PNG', startX + cardWidth + 10, startY, cardWidth, cardHeight);

          const pdfBlob = doc.output('blob');
          zip.file(`${student.registration_no || student.id}.pdf`, pdfBlob);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `naita_ids_individual_${new Date().getTime()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      onClose();
    } catch (error) {
      console.error('Error generating cards:', error);
      alert('Failed to generate cards. See console for details.');
    } finally {
      setLoading(false);
      setProcessingStudent(null);
      setProcessingStep('idle');
      setProgress(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bulk ID Card Generator</h2>
              <p className="text-sm text-gray-600">Select students and choose output format</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 flex-1 overflow-hidden flex flex-col">
            {/* Filters */}
            <div className="grid grid-cols-4 gap-3 mb-4 bg-gray-50 p-3 rounded-lg border">
              <div className="col-span-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">Search</label>
                <div className="relative mt-1">
                  <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Name or Reg No..."
                    className="w-full pl-8 pr-2 py-1.5 text-sm border rounded"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Course</label>
                <select
                  className="w-full mt-1 py-1.5 text-sm border rounded"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">District</label>
                <select
                  className="w-full mt-1 py-1.5 text-sm border rounded"
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                >
                  <option value="">All Districts</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Center</label>
                <select
                  className="w-full mt-1 py-1.5 text-sm border rounded"
                  value={centerFilter}
                  onChange={(e) => setCenterFilter(e.target.value)}
                >
                  <option value="">All Centers</option>
                  {centers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Student Table */}
            <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
              <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <button onClick={selectAll} className="font-semibold text-sm text-blue-600 hover:underline">
                    {filteredStudents.every(s => selectedStudents.includes(s.id!)) && filteredStudents.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-500">
                    ({selectedStudents.length} selected)
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Showing {filteredStudents.length} students
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No students match the filters.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reg No</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student) => (
                        <tr
                          key={student.id}
                          className={`hover:bg-gray-50 cursor-pointer ${selectedStudents.includes(student.id!) ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleStudent(student.id!)}
                        >
                          <td className="px-3 py-2">
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedStudents.includes(student.id!) ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                              {selectedStudents.includes(student.id!) && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">{student.full_name_english}</td>
                          <td className="px-3 py-2 text-sm text-green-600 font-mono">{student.registration_no}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{student.course_name}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{student.center_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Format Selection */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <button
                onClick={() => setFormat('grid')}
                className={`p-3 border rounded-lg flex flex-col items-center justify-center transition ${format === 'grid' ? 'bg-green-50 border-green-500 text-green-700' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center space-x-2 font-bold">
                  <Printer className="w-5 h-5" />
                  <span>Grid PDF (Paper Saver)</span>
                </div>
                <div className="text-xs opacity-75 mt-1">Recommended for printing. 4 students (Front+Back) per page.</div>
              </button>

              <button
                onClick={() => setFormat('zip')}
                className={`p-3 border rounded-lg flex flex-col items-center justify-center transition ${format === 'zip' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center space-x-2 font-bold">
                  <Download className="w-5 h-5" />
                  <span>Individual Files (ZIP)</span>
                </div>
                <div className="text-xs opacity-75 mt-1">Get separate PDF files for each student.</div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            {loading && progress ? (
              <div className="text-sm text-blue-600 font-medium animate-pulse">
                Generating card {progress.current} of {progress.total}...
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                Prepare high-quality cards for printing
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || selectedStudents.length === 0}
              className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <span>
                {loading ? 'Processing...' : `Generate ${selectedStudents.length} Cards`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Render Area for Capture */}
      <div
        ref={renderAreaRef}
        style={{
          position: 'fixed',
          top: 0,
          left: -10000,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        {processingStudent && processingStep === 'front' && (
          <div id="bulk-render-front">
            <CardFront
              student={processingStudent}
              qrData={generateQRData(processingStudent)}
            />
          </div>
        )}
        {processingStudent && processingStep === 'back' && (
          <div id="bulk-render-back">
            <CardBack
              student={processingStudent}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default BulkIDCardGenerator;