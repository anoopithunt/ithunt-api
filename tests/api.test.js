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

});
