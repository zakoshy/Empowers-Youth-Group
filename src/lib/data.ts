

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

export const polls = [
  {
    id: "poll-001",
    question: "What should be the theme for our next community outreach program?",
    options: [
      { id: "opt1", text: "Environmental Conservation" },
      { id: "opt2", text: "Digital Skills Training" },
      { id: "opt3", text: "Health and Wellness" },
    ],
    voted: false,
  },
  {
    id: "poll-002",
    question: "Where should we allocate the surplus funds from this year?",
    options: [
      { id: "opt1", text: "Expand the Agro-Investment Project" },
      { id: "opt2", text: "Start a Scholarship Fund" },
      { id: "opt3", text: "Invest in a community transport vehicle" },
    ],
    voted: true,
  }
];

export const constitution = {
  url: "/placeholder-constitution.pdf",
  lastUpdated: "2024-01-10",
};

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
    { href: "/dashboard/contributions", label: "Contributions", icon: "DollarSign", roles: ["Member", "Treasurer"] },
    { href: "/dashboard/events", label: "Manage Events", icon: "Calendar", roles: ["Coordinator", "Admin"] },
    { href: "/dashboard/reports", label: "Investments", icon: "TrendingUp", roles: ["Member", "Investment Lead", "Admin"] },
    { href: "/dashboard/constitution", label: "Constitution", icon: "FileText", roles: ["Member", "Chairperson", "Admin"] },
    { href: "/dashboard/manage-users", label: "Manage Users", icon: "Users", roles: ["Admin"] },
  ];
  
  const filteredLinks = allLinks.filter(link => link.roles.includes(userRole));

  // Use a Map to ensure uniqueness based on 'href', which should be unique.
  const uniqueLinks = new Map();
  filteredLinks.forEach(link => {
      uniqueLinks.set(link.href, link);
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
