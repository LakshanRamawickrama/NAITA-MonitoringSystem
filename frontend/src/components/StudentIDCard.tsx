// src/components/StudentIDCard.tsx
import React, { useState, useEffect } from 'react';
import { User, MapPin, Building, BookOpen, Calendar, Download, Printer } from 'lucide-react';
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
  const [isFront, setIsFront] = useState(true);

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
    const frontContent = document.getElementById('student-id-front')?.innerHTML || '';
    const backContent = document.getElementById('student-id-back')?.innerHTML || '';
    
    if (frontContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Student ID Card - ${student.full_name_english}</title>
            <style>
              @page {
                size: A4 landscape;
                margin: 0;
              }
              body { 
                font-family: 'Arial', sans-serif; 
                margin: 0; 
                padding: 0;
                background: #f5f5f5;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              .id-card-container {
                width: 85mm;
                height: 54mm;
                background: white;
                border: 2px solid #000;
                border-radius: 5px;
                padding: 4px;
                page-break-inside: avoid;
                break-inside: avoid;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                position: relative;
              }
              .print-header {
                text-align: center;
                padding: 2px 0;
                border-bottom: 2px solid #000;
                margin-bottom: 4px;
              }
              .print-logo {
                height: 20px;
                width: auto;
                display: inline-block;
                vertical-align: middle;
                margin-right: 4px;
                filter: grayscale(100%);
              }
              .print-title {
                font-size: 12px;
                font-weight: bold;
                color: #000;
                display: inline-block;
                vertical-align: middle;
              }
              .print-subtitle {
                font-size: 8px;
                color: #333;
                margin-top: 1px;
              }
              .student-photo {
                width: 40px;
                height: 40px;
                border: 1px solid #000;
                border-radius: 50%;
                overflow: hidden;
                background: #f0f0f0;
              }
              .qr-code {
                width: 50px;
                height: 50px;
                border: 1px solid #000;
                padding: 2px;
                background: white;
              }
              .print-section {
                border: 1px solid #999;
                border-radius: 3px;
                padding: 3px;
                margin-bottom: 4px;
                background: #f9f9f9;
              }
              .print-label {
                font-weight: bold;
                color: #000;
                font-size: 8px;
              }
              .print-value {
                color: #333;
                font-size: 8px;
              }
              .validity-note {
                border: 1px solid #ccc;
                border-radius: 2px;
                padding: 2px;
                font-size: 7px;
                text-align: center;
                background: #fff;
                margin-top: 2px;
              }
              .back-content {
                page-break-before: always;
              }
              @media print {
                body * {
                  visibility: hidden;
                }
                #student-id-card-print, #student-id-card-print * {
                  visibility: visible;
                }
                #student-id-card-print {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  height: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div id="student-id-card-print">
              <div class="id-card-container front">
                ${frontContent}
              </div>
              <div class="id-card-container back-content">
                ${backContent}
              </div>
            </div>
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
    <div className="bg-white rounded-lg shadow p-4 max-w-lg mx-auto">
      <div className="relative w-[340px] h-[210px] mx-auto" style={{ perspective: '1000px' }}>
        <div 
          className="absolute w-full h-full transition-transform duration-500 ease-in-out"
          style={{ transformStyle: 'preserve-3d', transform: isFront ? 'rotateY(0deg)' : 'rotateY(180deg)' }}
        >
          {/* Front Side */}
          <div 
            id="student-id-front"
            className="absolute w-full h-full bg-white border-2 border-black rounded-lg p-2 backface-hidden overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="border-b-2 border-black pb-1 mb-1 text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-800 bg-white">
                    <img 
                      src="/naita-logo.png" 
                      alt="NAITA Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-black">STUDENT ID CARD</h2>
                    <p className="text-[8px] text-gray-700">Vocational Training Authority</p>
                    <p className="text-[8px] text-gray-600">NAITA Logistics Program</p>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex flex-row flex-1 space-x-2">
                {/* Photo and Name */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-2 border-black overflow-hidden bg-gray-100 flex items-center justify-center mb-1">
                    {student.profile_photo_url ? (
                      <img 
                        src={student.profile_photo_url} 
                        alt={student.full_name_english}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                  <p className="text-[8px] font-bold text-gray-800">PHOTO</p>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-0.5 text-[9px]">
                  <p className="font-bold text-black border-b border-gray-300 pb-0.5">{student.full_name_english}</p>
                  <div className="flex items-start">
                    <span className="font-bold text-gray-800 mr-1 min-w-[40px]">Reg No:</span>
                    <span className="font-bold text-black">{student.registration_no}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold text-gray-800 mr-1 min-w-[40px]">NIC:</span>
                    <span className="text-black">{student.nic_id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
                    <div className="flex items-center">
                      <BookOpen className="w-3 h-3 mr-1 text-gray-700" />
                      <span>{student.course_name || 'Not assigned'}</span>
                    </div>
                    <div className="flex items-center">
                      <Building className="w-3 h-3 mr-1 text-gray-700" />
                      <span>{student.center_name || 'Not assigned'}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-gray-700" />
                      <span>{student.district}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-gray-700" />
                      <span>{student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="border-2 border-black p-0.5 bg-white mb-1">
                    {qrData && (
                      <QRCodeSVG
                        value={qrData}
                        size={60}
                        level="H"
                        includeMargin={true}
                        fgColor="#000000"
                        bgColor="#ffffff"
                      />
                    )}
                  </div>
                  <p className="text-[8px] text-gray-600">Scan to verify</p>
                  <p className="text-[8px] text-gray-700">ID: {student.id}</p>
                </div>
              </div>

              {/* Signature Area */}
              <div className="flex justify-between items-end text-[8px] mt-1 border-t border-dashed border-gray-400 pt-0.5">
                <div>
                  <p className="font-bold text-black">STUDENT SIGN</p>
                  <div className="border-t border-gray-400 w-16"></div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-black">AUTHORIZED SIGN</p>
                  <div className="border-t border-gray-400 w-16 ml-auto"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Back Side */}
          <div 
            id="student-id-back"
            className="absolute w-full h-full bg-white border-2 border-black rounded-lg p-2 backface-hidden overflow-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="border-b-2 border-black pb-1 mb-1 text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-800 bg-white">
                    <img 
                      src="/naita-logo.png" 
                      alt="NAITA Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-black">STUDENT ID CARD</h2>
                    <p className="text-[8px] text-gray-700">Vocational Training Authority</p>
                    <p className="text-[8px] text-gray-600">NAITA Logistics Program</p>
                  </div>
                </div>
              </div>

              {/* Back Content */}
              <div className="flex-1 space-y-1 text-[9px] text-gray-800">
                <p className="font-bold text-center">Terms and Conditions</p>
                <p>This card is the property of NAITA and must be returned upon completion of the course or upon request.</p>
                <p>Report loss or theft immediately to the center coordinator.</p>
                <p>Valid only during the course duration. Misuse may result in disciplinary action.</p>
                <p>If found, please return to:</p>
                <p>NAITA, 971 Sri Jayawardenepura Mawatha, Welikada, Rajagiriya, Sri Lanka</p>
                <p>Contact: +94 11 288 8782 | info@naita.gov.lk</p>
              </div>

              {/* Footer */}
              <div className="text-center text-[8px] border-t border-dashed border-gray-400 pt-0.5">
                <p>www.naita.gov.lk</p>
                <p>Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setIsFront(!isFront)}
          className="px-4 py-2 border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        >
          Flip Card
        </button>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-300">
          <button
            onClick={handleDownloadIDCard}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{loading ? 'Downloading...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print (Duplex for both sides)</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-100 transition"
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