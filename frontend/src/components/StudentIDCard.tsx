// src/components/StudentIDCard.tsx
import React, { useState, useEffect } from 'react';
import { User, QrCode, MapPin, Building, BookOpen, Calendar, Phone, Mail, Download, Printer } from 'lucide-react';
import { type StudentType, generateStudentIDCard } from '../api/api';
import { QRCodeSVG } from 'qrcode.react';

interface StudentIDCardProps {
  student: StudentType;
  onClose?: () => void;
  showActions?: boolean;
}

const StudentIDCard: React.FC<StudentIDCardProps> = ({ student, onClose, showActions = true }) => {
  const [qrData, setQRData] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateQRData();
  }, [student]);

  const generateQRData = async () => {
    try {
      const data = {
        student_id: student.id!,
        registration_no: student.registration_no,
        full_name: student.full_name_english,
        nic_id: student.nic_id,
        course_name: student.course_name || 'Not assigned',
        center_name: student.center_name || 'Not assigned',
        enrollment_status: student.enrollment_status || 'Pending',
        timestamp: new Date().toISOString()
      };
      setQRData(JSON.stringify(data));
    } catch (error) {
      console.error('Error generating QR data:', error);
    }
  };

  const handleDownloadIDCard = async () => {
    if (!student.id) return;
    
    setLoading(true);
    try {
      const blob = await generateStudentIDCard(student.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student_id_card_${student.registration_no}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading ID card:', error);
      alert('Failed to download ID card');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('student-id-card');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Student ID Card - ${student.full_name_english}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .id-card { width: 85mm; height: 54mm; border: 2px solid #333; border-radius: 8px; padding: 10px; background: white; }
              .header { background: linear-gradient(135deg, #4CAF50, #2196F3); color: white; padding: 8px; border-radius: 5px 5px 0 0; margin: -10px -10px 10px -10px; }
              .photo-section { width: 80px; height: 80px; border: 2px solid #ddd; border-radius: 50%; overflow: hidden; background: #f5f5f5; }
              .qr-section { width: 80px; height: 80px; padding: 5px; background: white; border: 1px solid #ddd; }
              .details { font-size: 10px; line-height: 1.3; }
              .label { font-weight: bold; color: #666; }
              @media print { 
                body { -webkit-print-color-adjust: exact; }
                .id-card { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow?.document.close();
      printWindow?.focus();
      setTimeout(() => {
        printWindow?.print();
        printWindow?.close();
      }, 250);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 max-w-md mx-auto">
      <div id="student-id-card" className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-3 rounded-lg text-center">
          <h2 className="text-lg font-bold">Student ID Card</h2>
          <p className="text-sm opacity-90">Vocational Training Authority</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Student Photo */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-green-300 overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center mb-2">
              {student.profile_photo_url ? (
                <img 
                  src={student.profile_photo_url} 
                  alt={student.full_name_english}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-green-600" />
              )}
            </div>
            <p className="text-xs text-center font-semibold text-gray-700">Photo</p>
          </div>

          {/* Student Details */}
          <div className="col-span-2 space-y-2">
            <div>
              <p className="text-sm font-bold text-gray-900">{student.full_name_english}</p>
              <p className="text-xs text-gray-600">{student.name_with_initials}</p>
            </div>
            
            <div className="space-y-1 text-xs">
              <p className="flex items-center">
                <span className="font-semibold text-gray-700 mr-2">Reg No:</span>
                <span className="text-green-600 font-bold">{student.registration_no}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-700 mr-2">NIC:</span>
                <span>{student.nic_id}</span>
              </p>
              <p className="flex items-center">
                <Phone className="w-3 h-3 mr-1" />
                <span>{student.mobile_no}</span>
              </p>
              {student.email && (
                <p className="flex items-center">
                  <Mail className="w-3 h-3 mr-1" />
                  <span className="truncate">{student.email}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Course & Center Info */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-semibold text-gray-700 flex items-center">
                <BookOpen className="w-3 h-3 mr-1" /> Course:
              </p>
              <p className="truncate">{student.course_name || 'Not assigned'}</p>
              {student.course_code && (
                <p className="text-green-600 font-medium">Code: {student.course_code}</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-700 flex items-center">
                <Building className="w-3 h-3 mr-1" /> Center:
              </p>
              <p className="truncate">{student.center_name || 'Not assigned'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 flex items-center">
                <MapPin className="w-3 h-3 mr-1" /> District:
              </p>
              <p>{student.district}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 flex items-center">
                <Calendar className="w-3 h-3 mr-1" /> Status:
              </p>
              <p className={`font-medium ${
                student.enrollment_status === 'Enrolled' ? 'text-green-600' :
                student.enrollment_status === 'Completed' ? 'text-blue-600' :
                'text-yellow-600'
              }`}>
                {student.enrollment_status || 'Pending'}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center">
              <QrCode className="w-4 h-4 mr-2" />
              Student QR Code
            </h3>
            <p className="text-xs text-gray-500">Scan for attendance</p>
          </div>
          
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-lg border-2 border-green-300">
              {qrData && (
                <QRCodeSVG
                  value={qrData}
                  size={120}
                  level="H"
                  includeMargin={true}
                  fgColor="#1f2937"
                  bgColor="#ffffff"
                />
              )}
            </div>
          </div>
          
          <div className="text-center mt-2">
            <p className="text-xs text-gray-600">Student ID: {student.id}</p>
            <p className="text-xs text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Validity Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <p className="text-xs text-yellow-800 text-center">
            This ID card is valid until the completion of the course. Report lost cards immediately.
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
          <button
            onClick={handleDownloadIDCard}
            disabled={loading}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{loading ? 'Downloading...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentIDCard;