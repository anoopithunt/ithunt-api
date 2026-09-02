import db from '../config/db.js';
import { successResponse, errorResponse, generateRegistrationSlip } from '../utils/helpers.js';

export function createAdmission(req, res) {
  try {
    const {
      fullName,
      candidateName,
      name,
      email,
      phone,
      mobile,
      course,
      track,
      qualification,
      address,
      fatherName,
      motherName,
      dob,
      gender,
      district,
      registrationNumber,
      registrationNo,
      status
    } = req.body;

    const applicantName = fullName || candidateName || name;
    const applicantPhone = phone || mobile;

    if (!applicantName || !applicantPhone || !course) {
      return errorResponse(res, 'Full name, phone number, and course selection are required', 400);
    }

    const regNumber = registrationNumber || registrationNo || `ITH-${Math.floor(100000 + Math.random() * 900000)}`;

    const admission = db.insert('admissions', {
      registrationNumber: regNumber,
      registrationNo: regNumber,
      fullName: applicantName,
      candidateName: applicantName,
      email: email || '',
      phone: applicantPhone,
      mobile: applicantPhone,
      course,
      track: track || 'MERN Stack / Software Engineering',
      qualification: qualification || 'Undergraduate',
      address: address || '',
      fatherName: fatherName || '',
      motherName: motherName || '',
      dob: dob || '',
      gender: gender || 'Male',
      district: district || 'PRAYAGRAJ',
      status: (status || 'PROVISIONALLY ADMITTED').toUpperCase(),
      createdAt: new Date().toISOString()
    });

    const slip = generateRegistrationSlip(admission);

    return successResponse(res, 'Admission registration submitted successfully', {
      admission,
      registrationSlip: slip
    }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

export function getAllAdmissions(req, res) {
  const { status, search } = req.query;
  let admissions = db.getCollection('admissions');

  if (status) {
    admissions = admissions.filter(a => a.status.toLowerCase() === status.toLowerCase());
  }

  if (search) {
    const term = search.toLowerCase();
    admissions = admissions.filter(a =>
      (a.fullName && a.fullName.toLowerCase().includes(term)) ||
      (a.email && a.email.toLowerCase().includes(term)) ||
      (a.phone && a.phone.includes(term)) ||
      (a.registrationNumber && a.registrationNumber.toLowerCase().includes(term))
    );
  }

  return successResponse(res, 'Admissions list retrieved', {
    admissions,
    totalCount: admissions.length
  });
}

export function getAdmissionById(req, res) {
  const { id } = req.params;
  const admission = db.findById('admissions', id) || db.findOne('admissions', a => a.registrationNumber === id);

  if (!admission) {
    return errorResponse(res, 'Admission record not found', 404);
  }

  return successResponse(res, 'Admission details retrieved', { admission });
}

export function getRegistrationSlipById(req, res) {
  const { id } = req.params;
  const admission = db.findById('admissions', id) || db.findOne('admissions', a => a.registrationNumber === id);

  if (!admission) {
    return errorResponse(res, 'Admission record not found', 404);
  }

  const slip = generateRegistrationSlip(admission);
  return successResponse(res, 'Official registration slip details generated', { registrationSlip: slip });
}

export function updateAdmissionStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return errorResponse(res, 'Status field is required', 400);
  }

  const updated = db.updateById('admissions', id, { status: status.toUpperCase() });
  if (!updated) {
    return errorResponse(res, 'Admission record not found', 404);
  }

  return successResponse(res, 'Admission status updated successfully', { admission: updated });
}

export function deleteAdmission(req, res) {
  try {
    const { id } = req.params;
    const admission = db.findById('admissions', id) || db.findOne('admissions', a => 
      a.id === id || 
      a.registrationNumber === id ||
      a.registrationNo === id
    );

    if (!admission) {
      return errorResponse(res, 'Admission record not found', 404);
    }

    const deleted = db.deleteById('admissions', admission.id);
    if (!deleted) {
      return errorResponse(res, 'Admission record could not be deleted', 500);
    }

    return successResponse(res, 'Admission record deleted successfully from database & Firebase', {
      deletedId: admission.id,
      registrationNumber: admission.registrationNumber || admission.registrationNo,
      fullName: admission.fullName
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
