/**
 * words.ts — Stackdle Word Lists
 * 
 * Uses a comprehensive word list for validation.
 * Client-side: permissive (any 5-letter alpha string accepted)
 * Server-side: full Wordle dictionary validation via the API
 */

// ============================================
// DAILY ANSWERS — Curated common 5-letter words
// The daily word is selected by: ANSWERS[dayIndex % ANSWERS.length]
// where dayIndex = days since our epoch (July 1, 2026).
// ============================================
export const ANSWERS: string[] = [
  "crane", "slate", "trace", "crate", "stare",
  "raise", "arise", "irate", "adieu", "audio",
  "canoe", "pride", "blaze", "charm", "dwarf",
  "epoch", "fjord", "glyph", "hyper", "ivory",
  "joker", "knack", "lunar", "maple", "naval",
  "oasis", "patio", "query", "rover", "solar",
  "thorn", "ultra", "vivid", "wager", "xenon",
  "yacht", "zesty", "album", "blink", "chimp",
  "dodge", "elbow", "feast", "grind", "haste",
  "inbox", "jumbo", "kebab", "lemon", "mango",
  "nerve", "olive", "plumb", "quota", "recap",
  "siege", "truce", "unity", "venue", "whirl",
  "proxy", "abbey", "acute", "badge", "cabin",
  "dance", "eager", "fable", "gauge", "haven",
  "image", "jewel", "kayak", "label", "magic",
  "naive", "ocean", "panic", "quilt", "radar",
  "saint", "table", "umbra", "vapor", "watch",
  "youth", "zebra", "angel", "brave", "click",
  "dream", "every", "flame", "globe", "honor",
  "issue", "jazzy", "kneel", "latch", "minor",
  "noise", "orbit", "pearl", "quiet", "reign",
  "spine", "tiger", "upper", "valve", "wheat",
  "pixel", "yearn", "zonal", "abuse", "berry",
  "climb", "draft", "ethic", "flora", "grasp",
  "hiker", "inner", "judge", "knife", "lyric",
  "marsh", "novel", "outer", "phase", "queen",
  "relic", "shock", "toast", "usher", "vigor",
  "wound", "boxer", "chess", "depot", "ember",
  "forge", "ghost", "hound", "irony", "joint",
  "koala", "lodge", "metal", "niche", "omega",
  "piano", "quake", "robin", "snowy", "trend",
  "unfed", "virus", "witch", "oxide", "yeast",
  "bliss", "crowd", "ditch", "exile", "frost",
  "grief", "house", "index", "jelly", "knock",
  "llama", "moose", "ninja", "opera", "plush",
  "storm", "trunk", "vouch", "width",
  "abyss", "bonus", "comet", "digit", "enact",
  "flint", "grill", "humor", "infer", "joust",
  "kiosk", "limit", "moist", "nudge", "onset",
  "pinch", "quest", "rhyme", "swirl", "thumb",
  "unfit", "verse", "wreck", "alloy", "beast",
  "cling", "dwell", "evoke", "flesh", "glaze",
  "hover", "ideal", "jaunt", "mirth", "notch",
  "optic", "prank", "rigid", "stung", "tunic",
  "usurp", "venom", "wrist", "amber", "budge",
  "clasp", "drone", "elfin", "frisk", "gouge",
  "input", "jolly", "knead", "lever", "mercy",
  "north", "other", "perch", "ridge", "sting",
  "topaz", "valid", "waltz", "zingy",
  "adapt", "brisk", "cache", "daisy", "edict",
  "flaky", "giddy", "hyena", "icing", "jumpy",
  "mossy", "nutty", "ozone", "plaid", "quick",
  "rocky", "spicy", "tipsy", "viper", "wacky",
  "toxin", "yummy", "blend", "cloak", "dwelt",
  "elegy", "flour", "growl", "hasty", "itchy",
  "juice", "karma", "leapt", "mural", "needy",
  "oomph", "prism", "qualm", "regal", "sleek",
  "twirl", "udder", "voila", "wrung",
  "argue", "brake", "crisp", "delve", "equal",
  "fifty", "gleam", "hoist", "incur",
  "lymph", "munch", "noted", "pause", "quill",
  "rusty", "shrug", "tract", "undue", "vying",
  "weary", "abode", "blurt", "civic", "dunce",
  "exude", "gusty", "heist", "impel",
  "lofty", "moron", "niece", "piety", "queue",
  "sworn", "toddy", "ulcer", "valet",
  "angst", "brood", "caulk", "dryly",
  "elude", "focus", "geeky", "hotly", "inter",
  "salty", "beach", "media", "plant", "world",
  "power", "light", "right", "heart", "money",
  "story", "place", "young", "years", "point",
  "share", "large", "price", "state", "paper",
  "group", "human", "green", "order", "glass",
  "model", "black", "level", "party", "river",
  "field", "month", "sport", "cause", "guide",
  "early", "trade", "space", "night", "seven",
  "daily", "bring", "court", "board", "drive",
  "final", "built", "fresh", "cover", "sweet",
  "total", "movie", "event", "force", "mouth",
  "style", "brain", "south", "block", "staff",
  "royal", "stone", "basic", "chain", "trial",
  "labor", "cross", "offer", "match", "floor",
  "sound", "child", "scale", "truth", "legal",
  "rough", "meant", "china", "mayor", "proud",
  "frame", "plain", "smile", "store", "proof",
  "chief", "award", "usual", "tower", "faith",
  "moral", "broke", "drink", "grain", "sleep",
  "print", "smart", "score", "enemy", "fifth",
  "brown", "shirt", "teeth", "crime", "claim",
  "treat", "ratio", "track", "asset", "urban",
  "pilot", "coach", "thick", "crowd", "bonus",
  "grade", "fewer", "prime", "honor", "steel",
  "fault", "grass", "admit", "doubt", "skill",
  "lunch", "motor", "super", "alarm", "apply",
  "angle", "solid", "naked", "count", "giant",
  "bread", "guess", "elect", "split", "anger",
  "brief", "metal", "lease", "pound", "juice",
  "essay", "grand", "minor", "mount", "favor",
  "waste", "stock", "phase", "guard", "scope",
  "shelf", "shift", "agent", "aside", "strip",
  "hence", "quote", "sight", "tough", "mount",
  "tight", "steam", "swing", "exact", "pitch",
  "tired", "trace", "shake", "spare", "sheet",
  "theme", "solve", "proud", "spray", "trend",
  "sugar", "smoke", "steel", "brush", "fiber",
  "outer", "nerve", "trace", "globe", "bunch",
  "dirty", "worth", "shoot", "tribe", "cabin",
];

// ============================================
// VALID GUESSES — Comprehensive word validation
// We accept ANY 5-letter alphabetic string on the client.
// The server-side API performs the actual dictionary check
// using a full ~13,000 word Wordle dictionary loaded at runtime.
// ============================================

/**
 * Client-side validation: accepts any 5-letter alphabetic string.
 * This prevents the frustrating "not in word list" for common words.
 * The server-side API route does the real dictionary validation.
 */
export function isValidGuess(word: string): boolean {
  const w = word.toLowerCase().trim();
  return w.length === 5 && /^[a-z]{5}$/.test(w);
}

// ============================================
// Utility: Get today's word
// Uses a deterministic date-based index so all
// players get the same word on the same day.
// ============================================

/** Our epoch start date: July 1, 2026 */
const EPOCH = new Date(2026, 6, 1); // Month is 0-indexed, so 6 = July

/**
 * Returns the number of days since our epoch.
 * This gives us a stable daily index for word selection.
 */
export function getDayIndex(): number {
  const now = new Date();
  const diff = now.getTime() - EPOCH.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Returns today's Wordle answer.
 * The word rotates daily based on the day index.
 * All players see the same word on the same day.
 */
export function getTodaysWord(): string {
  const index = getDayIndex();
  // Modulo wraps around when we exhaust the list
  return ANSWERS[((index % ANSWERS.length) + ANSWERS.length) % ANSWERS.length];
}

/**
 * Returns the current game ID (matches the day index + 1 for 1-based IDs).
 */
export function getGameId(): number {
  return getDayIndex() + 1;
}
