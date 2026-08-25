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
        email: 'admin@ithunt.in',
        password: 'Admin@12345'
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
    const testEmail = `student_full_${Date.now()}@ithunt.in`;
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

});
