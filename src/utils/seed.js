import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';

export async function seedInitialData() {
  // Seed SuperAdmin if not exists or sync credentials
  const existingAdmin = db.findOne('users', u => u.role === 'superadmin' || u.id === 'admin-001');
  const hashedPassword = await bcrypt.hash('admin@ithunt2026', 10);

  if (!existingAdmin) {
    db.insert('users', {
      id: 'admin-001',
      name: 'Lakshman Singh Chauhan',
      email: 'admin@ithunt.com',
      password: hashedPassword,
      role: 'superadmin',
      designation: 'Director & Founder',
      phone: '+919795771806'
    });
    console.log('✓ Default SuperAdmin account created (admin@ithunt.com / admin@ithunt2026)');
  } else {
    db.updateById('users', existingAdmin.id, {
      email: 'admin@ithunt.com',
      password: hashedPassword
    });
  }

  // Seed Default Courses if empty
  const courses = db.getCollection('courses');
  if (courses.length === 0) {
    const defaultCourses = [
      {
        id: 'course-nielit-o',
        title: 'NIELIT O Level Diploma',
        category: 'Government Certification',
        duration: '1 Year / 2 Semesters',
        fee: '₹12,500',
        description: 'Comprehensive IT Foundation covering Python, Web Design, IoT & IT Tools accredited by NIELIT Govt of India.',
        featured: true
      },
      {
        id: 'course-mern-stack',
        title: 'Full Stack MERN Software Engineering',
        category: 'Web Development',
        duration: '6 Months',
        fee: '₹18,000',
        description: 'Production-ready web development with MongoDB, Express.js, React 19, Node.js, and Live Project Deployment.',
        featured: true
      },
      {
        id: 'course-python-ai',
        title: 'Python AI & Machine Learning',
        category: 'Data Science & AI',
        duration: '3 Months',
        fee: '₹14,000',
        description: 'Core Python, Pandas, NumPy, Scikit-Learn, Deep Learning & LLM API integrations.',
        featured: true
      },
      {
        id: 'course-nielit-a',
        title: 'NIELIT A Level Advanced Diploma',
        category: 'Government Certification',
        duration: '1 Year',
        fee: '₹22,000',
        description: 'Advanced computer software diploma covering Data Structures, DBMS, Software Engineering & OS.',
        featured: false
      }
    ];
    defaultCourses.forEach(c => db.insert('courses', c));
    console.log('✓ Default IT HUNT courses seeded');
  }

  // Seed Default Internships if empty
  const internships = db.getCollection('internships');
  if (internships.length === 0) {
    const defaultInternships = [
      {
        id: 'internship-mern-6m',
        title: '6-Month Production MERN Developer Internship',
        stipend: 'Performance Based',
        duration: '6 Months',
        mode: 'Hybrid / On-Campus',
        skills: ['React', 'Node.js', 'Express', 'MongoDB', 'Git'],
        description: 'Work on live client software applications, gain corporate LOR and placement assistance.',
        status: 'OPEN'
      },
      {
        id: 'internship-python-3m',
        title: '3-Month Python & Data Analytics Internship',
        stipend: 'Performance Based',
        duration: '3 Months',
        mode: 'On-Campus',
        skills: ['Python', 'SQL', 'Pandas', 'Flask', 'REST API'],
        description: 'Develop data analytics dashboards and automated script pipelines.',
        status: 'OPEN'
      }
    ];
    defaultInternships.forEach(i => db.insert('internships', i));
    console.log('✓ Default IT HUNT internship tracks seeded');
  }

  // Seed Default Reviews if empty
  const reviews = db.getCollection('reviews');
  if (reviews.length === 0) {
    const defaultReviews = [
      {
        id: 'rev-1',
        name: 'Rahul Sharma',
        role: 'MERN Stack Intern Placement at Paytm',
        rating: 5,
        reviewText: 'IT HUNT transformed my coding career! The 6-month hands-on internship under Lakshman Sir provided real production experience.',
        verified: true,
        featured: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'rev-2',
        name: 'Priya Verma',
        role: 'NIELIT O Level Student',
        rating: 5,
        reviewText: 'Excellent workstation facilities and supportive faculty in Prayagraj Holagarh. Cleared my O-level exams with top grades!',
        verified: true,
        featured: true,
        createdAt: new Date().toISOString()
      }
    ];
    defaultReviews.forEach(r => db.insert('reviews', r));
    console.log('✓ Default student reviews seeded');
  }
}
