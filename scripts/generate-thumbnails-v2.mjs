import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const outDir = join(import.meta.dirname, "..", "public", "thumbnails");
mkdirSync(outDir, { recursive: true });

// --- Shared SVG parts ---

const W = 800;
const H = 480;
const CX = W / 2;
const CY = H / 2;

function defs() {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0099A8"/>
      <stop offset="100%" stop-color="#00B4C5"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="0.5" opacity="0.06"/>
    </pattern>
    <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="1" fill="white" opacity="0.07"/>
    </pattern>
  </defs>`;
}

function background() {
  return `<rect width="${W}" height="${H}" rx="16" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" rx="16" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" rx="16" fill="url(#dots)"/>`;
}

function decorations() {
  // Subtle geometric shapes in background
  return `<circle cx="120" cy="100" r="60" fill="none" stroke="white" stroke-width="1" opacity="0.04"/>
  <circle cx="120" cy="100" r="40" fill="none" stroke="white" stroke-width="0.5" opacity="0.03"/>
  <circle cx="680" cy="380" r="80" fill="none" stroke="white" stroke-width="1" opacity="0.04"/>
  <circle cx="680" cy="380" r="50" fill="none" stroke="white" stroke-width="0.5" opacity="0.03"/>
  <polygon points="700,60 730,80 730,120 700,140 670,120 670,80" fill="none" stroke="white" stroke-width="0.8" opacity="0.05"/>
  <polygon points="100,350 125,367 125,400 100,417 75,400 75,367" fill="none" stroke="white" stroke-width="0.8" opacity="0.04"/>
  <rect x="60" y="50" width="30" height="30" rx="4" fill="none" stroke="white" stroke-width="0.6" opacity="0.03" transform="rotate(15 75 65)"/>
  <rect x="710" y="200" width="25" height="25" rx="3" fill="none" stroke="white" stroke-width="0.6" opacity="0.03" transform="rotate(-20 722 212)"/>`;
}

function wrapSvg(iconContent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs()}
  ${background()}
  ${decorations()}
  ${iconContent}
</svg>`;
}

// --- Icon definitions (centered at 400,240, ~160x160) ---

const icons = {
  // Brain: detailed with gyri and synapse dots
  brain: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Left hemisphere -->
    <path d="M-8,-70 C-45,-68 -75,-42 -78,-5" opacity="0.9"/>
    <path d="M-78,-5 C-82,30 -60,58 -35,68" opacity="0.9"/>
    <path d="M-35,68 C-18,75 -8,72 -4,65" opacity="0.9"/>
    <path d="M-4,65 L-4,-70" opacity="0.5"/>
    <!-- Right hemisphere -->
    <path d="M4,-70 C41,-68 71,-42 74,-5" opacity="0.9"/>
    <path d="M74,-5 C78,30 56,58 31,68" opacity="0.9"/>
    <path d="M31,68 C14,75 4,72 0,65" opacity="0.9"/>
    <!-- Left gyri -->
    <path d="M-8,-70 C-8,-55 -35,-50 -55,-35" stroke-width="2.5"/>
    <path d="M-70,-15 C-50,-20 -30,-10 -4,0" stroke-width="2.5"/>
    <path d="M-75,15 C-55,10 -30,25 -4,30" stroke-width="2.5"/>
    <path d="M-65,42 C-45,35 -25,50 -4,50" stroke-width="2.5"/>
    <!-- Right gyri -->
    <path d="M4,-70 C4,-55 31,-50 51,-35" stroke-width="2.5"/>
    <path d="M66,-15 C46,-20 26,-10 0,0" stroke-width="2.5"/>
    <path d="M71,15 C51,10 26,25 0,30" stroke-width="2.5"/>
    <path d="M61,42 C41,35 21,50 0,50" stroke-width="2.5"/>
    <!-- Stem -->
    <path d="M-4,65 C-4,78 -2,85 0,88" stroke-width="3"/>
    <path d="M0,65 C0,78 -2,85 0,88" stroke-width="3"/>
    <!-- Synapse dots -->
    <circle cx="-95" cy="-20" r="3" fill="white" opacity="0.5"/>
    <circle cx="-90" cy="-35" r="2" fill="white" opacity="0.35"/>
    <circle cx="-100" cy="5" r="2.5" fill="white" opacity="0.4"/>
    <circle cx="91" cy="-25" r="3" fill="white" opacity="0.5"/>
    <circle cx="88" cy="10" r="2" fill="white" opacity="0.35"/>
    <circle cx="95" cy="-5" r="2.5" fill="white" opacity="0.4"/>
    <circle cx="-85" cy="30" r="2" fill="white" opacity="0.3"/>
    <circle cx="85" cy="35" r="2" fill="white" opacity="0.3"/>
    <!-- Synapse lines -->
    <line x1="-78" y1="-5" x2="-95" y2="-20" stroke-width="1" opacity="0.25"/>
    <line x1="-78" y1="-5" x2="-90" y2="-35" stroke-width="1" opacity="0.2"/>
    <line x1="74" y1="-5" x2="91" y2="-25" stroke-width="1" opacity="0.25"/>
    <line x1="74" y1="-5" x2="95" y2="-5" stroke-width="1" opacity="0.2"/>
  </g>`,

  // Compass: detailed with outer ring, cardinal marks, needle
  compass: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Outer ring -->
    <circle cx="0" cy="0" r="80" stroke-width="3"/>
    <circle cx="0" cy="0" r="75" stroke-width="1" opacity="0.4"/>
    <!-- Tick marks -->
    <line x1="0" y1="-80" x2="0" y2="-68" stroke-width="3"/>
    <line x1="80" y1="0" x2="68" y2="0" stroke-width="3"/>
    <line x1="0" y1="80" x2="0" y2="68" stroke-width="3"/>
    <line x1="-80" y1="0" x2="-68" y2="0" stroke-width="3"/>
    <!-- Minor ticks -->
    <line x1="56" y1="-56" x2="50" y2="-50" stroke-width="1.5" opacity="0.5"/>
    <line x1="56" y1="56" x2="50" y2="50" stroke-width="1.5" opacity="0.5"/>
    <line x1="-56" y1="56" x2="-50" y2="50" stroke-width="1.5" opacity="0.5"/>
    <line x1="-56" y1="-56" x2="-50" y2="-50" stroke-width="1.5" opacity="0.5"/>
    <!-- Cardinal letters -->
    <text x="0" y="-52" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif" font-weight="bold" opacity="0.8">N</text>
    <text x="54" y="5" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif" opacity="0.5">E</text>
    <text x="0" y="60" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif" opacity="0.5">S</text>
    <text x="-54" y="5" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif" opacity="0.5">W</text>
    <!-- Inner circle -->
    <circle cx="0" cy="0" r="10" fill="white" fill-opacity="0.15" stroke-width="2"/>
    <circle cx="0" cy="0" r="4" fill="white" opacity="0.6"/>
    <!-- Needle north (red-ish via opacity) -->
    <polygon points="0,-65 -8,0 0,-10 8,0" fill="white" fill-opacity="0.5" stroke="white" stroke-width="1.5"/>
    <!-- Needle south -->
    <polygon points="0,65 -8,0 0,10 8,0" fill="white" fill-opacity="0.15" stroke="white" stroke-width="1.5"/>
    <!-- Degree ring marks (subtle) -->
    ${Array.from({length: 36}, (_, i) => {
      const a = i * 10 * Math.PI / 180;
      const r1 = 80, r2 = 77;
      return `<line x1="${Math.sin(a)*r1}" y1="${-Math.cos(a)*r1}" x2="${Math.sin(a)*r2}" y2="${-Math.cos(a)*r2}" stroke-width="0.8" opacity="0.3"/>`;
    }).join('\n    ')}
  </g>`,

  // Heart-Shield: shield outline with heart inside and glow
  heart_shield: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Shield -->
    <path d="M0,-80 L-65,-55 L-65,5 C-65,45 -15,75 0,85 C15,75 65,45 65,5 L65,-55 Z" fill="white" fill-opacity="0.08" stroke-width="3"/>
    <path d="M0,-70 L-55,-48 L-55,3 C-55,38 -12,63 0,72 C12,63 55,38 55,3 L55,-48 Z" fill="white" fill-opacity="0.05" stroke-width="1.5" opacity="0.5"/>
    <!-- Heart inside -->
    <path d="M0,-15 C-5,-25 -18,-30 -25,-22 C-35,-12 -32,2 0,25 C32,2 35,-12 25,-22 C18,-30 5,-25 0,-15z" fill="white" fill-opacity="0.2" stroke-width="2.5"/>
    <!-- Pulse line through heart -->
    <path d="M-40,5 L-20,5 L-12,-12 L-4,18 L4,-8 L12,5 L40,5" stroke-width="2" opacity="0.5"/>
    <!-- Glow rings -->
    <circle cx="0" cy="0" r="50" stroke-width="0.8" opacity="0.08"/>
    <circle cx="0" cy="0" r="60" stroke-width="0.5" opacity="0.05"/>
  </g>`,

  // Book: open book with pages, bookmark, text lines
  book: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Left page -->
    <path d="M-5,-65 L-5,55 C-5,55 -25,48 -70,48 L-70,-55 C-70,-55 -30,-62 -5,-65z" fill="white" fill-opacity="0.1" stroke-width="2.5"/>
    <!-- Right page -->
    <path d="M5,-65 L5,55 C5,55 25,48 70,48 L70,-55 C70,-55 30,-62 5,-65z" fill="white" fill-opacity="0.1" stroke-width="2.5"/>
    <!-- Spine -->
    <path d="M0,-68 L0,58" stroke-width="2" opacity="0.6"/>
    <!-- Left page text lines -->
    <line x1="-55" y1="-35" x2="-18" y2="-35" stroke-width="1.5" opacity="0.4"/>
    <line x1="-55" y1="-22" x2="-22" y2="-22" stroke-width="1.5" opacity="0.35"/>
    <line x1="-55" y1="-9" x2="-15" y2="-9" stroke-width="1.5" opacity="0.3"/>
    <line x1="-55" y1="4" x2="-25" y2="4" stroke-width="1.5" opacity="0.25"/>
    <line x1="-55" y1="17" x2="-20" y2="17" stroke-width="1.5" opacity="0.2"/>
    <!-- Right page text lines -->
    <line x1="18" y1="-35" x2="55" y2="-35" stroke-width="1.5" opacity="0.4"/>
    <line x1="22" y1="-22" x2="55" y2="-22" stroke-width="1.5" opacity="0.35"/>
    <line x1="15" y1="-9" x2="55" y2="-9" stroke-width="1.5" opacity="0.3"/>
    <line x1="25" y1="4" x2="55" y2="4" stroke-width="1.5" opacity="0.25"/>
    <line x1="20" y1="17" x2="55" y2="17" stroke-width="1.5" opacity="0.2"/>
    <!-- Bookmark -->
    <path d="M45,-55 L45,-30 L50,-25 L55,-30 L55,-55" fill="white" fill-opacity="0.2" stroke-width="1.5"/>
    <!-- Page curl -->
    <path d="M70,48 C68,42 62,38 55,40" stroke-width="1" opacity="0.3"/>
  </g>`,

  // Briefcase: detailed with buckle, handle, compartments
  briefcase: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Main body -->
    <rect x="-75" y="-30" width="150" height="95" rx="8" fill="white" fill-opacity="0.1" stroke-width="2.5"/>
    <!-- Handle -->
    <path d="M-20,-30 L-20,-48 C-20,-55 -15,-60 -8,-60 L8,-60 C15,-60 20,-55 20,-48 L20,-30" stroke-width="3"/>
    <!-- Middle divider -->
    <line x1="-75" y1="15" x2="75" y2="15" stroke-width="1.5" opacity="0.3"/>
    <!-- Buckle/clasp -->
    <rect x="-12" y="8" width="24" height="14" rx="3" fill="white" fill-opacity="0.15" stroke-width="2"/>
    <circle cx="0" cy="15" r="3" fill="white" fill-opacity="0.3"/>
    <!-- Side compartments -->
    <line x1="-40" y1="-30" x2="-40" y2="65" stroke-width="1" opacity="0.15"/>
    <line x1="40" y1="-30" x2="40" y2="65" stroke-width="1" opacity="0.15"/>
    <!-- Bottom detail -->
    <line x1="-65" y1="55" x2="65" y2="55" stroke-width="1" opacity="0.1"/>
    <!-- Stitching -->
    <rect x="-70" y="-25" width="140" height="85" rx="5" stroke-dasharray="4 6" stroke-width="0.8" opacity="0.15"/>
  </g>`,

  // Speech: two overlapping speech bubbles with text hints
  speech: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Back bubble -->
    <path d="M15,-60 L65,-60 C73,-60 80,-53 80,-45 L80,-5 C80,3 73,10 65,10 L55,10 L60,30 L35,10 L15,10 C7,10 0,3 0,-5 L0,-45 C0,-53 7,-60 15,-60z" fill="white" fill-opacity="0.1" stroke-width="2.5"/>
    <!-- Front bubble -->
    <path d="M-65,-35 L25,-35 C33,-35 40,-28 40,-20 L40,20 C40,28 33,35 25,35 L-15,35 L-30,60 L-25,35 L-65,35 C-73,35 -80,28 -80,20 L-80,-20 C-80,-28 -73,-35 -65,-35z" fill="white" fill-opacity="0.12" stroke-width="2.5"/>
    <!-- Text lines in front bubble -->
    <line x1="-55" y1="-15" x2="15" y2="-15" stroke-width="2" opacity="0.35"/>
    <line x1="-55" y1="-2" x2="5" y2="-2" stroke-width="2" opacity="0.3"/>
    <line x1="-55" y1="11" x2="-10" y2="11" stroke-width="2" opacity="0.25"/>
    <!-- Dots in back bubble -->
    <circle cx="35" cy="-30" r="3" fill="white" opacity="0.25"/>
    <circle cx="47" cy="-30" r="3" fill="white" opacity="0.25"/>
    <circle cx="59" cy="-30" r="3" fill="white" opacity="0.25"/>
  </g>`,

  // Leaf: elegant leaf with veins and a small blossom
  leaf: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Main leaf shape -->
    <path d="M0,80 C0,80 -70,30 -70,-20 C-70,-60 -35,-80 0,-75 C35,-80 70,-60 70,-20 C70,30 0,80 0,80z" fill="white" fill-opacity="0.1" stroke-width="2.5"/>
    <!-- Central vein -->
    <path d="M0,-70 L0,80" stroke-width="2.5" opacity="0.6"/>
    <!-- Side veins -->
    <path d="M0,-50 C-20,-40 -40,-35 -52,-28" stroke-width="1.5" opacity="0.35"/>
    <path d="M0,-50 C20,-40 40,-35 52,-28" stroke-width="1.5" opacity="0.35"/>
    <path d="M0,-25 C-25,-15 -50,-8 -60,2" stroke-width="1.5" opacity="0.3"/>
    <path d="M0,-25 C25,-15 50,-8 60,2" stroke-width="1.5" opacity="0.3"/>
    <path d="M0,0 C-25,10 -48,20 -55,30" stroke-width="1.5" opacity="0.25"/>
    <path d="M0,0 C25,10 48,20 55,30" stroke-width="1.5" opacity="0.25"/>
    <path d="M0,25 C-20,35 -35,42 -40,50" stroke-width="1.5" opacity="0.2"/>
    <path d="M0,25 C20,35 35,42 40,50" stroke-width="1.5" opacity="0.2"/>
    <!-- Small blossom at top -->
    <circle cx="0" cy="-72" r="8" fill="white" fill-opacity="0.15" stroke-width="1.5"/>
    <circle cx="-10" cy="-78" r="6" fill="white" fill-opacity="0.1" stroke-width="1"/>
    <circle cx="10" cy="-78" r="6" fill="white" fill-opacity="0.1" stroke-width="1"/>
    <circle cx="0" cy="-84" r="5" fill="white" fill-opacity="0.1" stroke-width="1"/>
    <!-- Dew drops -->
    <circle cx="-30" cy="-10" r="3" fill="white" fill-opacity="0.2"/>
    <circle cx="25" cy="15" r="2.5" fill="white" fill-opacity="0.15"/>
  </g>`,

  // Award: medal with star and ribbon
  award: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Ribbons -->
    <path d="M-22,25 L-45,85 L-25,70 L-10,85 L-10,30" fill="white" fill-opacity="0.08" stroke-width="2"/>
    <path d="M22,25 L45,85 L25,70 L10,85 L10,30" fill="white" fill-opacity="0.08" stroke-width="2"/>
    <!-- Outer medal ring -->
    <circle cx="0" cy="-5" r="55" fill="white" fill-opacity="0.08" stroke-width="3"/>
    <!-- Inner medal ring -->
    <circle cx="0" cy="-5" r="45" fill="white" fill-opacity="0.05" stroke-width="1.5" opacity="0.5"/>
    <!-- Notched edge (subtle) -->
    ${Array.from({length: 24}, (_, i) => {
      const a = i * 15 * Math.PI / 180;
      const r1 = 55, r2 = 52;
      return `<line x1="${Math.sin(a)*r1}" y1="${-5 - Math.cos(a)*r1}" x2="${Math.sin(a)*r2}" y2="${-5 - Math.cos(a)*r2}" stroke-width="1.5" opacity="0.2"/>`;
    }).join('\n    ')}
    <!-- Star -->
    <polygon points="0,-35 8,-15 30,-15 13,-1 20,20 0,9 -20,20 -13,-1 -30,-15 -8,-15" fill="white" fill-opacity="0.2" stroke-width="2"/>
    <!-- Inner star highlight -->
    <polygon points="0,-25 5,-12 18,-12 8,-3 12,12 0,5 -12,12 -8,-3 -18,-12 -5,-12" fill="white" fill-opacity="0.1" stroke-width="0" opacity="0.5"/>
  </g>`,

  // Apple: apple with heart cutout
  apple: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Apple body -->
    <path d="M0,-25 C-15,-35 -55,-35 -60,-5 C-68,35 -40,70 -10,80 C-3,82 3,82 10,80 C40,70 68,35 60,-5 C55,-35 15,-35 0,-25z" fill="white" fill-opacity="0.1" stroke-width="2.5"/>
    <!-- Indent at top -->
    <path d="M-12,-25 C-5,-20 5,-20 12,-25" stroke-width="2" opacity="0.5"/>
    <!-- Stem -->
    <path d="M0,-25 C2,-40 5,-55 12,-62" stroke-width="2.5"/>
    <!-- Small leaf on stem -->
    <path d="M8,-52 C15,-58 25,-55 28,-48 C22,-45 12,-48 8,-52z" fill="white" fill-opacity="0.15" stroke-width="1.5"/>
    <!-- Heart inside -->
    <path d="M0,15 C-3,10 -12,7 -16,12 C-22,19 -18,28 0,40 C18,28 22,19 16,12 C12,7 3,10 0,15z" fill="white" fill-opacity="0.15" stroke-width="2"/>
    <!-- Shine highlight -->
    <path d="M-35,-10 C-38,5 -35,15 -30,22" stroke-width="1.5" opacity="0.2"/>
  </g>`,

  // Puzzle: interlocking puzzle pieces
  puzzle: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Top-left piece -->
    <path d="M-70,-70 L-10,-70 C-10,-70 -10,-85 0,-85 C10,-85 10,-70 10,-70 L10,-10 C10,-10 25,-10 25,0 C25,10 10,10 10,10 L-70,10 L-70,-70z" fill="white" fill-opacity="0.12" stroke-width="2.5"/>
    <!-- Top-right piece -->
    <path d="M10,-70 L70,-70 L70,10 C70,10 55,10 55,0 C55,-10 70,-10 70,-10 L70,-70" fill="white" fill-opacity="0.08" stroke-width="2.5"/>
    <!-- Bottom-left piece -->
    <path d="M-70,10 L10,10 L10,70 L-70,70 L-70,10" fill="white" fill-opacity="0.06" stroke-width="2.5"/>
    <!-- Bottom-right piece (slightly detached) -->
    <g transform="translate(8,8) rotate(3)">
      <path d="M10,10 C10,10 10,25 0,25 C-10,25 -10,10 -10,10 L-10,10 C-10,10 -25,10 -25,0 C-25,-10 -10,-10 -10,-10 L60,-10 L60,60 L-10,60 L-10,10z" fill="white" fill-opacity="0.1" stroke-width="2.5"/>
    </g>
    <!-- Nub detail: top piece right nub -->
    <path d="M10,-70 C10,-70 10,-85 0,-85 C-10,-85 -10,-70 -10,-70" stroke-width="0" fill="none"/>
  </g>`,

  // Shield (with checkmark) for Antimobbing
  shield: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Shield body -->
    <path d="M0,-80 L-65,-55 L-65,5 C-65,45 -15,75 0,85 C15,75 65,45 65,5 L65,-55 Z" fill="white" fill-opacity="0.08" stroke-width="3"/>
    <!-- Inner shield line -->
    <path d="M0,-65 L-52,-44 L-52,3 C-52,36 -12,60 0,68 C12,60 52,36 52,3 L52,-44 Z" fill="white" fill-opacity="0.05" stroke-width="1.5" opacity="0.5"/>
    <!-- Large checkmark -->
    <path d="M-28,0 L-10,20 L30,-25" stroke-width="5" opacity="0.8"/>
    <!-- Decorative rays -->
    <line x1="-45" y1="-30" x2="-38" y2="-25" stroke-width="1" opacity="0.15"/>
    <line x1="45" y1="-30" x2="38" y2="-25" stroke-width="1" opacity="0.15"/>
    <line x1="0" y1="-65" x2="0" y2="-55" stroke-width="1" opacity="0.15"/>
  </g>`,

  // Shield with person inside for Kinderschutz
  shield_person: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Shield body -->
    <path d="M0,-80 L-65,-55 L-65,5 C-65,45 -15,75 0,85 C15,75 65,45 65,5 L65,-55 Z" fill="white" fill-opacity="0.08" stroke-width="3"/>
    <path d="M0,-68 L-55,-46 L-55,3 C-55,38 -12,62 0,70 C12,62 55,38 55,3 L55,-46 Z" fill="white" fill-opacity="0.04" stroke-width="1" opacity="0.4"/>
    <!-- Person head -->
    <circle cx="0" cy="-25" r="16" fill="white" fill-opacity="0.12" stroke-width="2.5"/>
    <!-- Person body -->
    <path d="M-25,40 C-25,18 -15,5 0,5 C15,5 25,18 25,40" fill="white" fill-opacity="0.1" stroke-width="2.5"/>
    <!-- Protective hand/wing -->
    <path d="M-40,-10 C-35,-25 -20,-30 -5,-25" stroke-width="1.5" opacity="0.3"/>
    <path d="M40,-10 C35,-25 20,-30 5,-25" stroke-width="1.5" opacity="0.3"/>
  </g>`,

  // Clipboard with checklist
  clipboard: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Board -->
    <rect x="-55" y="-55" width="110" height="140" rx="8" fill="white" fill-opacity="0.08" stroke-width="2.5"/>
    <!-- Clip at top -->
    <rect x="-20" y="-72" width="40" height="25" rx="5" fill="white" fill-opacity="0.12" stroke-width="2.5"/>
    <line x1="-15" y1="-60" x2="15" y2="-60" stroke-width="2" opacity="0.3"/>
    <!-- Clip ring -->
    <circle cx="0" cy="-72" r="6" fill="white" fill-opacity="0.1" stroke-width="2"/>
    <!-- Checklist items -->
    <rect x="-38" y="-30" width="12" height="12" rx="2" stroke-width="2" opacity="0.5"/>
    <path d="M-35,-26 L-31,-22 L-24,-30" stroke-width="2" opacity="0.6"/>
    <line x1="-18" y1="-24" x2="38" y2="-24" stroke-width="2" opacity="0.35"/>
    <rect x="-38" y="-6" width="12" height="12" rx="2" stroke-width="2" opacity="0.5"/>
    <path d="M-35,-2 L-31,2 L-24,-6" stroke-width="2" opacity="0.6"/>
    <line x1="-18" y1="0" x2="35" y2="0" stroke-width="2" opacity="0.3"/>
    <rect x="-38" y="18" width="12" height="12" rx="2" stroke-width="2" opacity="0.5"/>
    <line x1="-18" y1="24" x2="30" y2="24" stroke-width="2" opacity="0.25"/>
    <rect x="-38" y="42" width="12" height="12" rx="2" stroke-width="2" opacity="0.4"/>
    <line x1="-18" y1="48" x2="32" y2="48" stroke-width="2" opacity="0.2"/>
    <!-- Paper edge -->
    <path d="M45,85 L45,75 L55,85" fill="white" fill-opacity="0.05" stroke-width="1" opacity="0.2"/>
  </g>`,

  // Flower: multi-petal flower with center
  flower: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <!-- Petals (8 petals around center) -->
    ${Array.from({length: 8}, (_, i) => {
      const a = i * 45 * Math.PI / 180;
      const px = Math.sin(a) * 38;
      const py = -Math.cos(a) * 38;
      return `<ellipse cx="${px}" cy="${py}" rx="22" ry="32" fill="white" fill-opacity="${0.06 + (i%3)*0.02}" stroke-width="2" transform="rotate(${i*45} ${px} ${py})"/>`;
    }).join('\n    ')}
    <!-- Center -->
    <circle cx="0" cy="0" r="18" fill="white" fill-opacity="0.15" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="10" fill="white" fill-opacity="0.1" stroke-width="1.5"/>
    <!-- Center details -->
    <circle cx="0" cy="0" r="4" fill="white" opacity="0.3"/>
    <!-- Stamen dots -->
    ${Array.from({length: 6}, (_, i) => {
      const a = i * 60 * Math.PI / 180;
      return `<circle cx="${Math.sin(a)*13}" cy="${-Math.cos(a)*13}" r="2" fill="white" opacity="0.25"/>`;
    }).join('\n    ')}
    <!-- Stem -->
    <path d="M0,55 C0,65 -3,75 -5,85" stroke-width="2.5" opacity="0.5"/>
    <!-- Small leaves on stem -->
    <path d="M-2,65 C-12,60 -18,65 -15,72 C-12,68 -5,67 -2,65z" fill="white" fill-opacity="0.1" stroke-width="1.5"/>
    <path d="M0,75 C8,70 14,73 12,80 C9,76 3,75 0,75z" fill="white" fill-opacity="0.08" stroke-width="1.5"/>
  </g>`,

  // People: two silhouettes side by side
  people: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <!-- Left person -->
    <circle cx="-30" cy="-40" r="22" fill="white" fill-opacity="0.1" stroke-width="2.5"/>
    <path d="M-65,60 C-65,25 -50,5 -30,5 C-15,5 -5,15 -2,30" fill="white" fill-opacity="0.08" stroke-width="2.5"/>
    <!-- Right person -->
    <circle cx="30" cy="-40" r="22" fill="white" fill-opacity="0.1" stroke-width="2.5"/>
    <path d="M65,60 C65,25 50,5 30,5 C15,5 5,15 2,30" fill="white" fill-opacity="0.08" stroke-width="2.5"/>
    <!-- Connection between them (heart or bond) -->
    <path d="M0,30 C0,30 -5,22 -10,25 C-16,30 -12,38 0,48 C12,38 16,30 10,25 C5,22 0,30 0,30z" fill="white" fill-opacity="0.15" stroke-width="1.5"/>
    <!-- Overlap area -->
    <path d="M-2,30 L2,30" stroke-width="0" opacity="0"/>
    <!-- Subtle facial features -->
    <circle cx="-35" cy="-43" r="2" fill="white" opacity="0.15"/>
    <circle cx="-25" cy="-43" r="2" fill="white" opacity="0.15"/>
    <path d="M-34,-35 C-32,-32 -28,-32 -26,-35" stroke-width="1.5" opacity="0.15"/>
    <circle cx="25" cy="-43" r="2" fill="white" opacity="0.15"/>
    <circle cx="35" cy="-43" r="2" fill="white" opacity="0.15"/>
    <path d="M26,-35 C28,-32 32,-32 34,-35" stroke-width="1.5" opacity="0.15"/>
  </g>`,

  // Generic: circle with checkmark
  generic: `<g transform="translate(${CX},${CY})" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="0" cy="0" r="65" fill="white" fill-opacity="0.08" stroke-width="3"/>
    <circle cx="0" cy="0" r="55" fill="white" fill-opacity="0.04" stroke-width="1.5" opacity="0.5"/>
    <path d="M-25,0 L-8,18 L30,-20" stroke-width="5" opacity="0.7"/>
  </g>`,
};

// --- Course-to-icon mapping ---

const courseIconMap = [
  { keywords: ["adhs", "autismus", "neurodivergenz"], icon: "brain" },
  { keywords: ["coach", "basis modul", "basis"], icon: "compass" },
  { keywords: ["burnout", "resilienz"], icon: "heart_shield" },
  { keywords: ["hochsensib"], icon: "flower" },
  { keywords: ["kommunikation", "konflikt", "mediation"], icon: "speech" },
  { keywords: ["jobcoach", "arbeitsplatz"], icon: "briefcase" },
  { keywords: ["lerncoach", "klassenassistenz"], icon: "book" },
  { keywords: ["ernährung", "gesundheit"], icon: "apple" },
  { keywords: ["famili", "beziehung", "paar", "eltern"], icon: "people" },
  { keywords: ["leadership", "cas", "führung"], icon: "award" },
  { keywords: ["bachblüten", "heilströmen", "eft", "naturheil"], icon: "leaf" },
  { keywords: ["psychografie", "psychosozial"], icon: "puzzle" },
  { keywords: ["antimobbing", "mobbing"], icon: "shield" },
  { keywords: ["casemanagement", "sozialversicherung"], icon: "clipboard" },
  { keywords: ["kinderschutz", "erwachsenenschutz", "kesb"], icon: "shield_person" },
];

function getIconForCourse(courseName) {
  const lower = courseName.toLowerCase();
  for (const mapping of courseIconMap) {
    if (mapping.keywords.some((kw) => lower.includes(kw))) {
      return mapping.icon;
    }
  }
  return "generic";
}

function generateSvg(iconKey) {
  const iconSvg = icons[iconKey] || icons.generic;
  return wrapSvg(iconSvg);
}

// --- Generate ---

const courses = [
  { slug: "adhs-coach", name: "ADHS Coach" },
  { slug: "autismus-coach", name: "Autismus Coach" },
  { slug: "cas-leadership", name: "CAS Leadership PLI" },
  { slug: "pli-basis", name: "PLI Basis" },
  { slug: "pli-jobcoach", name: "PLI Jobcoach" },
  { slug: "klassenassistenz", name: "Klassenassistenz PLI" },
  { slug: "neurodivergenz-arbeitsplatz", name: "Neurodivergenz am Arbeitsplatz" },
  { slug: "ernaehrungsberater", name: "PLI Ernährungsberater" },
  { slug: "hochsensibilitaet", name: "Hochsensibilität PLI" },
  { slug: "lerncoach", name: "PLI Lerncoach" },
  { slug: "psychografie", name: "PLI Psychografie" },
  { slug: "resilienzcoach", name: "Resilienzcoach" },
  { slug: "burnout-coach", name: "Burnout Coach" },
  { slug: "kommunikationscoach", name: "Kommunikationscoach" },
  { slug: "konfliktcoach", name: "Konfliktcoach" },
  { slug: "familiencoach", name: "Familiencoach" },
  { slug: "bachblueten", name: "Bachblüten Beratung" },
  { slug: "heilstroemen", name: "Heilströmen" },
  { slug: "eft-coach", name: "EFT Coach" },
  { slug: "antimobbingcoach", name: "Antimobbingcoach" },
  { slug: "casemanagement", name: "Casemanagement" },
  { slug: "sozialversicherung", name: "Sozialversicherung" },
  { slug: "kinderschutz", name: "Kindes- und Erwachsenenschutz" },
  { slug: "psychosoziale-beratung", name: "Psychosoziale Beratung" },
  { slug: "paarcoach", name: "Paar- und Beziehungscoach" },
  { slug: "elterncoach", name: "Elterncoach" },
  { slug: "mediationscoach", name: "Mediationscoach" },
  { slug: "gesundheitscoach", name: "Gesundheitscoach" },
  { slug: "naturheilkunde", name: "Naturheilkunde" },
  { slug: "fuehrungscoach", name: "Führungscoach" },
];

const iconTypes = Object.keys(icons);
let generatedCount = 0;

// Generate slug-based thumbnails
for (const course of courses) {
  const iconKey = getIconForCourse(course.name);
  const svg = generateSvg(iconKey);
  const filePath = join(outDir, `${course.slug}.svg`);
  writeFileSync(filePath, svg);
  generatedCount++;
}

// Generate icon-type based thumbnails (for UUID course matching)
for (const iconType of iconTypes) {
  const svg = generateSvg(iconType);
  const filePath = join(outDir, `icon-${iconType}.svg`);
  writeFileSync(filePath, svg);
  generatedCount++;
}

console.log(`✓ Generated ${generatedCount} SVG thumbnails (v2) in ${outDir}`);
console.log(`  Size: ${W}x${H}px | Border-radius: 16px`);
console.log(`  Icons: ${iconTypes.join(", ")}`);
