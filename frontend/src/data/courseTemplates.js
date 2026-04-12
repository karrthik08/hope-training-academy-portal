export const COURSE_TEMPLATES = [
  {
    id: 'live-1hour',
    name: '1-Hour Live Class',
    description: 'Quick live training session',
    icon: '⏱️',
    data: {
      title: '',
      description: 'A focused 1-hour live training session covering key concepts.',
      category: 'Professional Development',
      target_audience: 'All staff',
      delivery_type: 'live',
      duration_hours: '1',
      prerequisites: 'None',
      learning_objectives: '• Understand core concepts\n• Apply knowledge immediately\n• Ask questions in real-time',
      agenda: '0:00-0:10 - Introduction and objectives\n0:10-0:40 - Main content delivery\n0:40-0:55 - Interactive discussion\n0:55-1:00 - Wrap-up and next steps',
      disclaimer: 'Attendance is required for completion credit.',
      accessibility_notes: 'Live captions available. Recording will be provided.',
      language_options: 'English',
      ceu_alignment: '',
      instructor_name: ''
    }
  },
  {
    id: 'cohort-12session',
    name: '12-Session Cohort Course',
    description: 'Multi-week comprehensive program',
    icon: '📚',
    data: {
      title: '',
      description: 'A comprehensive 12-week cohort-based learning program with weekly sessions.',
      category: 'Certification Programs',
      target_audience: 'Committed learners seeking certification',
      delivery_type: 'live',
      duration_hours: '24',
      prerequisites: 'Commitment to attend all 12 sessions',
      learning_objectives: '• Master advanced skills through progressive learning\n• Build community with cohort peers\n• Complete certification requirements\n• Apply learning through weekly assignments',
      agenda: 'Week 1-3: Foundations\nWeek 4-6: Intermediate Skills\nWeek 7-9: Advanced Applications\nWeek 10-11: Capstone Project\nWeek 12: Final Assessment & Celebration',
      disclaimer: 'Participants must attend at least 10 of 12 sessions to receive certification.',
      accessibility_notes: 'All sessions recorded. Materials provided in advance.',
      language_options: 'English',
      ceu_alignment: '2.4 CEUs upon successful completion',
      instructor_name: ''
    }
  },
  {
    id: 'selfpaced-cert',
    name: 'Self-Paced Certification',
    description: 'Independent study with assessment',
    icon: '🎓',
    data: {
      title: '',
      description: 'Complete this certification course at your own pace with built-in assessments.',
      category: 'Certification Programs',
      target_audience: 'Self-motivated learners',
      delivery_type: 'self-paced',
      duration_hours: '8',
      prerequisites: 'None - open to all',
      learning_objectives: '• Complete all modules independently\n• Pass knowledge assessments\n• Earn professional certification\n• Access resources anytime',
      agenda: 'Module 1: Introduction & Foundations\nModule 2: Core Concepts\nModule 3: Practical Applications\nModule 4: Advanced Topics\nModule 5: Final Assessment',
      disclaimer: 'You have 90 days from enrollment to complete. Passing score: 80%.',
      accessibility_notes: 'All content available 24/7. Multiple formats provided.',
      language_options: 'English',
      ceu_alignment: '0.8 CEUs upon passing final assessment',
      instructor_name: ''
    }
  },
  {
    id: 'webinar-eval',
    name: 'Webinar with Evaluation',
    description: 'Single event with post-survey',
    icon: '🎤',
    data: {
      title: '',
      description: 'Interactive webinar with Q&A and post-event evaluation.',
      category: 'Webinars',
      target_audience: 'General audience',
      delivery_type: 'live',
      duration_hours: '1.5',
      prerequisites: 'None',
      learning_objectives: '• Learn from expert presenter\n• Participate in live Q&A\n• Receive presentation materials\n• Provide feedback for improvement',
      agenda: '0:00-0:05 - Welcome and housekeeping\n0:05-0:50 - Main presentation\n0:50-1:20 - Q&A session\n1:20-1:30 - Evaluation and closing',
      disclaimer: 'Certificate of attendance provided upon completing post-webinar survey.',
      accessibility_notes: 'ASL interpreter available upon request. Captions enabled.',
      language_options: 'English',
      ceu_alignment: '',
      instructor_name: ''
    }
  },
  {
    id: 'youth-training',
    name: 'Youth Training',
    description: 'Designed for younger participants',
    icon: '👥',
    data: {
      title: '',
      description: 'Engaging training designed specifically for youth participants with interactive activities.',
      category: 'Youth Programs',
      target_audience: 'Youth ages 14-24',
      delivery_type: 'live',
      duration_hours: '3',
      prerequisites: 'Parent/guardian permission for minors under 18',
      learning_objectives: '• Develop practical life skills\n• Build confidence through activities\n• Connect with peers\n• Receive ongoing support',
      agenda: 'Session 1: Icebreakers and goal setting (45 min)\nSession 2: Skill-building activities (90 min)\nSession 3: Group project and reflection (45 min)',
      disclaimer: 'Parental consent required for participants under 18. Safe space guidelines apply.',
      accessibility_notes: 'Sensory-friendly environment. Multiple learning modalities used.',
      language_options: 'English',
      ceu_alignment: '',
      instructor_name: ''
    }
  },
  {
    id: 'compliance',
    name: 'Compliance Training',
    description: 'Required workplace training',
    icon: '✅',
    data: {
      title: '',
      description: 'Mandatory compliance training to meet organizational and regulatory requirements.',
      category: 'Compliance',
      target_audience: 'All employees (required)',
      delivery_type: 'self-paced',
      duration_hours: '2',
      prerequisites: 'Current employment with organization',
      learning_objectives: '• Understand compliance requirements\n• Recognize policy violations\n• Know reporting procedures\n• Pass required assessment',
      agenda: 'Section 1: Policy Overview\nSection 2: Key Requirements\nSection 3: Case Studies\nSection 4: Assessment (80% passing required)',
      disclaimer: 'This training is mandatory. Completion required within 30 days of hire/assignment. Records maintained per regulatory requirements.',
      accessibility_notes: 'ADA compliant. Alternative formats available upon request.',
      language_options: 'English, Spanish',
      ceu_alignment: 'Meets OSHA/regulatory training requirements',
      instructor_name: ''
    }
  }
];
