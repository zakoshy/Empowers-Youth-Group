# **App Name**: EmpowerHub

## Core Features:

- User Authentication: Secure user registration and login system using NextAuth.js.
- Role-Based Access Control: Admin panel to assign roles (Chairperson, Treasurer, Coordinator, Investment Lead, Member) and middleware to control access to dashboards.
- Financial Tracking: Treasurer can record monthly contributions; members can view their contribution summary and debt.  All can see financial years.
- Event Management: Coordinator can create/update events, displayed publicly and on member dashboards.
- Document Management: Chairperson can upload/update the group constitution; Investment Lead can upload/update investment reports; all members can view these.
- Polling System: Chairperson creates polls, and members can vote.
- Personalized Community Suggestions: Based on the investment documents, events, and member financial situations, use a generative AI tool to create suggestions on possible programs that members and the community can engage in together, displayed to each member based on their roles and preferences.

## Style Guidelines:

- Primary color: Deep sky blue (#00BFFF) to symbolize trust, community, and forward-thinking initiatives.
- Background color: Light blue (#E0F7FA) to provide a calm and welcoming backdrop.
- Accent color: Soft green (#90EE90) for CTAs, symbolizing growth and prosperity.
- Body font: 'PT Sans', a humanist sans-serif to combine a modern look with a touch of warmth for easy reading.
- Headline font: 'Playfair', a modern sans-serif with an elegant and high-end feel to create sophisticated, legible titles; if longer text is anticipated, use 'PT Sans' for body.
- Use simple, clean icons from a library like Feather icons, customized with the primary color, to represent different actions and data points within the dashboards.
- Mobile-first, responsive design using TailwindCSS grid and flexbox to ensure optimal viewing on all devices.  Dashboards should be clear and easy to navigate, ensuring important information is quickly accessible.