// Route structure only. Labels are resolved at render time through
// useTranslations("nav") / useTranslations("footer") using the `key` on each entry,
// so this file does not change per locale.

import { industries, solutions } from "@/lib/content";

export type NavItem = {
  key: string;
  href: string;
  children?: { key: string; href: string; labelNs?: "nav" | "solutionPages" | "industryPages" }[];
};

const solutionChildren = solutions.map((s) => ({
  key: `${s.key}.title`,
  href: `/solutions/${s.slug}`,
  labelNs: "solutionPages" as const
}));

const industryChildren = industries.map((i) => ({
  key: `${i.key}.title`,
  href: `/industries/${i.slug}`,
  labelNs: "industryPages" as const
}));

export const primaryNav: NavItem[] = [
  { key: "solutions", href: "/solutions", children: solutionChildren },
  { key: "industries", href: "/industries", children: industryChildren },
  {
    key: "about",
    href: "/about",
    children: [
      { key: "aboutUs", href: "/about" },
      { key: "founder", href: "/founder" }
    ]
  },
  { key: "pricing", href: "/pricing" },
  {
    key: "resources",
    href: "/blog",
    children: [
      { key: "blog", href: "/blog" },
      { key: "faqs", href: "/resources/faqs" }
    ]
  },
  { key: "contact", href: "/contact" }
];

export type FooterLink = { key: string; href: string; labelNs?: "nav" | "solutionPages" | "industryPages" };
export type FooterNavGroup = { headingKey: string; links: FooterLink[] };

export const footerNav: FooterNavGroup[] = [
  { headingKey: "solutionsHeading", links: solutionChildren },
  { headingKey: "industriesHeading", links: industryChildren.slice(0, 6) },
  {
    headingKey: "companyHeading",
    links: [
      { key: "aboutUs", href: "/about" },
      { key: "founder", href: "/founder" },
      { key: "pricing", href: "/pricing" },
      { key: "faqs", href: "/resources/faqs" },
      { key: "contact", href: "/contact" }
    ]
  }
];

export const legalNav = [
  { key: "notice", href: "/legal/notice" },
  { key: "privacy", href: "/legal/privacy" },
  { key: "cookies", href: "/legal/cookies" },
  { key: "terms", href: "/legal/terms" }
];

export const socialLinks = [
  { label: "LinkedIn", short: "IN", href: "https://www.linkedin.com/in/elad-daudet" },
  { label: "GitHub", short: "GH", href: "https://github.com/MISTERorg" },
  { label: "YouTube", short: "YT", href: "https://www.youtube.com/@eladdaudet" }
];
