import { ANSWERS } from './words';

// We start with a base dictionary of common 5-letter words in case fetch fails
const BASE_DICTIONARY = new Set([
  ...ANSWERS,
  "about","above","abuse","actor","acute","admit","adopt","adult","after","again",
  "agent","agree","ahead","alarm","album","alert","alien","align","alive","alley",
  "allow","alone","along","alter","amaze","ample","amuse","angel","anger","angle",
  "angry","anime","ankle","annex","annoy","antic","apart","apple","arena","argue",
  "armor","aroma","arose","array","arrow","aside","asset","atlas","attic","audio",
  "audit","avert","avoid","await","awake","award","aware","awful","bacon","badge",
  "badly","baker","bases","basic","basin","basis","batch","beach","beard","beast",
  "begin","being","below","bench","berry","bible","birth","black","blade","blame",
  "bland","blank","blast","blaze","bleak","bleed","blend","bless","blind","blink",
  "block","blond","blood","bloom","blown","blues","bluff","blunt","blurt","board",
  "boast","bonus","booby","boost","booth","booty","bored","bound","bow","brain",
  "brand","brass","brave","bravo","bread","break","breed","brick","bride","brief",
  "bring","brink","brisk","broad","broke","brook","broom","broth","brown","brush",
  "buddy","build","built","bulge","bulky","bully","bunch","bunny","burst","buyer",
  "cabin","cable","camel","canal","candy","cargo","carry","carve","catch","cater",
  "cause","cease","cedar","chain","chair","chalk","chant","chaos","charm","chart",
  "chase","cheap","cheat","check","cheek","cheer","chest","chick","chief","child",
  "chill","china","chord","chose","chunk","churn","cider","cigar","cinch","cisco",
  "civic","civil","claim","clamp","clash","clasp","class","clean","clear","clerk",
  "click","cliff","climb","cling","clock","clone","close","cloth","cloud","clown",
  "cluck","clump","clung","coach","coast","cocoa","colon","color","comet","comic",
  "comma","coral","could","couch","cough","could","count","coupe","court","cover",
  "crack","craft","crane","crash","crate","crave","crazy","creak","cream","creep",
  "crest","crisp","cross","crowd","crown","crude","cruel","crush","cubic","curry",
  "curse","curve","cycle","daddy","daily","dairy","daisy","dance","datum","dealt",
  "death","debut","decay","decor","decoy","decry","delay","delta","demon","dense",
  "depot","depth","derby","detox","devil","diary","diner","dirty","disco","ditch",
  "dizzy","dodge","donor","donut","doubt","dough","dowdy","downs","dozen","draft",
  "drain","drake","drama","drank","drape","drawn","dread","dream","dress","dried",
  "drift","drill","drink","drive","drone","drool","drops","drown","drugs","drunk",
  "dryer","dryly","dummy","dunce","dusty","dutch","dwarf","dwell","dwelt","dying",
  "eager","eagle","early","earth","easel","eaten","eater","edict","eight","elbow",
  "elder","elect","elite","elope","elude","email","emcee","ember","emery","empty",
  "endow","enemy","enjoy","enact","ended","enter","entry","envoy","equal","equip",
  "erase","error","erupt","essay","ethic","evade","event","every","evict","evoke",
  "exact","exalt","exert","exile","exist","expat","expel","extra","exude","fable",
  "faced","facet","faith","false","fancy","fatal","fatty","fault","fauna","feast",
  "fence","ferry","fetch","fever","fewer","fiber","field","fiery","fifth","fifty",
  "fight","filth","final","first","fixed","flair","flake","flaky","flame","flank",
  "flare","flash","flask","flash","flesh","flick","fling","flint","flirt","float",
  "flock","flood","floor","flora","flour","fluid","fluke","flung","flush","flute",
  "focal","foggy","folly","force","forge","forgo","forth","forum","found","frame",
  "frank","fraud","freak","freed","fresh","friar","fried","frill","frisk","front",
  "frost","froze","fruit","fully","fungi","funny","furry","fuzzy","gauge","gaunt",
  "genre","ghost","giant","giddy","given","giver","gland","glass","glaze","gleam",
  "glide","glint","globe","gloom","glory","gloss","glove","going","goofy","goose",
  "gorge","gotta","gouge","gourd","grace","grade","grain","grand","grant","grape",
  "graph","grasp","grass","grate","grave","gravy","graze","great","greed","green",
  "greet","grief","grill","grind","gripe","groan","groom","grope","gross","group",
  "grove","growl","grown","guard","guava","guess","guest","guide","guild","guilt",
  "guise","gulch","gummy","gusto","gusty","gypsy","habit","hairy","halve","handy",
  "happy","hardy","harsh","hasn't","haste","hasty","hatch","haunt","haven","heart",
  "heavy","hedge","hefty","heist","hello","hence","herbs","hinge","hippo","hoist",
  "homer","honey","honor","horse","hotel","hound","house","hover","human","humid",
  "humor","hyena","hyper","icing","ideal","idiot","image","imply","inbox","incur",
  "index","indie","infer","inner","input","inter","intro","ionic","irony","ivory",
  "jazzy","jeans","jelly","jewel","jiffy","jimmy","joker","jolly","joust","judge",
  "juice","juicy","jumbo","jumpy","juror","kayak","kebab","kiddo","kinky","kiosk",
  "knack","knead","kneel","knelt","knelt","knife","knock","known","koala","label",
  "labor","laced","lance","large","laser","latch","later","latex","laugh","laundry",
  "layer","leach","leaky","leapt","learn","lease","least","leave","ledge","legal",
  "lemon","level","lever","libel","light","liked","lilac","limit","lined","linen",
  "liner","lingo","llama","lobby","local","lofty","logic","login","logos","login",
  "loose","lorry","loser","lousy","lover","lower","loyal","lucky","lumpy","lunch",
  "lunar","lunge","lusty","lying","lynch","lyric","macho","madly","magic","major",
  "maker","mango","manor","maple","march","marry","marsh","match","maybe","mayor",
  "medal","media","mercy","merge","merit","merry","metal","meter","micro","midst",
  "might","mimic","mince","minor","minus","mirth","miser","modal","model","modem",
  "mogul","moist","moldy","money","month","moose","moral","motif","motor","motto",
  "mound","mount","mourn","mouse","mouth","moved","movie","mower","mucus","muddy",
  "mummy","mural","murky","mushy","music","musty","naive","naked","nasty","naval",
  "needs","nerve","never","newly","niche","night","ninja","ninth","noble","noise",
  "north","notch","noted","novel","nudge","nurse","nutty","nylon","occur","ocean",
  "oddly","offal","offer","often","olive","omega","onset","opera","optic","orbit",
  "order","other","ought","ounce","outer","outdo","outgo","ovary","oxide","ozone",
  "paddy","pager","paint","panel","panic","paper","party","pasta","paste","patch",
  "patio","pause","peach","pearl","pedal","penny","perch","peril","perky","petal",
  "petty","phase","phone","photo","piano","piece","pilot","pinch","pixel","pizza",
  "place","plaid","plain","plane","plank","plant","plate","plaza","plead","pleat",
  "plier","pluck","plumb","plume","plump","plunge","point","polar","polio","polka",
  "poppy","porch","poser","pouch","pound","power","prank","prawn","press","price",
  "pride","prime","print","prior","prism","privy","prize","probe","prone","proof",
  "prose","proud","prove","prowl","prude","prune","psalm","pupil","puppy","purge",
  "purse","pushy","pygmy","quack","qualm","quart","queen","queer","query","queue",
  "quick","quiet","quill","quilt","quirk","quota","quote","rabbi","radar","radio",
  "rainy","raise","rally","ranch","range","rapid","ratio","razor","reach","react",
  "ready","realm","rebel","recap","recon","refer","reign","relax","relay","relic",
  "remit","renew","repay","repel","reply","rerun","reset","resin","retry","revel",
  "rider","ridge","rifle","right","rigid","rinse","risky","rival","river","roast",
  "robin","robot","rocky","rodeo","rogue","roman","roomy","rouge","rough","round",
  "route","rover","rowdy","royal","rugby","ruler","rumba","rumor","rural","rusty",
  "sadly","saint","salad","salon","salsa","salty","salve","sandy","satin","sauce",
  "sauna","savor","savvy","scale","scalp","scald","scare","scarf","scary","scene",
  "scent","school","scope","score","scout","scowl","scram","scrap","screw",
  "scrub","sedan","sense","sepia","serve","setup","seven","shade","shady","shaft",
  "shake","shall","shame","shape","share","shark","sharp","shave","shawl","shear",
  "sheer","sheet","shelf","shell","shift","shine","shiny","shirt","shock","shoot",
  "shore","short","shout","shove","shown","showy","shrub","shrug","shunt","siege",
  "sight","sigma","silly","since","siren","sixth","sixty","skate","sketc","skill",
  "skull","slack","slain","slang","slant","slash","slate","sleek","sleep","sleet",
  "slept","slice","slide","slime","slimy","sling","slope","sloth","slugs","slump",
  "slung","slunk","small","smart","smash","smell","smile","smith","smoky","snake",
  "snare","snark","sneak","sneer","sniff","snore","snout","sober","solar","solid",
  "solve","sonic","sorry","south","space","spade","spare","spark","spawn","speak",
  "spear","speck","speed","spell","spend","spent","spice","spicy","spied","spill",
  "spine","spoke","spoon","sport","spots","spray","spree","sprig","spunk","squad",
  "squat","squid","stack","staff","stage","stain","stair","stake","stale","stalk",
  "stall","stamp","stand","stank","stare","stark","start","stash","state","stave",
  "stays","steak","steal","steam","steel","steep","steer","stern","stick","stiff",
  "still","sting","stink","stock","stoic","stoke","stole","stomp","stone","stood",
  "stool","stoop","store","stork","storm","story","stout","stove","strap","straw",
  "stray","strip","strum","strut","stuck","study","stuff","stump","stung","stunk",
  "stunt","style","sugar","suite","sulky","sunny","super","surge","sushi","swamp",
  "swarm","swear","sweat","sweep","sweet","swept","swift","swing","swipe","swirl",
  "swore","sworn","swung","tabby","table","tacit","taffy","taint","taken","tales",
  "taste","tasty","taunt","teddy","tempo","tense","tenth","tepid","terra","thank",
  "theft","their","theme","there","these","thick","thief","thigh","thing","think",
  "third","thorn","those","three","threw","throw","thrum","thud","thumb","thump",
  "tidal","tiger","tight","timer","tipsy","tired","titan","title","toast","today",
  "token","tonic","tooth","topaz","topic","torch","total","touch","tough","towel",
  "tower","toxic","toxin","trace","track","trade","trail","train","trait","tramp",
  "trash","treat","trend","trial","tribe","trick","tried","trite","troll","troop",
  "trout","truck","truly","trump","trunk","trust","truth","tulip","tumor","tuner",
  "tunic","turbo","tutor","tweed","tweet","twice","twigs","twirl","twist","tying",
  "udder","ultra","uncut","under","undid","undue","unfit","union","unite","unity",
  "unlit","until","upper","upset","urban","usage","usher","usual","utter","valid",
  "valor","value","valve","vapor","vault","vegan","venom","venue","verse","vigor",
  "viper","viral","visit","visor","vista","vital","vivid","vocal","vodka","vogue",
  "voice","voila","voter","vouch","vowel","vulva","wafer","wager","wagon","waist",
  "watch","water","waver","weary","weave","wedge","weedy","weigh","weird","whale",
  "wheat","wheel","where","which","while","whine","whiny","whirl","white","whole",
  "whose","widen","wider","widow","width","wield","windy","witch","woman","women",
  "world","worry","worse","worst","worth","would","wound","wrath","wreck","wrist",
  "write","wrong","wrote","yacht","yearn","yeast","yield","young","youth","zebra",
  "zesty","zingy","zonal",
]);

import fs from 'fs';
import path from 'path';

let cachedWords: Set<string> | null = null;
const CACHE_FILE = path.join(process.cwd(), '.wordlist.json');

export async function getValidWords(): Promise<Set<string>> {
  if (cachedWords) return cachedWords;
  
  try {
    // 1. Try to read from disk cache
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      cachedWords = new Set(JSON.parse(data));
      return cachedWords;
    }

    // 2. Fallback to network
    const res = await fetch('https://raw.githubusercontent.com/tabatkins/wordle-list/main/words');
    if (!res.ok) throw new Error('Failed to fetch words');
    const text = await res.text();
    const words = text.split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => /^[a-z]{5}$/.test(w));
    
    cachedWords = new Set([...ANSWERS, ...BASE_DICTIONARY, ...words]);
    
    // 3. Save to disk cache for future runs
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Array.from(cachedWords)));
    
    return cachedWords;
  } catch (error) {
    console.error('Failed to load full word list, falling back to local list:', error);
    return BASE_DICTIONARY;
  }
}
