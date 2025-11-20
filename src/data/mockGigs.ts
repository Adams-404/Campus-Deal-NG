export interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string;
  duration: string;
  rating: number;
  reviews_count: number;
  tags: string[];
  user_id: string;
  user_name: string;
  user_avatar: string;
  created_at: string;
  is_active: boolean;
  status?: 'active' | 'paused' | 'completed';
  images?: string[];
}

export const mockGigs: Gig[] = [
  {
    id: "1",
    title: "Math Tutoring - Calculus & Algebra",
    description: "Experienced math tutor offering personalized sessions for students struggling with calculus and algebra. I have 4+ years of experience tutoring university students and can help with homework, exam prep, and understanding complex concepts. Available for both one-on-one and group sessions.",
    category: "Tutoring",
    price: 5000,
    location: "On Campus",
    duration: "1-2 hours",
    rating: 4.8,
    reviews_count: 24,
    tags: ["Math", "Calculus", "Algebra", "Homework Help"],
    user_id: "user1",
    user_name: "Adesuwa Adebayo",
    user_avatar: "",
    created_at: new Date().toISOString(),
    is_active: true,
    status: 'active'
  },
  {
    id: "2",
    title: "Logo Design & Branding",
    description: "Professional logo design and brand identity packages for startups and small businesses. I will provide 3 initial concepts and unlimited revisions until you are satisfied. Quick turnaround guaranteed.",
    category: "Design & Creative",
    price: 15000,
    location: "Remote",
    duration: "2-3 days",
    rating: 4.9,
    reviews_count: 31,
    tags: ["Logo", "Branding", "Graphic Design", "Adobe"],
    user_id: "user2",
    user_name: "Chinedu Okafor",
    user_avatar: "",
    created_at: new Date().toISOString(),
    is_active: true,
    status: 'active'
  },
  {
    id: "3",
    title: "Website Development",
    description: "Full-stack web development services. React, Node.js, databases. I can build landing pages, portfolios, or full web applications. Check out my portfolio for examples of my previous work.",
    category: "Tech & Programming",
    price: 50000,
    location: "Remote/On Campus",
    duration: "1-2 weeks",
    rating: 4.7,
    reviews_count: 18,
    tags: ["React", "Node.js", "Full Stack", "Web Development"],
    user_id: "user3",
    user_name: "Ibrahim Mohammed",
    user_avatar: "",
    created_at: new Date().toISOString(),
    is_active: true,
    status: 'active'
  },
  {
    id: "4",
    title: "Campus Food Delivery",
    description: "Quick and reliable food delivery from any restaurant to your dorm or study location. Available evenings and weekends. I have a bike and can get to you fast!",
    category: "Delivery & Moving",
    price: 2000,
    location: "Campus Wide",
    duration: "30-45 mins",
    rating: 4.6,
    reviews_count: 67,
    tags: ["Food Delivery", "Quick", "Campus", "Flexible"],
    user_id: "user4",
    user_name: "Amina Bello",
    user_avatar: "",
    created_at: new Date().toISOString(),
    is_active: true,
    status: 'active'
  },
  {
    id: "5",
    title: "Professional Photography Session",
    description: "High-quality photography for events, portraits, or products. I use professional equipment and provide edited photos within 48 hours.",
    category: "Photography",
    price: 10000,
    location: "On Campus",
    duration: "2 hours",
    rating: 4.9,
    reviews_count: 12,
    tags: ["Photography", "Portrait", "Event", "Headshots"],
    user_id: "user5",
    user_name: "David Okon",
    user_avatar: "",
    created_at: new Date().toISOString(),
    is_active: true,
    status: 'active'
  },
  {
    id: "6",
    title: "Guitar Lessons for Beginners",
    description: "Learn to play the guitar from scratch! I teach chords, strumming patterns, and your favorite songs. No prior experience needed.",
    category: "Music & Audio",
    price: 3000,
    location: "Student Center",
    duration: "1 hour",
    rating: 5.0,
    reviews_count: 8,
    tags: ["Music", "Guitar", "Lessons", "Beginner"],
    user_id: "user6",
    user_name: "Sarah Johnson",
    user_avatar: "",
    created_at: new Date().toISOString(),
    is_active: true,
    status: 'active'
  }
];

export const mockApplications = [
  {
    id: "app1",
    gig_id: "1",
    user_id: "user_me",
    proposal: "Hi, I'm interested in your tutoring services. I need help with Calculus II.",
    rate: 5000,
    status: "pending",
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    gigs: mockGigs[0]
  },
  {
    id: "app2",
    gig_id: "2",
    user_id: "user_me",
    proposal: "I need a logo for my new startup. I like your style.",
    rate: 15000,
    status: "accepted",
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    gigs: mockGigs[1]
  },
  {
    id: "app3",
    gig_id: "3",
    user_id: "user_me",
    proposal: "Can you build a simple e-commerce site?",
    rate: 45000,
    status: "rejected",
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    gigs: mockGigs[2]
  }
];
