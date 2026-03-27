/**
 * Design tokens for Connect Valley 2026.
 * Use these instead of hardcoded color values.
 */
export const tokens = {
  colors: {
    surface: {
      primary: 'bg-[#030816]',      // navy
      secondary: 'bg-[#0a1930]',    // navy-light
      card: 'bg-white/5',
      cardHover: 'bg-white/10',
      overlay: 'bg-black/60',
    },
    border: {
      default: 'border-white/5',
      subtle: 'border-white/10',
      accent: 'border-gold/30',
      active: 'border-accent-500/50',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-silver/70',
      muted: 'text-silver/60',       // WCAG AA compliant (was /40)
      accent: 'text-accent-500',
      gold: 'text-gold',
      error: 'text-red-400',
      success: 'text-green-400',
    },
    status: {
      live: 'bg-red-500/20 text-red-400',
      confirmed: 'bg-green-500/20 text-green-400',
      pending: 'bg-amber-500/20 text-amber-400',
      cancelled: 'bg-red-500/20 text-red-400',
    },
    tier: {
      diamond: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
      platinum: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
      gold: 'bg-gold/20 text-gold border-gold/30',
      silver: 'bg-silver/20 text-silver-light border-silver/30',
      bronze: 'bg-amber-700/20 text-amber-600 border-amber-700/30',
      support: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
  },
  spacing: {
    page: 'max-w-lg mx-auto px-4',
    section: 'mb-6',
    cardPadding: 'p-4',
  },
  typography: {
    h1: 'text-2xl font-bold font-montserrat',
    h2: 'text-xl font-bold font-montserrat',
    h3: 'text-lg font-semibold font-montserrat',
    body: 'text-sm',
    caption: 'text-xs',
    tiny: 'text-[10px]',
  },
  radius: {
    card: 'rounded-2xl',
    button: 'rounded-xl',
    badge: 'rounded-full',
    input: 'rounded-xl',
  },
} as const;
