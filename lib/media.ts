// One place for every picture and video on the site.
// Swap a path here and the whole site follows. Files live in /public.

export const media = {
  // HERO BACKGROUND VIDEOS
  // The home hero plays these in order with a crossfade. Every other page uses the
  // first clip only, looping quietly behind its title. Leave the list empty to show
  // the lit-hall background without video.
  // Example: ["/videos/v1.mp4", "/videos/v2.mp4"]
  // Tips: muted H.264 MP4, 1280 to 1920 px wide, under 6 MB each, no audio track needed.
  heroVideos: [] as string[],

  // Optional still shown while the first clip loads, and for visitors who prefer reduced motion.
  heroPoster: null as string | null,

  // How visible the video is behind the headline (0 to 1). The scrim keeps text readable.
  heroVideoOpacity: 0.62,

  // Seconds each clip plays on the home hero before the crossfade to the next one.
  heroClipSeconds: 6,

  // Site logo (transparent PNG). Set to null to fall back to the typographic wordmark.
  logo: "/icons/misvor-logo-gold.png" as string | null,
  logoAlt: "MISVOR",

  newsFallback: "/images/placeholders/news.svg",
  founder: "/images/team/elad.jpg"
} as const;
