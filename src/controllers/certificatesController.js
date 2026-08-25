import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * Generate unique official IT HUNT Certificate ID (e.g. ITH-CERT-2026-0042)
 */
function generateCertificateNumber() {
  const year = new Date().getFullYear();
  const certCount = db.getCollection('certificates').length + 1;
  return `ITH-CERT-${year}-${String(certCount).padStart(4, '0')}`;
}

/**
 * Issue a new certificate (Admin / Faculty)
 */
export function issueCertificate(req, res) {
  try {
    const {
      studentName,
      enrollmentNumber,
      courseName,
      issueDate,
      grade,
      duration,
      projectTitle,
      remarks
    } = req.body;

    if (!studentName || !courseName) {
      return errorResponse(res, 'Student name and course name are required to issue certificate', 400);
    }

    const certificateNumber = req.body.certificateNumber || generateCertificateNumber();

    // Check duplicate certificate number
    const existing = db.findOne('certificates', c => c.certificateNumber === certificateNumber);
    if (existing) {
      return errorResponse(res, 'A certificate with this certificate number already exists', 409);
    }

    const certificate = db.insert('certificates', {
      certificateNumber,
      studentName,
      enrollmentNumber: enrollmentNumber || '',
      courseName,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      grade: grade || 'A (Excellent)',
      duration: duration || '6 Months',
      projectTitle: projectTitle || '',
      status: 'VERIFIED_ACTIVE',
      issuer: 'IT HUNT Tech Academy & Software Solutions',
      authorizedSignatory: 'Mr. Lakshman Singh Chauhan (Director)',
      remarks: remarks || 'Successfully completed course with project deployment.',
      verificationUrl: `http://localhost:3000/api/certificates/verify/${certificateNumber}`
    });

    return successResponse(res, 'Official Certificate issued and registered successfully', { certificate }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Verify a Certificate publicly by Certificate Number
 */
export function verifyCertificate(req, res) {
  try {
    const { certNo } = req.params;

    const certificate = db.findOne('certificates', c => 
      c.certificateNumber.toLowerCase() === certNo.toLowerCase() ||
      c.id === certNo
    );

    if (!certificate) {
      return errorResponse(res, 'Certificate not found or invalid certificate number', 404);
    }

    return successResponse(res, 'Certificate is authentic and officially verified by IT HUNT', {
      isAuthentic: true,
      certificate
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * List all certificates
 */
export function getAllCertificates(req, res) {
  try {
    const { course, status } = req.query;
    let certificates = db.getCollection('certificates');

    if (course) {
      certificates = certificates.filter(c => c.courseName.toLowerCase().includes(course.toLowerCase()));
    }
    if (status) {
      certificates = certificates.filter(c => c.status === status);
    }

    return successResponse(res, 'Certificates list retrieved', {
      certificates,
      totalCount: certificates.length
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Get certificate by ID
 */
export function getCertificateById(req, res) {
  try {
    const { id } = req.params;
    const certificate = db.findById('certificates', id);
    if (!certificate) {
      return errorResponse(res, 'Certificate record not found', 404);
    }
    return successResponse(res, 'Certificate details retrieved', { certificate });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Delete / Revoke certificate
 */
export function deleteCertificate(req, res) {
  try {
    const { id } = req.params;
    const deleted = db.deleteById('certificates', id);
    if (!deleted) {
      return errorResponse(res, 'Certificate record not found', 404);
    }
    return successResponse(res, 'Certificate deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
