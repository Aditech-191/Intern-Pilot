import { StudentProfile, Opportunity } from "@/types";

export const SEED_PROFILES: StudentProfile[] = [
  {
    id: "student-alex-omondi",
    name: "Alex Omondi",
    university: "Makerere University",
    course: "BSc. Software Engineering",
    year_of_study: 3,
    skills: ["React", "TypeScript", "Node.js", "Python", "PostgreSQL", "Tailwind CSS"],
    interests: ["Full-Stack Web", "Fintech", "Cloud Architecture"],
    experience_summary: "Built an open-source campus food delivery web app; active student lead at GDSC Makerere with 2 production hackathon prototypes."
  },
  {
    id: "student-amina-namukasa",
    name: "Amina Namukasa",
    university: "Kyambogo University",
    course: "BSc. Computer Science",
    year_of_study: 2,
    skills: ["Python", "Flask", "SQL", "Data Analysis", "Git", "REST APIs"],
    interests: ["Data Science", "Machine Learning", "HealthTech"],
    experience_summary: "Completed data analytics foundations at Outbox Africa; developed a predictive crop price tracker for local agricultural markets."
  }
];

export const SEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-safeboda-01",
    title: "Software Engineering Intern (Web & Backend)",
    organization: "SafeBoda",
    location: "Kampala, Uganda (Hybrid)",
    deadline: "2026-11-20", // Closing in ~7 days
    eligibility: "Undergraduates in Computer Science, Software Engineering or related discipline in Year 2 or 3.",
    requirements: ["React", "TypeScript", "Node.js", "REST APIs", "Git basics"],
    link: "https://safeboda.com/careers/internships",
    summary: "Hands-on engineering internship building merchant and driver tooling for East Africa's leading super-app platform.",
    category: "Internship",
    is_verified: true,
    created_at: "2026-11-01"
  },
  {
    id: "opp-mtn-grad-02",
    title: "MTN Digital Innovation Graduate Trainee 2027",
    organization: "MTN Uganda",
    location: "Kampala, Uganda (On-site)",
    deadline: "2026-11-30",
    eligibility: "Final year students or recent graduates (< 1 year) with a Second Class Upper or First Class degree.",
    requirements: ["Python", "SQL", "Cloud Fundamentals", "Problem Solving", "Data Analysis"],
    link: "https://www.mtn.co.ug/careers",
    summary: "12-month intensive rotational leadership and tech program across cloud infrastructure, Fintech (MoMo), and data engineering.",
    category: "Graduate Trainee",
    is_verified: true,
    created_at: "2026-11-05"
  },
  {
    id: "opp-andela-lead-03",
    title: "Technical Leadership Apprenticeship",
    organization: "Andela",
    location: "Remote (Uganda / East Africa)",
    deadline: "2026-12-15",
    eligibility: "Open to passionate university students with foundational web or mobile development experience.",
    requirements: ["TypeScript", "Python", "Data Structures", "System Design Basics", "Git"],
    link: "https://andela.com/learning",
    summary: "Global mentorship, pair programming with senior engineers, and stipend-supported open-source real-world project contributions.",
    category: "Fellowship",
    is_verified: true,
    created_at: "2026-11-02"
  },
  {
    id: "opp-mak-ai-04",
    title: "Undergraduate AI Research Fellow",
    organization: "Makerere Artificial Intelligence Lab",
    location: "Kampala, Uganda (Makerere Campus)",
    deadline: "2026-11-18", // Urgent (< 5 days)
    eligibility: "Current Makerere, Kyambogo, or MUST students with strong math, statistics, and Python skills.",
    requirements: ["Python", "PyTorch or TensorFlow", "Data Analysis", "Computer Vision basics"],
    link: "https://air.ug/fellowships",
    summary: "Conduct supervised research applying computer vision and NLP to automated crop disease surveillance and local African language translation.",
    category: "Fellowship",
    is_verified: true,
    created_at: "2026-11-04"
  },
  {
    id: "opp-google-gads-05",
    title: "Google Africa Developer Scholarship (GADS)",
    organization: "Google & Pluralsight",
    location: "Remote (All Africa)",
    deadline: "2026-12-31",
    eligibility: "Any university student across sub-Saharan Africa eager to master Cloud, Android, or Web Engineering.",
    requirements: ["HTML/CSS/JavaScript", "Cloud Basics", "Curiosity to learn"],
    link: "https://buildyourfuture.withgoogle.com/scholarships",
    summary: "Full certification sponsorship for Associate Cloud Engineer and Mobile Web Specialist with dedicated cohort mentors.",
    category: "Scholarship",
    is_verified: true,
    created_at: "2026-10-25"
  },
  {
    id: "opp-stanbic-06",
    title: "Digital Banking & Systems Intern",
    organization: "Stanbic Bank Uganda",
    location: "Crested Towers, Kampala (On-site)",
    deadline: "2026-11-22",
    eligibility: "Year 2 or 3 students in ICT, Software Engineering, or Business Computing.",
    requirements: ["SQL", "PostgreSQL", "Node.js", "Cybersecurity Basics", "Financial Systems"],
    link: "https://stanbicbank.co.ug/careers",
    summary: "Work alongside the core banking engineering squad on mobile payment integrations and secure transactional microservices.",
    category: "Internship",
    is_verified: true,
    created_at: "2026-11-08"
  },
  {
    id: "opp-innov-vil-07",
    title: "Future Lab Venture Tech Fellow",
    organization: "The Innovation Village",
    location: "Ntinda, Kampala, Uganda",
    deadline: "2026-12-05",
    eligibility: "Creative student developers building solutions for agri-tech, logistics, and gig-economy enablement.",
    requirements: ["React", "Tailwind CSS", "Node.js", "Product Prototyping"],
    link: "https://innovationvillage.co.ug",
    summary: "Paid 3-month venture building residency pairing student builders with seed-stage startups tackling local challenges.",
    category: "Fellowship",
    is_verified: true,
    created_at: "2026-11-09"
  },
  {
    id: "opp-refactory-08",
    title: "Software Engineering Apprenticeship",
    organization: "Refactory Uganda",
    location: "Muyenga, Kampala",
    deadline: "2026-11-16", // Urgent (< 3 days)
    eligibility: "Students seeking practical industry-readiness bridge training and company placement.",
    requirements: ["JavaScript", "React", "Git", "Team Collaboration"],
    link: "https://refactory.ug/programs",
    summary: "Immersive industry-partnered boot-camp fast-tracking students directly into vetted Kampala tech hiring pipelines.",
    category: "Internship",
    is_verified: true,
    created_at: "2026-11-03"
  }
];

