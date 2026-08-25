import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const feeCount = db.getCollection('fees').length + 1;
  return `ITH-RCPT-${year}-${String(feeCount).padStart(4, '0')}`;
}

/**
 * Record a student fee payment
 */
export function recordFeePayment(req, res) {
  try {
    const {
      studentId,
      studentName,
      enrollmentNumber,
      courseName,
      amount,
      paymentMode,
      transactionId,
      installmentNumber,
      totalCourseFee,
      remarks
    } = req.body;

    if (!studentName || !amount) {
      return errorResponse(res, 'Student name and amount are required fields', 400);
    }

    const receiptNumber = generateReceiptNumber();

    const payment = db.insert('fees', {
      receiptNumber,
      studentId: studentId || '',
      studentName,
      enrollmentNumber: enrollmentNumber || '',
      courseName: courseName || 'Tech Academy Program',
      amount: Number(amount),
      paymentMode: paymentMode || 'UPI',
      transactionId: transactionId || `TXN-${Date.now()}`,
      installmentNumber: installmentNumber || 1,
      totalCourseFee: Number(totalCourseFee) || Number(amount),
      paymentDate: new Date().toISOString(),
      status: 'PAID',
      receivedBy: req.user ? req.user.name : 'IT HUNT Accounts Office',
      remarks: remarks || 'Tuition fee installment received'
    });

    return successResponse(res, 'Fee payment recorded successfully and receipt generated', { payment }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Get fee transaction history for a specific student
 */
export function getStudentFeeLedger(req, res) {
  try {
    const { studentId } = req.params;

    const payments = db.find('fees', f => 
      f.studentId === studentId ||
      f.enrollmentNumber.toLowerCase() === studentId.toLowerCase()
    );

    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return successResponse(res, 'Student fee ledger retrieved', {
      studentId,
      payments,
      totalPaid,
      receiptCount: payments.length
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Admin: Get all fee transactions and financial revenue stats
 */
export function getAllFeesTransactions(req, res) {
  try {
    const fees = db.getCollection('fees');
    const totalRevenue = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    return successResponse(res, 'Fee transactions and revenue summary retrieved', {
      transactions: fees,
      totalCount: fees.length,
      totalRevenueCollected: totalRevenue
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
