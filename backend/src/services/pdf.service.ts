import { jsPDF } from 'jspdf';
import { Fee, Student, User, Room, RoomAllocation } from '@prisma/client';

type FeeWithDetails = Fee & {
  student: Student & { user: User };
  roomAllocation: RoomAllocation & { room: Room };
};

export class PdfService {
  static generateInvoicePdf(fee: FeeWithDetails, paymentRef?: string, paymentDate?: Date): Buffer {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    // Color palette
    const darkColor = '#1f2937'; // Slate-800
    const textGray = '#6b7280'; // Gray-500

    // Title & Header Banner
    doc.setFillColor(79, 70, 229); // indigo
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CLARIA UNIVERSITY HOSTEL', 15, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Official Fee Invoice & Payment Receipt', 15, 25);
    doc.text(`Billing Cycle: ${fee.billingPeriod}`, 15, 30);

    // Invoice Meta (Top Right)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 150, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice Ref: INV-${fee.id.substring(0, 8).toUpperCase()}`, 150, 23);
    doc.text(`Due Date: ${new Date(fee.dueDate).toLocaleDateString()}`, 150, 27);
    doc.text(`Status: ${fee.status}`, 150, 31);

    // Bill To Section
    doc.setTextColor(darkColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 15, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student Name: ${fee.student.user.name}`, 15, 61);
    doc.text(`Roll Number: ${fee.student.studentId}`, 15, 66);
    doc.text(`Department: ${fee.student.department} (Semester ${fee.student.semester})`, 15, 71);
    doc.text(`Email: ${fee.student.user.email}`, 15, 76);

    // Room Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Room Information:', 120, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Building: ${fee.roomAllocation.room.building}`, 120, 61);
    doc.text(`Room Number: ${fee.roomAllocation.room.roomNumber} (Floor ${fee.roomAllocation.room.floor})`, 120, 66);
    doc.text(`Room Type: ${fee.roomAllocation.room.roomType}`, 120, 71);

    // Divider Line
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.line(15, 83, 195, 83);

    // Table Header
    doc.setFillColor(243, 244, 246);
    doc.rect(15, 88, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Charge Category', 20, 93);
    doc.text('Description', 70, 93);
    doc.text('Amount (USD)', 170, 93, { align: 'right' });

    // Table Items
    doc.setFont('helvetica', 'normal');
    let y = 103;

    const items = [
      { name: 'Base Room Rent', desc: `Standard rent for ${fee.roomAllocation.room.roomType} room`, amount: fee.amount },
      { name: 'Utility Charges', desc: 'Water, Electricity, and High-Speed internet', amount: fee.utilityCharges },
      { name: 'Security Deposit', desc: 'Refundable security charges (one-time)', amount: fee.securityDeposit },
      { name: 'Misc Charges', desc: 'Maintenance and common room contributions', amount: fee.miscCharges },
      { name: 'Late Payment Fee', desc: 'Accumulated overdue penalty charges', amount: fee.lateFee },
    ];

    const activeItems = items.filter(item => item.amount > 0);

    activeItems.forEach(item => {
      doc.text(item.name, 20, y);
      doc.text(item.desc, 70, y);
      doc.text(`$${item.amount.toFixed(2)}`, 170, y, { align: 'right' });
      y += 8;
    });

    // Total Calculation Section
    doc.line(15, y, 195, y);
    y += 6;

    const total = fee.amount + fee.utilityCharges + fee.securityDeposit + fee.miscCharges + fee.lateFee;

    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount Due:', 120, y);
    doc.text(`$${total.toFixed(2)}`, 170, y, { align: 'right' });

    if (fee.status === 'PAID') {
      y += 15;
      // Success Stamp Box
      doc.setDrawColor(16, 185, 129); // Emerald-500
      doc.setFillColor(209, 250, 229); // Emerald-100
      doc.rect(15, y, 180, 20, 'FD');

      doc.setTextColor(6, 95, 70); // Emerald-800
      doc.setFontSize(11);
      doc.text('PAYMENT RECEIPT STAMP - TRANSACTION SUCCESSFUL', 20, y + 6);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Payment Reference: ${paymentRef || 'N/A'}`, 20, y + 12);
      doc.text(`Paid At: ${paymentDate ? new Date(paymentDate).toLocaleString() : 'N/A'}`, 20, y + 16);
    }

    // Terms and Footer
    doc.setTextColor(textGray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for staying at Claria University Hostel. Please pay monthly dues by the 5th of every month.', 15, 275);
    doc.text('For queries, write to: billing@clariahostel.edu. This is an auto-generated official document.', 15, 280);

    const pdfBase64 = doc.output('datauristring').split(',')[1];
    return Buffer.from(pdfBase64, 'base64');
  }
}
