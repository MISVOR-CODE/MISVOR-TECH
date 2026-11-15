// Company facts used across the site. Edit here and every page follows.

export const site = {
  name: "MISVOR",
  // Where the team is based. Used in the footer and on the contact page.
  location: "Valencia, Spain",
  // Public contact address. Contact form messages are sent to CONTACT_TO_EMAIL
  // (see .env.example) and fall back to this address.
  email: "eladdaudet1918@gmail.com",
  // WhatsApp number in international format, no spaces and no "+".
  // This is still the number the site shipped with. Replace it with MISVOR's own.
  whatsapp: "34691287205",
  // Optional legal details. When set they appear on the legal notice page.
  legalName: "",
  taxId: ""
} as const;

// The cities the founder has delivered work from. They become the lit nodes on the globe.
export const cities = [
  { key: "valencia", lat: 39.47, lon: -0.38 },
  { key: "tokyo", lat: 35.68, lon: 139.69 },
  { key: "prague", lat: 50.08, lon: 14.43 },
  { key: "sanJose", lat: 37.34, lon: -121.89 },
  { key: "douala", lat: 4.05, lon: 9.77 },
  { key: "pune", lat: 18.52, lon: 73.86 }
] as const;

export const founderLinks = [
  { label: "Portfolio", href: "https://misterorg.github.io/portfolio/" },
  { label: "GitHub", href: "https://github.com/MISTERorg" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/elad-daudet" },
  { label: "GitLab", href: "https://gitlab.com/mistercomp1/" },
  { label: "YouTube", href: "https://www.youtube.com/@eladdaudet" }
] as const;

// The MISVOR AI robot is a separate project (misvor-ai, on Cloudflare Pages) so it can change without touching this site.
// Set NEXT_PUBLIC_ROBOT_URL to its address. It is read at build time.
const DEFAULT_ROBOT_URL = "https://misvor-ai.pages.dev";

/** Link behind the "Talk to MISVOR AI" button. The visitor's language travels along as ?lang=. */
export function robotHref(locale: string, base: string | undefined = process.env.NEXT_PUBLIC_ROBOT_URL): string {
  const url = new URL((base || "").trim() || DEFAULT_ROBOT_URL);
  url.searchParams.set("lang", locale);
  return url.toString();
}
