// src/components/StudentIDCard.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, MapPin, Building, BookOpen, Calendar, Download, Printer } from 'lucide-react';
import { type StudentType } from '../api/api';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface StudentIDCardProps {
  student: StudentType;
  onClose?: () => void;
  showActions?: boolean;
}

// Exported for Bulk Generator
export interface CardProps {
  student: StudentType;
  qrData?: string;
}

export const CardFront: React.FC<CardProps> = ({ student, qrData }) => (
  <div className="w-[340px] h-[210px] bg-white border-2 border-black rounded-lg p-2 overflow-hidden relative">
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
);

export const CardBack: React.FC<CardProps> = () => (
  <div className="w-[340px] h-[210px] bg-white border-2 border-black rounded-lg p-2 overflow-hidden relative">
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
      <div className="flex-1 space-y-0.5 text-[7px] text-gray-800 leading-tight">
        <p className="font-bold text-center border-b border-gray-200 pb-0.5 mb-0.5">Terms and Conditions</p>
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
);

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
    setLoading(true);
    try {
      // Get the elements to capture
      const frontElement = document.getElementById('printable-card-front');
      const backElement = document.getElementById('printable-card-back');

      if (!frontElement || !backElement) {
        throw new Error('Card elements not found');
      }

      // Capture front side
      const frontCanvas = await html2canvas(frontElement, { scale: 2, useCORS: true });
      const frontImgData = frontCanvas.toDataURL('image/png');

      // Capture back side
      const backCanvas = await html2canvas(backElement, { scale: 2, useCORS: true });
      const backImgData = backCanvas.toDataURL('image/png');

      // Create PDF
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape, mm, A4

      // A4 dimensions: 297mm x 210mm
      // Card dimensions: 85mm x 54mm (standard ID card)

      const cardWidth = 85;
      const cardHeight = 54;

      // Calculate centering for A4 Landscape (297mm x 210mm)
      // Gap between cards = 10mm
      const gap = 10;
      const totalWidth = (cardWidth * 2) + gap;

      const startX = (297 - totalWidth) / 2;
      const startY = (210 - cardHeight) / 2;

      // Add Front
      pdf.setFontSize(10);
      // Center title above cards
      const title = `Student ID Card - ${student.full_name_english}`;
      const titleWidth = pdf.getStringUnitWidth(title) * 10 / pdf.internal.scaleFactor;
      pdf.text(title, (297 - titleWidth) / 2, startY - 10);

      pdf.addImage(frontImgData, 'PNG', startX, startY, cardWidth, cardHeight);
      pdf.addImage(backImgData, 'PNG', startX + cardWidth + gap, startY, cardWidth, cardHeight);

      pdf.save(`student_id_card_${student.registration_no || 'naita'}.pdf`);

    } catch (error) {
      console.error('Error downloading ID card:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>
        {`
          @media print {
            body {
              visibility: hidden;
            }
            
            /* Show printable area */
            .printable-card-area {
              visibility: visible !important;
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: 100vh !important;
              z-index: 9999 !important;
              gap: 20px !important;
              background: white !important;
            }
            
            .printable-card-area * {
              visibility: visible !important;
            }
            
            @page {
              size: landscape;
              margin: 0mm;
            }
          }
        `}
      </style>

      {/* Interactive Screen View */}
      <div className="bg-white rounded-lg shadow p-4 max-w-lg mx-auto print:hidden">
        <div className="relative w-[340px] h-[210px] mx-auto" style={{ perspective: '1000px' }}>
          <div
            className="absolute w-full h-full transition-transform duration-500 ease-in-out"
            style={{ transformStyle: 'preserve-3d', transform: isFront ? 'rotateY(0deg)' : 'rotateY(180deg)' }}
          >
            {/* Front Side Wrapper */}
            <div
              id="student-id-front"
              className="absolute w-full h-full backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <CardFront student={student} qrData={qrData} />
            </div>

            {/* Back Side Wrapper */}
            <div
              id="student-id-back"
              className="absolute w-full h-full backface-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <CardBack student={student} />
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
          <div className="flex flex-wrap justify-end gap-2 mt-4 pt-4 border-t border-gray-300">
            <button
              onClick={handleDownloadIDCard}
              disabled={loading}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-black text-white px-3 py-1.5 text-sm rounded-lg transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Generating...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 text-sm rounded-lg transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hidden Print/Download View - Off-screen but rendered via Portal */}
      {createPortal(
        <div className="printable-card-area fixed left-[-10000px] top-0 flex gap-4">
          <div id="printable-card-front">
            <CardFront student={student} qrData={qrData} />
          </div>
          <div id="printable-card-back">
            <CardBack student={student} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default StudentIDCard;
