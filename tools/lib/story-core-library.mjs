import crypto from "node:crypto";

import { slugify, titleFromSlug } from "./book-core.mjs";

export const archetypes = [
  {
    id: "wounded-seeker",
    name: "Wounded Seeker",
    drive: "Needs a pattern that can make suffering legible.",
    gift: "Curiosity that keeps moving even through fear.",
    shadow: "Treats obsession as depth.",
  },
  {
    id: "threshold-guide",
    name: "Threshold Guide",
    drive: "Controls access to hidden systems and hidden meanings.",
    gift: "Can translate the impossible into usable action.",
    shadow: "Uses explanation to create dependence.",
  },
  {
    id: "civic-guardian",
    name: "Civic Guardian",
    drive: "Keeps institutions from dissolving into appetite.",
    gift: "Duty under pressure.",
    shadow: "Protects order even after justice has gone missing.",
  },
  {
    id: "heretic-maker",
    name: "Heretic Maker",
    drive: "Breaks inherited forms to reveal latent power.",
    gift: "Inventive transgression.",
    shadow: "Romanticizes damage as liberation.",
  },
  {
    id: "grief-bearer",
    name: "Grief Bearer",
    drive: "Keeps faith with what was lost.",
    gift: "Emotional truth and memory.",
    shadow: "Mistakes remembrance for loyalty to the dead.",
  },
  {
    id: "cold-strategist",
    name: "Cold Strategist",
    drive: "Turns uncertainty into leverage.",
    gift: "Long-view planning and composure.",
    shadow: "Reduces persons to positions.",
  },
  {
    id: "witness-scribe",
    name: "Witness Scribe",
    drive: "Must record the truth before power edits it.",
    gift: "Attention to nuance and contradiction.",
    shadow: "Believes observation alone is innocence.",
  },
  {
    id: "exile-heir",
    name: "Exile Heir",
    drive: "Feels obligated to restore a broken inheritance.",
    gift: "Persistence across estrangement.",
    shadow: "Confuses ownership with belonging.",
  },
  {
    id: "mercy-broker",
    name: "Mercy Broker",
    drive: "Tries to keep conflict survivable.",
    gift: "Negotiation under moral stress.",
    shadow: "Trades away clarity to preserve contact.",
  },
  {
    id: "shapeshifter-trickster",
    name: "Shapeshifter Trickster",
    drive: "Tests structures by slipping around them.",
    gift: "Adaptive intelligence.",
    shadow: "Cannot tell flexibility from betrayal.",
  },
  {
    id: "prophet-of-cost",
    name: "Prophet of Cost",
    drive: "Insists that every miracle has a ledger.",
    gift: "Sees hidden prices.",
    shadow: "Believes inevitability is wisdom.",
  },
  {
    id: "repairer",
    name: "Repairer",
    drive: "Wants to mend what violence has normalized.",
    gift: "Patient craft and care.",
    shadow: "Keeps repairing systems that should be refused.",
  },
];

export const relationshipDynamics = [
  {
    id: "false-rescue",
    name: "False Rescue",
    premise: "One character stabilizes the other while quietly shaping the debt.",
    escalation: "Gratitude hardens into suspicion once the price appears.",
  },
  {
    id: "debt-bound-alliance",
    name: "Debt-Bound Alliance",
    premise: "Cooperation begins because one side owes survival or access.",
    escalation: "The debt is reinterpreted as a tool of control.",
  },
  {
    id: "rival-recognition",
    name: "Rival Recognition",
    premise: "Two characters understand each other too well to remain comfortable enemies.",
    escalation: "Respect raises the stakes instead of lowering them.",
  },
  {
    id: "fractured-mentorship",
    name: "Fractured Mentorship",
    premise: "A teacher offers real insight while distorting the moral frame.",
    escalation: "Learning becomes the road to disobedience.",
  },
  {
    id: "custodian-and-heir",
    name: "Custodian And Heir",
    premise: "One guards the inheritance while the other claims the right to reshape it.",
    escalation: "Protection and possession become indistinguishable.",
  },
  {
    id: "witness-and-transgressor",
    name: "Witness And Transgressor",
    premise: "One acts, the other records, and both want the record to favor them.",
    escalation: "Documentation becomes a battlefield.",
  },
  {
    id: "double-agent-intimacy",
    name: "Double-Agent Intimacy",
    premise: "Closeness persists while each side withholds a strategic truth.",
    escalation: "Affection survives disclosure but changes shape.",
  },
  {
    id: "parentified-bond",
    name: "Parentified Bond",
    premise: "One character keeps having to stabilize the other emotionally.",
    escalation: "Care becomes resentment, then clarity.",
  },
  {
    id: "shared-vow-divergent-law",
    name: "Shared Vow, Divergent Law",
    premise: "Two characters agree on the goal but not on the permitted means.",
    escalation: "Their shared vow sharpens rather than softens the split.",
  },
  {
    id: "archive-and-body",
    name: "Archive And Body",
    premise: "One preserves memory; the other insists on lived consequence.",
    escalation: "Memory and survival refuse to rank each other cleanly.",
  },
];

export const storyPatterns = [
  {
    id: "threshold-quest",
    name: "Threshold Quest",
    question: "What must be surrendered to pass into a larger order without being consumed by it?",
    pressure: "The path forward is also the path of contamination.",
  },
  {
    id: "siege-of-inheritance",
    name: "Siege Of Inheritance",
    question: "Who has the right to restore, inherit, or steward a damaged legacy?",
    pressure: "Claim, stewardship, and conquest sound alike under stress.",
  },
  {
    id: "false-utopia-reveal",
    name: "False Utopia Reveal",
    question: "What hidden violence sustains the elegant explanation?",
    pressure: "Wonder delays moral judgment just long enough to be dangerous.",
  },
  {
    id: "recovery-of-law",
    name: "Recovery Of Law",
    question: "Can a lost rule restore justice, or only formalize conflict?",
    pressure: "Procedure can save the weak or arm the ruthless.",
  },
  {
    id: "investigation-through-ruins",
    name: "Investigation Through Ruins",
    question: "What truth becomes visible only when old systems partially fail?",
    pressure: "Every clue also shows who wanted it buried.",
  },
  {
    id: "pilgrimage-of-return",
    name: "Pilgrimage Of Return",
    question: "What kind of self can actually come home changed?",
    pressure: "Return becomes impossible without reinterpreting home.",
  },
  {
    id: "moral-heist",
    name: "Moral Heist",
    question: "What is worth stealing back from institutions that were already thieves?",
    pressure: "The protagonists must borrow the methods they condemn.",
  },
  {
    id: "succession-contest",
    name: "Succession Contest",
    question: "Who gets to define continuity when the original order is gone?",
    pressure: "Legitimacy must be performed before it can be proven.",
  },
];

export const narrativeStructures = [
  {
    id: "six-movement-escalation",
    name: "Six Movement Escalation",
    shape: "Each chapter increases scale, clarity, and moral cost in a forward line.",
    bestFor: "Fast, cumulative books with visible pressure growth.",
  },
  {
    id: "braided-discovery",
    name: "Braided Discovery",
    shape: "Knowledge strands arrive from different domains before locking into one argument.",
    bestFor: "Books where concept, relationship, and setting must converge.",
  },
  {
    id: "countdown-spiral",
    name: "Countdown Spiral",
    shape: "Every chapter tightens time pressure while revisiting the same core conflict from a harsher angle.",
    bestFor: "Stories that need urgency and recurrence.",
  },
  {
    id: "chamber-and-expedition",
    name: "Chamber And Expedition",
    shape: "Static decision spaces alternate with movement through volatile environments.",
    bestFor: "Books that balance argument with adventure.",
  },
  {
    id: "concentric-return",
    name: "Concentric Return",
    shape: "The story moves outward, discovers the hidden center, then returns under transformed terms.",
    bestFor: "Transformation narratives and return structures.",
  },
  {
    id: "echo-and-rupture",
    name: "Echo And Rupture",
    shape: "Later chapters mirror earlier ones while breaking their assumptions.",
    bestFor: "Stories about betrayal, recognition, and reinterpretation.",
  },
];

export const themes = [
  {
    id: "limits-preserve-meaning",
    name: "Limits Preserve Meaning",
    thesis: "Constraint is not the opposite of possibility; it is what makes possibility matter.",
  },
  {
    id: "care-versus-control",
    name: "Care Versus Control",
    thesis: "Protection becomes domination when it denies the other person's agency.",
  },
  {
    id: "memory-is-power",
    name: "Memory Is Power",
    thesis: "Who frames the past also frames what futures feel legitimate.",
  },
  {
    id: "reciprocity-restrains-power",
    name: "Reciprocity Restrains Power",
    thesis: "Power without mutual answerability cannot remain humane.",
  },
  {
    id: "survival-versus-dignity",
    name: "Survival Versus Dignity",
    thesis: "Living on is not the same as living well or living rightly.",
  },
  {
    id: "institutions-outlive-innocence",
    name: "Institutions Outlive Innocence",
    thesis: "Systems persist after the motives that founded them have rotted or vanished.",
  },
  {
    id: "truth-against-usefulness",
    name: "Truth Against Usefulness",
    thesis: "A convenient explanation can be structurally false even when it helps in the short term.",
  },
  {
    id: "grief-organized-into-rule",
    name: "Grief Organized Into Rule",
    thesis: "Unprocessed grief easily becomes administration, conquest, or ritual repetition.",
  },
  {
    id: "knowledge-has-a-ledger",
    name: "Knowledge Has A Ledger",
    thesis: "Every breakthrough redistributes risk, leverage, and accountability.",
  },
  {
    id: "return-requires-redefinition",
    name: "Return Requires Redefinition",
    thesis: "You cannot come back honestly if you insist on being unchanged.",
  },
  {
    id: "witness-as-duty",
    name: "Witness As Duty",
    thesis: "Seeing clearly creates obligations that neutrality cannot discharge.",
  },
  {
    id: "language-builds-worlds",
    name: "Language Builds Worlds",
    thesis: "Naming is never merely descriptive when institutions and bodies obey the terms.",
  },
];

export const wisdomStrains = [
  {
    id: "tragic-lucidity",
    name: "Tragic Lucidity",
    principle: "See clearly even when clarity removes comfort.",
  },
  {
    id: "stoic-craft",
    name: "Stoic Craft",
    principle: "Do the next exact thing well even inside chaos.",
  },
  {
    id: "reparative-mercy",
    name: "Reparative Mercy",
    principle: "Mercy must repair structure, not merely soothe feeling.",
  },
  {
    id: "civic-duty",
    name: "Civic Duty",
    principle: "Private desire must answer to the common world.",
  },
  {
    id: "ecological-reciprocity",
    name: "Ecological Reciprocity",
    principle: "Nothing lives alone; every act alters an environment of consequence.",
  },
  {
    id: "cunning-pragmatism",
    name: "Cunning Pragmatism",
    principle: "Use unstable means carefully, but never pretend they are clean.",
  },
];

export const worldBuildingDrivers = [
  {
    id: "layered-jurisdictions",
    name: "Layered Jurisdictions",
    effect: "Authority overlaps, conflicts, and persists in partial forms.",
  },
  {
    id: "scarcity-of-stability",
    name: "Scarcity Of Stability",
    effect: "What stays coherent is rare, expensive, and political.",
  },
  {
    id: "ritualized-law",
    name: "Ritualized Law",
    effect: "Procedure is inseparable from symbol and legitimacy.",
  },
  {
    id: "archive-identity",
    name: "Archive Identity",
    effect: "Records and memory systems are treated as parts of personhood.",
  },
  {
    id: "threshold-geography",
    name: "Threshold Geography",
    effect: "The world is organized around crossings, gates, layers, or liminal zones.",
  },
  {
    id: "machine-civics",
    name: "Machine Civics",
    effect: "Infrastructure enforces ethics, politics, and exclusion rules.",
  },
  {
    id: "debt-economy",
    name: "Debt Economy",
    effect: "Obligation moves like currency and sticks like law.",
  },
  {
    id: "dream-ecology",
    name: "Dream Ecology",
    effect: "The environment responds to memory, desire, or symbolic force.",
  },
  {
    id: "unstable-physics",
    name: "Unstable Physics",
    effect: "Material rules shift, fracture, or become negotiable.",
  },
  {
    id: "translation-hazard",
    name: "Translation Hazard",
    effect: "Crossing between systems changes meaning and often damages certainty.",
  },
];

export const plotElements = [
  {
    id: "sealed-summons",
    name: "Sealed Summons",
    job: "Forces movement by introducing a binding call or claim.",
  },
  {
    id: "false-guide",
    name: "False Guide",
    job: "Explains the world while bending the protagonist's dependence.",
  },
  {
    id: "stolen-ledger",
    name: "Stolen Ledger",
    job: "Makes hidden costs traceable and therefore dangerous.",
  },
  {
    id: "missing-witness",
    name: "Missing Witness",
    job: "Removes the easiest route to truth and raises urgency.",
  },
  {
    id: "ritual-bargain",
    name: "Ritual Bargain",
    job: "Turns consent into a high-pressure dramatic scene.",
  },
  {
    id: "trial-by-archive",
    name: "Trial By Archive",
    job: "Lets the past prosecute the present.",
  },
  {
    id: "engineered-misunderstanding",
    name: "Engineered Misunderstanding",
    job: "Creates conflict that reveals motive when the fog clears.",
  },
  {
    id: "hidden-jurisdiction",
    name: "Hidden Jurisdiction",
    job: "Reveals that another layer of law or rule has been governing events.",
  },
  {
    id: "debt-called-in",
    name: "Debt Called In",
    job: "Transforms an old favor into a present constraint.",
  },
  {
    id: "sabotage-at-ceremony",
    name: "Sabotage At Ceremony",
    job: "Breaks legitimacy in public view.",
  },
  {
    id: "map-with-missing-sector",
    name: "Map With Missing Sector",
    job: "Requires interpretation rather than simple navigation.",
  },
  {
    id: "buried-counterhistory",
    name: "Buried Counterhistory",
    job: "Destabilizes the official story once exposed.",
  },
];

export const specialObjects = [
  {
    id: "oath-key",
    name: "Oath Key",
    significance: "Unlocks access only when the right claim is spoken or embodied.",
  },
  {
    id: "grief-ledger",
    name: "Grief Ledger",
    significance: "Records losses and the prices hidden behind restorations.",
  },
  {
    id: "witness-compass",
    name: "Witness Compass",
    significance: "Points not to a place, but to the version of events least distorted.",
  },
  {
    id: "broken-astrolabe",
    name: "Broken Astrolabe",
    significance: "A damaged tool that still reveals the world's deeper order.",
  },
  {
    id: "ash-crown",
    name: "Ash Crown",
    significance: "A token of authority that exposes what rule is willing to burn.",
  },
  {
    id: "seed-vault",
    name: "Seed Vault",
    significance: "Stores a future population, idea, or possibility in suspended form.",
  },
  {
    id: "portable-shrine",
    name: "Portable Shrine",
    significance: "Carries ritual legitimacy into hostile terrain.",
  },
  {
    id: "resonance-knife",
    name: "Resonance Knife",
    significance: "Cuts structures by finding their hidden fault lines.",
  },
  {
    id: "treaty-lattice",
    name: "Treaty Lattice",
    significance: "Embodies agreements that can be tested or broken visibly.",
  },
  {
    id: "sealed-letter",
    name: "Sealed Letter",
    significance: "Delivers a truth that must arrive late to matter.",
  },
];

export const eventCatalog = [
  {
    id: "inciting-disturbance",
    name: "Inciting Disturbance",
    dramaticUse: "The world stops pretending to be stable.",
  },
  {
    id: "assembly-of-claims",
    name: "Assembly Of Claims",
    dramaticUse: "Multiple orders of legitimacy collide in one room.",
  },
  {
    id: "ambush-in-transit",
    name: "Ambush In Transit",
    dramaticUse: "Movement becomes the site of vulnerability.",
  },
  {
    id: "bargain-under-pressure",
    name: "Bargain Under Pressure",
    dramaticUse: "A deal clarifies desire, fear, and leverage at once.",
  },
  {
    id: "revelation-of-cost",
    name: "Revelation Of Cost",
    dramaticUse: "A promised good becomes ethically expensive.",
  },
  {
    id: "betrayal-disclosed",
    name: "Betrayal Disclosed",
    dramaticUse: "Trust is reinterpreted through new knowledge.",
  },
  {
    id: "ritual-test",
    name: "Ritual Test",
    dramaticUse: "Legitimacy is performed rather than asserted.",
  },
  {
    id: "archive-descent",
    name: "Archive Descent",
    dramaticUse: "The past becomes a navigable pressure chamber.",
  },
  {
    id: "moral-argument",
    name: "Moral Argument",
    dramaticUse: "The book's thesis is fought for in live relational terms.",
  },
  {
    id: "sacrifice-or-renunciation",
    name: "Sacrifice Or Renunciation",
    dramaticUse: "A character gives up leverage to remain whole.",
  },
  {
    id: "return-under-new-law",
    name: "Return Under New Law",
    dramaticUse: "The ending shows the world changed in structure, not only feeling.",
  },
  {
    id: "founding-act",
    name: "Founding Act",
    dramaticUse: "A new order is made visible through action and witness.",
  },
];

export const pacingProfiles = [
  {
    id: "surging-escalation",
    name: "Surging Escalation",
    scenePattern: [3, 4, 4, 5, 5, 4, 4, 3],
    blockPattern: [4, 5, 5, 6, 6, 5, 5, 4],
    tone: "Keeps widening pressure and minimizes idle chapters.",
  },
  {
    id: "quiet-spikes",
    name: "Quiet Spikes",
    scenePattern: [3, 3, 4, 5, 4, 5, 4, 3],
    blockPattern: [4, 4, 5, 6, 5, 6, 5, 4],
    tone: "Alternates reflective preparation with violent pressure leaps.",
  },
  {
    id: "braided-pulse",
    name: "Braided Pulse",
    scenePattern: [4, 3, 4, 4, 5, 4, 5, 4],
    blockPattern: [5, 4, 5, 5, 6, 5, 6, 5],
    tone: "Moves through multiple strands without losing momentum.",
  },
];

const chapterPhaseTemplates = [
  {
    id: "disturbance",
    title: "Opening Disturbance",
    purpose: "Introduce the unstable world and force the first irreversible move.",
    pressure: "The protagonist must act before understanding the full frame.",
    dialogueModes: ["orientation-through-friction", "promise-with-a-hidden-price"],
  },
  {
    id: "terms",
    title: "New Terms Of Contact",
    purpose: "Clarify the governing rules, obligations, and first alliances.",
    pressure: "Learning the rules also increases dependence.",
    dialogueModes: ["negotiation-with-reservations", "instruction-that-conceals-power"],
  },
  {
    id: "expansion",
    title: "Widening Pressure",
    purpose: "Push the story into a larger field of consequences and actors.",
    pressure: "The local problem becomes systemic.",
    dialogueModes: ["strategic-disagreement", "evidence-testing"],
  },
  {
    id: "reversal",
    title: "Reversal At Cost",
    purpose: "Expose the hidden price of the current path and turn trust unstable.",
    pressure: "What looked useful is revealed as compromised.",
    dialogueModes: ["accusation-and-deflection", "confession-under-duress"],
  },
  {
    id: "crisis",
    title: "Crisis Of Meaning",
    purpose: "Force the book's thesis into a live moral decision.",
    pressure: "The protagonist must choose what kind of order they can still serve.",
    dialogueModes: ["moral-argument", "vow-or-refusal"],
  },
  {
    id: "settlement",
    title: "Return With New Terms",
    purpose: "Resolve the conflict by changing what counts as a livable order.",
    pressure: "The ending must transform structure, not only emotion.",
    dialogueModes: ["reckoning", "measured-reconciliation-or-parting"],
  },
];

export const chapterRoleTemplates = [
  {
    protagonist: "Drives the action and commits to the chapter's decisive move.",
    counterpart: "Offers expertise, temptation, or counter-pressure close to the protagonist.",
    "pressure-source": "Embodies the force that makes delay impossible.",
    witness: "Records the cost and reveals what others try to normalize.",
    catalyst: "Introduces a variable or piece of evidence that changes the chapter's angle.",
  },
  {
    protagonist: "Tests a working theory against resistance in the environment.",
    counterpart: "Provides partial access while protecting their own leverage.",
    "pressure-source": "Turns information asymmetry into threat.",
    witness: "Names the emotional consequence others would abstract away.",
    catalyst: "Triggers the next threshold or reveals a hidden route.",
  },
  {
    protagonist: "Connects scattered clues into an actionable pattern.",
    counterpart: "Becomes a foil whose values sharpen the protagonist's choice.",
    "pressure-source": "Expands the scale of the conflict.",
    witness: "Challenges the official framing of the crisis.",
    catalyst: "Forces motion before certainty is available.",
  },
  {
    protagonist: "Must reinterpret earlier trust or earlier certainty.",
    counterpart: "Becomes legible as ally, manipulator, or both at once.",
    "pressure-source": "Monetizes the protagonists' earlier compromises.",
    witness: "Carries the memory that prevents false reconciliation.",
    catalyst: "Exposes the hidden price or hidden architecture.",
  },
  {
    protagonist: "Chooses a principle that costs real leverage.",
    counterpart: "Presses the strongest alternative logic available.",
    "pressure-source": "Makes capitulation sound efficient and humane.",
    witness: "Confirms what the decision means in lived terms.",
    catalyst: "Creates the narrow opening through which action remains possible.",
  },
  {
    protagonist: "Acts under transformed understanding rather than earlier appetite.",
    counterpart: "Reflects what can be preserved and what must end.",
    "pressure-source": "Attempts one last conversion of order into control.",
    witness: "Carries the outcome into public memory.",
    catalyst: "Marks the founding gesture, return, or settlement.",
  },
];

function createRngState(seed) {
  const digest = crypto.createHash("sha256").update(seed).digest();
  return digest.readUInt32LE(0);
}

export function createSeed() {
  return crypto.randomBytes(8).toString("hex");
}

export function createRng(seed) {
  let state = createRngState(String(seed || "default"));

  return function next() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickOne(rng, values) {
  return values[Math.floor(rng() * values.length)];
}

export function pickUnique(rng, values, count) {
  const pool = [...values];
  const chosen = [];

  while (pool.length && chosen.length < count) {
    const index = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }

  return chosen;
}

function phaseForIndex(index, chapterCount) {
  const maxIndex = Math.max(chapterCount - 1, 1);
  const mappedIndex = Math.round((index / maxIndex) * (chapterPhaseTemplates.length - 1));
  return chapterPhaseTemplates[mappedIndex];
}

function roleTemplateForIndex(index, chapterCount) {
  const maxIndex = Math.max(chapterCount - 1, 1);
  const mappedIndex = Math.round((index / maxIndex) * (chapterRoleTemplates.length - 1));
  return chapterRoleTemplates[mappedIndex];
}

function chapterSlug(index, phase, event) {
  return `${String(index + 1).padStart(2, "0")}-${slugify(`${phase.id}-${event.id}`)}`;
}

function chapterTitle(phase, event) {
  const phaseTitle = phase.title.replace(/\bAt\b/i, "At");
  return `${phaseTitle}: ${event.name.replace(/\bOf\b/g, "of")}`;
}

function chapterSummary(phase, event, plotElement) {
  return `${phase.title} built around ${event.name.toLowerCase()} and the pressure of ${plotElement.name.toLowerCase()}.`;
}

export function buildStoryCoreProfile({
  seed,
  title,
  slug,
  chapterCount = 6,
  genre = "",
  tone = "",
  premise = "",
}) {
  const rng = createRng(seed);
  const selectedArchetypes = pickUnique(rng, archetypes, 5);
  const selectedRelations = pickUnique(rng, relationshipDynamics, 3);
  const selectedThemes = pickUnique(rng, themes, 3);
  const selectedWorldDrivers = pickUnique(rng, worldBuildingDrivers, 3);
  const selectedPlotElements = pickUnique(rng, plotElements, 4);
  const selectedObjects = pickUnique(rng, specialObjects, 3);
  const storyPattern = pickOne(rng, storyPatterns);
  const narrativeStructure = pickOne(rng, narrativeStructures);
  const wisdom = pickOne(rng, wisdomStrains);
  const pacingProfile = pickOne(rng, pacingProfiles);
  const selectedEvents = pickUnique(rng, eventCatalog, Math.max(chapterCount, 6));

  const characters = [
    {
      roleId: "protagonist",
      title: "Protagonist",
      file: "protagonist",
      archetype: selectedArchetypes[0],
      summary: "Primary lens of action, interpretation, and change.",
    },
    {
      roleId: "counterpart",
      title: "Counterpart",
      file: "counterpart",
      archetype: selectedArchetypes[1],
      summary: "Closest ally, foil, guide, or temptation vector.",
    },
    {
      roleId: "pressure-source",
      title: "Pressure Source",
      file: "pressure-source",
      archetype: selectedArchetypes[2],
      summary: "Embodies the main coercive, rival, or antagonistic force.",
    },
    {
      roleId: "witness",
      title: "Witness",
      file: "witness",
      archetype: selectedArchetypes[3],
      summary: "Names what others try to obscure and carries public consequence.",
    },
    {
      roleId: "catalyst",
      title: "Catalyst",
      file: "catalyst",
      archetype: selectedArchetypes[4],
      summary: "Introduces pressure, information, or disruption at key turns.",
    },
  ];

  const places = [
    {
      id: "anchor-location",
      title: "Anchor Location",
      role: "Stable or familiar space that establishes the initial order.",
    },
    {
      id: "threshold-location",
      title: "Threshold Location",
      role: "Crossing point where the governing rules become visible.",
    },
    {
      id: "pressure-front",
      title: "Pressure Front",
      role: "Environment where competition, pursuit, or systemic strain intensifies.",
    },
    {
      id: "revelation-site",
      title: "Revelation Site",
      role: "Space where the hidden architecture or hidden truth becomes undeniable.",
    },
  ];

  const conceptSeeds = [
    {
      id: "governing-premise",
      title: "Governing Premise",
      role: "Central speculative, scientific, or philosophical proposition.",
    },
    {
      id: "hidden-cost",
      title: "Hidden Cost",
      role: "What the system demands but prefers not to name.",
    },
    {
      id: "transformative-rule",
      title: "Transformative Rule",
      role: "Condition that allows the ending to feel structurally earned.",
    },
  ];

  const relationshipSeeds = [
    {
      id: "protagonist-and-counterpart",
      title: "Protagonist And Counterpart",
      dynamic: selectedRelations[0],
    },
    {
      id: "protagonist-and-pressure-source",
      title: "Protagonist And Pressure Source",
      dynamic: selectedRelations[1],
    },
    {
      id: "counterpart-and-witness",
      title: "Counterpart And Witness",
      dynamic: selectedRelations[2],
    },
  ];

  const chapterBlueprints = Array.from({ length: chapterCount }, (_, index) => {
    const phase = phaseForIndex(index, chapterCount);
    const event = selectedEvents[index % selectedEvents.length];
    const plotElement = selectedPlotElements[index % selectedPlotElements.length];
    const spotlightObject = selectedObjects[index % selectedObjects.length];
    const sceneCount = pacingProfile.scenePattern[index % pacingProfile.scenePattern.length];
    const blockCount = pacingProfile.blockPattern[index % pacingProfile.blockPattern.length];
    const roleTemplate = roleTemplateForIndex(index, chapterCount);

    return {
      id: chapterSlug(index, phase, event),
      title: chapterTitle(phase, event),
      summary: chapterSummary(phase, event, plotElement),
      phase,
      event,
      plotElement,
      spotlightObject,
      sceneCount,
      blockCount,
      dialogueModes: phase.dialogueModes,
      roleTemplate,
      requiredCharacters:
        index === 0
          ? ["protagonist", "counterpart", "witness"]
          : index < 3
            ? ["protagonist", "counterpart", "witness", "catalyst"]
            : ["protagonist", "counterpart", "pressure-source", "witness", "catalyst"],
      requiredPlaces: index === 0 ? ["anchor-location", "threshold-location"] : index >= chapterCount - 2 ? ["pressure-front", "revelation-site"] : ["threshold-location", "pressure-front"],
      requiredConcepts: index < 2 ? ["governing-premise", "hidden-cost"] : ["hidden-cost", "transformative-rule"],
      requiredRelationships:
        index === 0
          ? ["protagonist-and-counterpart"]
          : index < 3
            ? ["protagonist-and-counterpart", "counterpart-and-witness"]
            : ["protagonist-and-counterpart", "protagonist-and-pressure-source", "counterpart-and-witness"],
      requiredEvents: [event.id],
      requiredObjects: [spotlightObject.id],
    };
  });

  return {
    seed,
    slug,
    title: title || titleFromSlug(slug),
    chapterCount,
    genre,
    tone,
    premise,
    storyPattern,
    narrativeStructure,
    pacingProfile,
    wisdom,
    selectedThemes,
    selectedWorldDrivers,
    selectedPlotElements,
    selectedObjects,
    selectedEvents,
    selectedArchetypes,
    selectedRelations,
    characters,
    places,
    conceptSeeds,
    relationshipSeeds,
    chapterBlueprints,
  };
}

function formatSelectedItems(items, formatter) {
  return items.map((item) => `- **${item.name || item.title}**: ${formatter(item)}`).join("\n");
}

export function buildStoryCoreMarkdown(profile) {
  return `# Story Core

## Seed

- Seed: \`${profile.seed}\`
- Story pattern: **${profile.storyPattern.name}**
- Narrative structure: **${profile.narrativeStructure.name}**
- Pacing profile: **${profile.pacingProfile.name}**
- Wisdom strain: **${profile.wisdom.name}**

## Governing Prompt

- Premise direction: ${profile.premise || "Refine from the user's request before generating drafts."}
- Genre signal: ${profile.genre || "Leave open until the prompt narrows it."}
- Tone signal: ${profile.tone || "Choose a tonal range that supports the selected themes and structure."}

## Pattern And Structure

- **${profile.storyPattern.name}**: ${profile.storyPattern.question}
- Pressure note: ${profile.storyPattern.pressure}
- **${profile.narrativeStructure.name}**: ${profile.narrativeStructure.shape}
- Best fit: ${profile.narrativeStructure.bestFor}

## Theme Stack

${formatSelectedItems(profile.selectedThemes, (item) => item.thesis)}

## Archetype Constellation

${profile.characters
  .map(
    (character) =>
      `- **${character.title}** uses **${character.archetype.name}**: ${character.archetype.drive} Gift: ${character.archetype.gift} Shadow: ${character.archetype.shadow}`
  )
  .join("\n")}

## Relationship Dynamics

${profile.relationshipSeeds
  .map(
    (relationship) =>
      `- **${relationship.title}** uses **${relationship.dynamic.name}**: ${relationship.dynamic.premise} Escalation: ${relationship.dynamic.escalation}`
  )
  .join("\n")}

## World Building Drivers

${formatSelectedItems(profile.selectedWorldDrivers, (item) => item.effect)}

## Plot Elements

${formatSelectedItems(profile.selectedPlotElements, (item) => item.job)}

## Special Objects

${formatSelectedItems(profile.selectedObjects, (item) => item.significance)}

## Event Spine

${profile.chapterBlueprints
  .map(
    (chapter, index) =>
      `${index + 1}. **${chapter.title}**: ${chapter.phase.purpose} Event focus: ${chapter.event.name}. Plot pressure: ${chapter.plotElement.name}.`
  )
  .join("\n")}

## Usage Rules

- Treat this file as the seeded source for unexpected but reproducible choices.
- If the user explicitly requests a different archetype, relation, structure, or theme, the user request overrides the seeded pick.
- Where the prompt leaves freedom, prefer these seeded picks over generic defaults so books do not collapse into the same probable shape.
- Use chapter rhythm and block counts from this file unless the user asks for a specific pacing model.
`;
}
