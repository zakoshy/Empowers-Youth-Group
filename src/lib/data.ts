









export type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image?: string;
};

export const memberData = {
  id: "user_123",
  name: "Alex Doe",
  role: "Member",
  financialSummary: {
    year: 2024,
    totalContribution: 1600,
    outstandingDebt: 800,
    monthlyContribution: 200,
    contributions: [
      { month: "January", status: "Paid" },
      { month: "February", status: "Paid" },
      { month: "March", status: "Paid" },
      { month: "April", status: "Paid" },
      { month: "May", status: "Paid" },
      { month: "June", status: "Paid" },
      { month: "July", status: "Paid" },
      { month: "August", status: "Paid" },
      { month: "September", status: "Pending" },
      { month: "October", status: "Pending" },
      { month: "November", status: "Pending" },
      { month: "December", status: "Pending" },
    ],
  },
};

export const investmentReports = [
  {
    id: "inv-001",
    title: "Q2 2024 Agro-Investment Report",
    date: "2024-07-15",
    summary: "Positive growth in our poultry farming initiative, with a 15% increase in projected returns.",
  },
  {
    id: "inv-002",
    title: "Q1 2024 Community Market Stall Analysis",
    date: "2024-04-20",
    summary: "The market stall has broken even and is on track for profitability in the next quarter.",
  },
];

export const DUMMY_CONSTITUTION_TEXT = `
The Constitution of The Empowers Youth Group

Article I: Name and Purpose
1.1 The name of this organization shall be "The Empowers Youth Group".
1.2 Our purpose is to foster economic independence, social responsibility, and personal growth among the youth of our community.

Article II: Membership
2.1 Membership is open to any youth aged 18-35 residing in our village.
2.2 Members must pay a monthly contribution of Ksh 200, due by the last day of each month.
2.3 Failure to contribute for three consecutive months without valid reason may result in suspension of membership privileges.

Article III: Governance
3.1 The group shall be led by an elected committee consisting of a Chairperson, Treasurer, and Coordinator.
3.2 Elections shall be held annually in December. All members in good standing are eligible to vote and be nominated.

Article IV: Finances
4.1 All funds shall be managed by the Treasurer and held in a group bank account.
4.2 The Treasurer must provide a monthly financial report to all members.
4.3 Investments require a majority vote from the members during a formal poll.

Article V: Meetings and Events
5.1 General meetings shall be held on the first Sunday of every month.
5.2 The Coordinator is responsible for organizing community events and workshops.
`;

export type Constitution = {
  id: string;
  title: string;
  content: string; // This will be the URL to the file in Firebase Storage
  uploadDate: string;
  fileName: string;
};

export type MeetingMinute = {
    id: string;
    title: string;
    meetingDate: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    uploadedBy: string;
    uploadDate: string;
}

export const navLinks = [
  { href: "/#", label: "Home" },
  { href: "/#about", label: "About Us" },
  { href: "/#mission", label: "Mission & Vision" },
  { href: "/#events", label: "Events" },
];

export const roles = ["Admin", "Chairperson", "Vice Chairperson", "Treasurer", "Coordinator", "Secretary", "Investment Lead", "Member"];

export const dashboardNavLinks = (userRole: string = "Member") => {
  const allLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "Home", roles: ["Member", "Admin", "Chairperson", "Vice Chairperson", "Treasurer", "Coordinator", "Secretary", "Investment Lead"] },
    { href: "/dashboard/profile", label: "Profile", icon: "Users", roles: ["Member", "Admin", "Chairperson", "Vice Chairperson", "Treasurer", "Coordinator", "Secretary", "Investment Lead"] },
    { href: "/dashboard/contributions", label: "Contributions", icon: "DollarSign", roles: ["Member", "Treasurer", "Chairperson"] },
    { href: "/dashboard/polls", label: "Polls", icon: "Vote", roles: ["Member", "Admin", "Chairperson", "Vice Chairperson", "Treasurer", "Coordinator", "Secretary", "Investment Lead"] },
    { href: "/dashboard/events", label: "Manage Events", icon: "Calendar", roles: ["Coordinator", "Admin"] },
    { href: "https://meet.google.com/new", label: "Schedule Meeting", icon: "Video", roles: ["Coordinator", "Admin"] },
    { href: "/dashboard/reports", label: "Investments", icon: "TrendingUp", roles: ["Member", "Investment Lead", "Admin"] },
    { href: "/dashboard/constitution", label: "Manage Constitution", icon: "FileText", roles: ["Chairperson", "Admin"] },
    { href: "/dashboard/constitution", label: "Constitution", icon: "FileText", roles: ["Member", "Vice Chairperson", "Treasurer", "Coordinator", "Secretary", "Investment Lead"] },
    { href: "/dashboard/minutes", label: "Manage Minutes", icon: "BookOpen", roles: ["Admin", "Secretary"] },
    { href: "/dashboard/minutes", label: "Meeting Minutes", icon: "BookOpen", roles: ["Member", "Chairperson", "Vice Chairperson", "Treasurer", "Coordinator", "Investment Lead"] },
    { href: "/dashboard/manage-users", label: "Manage Users", icon: "Users", roles: ["Admin"] },
  ];
  
  const filteredLinks = allLinks.filter(link => link.roles.includes(userRole));

  // Use a Map to ensure uniqueness based on 'href', which should be unique for navigation.
  // This prevents showing both "Manage X" and "X" for the same page.
  const uniqueLinks = new Map();
  filteredLinks.forEach(link => {
      if (!uniqueLinks.has(link.href)) {
        uniqueLinks.set(link.href, link);
      } else {
          // Prioritize the "Manage" link if a user has roles for both.
          const existingLink = uniqueLinks.get(link.href);
          if (link.label.startsWith("Manage") && !existingLink.label.startsWith("Manage")) {
              uniqueLinks.set(link.href, link);
          }
      }
  });

  return Array.from(uniqueLinks.values());
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export const FINANCIAL_CONFIG = {
  MONTHLY_CONTRIBUTION: 200,
  FINANCIAL_YEAR_START_MONTH: 0, // January
};

    

    


    