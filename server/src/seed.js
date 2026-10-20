import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { HRContact } from './models/HRContact.js';
import { Resume } from './models/Resume.js';

dotenv.config();

const sampleHRs = [
  {
    companyName: 'Razorpay',
    website: 'https://razorpay.com',
    industry: 'Fintech / Payments',
    companySize: '1000+',
    tier: 'fintech',
    techStack: ['Node.js', 'React', 'Go', 'AWS', 'Kubernetes', 'MongoDB', 'PostgreSQL'],
    recruiterName: 'Priya Sharma',
    recruiterEmail: 'priya.sharma@razorpay.com',
    recruiterTitle: 'Senior Talent Acquisition Specialist',
    linkedinUrl: 'https://linkedin.com/in/priyasharma-tech-ta',
    location: 'Bangalore, India',
    verified: true,
  },
  {
    companyName: 'Postman',
    website: 'https://postman.com',
    industry: 'API Platform / Developer Tools',
    companySize: '500-1000',
    tier: 'unicorn',
    techStack: ['React', 'Node.js', 'TypeScript', 'Electron', 'AWS', 'Docker'],
    recruiterName: 'Aditya Mehta',
    recruiterEmail: 'aditya.mehta@postman.com',
    recruiterTitle: 'Lead Technical Recruiter',
    linkedinUrl: 'https://linkedin.com/in/adityamehta-hiring',
    location: 'Bangalore / Remote',
    verified: true,
  },
  {
    companyName: 'Swiggy',
    website: 'https://swiggy.com',
    industry: 'Consumer Tech / Logistics',
    companySize: '1000+',
    tier: 'unicorn',
    techStack: ['Java', 'Spring Boot', 'Go', 'React', 'Kafka', 'AWS', 'Microservices'],
    recruiterName: 'Sneha Deshmukh',
    recruiterEmail: 'sneha.deshmukh@swiggy.in',
    recruiterTitle: 'Talent Acquisition Partner - Engineering',
    linkedinUrl: 'https://linkedin.com/in/snehadeshmukh-ta',
    location: 'Bangalore, India',
    verified: true,
  },
  {
    companyName: 'Groww',
    website: 'https://groww.in',
    industry: 'Wealthtech / Fintech',
    companySize: '500-1000',
    tier: 'fintech',
    techStack: ['Java', 'Spring Boot', 'React', 'Python', 'Kubernetes', 'PostgreSQL'],
    recruiterName: 'Rohit Kulkarni',
    recruiterEmail: 'rohit.kulkarni@groww.in',
    recruiterTitle: 'Engineering Recruiter',
    linkedinUrl: 'https://linkedin.com/in/rohitkulkarni-groww',
    location: 'Bangalore, India',
    verified: true,
  },
  {
    companyName: 'Zomato',
    website: 'https://zomato.com',
    industry: 'Foodtech / Quick Commerce',
    companySize: '1000+',
    tier: 'unicorn',
    techStack: ['Node.js', 'React', 'Python', 'PHP', 'AWS', 'Redis', 'Kafka'],
    recruiterName: 'Ananya Verma',
    recruiterEmail: 'ananya.verma@zomato.com',
    recruiterTitle: 'Human Resources - Tech Hiring',
    linkedinUrl: 'https://linkedin.com/in/ananyaverma-zomato',
    location: 'Gurgaon, India',
    verified: true,
  },
  {
    companyName: 'Cred',
    website: 'https://cred.club',
    industry: 'Fintech / Luxury Tech',
    companySize: '500-1000',
    tier: 'fintech',
    techStack: ['Go', 'Java', 'React Native', 'Kotlin', 'AWS', 'Kafka'],
    recruiterName: 'Varun Nair',
    recruiterEmail: 'varun.nair@cred.club',
    recruiterTitle: 'Senior Recruiter - Engineering & Product',
    linkedinUrl: 'https://linkedin.com/in/varunnair-cred',
    location: 'Bangalore, India',
    verified: true,
  },
  {
    companyName: 'InMobi',
    website: 'https://inmobi.com',
    industry: 'AdTech / AI Marketing',
    companySize: '1000+',
    tier: 'unicorn',
    techStack: ['Python', 'Java', 'Big Data', 'Spark', 'Hadoop', 'AWS', 'React'],
    recruiterName: 'Ritu Sen',
    recruiterEmail: 'ritu.sen@inmobi.com',
    recruiterTitle: 'Talent Acquisition Manager',
    linkedinUrl: 'https://linkedin.com/in/ritusentech',
    location: 'Bangalore, India',
    verified: true,
  },
  {
    companyName: 'Hasura',
    website: 'https://hasura.io',
    industry: 'Open Source / GraphQL / Developer Tools',
    companySize: '100-300',
    tier: 'remote',
    techStack: ['Haskell', 'Go', 'GraphQL', 'React', 'PostgreSQL', 'Docker'],
    recruiterName: 'Kavita Joshi',
    recruiterEmail: 'kavita.joshi@hasura.io',
    recruiterTitle: 'People & Talent Lead',
    linkedinUrl: 'https://linkedin.com/in/kavitajoshi-hasura',
    location: 'Remote / India',
    verified: true,
  },
  {
    companyName: 'BrowserStack',
    website: 'https://browserstack.com',
    industry: 'Cloud Infrastructure / Testing',
    companySize: '500-1000',
    tier: 'unicorn',
    techStack: ['Ruby on Rails', 'Node.js', 'React', 'Docker', 'AWS', 'Python'],
    recruiterName: 'Amit Bansal',
    recruiterEmail: 'amit.bansal@browserstack.com',
    recruiterTitle: 'Engineering Talent Partner',
    linkedinUrl: 'https://linkedin.com/in/amitbansal-recruitment',
    location: 'Mumbai, India',
    verified: true,
  },
  {
    companyName: 'Freshworks',
    website: 'https://freshworks.com',
    industry: 'SaaS / Customer Experience',
    companySize: '1000+',
    tier: 'unicorn',
    techStack: ['Ruby', 'Java', 'Node.js', 'Ember.js', 'React', 'AWS', 'Kafka'],
    recruiterName: 'Divya Sundaram',
    recruiterEmail: 'divya.sundaram@freshworks.com',
    recruiterTitle: 'Senior Recruiter',
    linkedinUrl: 'https://linkedin.com/in/divyasundaram-freshworks',
    location: 'Chennai / Hyderabad',
    verified: true,
  },
  {
    companyName: 'Urban Company',
    website: 'https://urbancompany.com',
    industry: 'Services Platform',
    companySize: '500-1000',
    tier: 'unicorn',
    techStack: ['Node.js', 'React', 'React Native', 'Python', 'MongoDB', 'Redis'],
    recruiterName: 'Siddharth Roy',
    recruiterEmail: 'siddharth.roy@urbancompany.com',
    recruiterTitle: 'Talent Partner - Tech',
    linkedinUrl: 'https://linkedin.com/in/siddharthroy-uc',
    location: 'Gurgaon, India',
    verified: true,
  },
  {
    companyName: 'Cars24',
    website: 'https://cars24.com',
    industry: 'AutoTech / Marketplace',
    companySize: '1000+',
    tier: 'unicorn',
    techStack: ['Python', 'Django', 'FastAPI', 'React', 'Node.js', 'PostgreSQL'],
    recruiterName: 'Megha Singhania',
    recruiterEmail: 'megha.singhania@cars24.com',
    recruiterTitle: 'Lead Talent Scout',
    linkedinUrl: 'https://linkedin.com/in/meghasinghania-cars24',
    location: 'Gurgaon, India',
    verified: true,
  },
  {
    companyName: 'Chargebee',
    website: 'https://chargebee.com',
    industry: 'Subscription Billing SaaS',
    companySize: '500-1000',
    tier: 'remote',
    techStack: ['Java', 'Spring Boot', 'Vue.js', 'React', 'AWS', 'MySQL'],
    recruiterName: 'Karthik Raja',
    recruiterEmail: 'karthik.raja@chargebee.com',
    recruiterTitle: 'Technical Recruiter',
    linkedinUrl: 'https://linkedin.com/in/karthikraja-chargebee',
    location: 'Chennai / Remote',
    verified: true,
  },
  {
    companyName: 'PhonePe',
    website: 'https://phonepe.com',
    industry: 'Fintech / Digital Payments',
    companySize: '1000+',
    tier: 'fintech',
    techStack: ['Java', 'Spring', 'Cassandra', 'HBase', 'Kafka', 'React'],
    recruiterName: 'Rohan Gupta',
    recruiterEmail: 'rohan.gupta@phonepe.com',
    recruiterTitle: 'Talent Acquisition Specialist',
    linkedinUrl: 'https://linkedin.com/in/rohangupta-phonepe',
    location: 'Bangalore / Pune',
    verified: true,
  },
  {
    companyName: 'CleverTap',
    website: 'https://clevertap.com',
    industry: 'Customer Engagement / MarTech',
    companySize: '300-500',
    tier: 'startup',
    techStack: ['Java', 'C++', 'Node.js', 'React', 'AWS', 'Big Data'],
    recruiterName: 'Neha Chawla',
    recruiterEmail: 'neha.chawla@clevertap.com',
    recruiterTitle: 'Lead Technical Recruiter',
    linkedinUrl: 'https://linkedin.com/in/nehachawla-clevertap',
    location: 'Mumbai / Bangalore',
    verified: true,
  },
  {
    companyName: 'Darwinbox',
    website: 'https://darwinbox.com',
    industry: 'HR Tech SaaS',
    companySize: '500-1000',
    tier: 'startup',
    techStack: ['Node.js', 'PHP', 'React', 'Python', 'MongoDB', 'AWS'],
    recruiterName: 'Vikram Reddy',
    recruiterEmail: 'vikram.reddy@darwinbox.io',
    recruiterTitle: 'Engineering Talent Lead',
    linkedinUrl: 'https://linkedin.com/in/vikramreddy-darwinbox',
    location: 'Hyderabad, India',
    verified: true,
  },
  {
    companyName: 'Licious',
    website: 'https://licious.in',
    industry: 'D2C / E-commerce',
    companySize: '500-1000',
    tier: 'startup',
    techStack: ['Node.js', 'React', 'React Native', 'AWS', 'MySQL'],
    recruiterName: 'Shalini Paul',
    recruiterEmail: 'shalini.paul@licious.com',
    recruiterTitle: 'Assistant Manager - Talent Acquisition',
    linkedinUrl: 'https://linkedin.com/in/shalinipaul-licious',
    location: 'Bangalore, India',
    verified: true,
  },
  {
    companyName: 'Zepto',
    website: 'https://zeptonow.com',
    industry: 'Quick Commerce / High Scale',
    companySize: '1000+',
    tier: 'unicorn',
    techStack: ['Go', 'Node.js', 'React', 'Python', 'AWS', 'Kubernetes', 'Redis'],
    recruiterName: 'Aman Saxena',
    recruiterEmail: 'aman.saxena@zeptonow.com',
    recruiterTitle: 'Senior Tech Recruiter',
    linkedinUrl: 'https://linkedin.com/in/amansaxena-zepto',
    location: 'Mumbai / Bangalore',
    verified: true,
  },
  {
    companyName: 'Khatabook',
    website: 'https://khatabook.com',
    industry: 'Fintech / MSME Tech',
    companySize: '200-500',
    tier: 'fintech',
    techStack: ['Kotlin', 'Android', 'React', 'Node.js', 'Go', 'GCP'],
    recruiterName: 'Pooja Bhatt',
    recruiterEmail: 'pooja.bhatt@khatabook.com',
    recruiterTitle: 'Technical Recruiter',
    linkedinUrl: 'https://linkedin.com/in/poojabhatt-khatabook',
    location: 'Bangalore, India',
    verified: true,
  },
  {
    companyName: 'Ola (ANI Technologies)',
    website: 'https://olacabs.com',
    industry: 'Mobility / EV Tech',
    companySize: '1000+',
    tier: 'unicorn',
    techStack: ['Java', 'Spring Boot', 'Python', 'React', 'Kafka', 'Kubernetes'],
    recruiterName: 'Gaurav Tewari',
    recruiterEmail: 'gaurav.tewari@olacabs.com',
    recruiterTitle: 'Lead Talent Advisor',
    linkedinUrl: 'https://linkedin.com/in/gauravtewari-ola',
    location: 'Bangalore, India',
    verified: true,
  },
];

const seedDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/techreachly';
    await mongoose.connect(uri);
    console.log('[Seed] Connected to MongoDB.');

    // Check if HR contacts already exist to protect user deletions
    const existingCount = await HRContact.countDocuments();
    if (existingCount > 0 && !process.argv.includes('--force')) {
      console.log(`[Seed] Database already contains ${existingCount} HR contacts. Preserving user data (pass --force to reset).`);
    } else {
      // Clear and seed curated IT HR contacts
      await HRContact.deleteMany({});
      const insertedContacts = await HRContact.insertMany(sampleHRs);
      console.log(`[Seed] Successfully seeded ${insertedContacts.length} verified IT HR contacts!`);
    }

    // Create demo candidate account
    const existingDemoUser = await User.findOne({ email: 'demo@techreachly.com' });
    if (!existingDemoUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Password123!', salt);

      const demoUser = await User.create({
        name: 'Demo Candidate',
        email: 'demo@techreachly.com',
        passwordHash,
        role: 'candidate',
        smtpConfig: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          authUser: 'demo@techreachly.com',
          senderName: 'Demo Candidate',
          verified: false,
        },
        outreachSettings: {
          dailyLimit: 25,
          minDelaySeconds: 180,
          maxDelaySeconds: 360,
          autoFollowUp: true,
          followUpDelayDays: 3,
        },
      });

      // Attach a demo parsed resume
      await Resume.create({
        userId: demoUser._id,
        fileName: 'alex_fullstack_resume.pdf',
        rawText: 'Full Stack Software Engineer with 3 years experience building React, Node.js, Express, MongoDB, and AWS cloud applications...',
        parsedData: {
          fullName: 'Demo Candidate',
          email: 'demo@techreachly.com',
          phone: '+91 98765 43210',
          currentRole: 'Full Stack MERN Developer',
          experienceYears: 3,
          summary: 'Detail-oriented Full Stack Engineer with 3+ years experience building scalable SaaS products, real-time messaging, and high-performance REST APIs.',
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'AWS', 'Tailwind CSS', 'Docker', 'Git'],
          keyProjects: [
            {
              title: 'Multi-Tenant Analytics Dashboard',
              description: 'Architected high-throughput real-time metrics aggregator handling 50k events/sec using Node.js & MongoDB.',
              techStack: ['React', 'Node.js', 'MongoDB', 'Redis'],
              highlights: 'Decreased dashboard query latency by 45% using indexed compound queries.',
              link: 'https://github.com/democandidate/analytics-engine',
            },
            {
              title: 'Collaborative Document Editor',
              description: 'Engineered real-time markdown editor with WebSocket synchronization and instant PDF export.',
              techStack: ['React', 'TypeScript', 'Node.js', 'Tailwind'],
              highlights: 'Adopted by 1,200 active monthly engineering users.',
              link: 'https://github.com/democandidate/collab-editor',
            },
          ],
          links: {
            github: 'https://github.com/democandidate',
            linkedin: 'https://linkedin.com/in/democandidate-tech',
            portfolio: 'https://democandidate.dev',
          },
          education: [
            {
              degree: 'B.Tech in Computer Science',
              institution: 'National Institute of Technology',
              year: '2021',
            },
          ],
        },
      });

      console.log('[Seed] Demo candidate created: demo@techreachly.com / Password123!');
    } else {
      console.log('[Seed] Demo user already exists.');
    }

    console.log('[Seed] Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
