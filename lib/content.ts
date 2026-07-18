export type Service = {
  title: string;
  description: string;
  mode: "browser" | "landing" | "dashboard" | "mobile" | "automation" | "system";
};

export const services: Service[] = [
  {
    title: "Websites",
    description: "Clear, credible digital experiences built to earn attention and create business opportunities.",
    mode: "browser",
  },
  {
    title: "Landing Pages",
    description: "Focused pages that turn campaigns, launches and offers into measurable action.",
    mode: "landing",
  },
  {
    title: "Web Applications",
    description: "Reliable platforms that simplify complex workflows for teams and customers.",
    mode: "dashboard",
  },
  {
    title: "Mobile Applications",
    description: "Fast, intuitive mobile products designed around real user behaviour.",
    mode: "mobile",
  },
  {
    title: "Automation",
    description: "Connected systems that remove repetitive work and keep operations moving.",
    mode: "automation",
  },
  {
    title: "Custom Software",
    description: "Purpose-built tools for requirements that off-the-shelf software cannot solve well.",
    mode: "system",
  },
];

export const projects = [
  {
    number: "01",
    type: "BUSINESS PLATFORM",
    title: "A sharper digital front door for a growing advisory business.",
    description: "A corporate website and lead-generation platform that turns complex services into a clear path to enquiry.",
    services: "STRATEGY / UX / UI DESIGN / DEVELOPMENT",
    challenge: "The existing digital presence explained the firm but did not guide decision-makers toward the right service or next action.",
    approach: "A new information system, sharper value proposition and conversion path built around how prospects evaluate advisory partners.",
    outcome: "A credible business platform designed to shorten the path from first visit to qualified conversation.",
    video: "/media/project-business.mp4",
    poster: "/media/project-business.webp",
    theme: "portal",
  },
  {
    number: "02",
    type: "OPERATIONS SYSTEM",
    title: "One operating view instead of twelve disconnected spreadsheets.",
    description: "A custom workflow dashboard that gives teams reliable data, approvals and operational visibility in one place.",
    services: "PRODUCT DESIGN / WEB APPLICATION / AUTOMATION",
    challenge: "Operational knowledge lived across spreadsheets, inboxes and manual approvals, creating delays and inconsistent reporting.",
    approach: "A role-based application combining requests, approvals, workflow automation and live operational reporting.",
    outcome: "One reliable operating view that reduces repetitive coordination and gives leaders clearer control.",
    video: "/media/project-operations.mp4",
    poster: "/media/project-operations.webp",
    theme: "grid",
  },
  {
    number: "03",
    type: "MOBILE PRODUCT",
    title: "A service marketplace designed to move at mobile speed.",
    description: "A focused mobile experience connecting customers, providers and real-time service updates.",
    services: "UX / MOBILE DEVELOPMENT / BACKEND",
    challenge: "Customers and providers needed a faster way to coordinate availability, confirmation and service progress.",
    approach: "A mobile-first flow with focused discovery, real-time status updates and a backend designed for service operations.",
    outcome: "A simpler, more responsive product experience for both sides of the marketplace.",
    video: "/media/project-mobile.mp4",
    poster: "/media/project-mobile.webp",
    theme: "signal",
  },
] as const;

export const advantages = [
  {
    number: "01",
    title: "Fast Execution",
    copy: "Clear milestones and efficient delivery without unnecessary agency layers.",
  },
  {
    number: "02",
    title: "Design + Development",
    copy: "The interface and technology are planned as one connected system.",
  },
  {
    number: "03",
    title: "Business-Focused Decisions",
    copy: "Technology is selected around requirements, not whatever is trending this week.",
  },
  {
    number: "04",
    title: "Clear Communication",
    copy: "Transparent progress, direct answers and realistic expectations from start to launch.",
  },
] as const;

export const processSteps = [
  ["01", "UNDERSTAND", "Define the business problem, audience, constraints and desired outcome."],
  ["02", "PLAN", "Shape the scope, system, priorities and fastest responsible route to launch."],
  ["03", "DESIGN", "Create the experience, interface language and interaction model as one system."],
  ["04", "BUILD", "Develop the product with clean architecture, visible progress and frequent checks."],
  ["05", "LAUNCH", "Prepare content, quality checks, analytics, deployment and a confident release."],
] as const;

export const technologyGroups = [
  ["FRONTEND", "Next.js", "React", "TypeScript", "GSAP"],
  ["BACKEND", "Node.js", "APIs", "Python", "Serverless"],
  ["MOBILE", "React Native", "Flutter", "iOS", "Android"],
  ["DATA + CLOUD", "PostgreSQL", "Supabase", "AWS", "Vercel"],
  ["AUTOMATION + AI", "n8n", "Make", "OpenAI", "Workflow APIs"],
  ["MEASUREMENT", "Analytics", "Experiments", "Observability", "SEO"],
] as const;
