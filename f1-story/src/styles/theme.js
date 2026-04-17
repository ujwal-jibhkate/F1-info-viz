// ─── F1: 75 Years of Speed — Design Tokens ───────────────────────────────────
// Single source of truth for all colors, typography, and visual constants.
// Import this into any component that needs theme values.

export const COLORS = {
  // Core palette
  carbon:      '#0a0a0a',   // near-black background
  carbonMid:   '#111111',   // section backgrounds
  carbonLight: '#1a1a1a',   // card backgrounds
  carbonBorder:'#2a2a2a',   // subtle borders

  // F1 Red spectrum
  racingRed:   '#e8002d',   // primary accent — F1 official red
  redHot:      '#ff1e3c',   // hover / highlight red
  redDeep:     '#a0001f',   // deep red for gradients

  // Neutral grays
  silver:      '#c0c0c0',   // secondary text
  steel:       '#888888',   // muted text
  asphalt:     '#444444',   // very muted

  // Data viz palette — constructor colors
  constructors: {
    Ferrari:    '#dc0000',
    Mercedes:   '#00d2be',
    RedBull:    '#3671c6',
    McLaren:    '#ff8000',
    Williams:   '#005aff',
    Renault:    '#fff500',
    Benetton:   '#00a651',
    TeamLotus:  '#b5985a',
    Sauber:     '#9b0000',
    ForceIndia: '#f596c8',
    Brawn:      '#ffffff',
    Brabham:    '#ffffff',
    Tyrrell:    '#006ef5',
    BRM:        '#006400',
    Maserati:   '#c0392b',
    Vanwall:    '#005f3c',
    Cooper:     '#004080',
  },

  // Chart utility colors
  street:      '#ff6b35',   // street circuit orange
  permanent:   '#4ecdc4',   // permanent circuit teal
  positive:    '#00ff87',   // positions gained
  negative:    '#e8002d',   // positions lost
  neutral:     '#888888',
}

export const FONTS = {
  display:  '"Bebas Neue", cursive',
  body:     '"DM Sans", sans-serif',
  mono:     '"Orbitron", monospace',
}

// Named F1 eras for story annotations
export const ERAS = [
  { start: 1950, end: 1957, label: 'The Founders',      team: 'Alfa Romeo / Ferrari' },
  { start: 1958, end: 1965, label: 'British Invasion',  team: 'Vanwall / BRM / Lotus' },
  { start: 1966, end: 1979, label: 'Cosworth Age',      team: 'Lotus / Tyrrell / McLaren' },
  { start: 1980, end: 1989, label: 'Turbo Wars',        team: 'Williams / McLaren' },
  { start: 1990, end: 1999, label: 'Williams Dynasty',  team: 'Williams / McLaren' },
  { start: 2000, end: 2008, label: 'Schumacher Era',    team: 'Ferrari' },
  { start: 2009, end: 2013, label: 'Red Bull Reign',    team: 'Red Bull / Brawn' },
  { start: 2014, end: 2021, label: 'Silver Domination', team: 'Mercedes' },
  { start: 2022, end: 2025, label: 'Verstappen Era',    team: 'Red Bull / McLaren' },
]

// Hero stats — the numbers that open the story
export const HERO_STATS = [
  { value: 75,     label: 'Seasons',    suffix: '' },
  { value: 867,    label: 'Drivers',    suffix: '+' },
  { value: 1150,   label: 'Races',      suffix: '+' },
  { value: 209,    label: 'Constructors', suffix: '' },
  { value: 32,     label: 'Countries',  suffix: '' },
]

// Famous driver journeys for the network viz presets
export const FAMOUS_JOURNEYS = [
  {
    id: 'alonso',
    label: 'The Nomad',
    driver: 'Fernando Alonso',
    description: '6 constructors across 23 seasons. Always chasing the perfect car.',
    color: COLORS.street,
  },
  {
    id: 'schumacher',
    label: 'The Emperor',
    driver: 'Michael Schumacher',
    description: '11 seasons at Ferrari. 72 wins together. The greatest partnership.',
    color: COLORS.constructors.Ferrari,
  },
  {
    id: 'hamilton',
    label: 'The Dynasty Builder',
    driver: 'Lewis Hamilton',
    description: '73 wins with Mercedes — the most productive partnership in F1 history.',
    color: COLORS.constructors.Mercedes,
  },
  {
    id: 'verstappen',
    label: 'The Prodigy',
    driver: 'Max Verstappen',
    description: 'From Toro Rosso at 17 to 4 world titles at Red Bull. The fastest ascent.',
    color: COLORS.constructors.RedBull,
  },
]
