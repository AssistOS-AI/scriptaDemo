---
name: chapter-builder
description: Expand a chapter plan into a detailed build-ready blueprint with scenes, character roles, block cadence, dialogue sets, and a stronger consistency checklist aligned with the book's Story Core and support specs.
---

# Chapter Builder

Use this skill when a chapter plan is still too vague to support good prose generation.

## Responsibilities

1. Read the chapter plan and its dependencies under `specs/`.
2. Expand the managed sections:
   `## Scene Blueprint`, `## Character Roles`, `## Block Set`, `## Dialogue Set`, and `## Consistency Checklist`.
3. Keep chapter planning aligned with the book seed, the story pattern, the narrative structure, and the requested rhythm.
4. Use the user's pacing instructions when they are explicit. Otherwise use the seeded block and scene counts.

## Command

Single chapter:

```bash
node tools/chapter-builder.mjs docs/<book-slug> <chapter-id>
```

All chapters:

```bash
node tools/chapter-builder.mjs docs/<book-slug> --all
```

## Workflow

1. Run the command on the target chapter or on all chapters.
2. Read the generated blueprint and refine it when the user prompt requires more specific scenes or roles.
3. Make sure each required character has a distinct chapter job.
4. Make sure each block does real work and ends with changed leverage.
5. Make sure the dialogue set carries pressure, not only exposition.

## Narrative Craft Requirements

Every expanded chapter plan must satisfy these requirements:

### Opening Hook
Each chapter must open with a **concrete, sensory, immediate hook** — never a summary, never abstract philosophy, never world-lecture. Acceptable openers:
- An action in progress: "Mirel's fingers trembled against the cold glass of the Lens array."
- A disruptive event: "The root-network went silent at the same instant the surface probe's signal died."
- A startling sensation: "Aethon felt the root-tremor before he heard it — a low, vibrating insistence that climbed through his trunk like a question refusing to be unanswered."
- A charged moment from a conversation already underway: "'You knew,' Lithos said, and the accusation carried no anger, only the flat finality of certainty."

NOT acceptable openers:
- "In the deepCanopy, things had changed since the Origaya observations began." (telling, not showing)
- "Oriveni civilization had always valued non-killing." (abstract lecture)
- A paragraph of world-lore before any character acts.

### Closing Hook and Chapter Bridge
Each chapter plan must include:
- **Closing hook** (`## Closing Hook`): The final image, action, or revelation that leaves the reader unable to stop reading. It must be an unresolved tension, a revealed cost, or an unexpected consequence — never a clean resolution. Examples:
  - "Caelith holds the probe's last transmission in her hands — and it contains a pattern she has never seen in four thousand years of data. A pattern that, if she is right, means Origaya has been watching them back."
  - "Aethon's root-network carries the vote: seven thousand years of precedent, overruled by a margin thinner than a leaf. The Descender stays in the sky. And Aethon feels, for the first time in his long life, the silence of a law that has stopped being true."

- **Next-chapter bridge** (`## Next-Chapter Bridge`): An explicit note tying the closing hook to the following chapter's opening. This prevents disjointed chapter jumps and ensures narrative continuity. Example: "Chapter 3 opens with Mirel at the Lens array, still processing Caelith's discovery. The bridge: what Caelith found forces Mirel to re-read her own old observations — and see a signal she had dismissed as noise."

### Scene Blueprint Quality
- Each scene must have **who, where, what happens, and why it matters now**.
- Avoid scenes that exist only to convey information. Every scene must change something: a relationship, a belief, a power balance, a physical situation.
- Mark which senses are dominant in each scene (root-tremor, solar heat, cold glass, fungal light) to maintain sensory continuity.
- Scenes should flow causally. If scene B follows scene A, the reader should be able to understand why B happens now and not later.

### Character Role Specificity
- Each character's role in the chapter must say **what they want, what they fear, and what they risk** — not just their functional job ("provides data").
- Character roles must specify their **emotional arc within the chapter**: where they start and where they end up emotionally.
- Supporting characters should have their own mini-arcs within the chapter, not just serve the protagonist.

### Block Set Discipline
- Every block must contain **action, decision, or revelation** — not just talk.
- The last block of each chapter must **raise the stakes** or **reveal a cost** for the next chapter.
- Avoid "transition blocks" that only move characters from one place to another without anything happening. If a transition is needed, something must change during it.

### Dialogue Set Pressure
- Dialogue must carry **subtext andstakes**. If what a character says is exactly what they mean, the dialogue is flat.
- Every conversation should have at least one thing the characters are NOT saying.
- Characters should sometimes win arguments they shouldn't win and lose arguments they should win.

## Output Standard

- Scenes must be concrete enough to draft directly.
- Character roles must say what each person is doing in this chapter.
- Block sets must define cadence, not only topics.
- Dialogue sets must define who wants what and what stays subtextual.
- The consistency checklist must be strict enough that `chapter-generator` can use it as a real gate.
- Every chapter plan must include `## Opening Hook`, `## Closing Hook`, and `## Next-Chapter Bridge` sections.