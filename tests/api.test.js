import request from 'supertest';
import app from '../src/app.js';

describe('IT HUNT Backend REST API Suite', () => {

  let adminToken = '';
  let admissionId = '';

  test('GET / - Root Endpoint', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.status).toEqual('ACTIVE');
  });

  test('GET /api/health - Health Check Endpoint', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('OK');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });

  test('POST /api/auth/login - SuperAdmin Login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@ithunt.com',
        password: 'admin@ithunt2026'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    adminToken = res.body.data.token;
  });

  test('POST /api/auth/register & DELETE /api/users/:id - Create and Delete User', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Delete Test Student',
        email: `student_to_delete_${Date.now()}@ithunt.test`,
        password: 'Password@123',
        role: 'student',
        phone: '+919876543210',
        course: 'MERN Stack Web Engineering'
      });
    
    expect(regRes.statusCode).toEqual(201);
    expect(regRes.body.success).toBe(true);
    const userIdToDelete = regRes.body.data.user.id;
    expect(userIdToDelete).toBeDefined();

    const delRes = await request(app)
      .delete(`/api/users/${userIdToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(delRes.statusCode).toEqual(200);
    expect(delRes.body.success).toBe(true);
    expect(delRes.body.data.deletedUserId).toEqual(userIdToDelete);
  });

  test('POST /api/admissions - Apply Admission', async () => {
    const res = await request(app)
      .post('/api/admissions')
      .send({
        fullName: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        phone: '+919795112233',
        course: 'NIELIT O Level Diploma',
        track: '1-Year Computer Diploma'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('registrationSlip');
    admissionId = res.body.data.admission.id;
  });

  test('GET /api/admissions/:id/slip - Fetch Registration Slip', async () => {
    const res = await request(app).get(`/api/admissions/${admissionId}/slip`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.registrationSlip.candidateName).toEqual('Aarav Sharma');
  });

  test('DELETE /api/admissions/:id - Delete Admission Record (Admin)', async () => {
    const delRes = await request(app)
      .delete(`/api/admissions/${admissionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.statusCode).toEqual(200);
    expect(delRes.body.success).toBe(true);
    expect(delRes.body.data.deletedId).toEqual(admissionId);
  });

  test('POST /api/careers/apply - Submit Job Application', async () => {
    const res = await request(app)
      .post('/api/careers/apply')
      .send({
        name: 'Vikram Singh',
        email: 'vikram.singh@example.com',
        phone: '+919988776655',
        position: 'Full Stack React / Node Instructor',
        resumeLink: 'https://example.com/resume.pdf'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/reviews - Submit Student Review', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({
        name: 'Neha Kapoor',
        role: 'Full Stack MERN Alum',
        rating: 5,
        reviewText: 'Great institute with hands-on live project training!'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/reviews - Fetch Public Reviews', async () => {
    const res = await request(app).get('/api/reviews');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.reviews.length).toBeGreaterThan(0);
  });

  test('GET /api/courses - Fetch Course Catalog', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.courses.length).toBeGreaterThan(0);
  });

  test('GET /api/admin/stats - Executive Dashboard Metrics (Authenticated)', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.stats).toHaveProperty('totalAdmissions');
    expect(res.body.data.stats).toHaveProperty('totalReviews');
  });

  test('POST /api/students/register & POST /api/students/login - Distinct Auth & Student Details Storage', async () => {
    const testEmail = `student_full_${Date.now()}@ithunt.vercel.app`;
    const regRes = await request(app)
      .post('/api/students/register')
      .send({
        name: 'Rohan Verma',
        email: testEmail,
        password: 'StudentPass@123',
        phone: '+919876500112',
        course: 'NIELIT O Level Diploma',
        guardianName: 'Suresh Verma',
        guardianPhone: '+919876500100',
        dob: '2002-05-15',
        gender: 'male',
        address: 'Civil Lines, Prayagraj, UP'
      });

    expect(regRes.statusCode).toEqual(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data).toHaveProperty('user');
    expect(regRes.body.data).toHaveProperty('student');
    expect(regRes.body.data).toHaveProperty('token');
    
    // Verify distinct table data linking
    expect(regRes.body.data.user.role).toEqual('student');
    expect(regRes.body.data.student.userId).toEqual(regRes.body.data.user.id);
    expect(regRes.body.data.student.enrollmentNumber).toMatch(/^ITH-\d{4}-STU\d{4}$/);
    expect(regRes.body.data.student.guardianName).toEqual('Suresh Verma');

    const studentToken = regRes.body.data.token;
    const studentId = regRes.body.data.student.id;

    // Test Student Login
    const loginRes = await request(app)
      .post('/api/students/login')
      .send({
        email: testEmail,
        password: 'StudentPass@123'
      });

    expect(loginRes.statusCode).toEqual(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.student).toBeDefined();
    expect(loginRes.body.data.student.enrollmentNumber).toEqual(regRes.body.data.student.enrollmentNumber);

    // Test Get Student Profile (Self)
    const profileRes = await request(app)
      .get('/api/students/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(profileRes.statusCode).toEqual(200);
    expect(profileRes.body.data.student.name).toEqual('Rohan Verma');

    // Test Update Student Profile (Self)
    const updateRes = await request(app)
      .put('/api/students/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        bio: 'Aspiring Software Developer learning NIELIT O level',
        phone: '+919876500999'
      });

    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body.data.student.bio).toEqual('Aspiring Software Developer learning NIELIT O level');

    // Test Admin Get All Students
    const allStudentsRes = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(allStudentsRes.statusCode).toEqual(200);
    expect(allStudentsRes.body.data.students.length).toBeGreaterThan(0);

    // Test Admin Delete Student (removes from both distinct tables)
    const deleteRes = await request(app)
      .delete(`/api/students/${studentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.statusCode).toEqual(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.data.deletedStudentId).toEqual(studentId);
  });

  test('GET /api/admin/firebase/collections/:collection - Fetch Detail Collection from Firebase Firestore', async () => {
    const res = await request(app)
      .get('/api/admin/firebase/collections/students')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('collection');
    expect(res.body.data.collection).toEqual('students');
    expect(res.body.data).toHaveProperty('data');
  });

  test('GET /api/admin/firebase/storage/files - Fetch Firebase Cloud Storage Files', async () => {
    const res = await request(app)
      .get('/api/admin/firebase/storage/files')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('files');
  });

  test('POST /api/certificates & GET /api/certificates/verify/:certNo - Issue & Verify Official Certificate', async () => {
    const issueRes = await request(app)
      .post('/api/certificates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentName: 'Sneha Patel',
        enrollmentNumber: 'ITH-2026-STU0099',
        courseName: 'Full Stack MERN Software Engineering',
        grade: 'A+ (Distinction)',
        duration: '6 Months'
      });

    expect(issueRes.statusCode).toEqual(201);
    expect(issueRes.body.success).toBe(true);
    const certNo = issueRes.body.data.certificate.certificateNumber;

    const verifyRes = await request(app).get(`/api/certificates/verify/${certNo}`);
    expect(verifyRes.statusCode).toEqual(200);
    expect(verifyRes.body.data.isAuthentic).toBe(true);
    expect(verifyRes.body.data.certificate.studentName).toEqual('Sneha Patel');
  });

  test('POST /api/fees/record & GET /api/fees/student/:id - Record Fee & Check Ledger', async () => {
    const feeRes = await request(app)
      .post('/api/fees/record')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: 'stu-test-101',
        studentName: 'Amit Tripathi',
        enrollmentNumber: 'ITH-2026-STU0101',
        courseName: 'NIELIT O Level Diploma',
        amount: 5000,
        paymentMode: 'UPI'
      });

    expect(feeRes.statusCode).toEqual(201);
    expect(feeRes.body.success).toBe(true);
    expect(feeRes.body.data.payment).toHaveProperty('receiptNumber');

    const ledgerRes = await request(app)
      .get('/api/fees/student/stu-test-101')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(ledgerRes.statusCode).toEqual(200);
    expect(ledgerRes.body.data.totalPaid).toBeGreaterThanOrEqual(5000);
  });

  test('POST /api/faculty & GET /api/faculty - Faculty Directory Management', async () => {
    const facultyRes = await request(app)
      .post('/api/faculty')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Vivek Pandey',
        email: `faculty_${Date.now()}@ithunt.vercel.app`,
        phone: '+919876541122',
        designation: 'Senior Faculty & Python AI Lead'
      });

    expect(facultyRes.statusCode).toEqual(201);
    expect(facultyRes.body.success).toBe(true);

    const listRes = await request(app).get('/api/faculty');
    expect(listRes.statusCode).toEqual(200);
    expect(listRes.body.data.faculty.length).toBeGreaterThan(0);
  });

  test('POST /api/attendance/mark & GET /api/attendance/student/:id - Student Attendance', async () => {
    const markRes = await request(app)
      .post('/api/attendance/mark')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: 'stu-test-101',
        studentName: 'Amit Tripathi',
        status: 'PRESENT',
        topicCovered: 'React Hooks & State Management'
      });

    expect(markRes.statusCode).toEqual(201);
    expect(markRes.body.success).toBe(true);

    const attRes = await request(app)
      .get('/api/attendance/student/stu-test-101')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(attRes.statusCode).toEqual(200);
    expect(attRes.body.data.totalClasses).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/internships & POST /api/internships/apply - Internship Tracks & Application', async () => {
    const listRes = await request(app).get('/api/internships');
    expect(listRes.statusCode).toEqual(200);
    expect(listRes.body.data.internships.length).toBeGreaterThan(0);

    const applyRes = await request(app)
      .post('/api/internships/apply')
      .send({
        candidateName: 'Pooja Gupta',
        email: 'pooja.gupta@example.com',
        phone: '+919988771122',
        college: 'University of Allahabad',
        githubUrl: 'https://github.com/poojagupta'
      });

    expect(applyRes.statusCode).toEqual(201);
    expect(applyRes.body.success).toBe(true);
    expect(applyRes.body.data.application.status).toEqual('PENDING_REVIEW');
  });

  test('POST /api/projects & GET /api/projects - Projects API with Firebase Sync and Student Relation', async () => {
    // 1. Create project by Admin
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Smart Agro IoT & Weather Station',
        category: "Python IoT & AI",
        description: 'Real-time soil moisture and environmental parameter monitoring system.',
        techStack: ['Python', 'Raspberry Pi', 'Flask', 'React', 'MQTT'],
        githubUrl: 'https://github.com/ithunt/smart-agro-iot',
        studentId: 'stu-test-101',
        guideName: 'Mr. Lakshman Singh Chauhan',
        featured: true
      });

    expect(createRes.statusCode).toEqual(201);
    expect(createRes.body.success).toBe(true);
    const createdProjectId = createRes.body.data.project.id;

    // 2. Fetch all projects
    const listRes = await request(app).get('/api/projects');
    expect(listRes.statusCode).toEqual(200);
    expect(listRes.body.data.projects.length).toBeGreaterThanOrEqual(1);

    // 3. Fetch project details by ID with student relationship
    const detailRes = await request(app).get(`/api/projects/${createdProjectId}`);
    expect(detailRes.statusCode).toEqual(200);
    expect(detailRes.body.data.project.title).toEqual('Smart Agro IoT & Weather Station');

    // 4. Student Capstone Project Submission
    const submitRes = await request(app)
      .post('/api/projects/submit')
      .send({
        title: 'Library Automation & Barcode Management',
        category: "NIELIT 'O' Level Major Project",
        description: 'Automated book issue/return tracking system with barcode integration.',
        authorName: 'Rohan Gupta',
        authorEmail: 'rohan.gupta@example.com',
        techStack: ['JavaScript', 'HTML5', 'CSS3']
      });

    expect(submitRes.statusCode).toEqual(201);
    expect(submitRes.body.data.submission.status).toEqual('UNDER_REVIEW');

    // 5. Delete project
    const delRes = await request(app)
      .delete(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.statusCode).toEqual(200);
    expect(delRes.body.success).toBe(true);
  });

});
