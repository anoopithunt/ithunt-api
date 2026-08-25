import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * Mark daily attendance for a student / batch
 */
export function markAttendance(req, res) {
  try {
    const {
      studentId,
      studentName,
      enrollmentNumber,
      batch,
      course,
      date,
      status,
      topicCovered,
      remarks
    } = req.body;

    if (!studentName || !status) {
      return errorResponse(res, 'Student name and status (PRESENT/ABSENT/LATE) are required', 400);
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0];

    const record = db.insert('attendance', {
      studentId: studentId || '',
      studentName,
      enrollmentNumber: enrollmentNumber || '',
      batch: batch || 'Batch 2026',
      course: course || 'General',
      date: attendanceDate,
      status: status.toUpperCase(), // PRESENT, ABSENT, LATE, EXCUSED
      topicCovered: topicCovered || '',
      markedBy: req.user ? req.user.name : 'Faculty Instructor',
      remarks: remarks || ''
    });

    return successResponse(res, 'Attendance record logged successfully', { record }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Get attendance records for a specific student
 */
export function getStudentAttendance(req, res) {
  try {
    const { studentId } = req.params;
    const records = db.find('attendance', a => 
      a.studentId === studentId || 
      a.enrollmentNumber.toLowerCase() === studentId.toLowerCase()
    );

    const totalClasses = records.length;
    const presentClasses = records.filter(r => r.status === 'PRESENT').length;
    const attendancePercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : '100.0';

    return successResponse(res, 'Student attendance summary retrieved', {
      studentId,
      totalClasses,
      presentClasses,
      attendancePercentage: `${attendancePercentage}%`,
      records
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Get attendance by batch and date
 */
export function getBatchAttendance(req, res) {
  try {
    const { batch, date } = req.query;
    let records = db.getCollection('attendance');

    if (batch) {
      records = records.filter(r => r.batch.toLowerCase().includes(batch.toLowerCase()));
    }
    if (date) {
      records = records.filter(r => r.date === date);
    }

    return successResponse(res, 'Batch attendance records retrieved', {
      records,
      count: records.length
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
