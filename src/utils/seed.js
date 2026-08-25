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

  // Seed Default Projects if empty
  const projects = db.getCollection('projects');
  if (projects.length === 0) {
    const defaultProjects = [
      {
        id: 'proj-101',
        title: 'Smart Healthcare & Hospital Management ERP',
        slug: 'smart-healthcare-hospital-erp',
        category: 'Full Stack MERN Stack',
        description: 'Complete inpatient & outpatient medical record management system with automated billing and doctor appointments.',
        techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Firebase Auth', 'TailwindCSS'],
        githubUrl: 'https://github.com/anoopithunt/hospital-management-erp',
        liveUrl: 'https://hospital-erp-ithunt.vercel.app',
        thumbnail: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=60',
        studentId: 'stu-test-101',
        authorName: 'Anoop Mishra',
        guideName: 'Mr. Lakshman Singh Chauhan',
        academicYear: '2025-2026',
        featured: true,
        status: 'APPROVED',
        createdAt: new Date().toISOString()
      },
      {
        id: 'proj-102',
        title: 'AI Crop Disease Detection & Fertilizer Advisor',
        slug: 'ai-crop-disease-detection',
        category: 'Python AI & Computer Vision',
        description: 'Deep Learning Convolutional Neural Network (CNN) model predicting leaf diseases with treatment suggestions for farmers.',
        techStack: ['Python', 'TensorFlow', 'OpenCV', 'Flask', 'Chart.js'],
        githubUrl: 'https://github.com/anoopithunt/ai-crop-disease',
        liveUrl: 'https://crop-ai-ithunt.vercel.app',
        thumbnail: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=60',
        studentId: null,
        authorName: 'Saurabh Patel & IT HUNT AI Batch',
        guideName: 'Mr. Lakshman Singh Chauhan',
        academicYear: '2025-2026',
        featured: true,
        status: 'APPROVED',
        createdAt: new Date().toISOString()
      },
      {
        id: 'proj-103',
        title: 'NIELIT Online Student Portal & Attendance Tracker',
        slug: 'nielit-student-portal-attendance',
        category: "NIELIT 'O' Level Major Project",
        description: 'Automated student examination result checking, digital ID card generator, and biometric class attendance viewer.',
        techStack: ['JavaScript', 'HTML5', 'CSS3', 'Firebase Realtime DB', 'Express API'],
        githubUrl: 'https://github.com/anoopithunt/nielit-student-portal',
        liveUrl: 'https://nielit-portal-ithunt.vercel.app',
        thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60',
        studentId: null,
        authorName: 'Kavita Singh',
        guideName: 'Mr. Lakshman Singh Chauhan',
        academicYear: '2025-2026',
        featured: false,
        status: 'APPROVED',
        createdAt: new Date().toISOString()
      }
    ];
    defaultProjects.forEach(p => db.insert('projects', p));
    console.log('✓ Default showcase & NIELIT projects seeded');
  }
}
