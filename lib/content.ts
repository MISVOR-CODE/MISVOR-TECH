import type { IconName } from "@/components/site/icons";
import type { SceneKind } from "@/components/fx/scenes";

// Route slugs and structure for solutions and industries. All visible text lives in
// messages/*.json under `solutionPages.<key>` and `industryPages.<key>`.

export type Solution = {
  key: string;
  slug: string;
  icon: IconName;
  scene: SceneKind;
  beam: string;
  stack: string[];
  industries: string[];
};

export const solutions: Solution[] = [
  {
    key: "aiAgents",
    slug: "ai-agents",
    icon: "agent",
    scene: "neural",
    beam: "251 234 162",
    stack: ["LangChain", "OpenAI API", "Hugging Face", "Ollama", "FastAPI"],
    industries: ["finance", "healthcare", "professional", "retail"]
  },
  {
    key: "workflowAutomation",
    slug: "workflow-automation",
    icon: "workflows",
    scene: "gears",
    beam: "214 126 142",
    stack: ["n8n", "Make.com", "Python", "Ansible", "UiPath"],
    industries: ["professional", "logistics", "manufacturing", "retail"]
  },
  {
    key: "documentIntelligence",
    slug: "document-intelligence",
    icon: "documents",
    scene: "stack",
    beam: "122 190 168",
    stack: ["Python", "OpenCV", "LangChain", "PostgreSQL", "Ollama"],
    industries: ["logistics", "finance", "healthcare", "professional"]
  },
  {
    key: "dataAnalytics",
    slug: "data-analytics",
    icon: "data",
    scene: "bars",
    beam: "226 214 184",
    stack: ["Python", "Pandas", "SQL", "Power BI", "Grafana"],
    industries: ["finance", "retail", "manufacturing", "education"]
  },
  {
    key: "cloudDevops",
    slug: "cloud-devops",
    icon: "cloud",
    scene: "globe",
    beam: "232 170 92",
    stack: ["AWS", "GCP", "Kubernetes", "Terraform", "GitLab CI/CD"],
    industries: ["media", "retail", "manufacturing", "education"]
  },
  {
    key: "securityCompliance",
    slug: "security-compliance",
    icon: "shield",
    scene: "shield",
    beam: "128 168 224",
    stack: ["IAM", "MFA", "OWASP ZAP", "SonarQube", "ISO 27001"],
    industries: ["finance", "healthcare", "education", "professional"]
  }
];

export type Industry = {
  key: string;
  slug: string;
  icon: IconName;
  /** The 3D object shown on this industry's page. */
  scene: SceneKind;
  solutions: string[];
};

export const industries: Industry[] = [
  { key: "finance", slug: "finance", icon: "fiscal", scene: "scales", solutions: ["documentIntelligence", "dataAnalytics", "securityCompliance"] },
  { key: "healthcare", slug: "healthcare", icon: "health", scene: "helix", solutions: ["aiAgents", "documentIntelligence", "securityCompliance"] },
  { key: "logistics", slug: "logistics", icon: "truck", scene: "containers", solutions: ["documentIntelligence", "workflowAutomation", "dataAnalytics"] },
  { key: "retail", slug: "retail", icon: "bag", scene: "bag", solutions: ["aiAgents", "workflowAutomation", "dataAnalytics"] },
  { key: "media", slug: "media", icon: "news", scene: "book", solutions: ["aiAgents", "workflowAutomation", "cloudDevops"] },
  { key: "education", slug: "education", icon: "cap", scene: "cap", solutions: ["aiAgents", "dataAnalytics", "cloudDevops"] },
  { key: "manufacturing", slug: "manufacturing", icon: "cog", scene: "turbine", solutions: ["workflowAutomation", "dataAnalytics", "cloudDevops"] },
  { key: "professional", slug: "professional-services", icon: "labor", scene: "briefcase", solutions: ["aiAgents", "workflowAutomation", "documentIntelligence"] }
];

export const solutionBySlug = (slug: string) => solutions.find((s) => s.slug === slug);
export const solutionByKey = (key: string) => solutions.find((s) => s.key === key);
export const industryBySlug = (slug: string) => industries.find((i) => i.slug === slug);
export const industryByKey = (key: string) => industries.find((i) => i.key === key);

// Tools shown in the home page ticker.
export const stackTicker = [
  "n8n",
  "Python",
  "LangChain",
  "OpenAI API",
  "Hugging Face",
  "Ollama",
  "FastAPI",
  "Next.js",
  "PostgreSQL",
  "AWS",
  "Google Cloud",
  "Kubernetes",
  "Docker",
  "Terraform",
  "Ansible",
  "GitHub Actions",
  "Grafana",
  "Playwright"
];
