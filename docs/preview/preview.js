const STYLE_ID = "book-preview-style";

const SOURCE_GROUP_LABELS = {
  core: "Core Specs",
  chapterPlans: "Chapter Plans",
  characters: "Characters",
  places: "Places",
  concepts: "Concepts",
  themes: "Themes",
  mechanics: "Mechanics",
  relationships: "Relationships",
  emotions: "Emotions",
  chapters: "Generated Chapters",
};

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      --desk: #201b19;
      --desk-shadow: rgba(7, 6, 5, 0.4);
      --paper: #f7f0e4;
      --paper-strong: #fdf8ef;
      --paper-edge: #d9ccb9;
      --ink: #171310;
      --muted: #6b5d4f;
      --line: rgba(23, 19, 16, 0.14);
      --line-soft: rgba(23, 19, 16, 0.08);
      --teal: #165f58;
      --teal-soft: rgba(22, 95, 88, 0.1);
      --amber: #9f6037;
      --amber-soft: rgba(159, 96, 55, 0.14);
      --cover-shadow: 0 28px 70px rgba(11, 9, 8, 0.32);
      --page-shadow: 0 18px 38px rgba(16, 14, 12, 0.12);
      --panel-shadow: 0 22px 48px rgba(16, 14, 12, 0.18);
      --radius-xl: 28px;
      --radius-lg: 22px;
      --radius-md: 16px;
      --sans: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      --serif: "Palatino Linotype", "Book Antiqua", "Georgia", serif;
      --mono: "IBM Plex Mono", Consolas, monospace;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body.book-preview-body {
      margin: 0;
      color: var(--ink);
      font-family: var(--sans);
      background:
        radial-gradient(circle at top left, rgba(159, 96, 55, 0.12), transparent 26%),
        radial-gradient(circle at 82% 10%, rgba(22, 95, 88, 0.14), transparent 22%),
        linear-gradient(180deg, #3a2e28 0%, var(--desk) 100%);
      min-height: 100vh;
    }

    .demo-shell {
      position: relative;
      min-height: 100vh;
      overflow: hidden;
    }

    .demo-shell::before,
    .demo-shell::after {
      content: "";
      position: fixed;
      width: 42vw;
      height: 42vw;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.18;
      pointer-events: none;
      z-index: 0;
    }

    .demo-shell::before {
      top: -16vw;
      left: -10vw;
      background: rgba(159, 96, 55, 0.54);
    }

    .demo-shell::after {
      top: 8vw;
      right: -14vw;
      background: rgba(22, 95, 88, 0.46);
    }

    .reader-frame {
      position: relative;
      z-index: 1;
      width: min(1380px, calc(100vw - 28px));
      margin: 0 auto;
      padding: 18px 0 36px;
    }

    .reader-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 16px 18px;
      border: 1px solid rgba(255, 248, 238, 0.12);
      border-radius: 22px;
      background: rgba(26, 22, 20, 0.68);
      box-shadow: 0 22px 42px rgba(0, 0, 0, 0.18);
      backdrop-filter: blur(20px);
      color: #f9efdf;
    }

    .toolbar-brand {
      min-width: 0;
    }

    .toolbar-brand__eyebrow {
      font-size: 0.74rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(249, 239, 223, 0.66);
    }

    .toolbar-brand__title {
      margin-top: 4px;
      font-size: 1.08rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toolbar-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .toolbar-select,
    .toolbar-button {
      appearance: none;
      border: 1px solid rgba(249, 239, 223, 0.12);
      background: rgba(255, 248, 238, 0.08);
      color: #f9efdf;
      border-radius: 999px;
      padding: 10px 14px;
      font: inherit;
      transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
    }

    .toolbar-button {
      cursor: pointer;
      font-weight: 600;
    }

    .toolbar-button:hover,
    .toolbar-select:hover,
    .toolbar-button:focus-visible,
    .toolbar-select:focus-visible {
      transform: translateY(-1px);
      background: rgba(255, 248, 238, 0.16);
      border-color: rgba(249, 239, 223, 0.24);
      outline: none;
    }

    .toolbar-button[disabled] {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }

    .toolbar-counter {
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(22, 95, 88, 0.18);
      color: #dcf3ec;
      font-size: 0.92rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .book-stage {
      position: relative;
      margin-top: 20px;
      padding: 18px 0 10px;
    }

    .book-stage::before {
      content: "";
      position: absolute;
      left: 4%;
      right: 4%;
      top: 54px;
      height: calc(100% - 80px);
      border-radius: 34px;
      background:
        linear-gradient(180deg, rgba(255, 250, 243, 0.06), rgba(255, 250, 243, 0.02)),
        rgba(255, 244, 228, 0.035);
      border: 1px solid rgba(255, 248, 238, 0.06);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
      z-index: 0;
    }

    .book-object {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr);
      align-items: stretch;
      gap: 0;
      max-width: 1260px;
      margin: 0 auto;
      filter: drop-shadow(0 32px 58px rgba(0, 0, 0, 0.28));
    }

    .book-spine {
      border-radius: 26px 0 0 26px;
      background:
        linear-gradient(180deg, #3a2218 0%, #6c4024 18%, #7a4c2b 50%, #50311f 100%);
      border: 1px solid rgba(255, 239, 219, 0.12);
      border-right: none;
      position: relative;
      overflow: hidden;
    }

    .book-spine::before,
    .book-spine::after {
      content: "";
      position: absolute;
      top: 26px;
      bottom: 26px;
      width: 2px;
      background: rgba(255, 235, 210, 0.16);
    }

    .book-spine::before {
      left: 12px;
    }

    .book-spine::after {
      right: 12px;
    }

    .book-spine__label {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      writing-mode: vertical-rl;
      color: rgba(255, 240, 216, 0.82);
      font-size: 0.8rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .spread {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      background:
        linear-gradient(90deg, rgba(227, 214, 194, 0.9) 0%, rgba(247, 240, 228, 0.9) 3%, rgba(247, 240, 228, 0.96) 49%, rgba(227, 214, 194, 0.92) 50%, rgba(247, 240, 228, 0.96) 51%, rgba(247, 240, 228, 0.9) 97%, rgba(227, 214, 194, 0.9) 100%);
      border: 1px solid rgba(255, 243, 224, 0.12);
      border-radius: 0 28px 28px 0;
      overflow: hidden;
      box-shadow: var(--cover-shadow);
      min-height: 820px;
      position: relative;
    }

    .spread::before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 34px;
      transform: translateX(-50%);
      background:
        linear-gradient(90deg, rgba(52, 36, 24, 0.22), rgba(255, 255, 255, 0.05) 40%, rgba(52, 36, 24, 0.18));
      opacity: 0.45;
      pointer-events: none;
      z-index: 2;
    }

    .folio {
      position: relative;
      min-height: 820px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent 18%),
        linear-gradient(180deg, var(--paper-strong), var(--paper));
      border-right: 1px solid rgba(81, 66, 48, 0.08);
      overflow: hidden;
      isolation: isolate;
    }

    .folio:last-child {
      border-right: none;
    }

    .folio::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgba(92, 73, 52, 0.06), transparent 10%, transparent 90%, rgba(92, 73, 52, 0.04)),
        radial-gradient(circle at top left, rgba(159, 96, 55, 0.05), transparent 32%);
      pointer-events: none;
    }

    .folio--left::after,
    .folio--right::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      width: 26px;
      pointer-events: none;
      z-index: 1;
    }

    .folio--left::after {
      right: -1px;
      background: linear-gradient(90deg, rgba(64, 46, 29, 0), rgba(64, 46, 29, 0.12));
    }

    .folio--right::after {
      left: -1px;
      background: linear-gradient(90deg, rgba(64, 46, 29, 0.12), rgba(64, 46, 29, 0));
    }

    .folio__inner {
      position: relative;
      z-index: 3;
      display: flex;
      flex-direction: column;
      min-height: 820px;
      padding: 34px 34px 24px;
    }

    .folio__eyebrow {
      font-size: 0.76rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--amber);
      font-weight: 700;
    }

    .folio__running {
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(23, 19, 16, 0.48);
      font-weight: 700;
    }

    .folio__title,
    .book-markdown h1,
    .book-markdown h2,
    .book-markdown h3 {
      font-family: var(--serif);
      line-height: 1.04;
      color: var(--ink);
      margin: 0;
    }

    .folio__title {
      margin-top: 12px;
      font-size: clamp(2rem, 3vw, 3.2rem);
      max-width: 12ch;
    }

    .folio__subtitle {
      margin-top: 12px;
      font-size: 1rem;
      line-height: 1.6;
      color: var(--muted);
    }

    .folio__summary {
      margin-top: 16px;
      color: var(--muted);
      line-height: 1.7;
      font-size: 1rem;
    }

    .folio__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 22px;
    }

    .page-button {
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.58);
      color: var(--ink);
      border-radius: 999px;
      padding: 10px 14px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
    }

    .page-button:hover,
    .page-button:focus-visible {
      transform: translateY(-1px);
      border-color: rgba(23, 19, 16, 0.24);
      background: rgba(255, 255, 255, 0.88);
      outline: none;
    }

    .page-button--accent {
      background: var(--teal-soft);
      color: var(--teal);
      border-color: rgba(22, 95, 88, 0.2);
    }

    .page-button--warm {
      background: var(--amber-soft);
      color: #7a441f;
      border-color: rgba(159, 96, 55, 0.2);
    }

    .cover-sheet {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(11, 8, 7, 0.02), rgba(11, 8, 7, 0.2));
    }

    .folio--cover,
    .folio--frontispiece {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0)),
        linear-gradient(180deg, #efe1cb, #e3d2ba);
    }

    .folio--cover::before,
    .folio--frontispiece::before {
      background:
        linear-gradient(90deg, rgba(92, 73, 52, 0.08), transparent 12%, transparent 88%, rgba(92, 73, 52, 0.06));
    }

    .page-art {
      position: absolute;
      inset: 0;
      z-index: 3;
      display: grid;
      place-items: center;
      padding: 18px;
    }

    .page-art--cover {
      background:
        radial-gradient(circle at 22% 12%, rgba(255, 243, 222, 0.16), transparent 24%),
        linear-gradient(180deg, #31231d, #201814 48%, #38261d);
    }

    .page-art--opening {
      background:
        radial-gradient(circle at 80% 14%, rgba(118, 192, 177, 0.08), transparent 24%),
        linear-gradient(180deg, #eee2cf, #e7d8c2);
    }

    .page-art__sheet {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 24px 44px rgba(19, 14, 11, 0.24);
    }

    .page-art__sheet--cover {
      background: #101722;
      border: 1px solid rgba(255, 243, 224, 0.12);
    }

    .page-art__sheet--opening {
      background: linear-gradient(180deg, #f7f0e3, #eddcc4);
      border: 1px solid rgba(96, 80, 59, 0.12);
    }

    .cover-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: saturate(1.05) contrast(1.02);
      padding: 16px;
    }

    .page-art--cover .cover-image {
      padding: 12px;
    }

    .page-art--opening .cover-image {
      padding: 18px;
    }

    .frontispiece-wrap {
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      gap: 24px;
    }

    .frontispiece-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(22, 95, 88, 0.14), rgba(159, 96, 55, 0.08));
      border: 1px solid rgba(23, 19, 16, 0.08);
      color: var(--amber);
      font-size: 0.76rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 800;
    }

    .frontispiece-quote {
      margin: 0;
      font-family: var(--serif);
      font-size: clamp(1.4rem, 2vw, 2rem);
      line-height: 1.52;
      color: var(--ink);
      max-width: 16ch;
    }

    .frontispiece-note {
      color: var(--muted);
      line-height: 1.7;
      max-width: 28ch;
    }

    .philosophy-quote {
      margin-top: 20px;
      padding: 18px 20px;
      border-left: 4px solid var(--teal);
      border-radius: 16px;
      background: rgba(22, 95, 88, 0.06);
      color: var(--ink);
      line-height: 1.72;
      font-family: var(--serif);
      font-size: 1.08rem;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 20px;
    }

    .detail-card {
      padding: 14px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.48);
      border: 1px solid var(--line-soft);
    }

    .detail-card strong {
      display: block;
      margin-bottom: 6px;
      font-size: 0.76rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--amber);
    }

    .detail-card span {
      color: var(--ink);
      line-height: 1.5;
      font-weight: 600;
    }

    .toc-list {
      display: grid;
      gap: 12px;
      margin-top: 22px;
    }

    .toc-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: start;
      padding: 12px 14px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.52);
      border: 1px solid var(--line-soft);
    }

    .toc-item__index {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--teal-soft);
      color: var(--teal);
      font-size: 0.84rem;
      font-weight: 800;
    }

    .toc-item__text strong {
      display: block;
      margin-bottom: 4px;
    }

    .toc-item__text span {
      color: var(--muted);
      line-height: 1.48;
      font-size: 0.92rem;
    }

    .toc-item__page {
      color: var(--amber);
      font-size: 0.82rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .atlas-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-top: 22px;
    }

    .atlas-panel {
      padding: 14px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid var(--line-soft);
    }

    .atlas-panel h3 {
      margin: 0 0 10px;
      font-size: 0.82rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--amber);
    }

    .atlas-panel ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 10px;
    }

    .atlas-panel li strong {
      display: block;
      margin-bottom: 2px;
    }

    .atlas-panel li span {
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .atlas-note {
      margin-top: 16px;
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.6;
    }

    .chapter-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: var(--amber-soft);
      color: #7a441f;
      font-size: 0.74rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 800;
    }

    .chapter-divider {
      height: 1px;
      margin: 22px 0;
      background: linear-gradient(90deg, rgba(23, 19, 16, 0.16), rgba(23, 19, 16, 0.02));
    }

    .folio-content {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding-right: 4px;
    }

    .folio-content::-webkit-scrollbar,
    .source-view__content::-webkit-scrollbar {
      width: 10px;
    }

    .folio-content::-webkit-scrollbar-thumb,
    .source-view__content::-webkit-scrollbar-thumb {
      background: rgba(107, 93, 79, 0.28);
      border-radius: 999px;
    }

    .book-markdown {
      color: var(--ink);
      font-family: var(--serif);
      font-size: 1.06rem;
      line-height: 1.7;
      letter-spacing: 0.002em;
    }

    .book-markdown p,
    .book-markdown ul,
    .book-markdown ol,
    .book-markdown blockquote,
    .book-markdown pre {
      margin: 0 0 1.08em;
    }

    .book-markdown p.paragraph-continued {
      margin-top: 0.36em;
      text-indent: 1.2em;
    }

    .book-markdown ul,
    .book-markdown ol {
      padding-left: 1.15rem;
    }

    .book-markdown li + li {
      margin-top: 0.38em;
    }

    .book-markdown h1,
    .book-markdown h2,
    .book-markdown h3 {
      margin: 1.25em 0 0.46em;
    }

    .book-markdown h1 {
      font-size: 2rem;
    }

    .book-markdown h2 {
      font-size: 1.44rem;
    }

    .book-markdown h3 {
      font-size: 1.16rem;
    }

    .book-markdown blockquote {
      padding: 14px 18px;
      border-radius: 16px;
      border-left: 4px solid var(--teal);
      background: rgba(22, 95, 88, 0.06);
      color: var(--ink);
    }

    .book-markdown code,
    .book-markdown pre {
      font-family: var(--mono);
    }

    .book-markdown code {
      padding: 0.1em 0.32em;
      border-radius: 0.4em;
      background: rgba(23, 19, 16, 0.08);
      font-size: 0.92em;
    }

    .book-markdown pre {
      padding: 16px;
      border-radius: 16px;
      background: #191714;
      color: #f9f0e1;
      overflow: auto;
      font-size: 0.88rem;
      line-height: 1.6;
    }

    .folio-footer {
      margin-top: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      color: rgba(23, 19, 16, 0.46);
      font-size: 0.84rem;
      letter-spacing: 0.04em;
      border-top: 1px solid rgba(23, 19, 16, 0.08);
      padding-top: 12px;
    }

    .folio-footer__number {
      font-weight: 800;
      color: rgba(23, 19, 16, 0.7);
    }

    .folio--blank .folio__inner,
    .folio--interleaf .folio__inner {
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .interleaf-mark {
      width: 210px;
      height: 210px;
      border-radius: 50%;
      background:
        radial-gradient(circle, rgba(22, 95, 88, 0.12), transparent 58%),
        radial-gradient(circle, rgba(159, 96, 55, 0.12), transparent 68%);
      display: grid;
      place-items: center;
      color: rgba(23, 19, 16, 0.54);
      font-size: 0.78rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      border: 1px solid rgba(23, 19, 16, 0.08);
    }

    .source-desk {
      position: fixed;
      inset: 0;
      z-index: 40;
      pointer-events: none;
    }

    .source-desk__backdrop {
      position: absolute;
      inset: 0;
      background: rgba(7, 6, 5, 0.36);
      opacity: 0;
      transition: opacity 200ms ease;
    }

    .source-desk__panel {
      position: absolute;
      border-radius: 28px;
      background: rgba(252, 246, 236, 0.97);
      box-shadow: var(--panel-shadow);
      border: 1px solid rgba(23, 19, 16, 0.1);
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      transform: translateY(20px) scale(0.985);
      opacity: 0;
      transition: transform 220ms ease, opacity 220ms ease, box-shadow 220ms ease;
      overflow: hidden;
    }

    .source-desk.is-open {
      pointer-events: auto;
    }

    .source-desk.is-open .source-desk__backdrop {
      opacity: 1;
    }

    .source-desk.is-open .source-desk__panel {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .source-head {
      padding: 18px 20px 14px;
      border-bottom: 1px solid var(--line-soft);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      cursor: grab;
      user-select: none;
      touch-action: none;
    }

    .source-head.is-static {
      cursor: default;
      touch-action: auto;
    }

    .source-head__title {
      min-width: 0;
    }

    .source-head__title strong {
      display: block;
      font-size: 1.08rem;
    }

    .source-head__title span {
      color: var(--muted);
      font-size: 0.92rem;
    }

    .source-head__actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .source-window-button {
      appearance: none;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.58);
      color: var(--ink);
      border-radius: 999px;
      padding: 9px 12px;
      cursor: pointer;
      font: inherit;
      font-size: 0.86rem;
      font-weight: 700;
      transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
    }

    .source-window-button:hover,
    .source-window-button:focus-visible {
      transform: translateY(-1px);
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(23, 19, 16, 0.2);
      outline: none;
    }

    .source-window-button--accent {
      background: var(--teal-soft);
      color: var(--teal);
      border-color: rgba(22, 95, 88, 0.18);
    }

    .source-window-button--drag {
      cursor: grab;
    }

    .source-window-button--drag:active,
    .source-head:active {
      cursor: grabbing;
    }

    .source-desk__panel.is-fullscreen {
      border-radius: 24px;
    }

    .source-tabs {
      display: flex;
      gap: 10px;
      padding: 0 20px 16px;
      border-bottom: 1px solid var(--line-soft);
    }

    .source-tab {
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.56);
      color: var(--ink);
      border-radius: 999px;
      padding: 10px 14px;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
    }

    .source-tab.is-active {
      background: var(--teal-soft);
      color: var(--teal);
      border-color: rgba(22, 95, 88, 0.2);
    }

    .source-layout {
      min-height: 0;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
    }

    .source-nav {
      min-height: 0;
      overflow: auto;
      padding: 16px 14px 20px 20px;
      border-right: 1px solid var(--line-soft);
      background: rgba(248, 241, 232, 0.72);
    }

    .source-group + .source-group {
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--line-soft);
    }

    .source-group h4 {
      margin: 0 0 10px;
      color: var(--amber);
      font-size: 0.78rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .source-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 8px;
    }

    .source-item {
      width: 100%;
      text-align: left;
      border: 1px solid transparent;
      background: transparent;
      border-radius: 16px;
      padding: 10px 12px;
      cursor: pointer;
      font: inherit;
      color: var(--ink);
    }

    .source-item strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.94rem;
    }

    .source-item span {
      display: block;
      color: var(--muted);
      font-size: 0.85rem;
      line-height: 1.45;
    }

    .source-item.is-active {
      border-color: rgba(22, 95, 88, 0.18);
      background: rgba(22, 95, 88, 0.09);
    }

    .source-view {
      min-height: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
    }

    .source-view__head {
      padding: 18px 20px 14px;
      border-bottom: 1px solid var(--line-soft);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .source-view__meta {
      min-width: 0;
    }

    .source-view__meta strong {
      display: block;
      font-size: 1.06rem;
      margin-bottom: 6px;
    }

    .source-view__meta p {
      margin: 0;
      color: var(--muted);
      line-height: 1.55;
      font-size: 0.92rem;
    }

    .source-view__links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: flex-end;
    }

    .source-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 9px 12px;
      border-radius: 999px;
      border: 1px solid var(--line);
      color: var(--ink);
      text-decoration: none;
      background: rgba(255, 255, 255, 0.62);
      font-size: 0.88rem;
      font-weight: 700;
    }

    .source-view__content {
      min-height: 0;
      overflow: auto;
      padding: 18px 20px 24px;
    }

    .source-empty,
    .book-loading,
    .book-error {
      display: grid;
      place-items: center;
      min-height: 320px;
      padding: 32px;
      text-align: center;
      color: var(--muted);
    }

    .book-loading,
    .book-error {
      min-height: 100vh;
      color: #f5ead8;
    }

    .book-error {
      color: #ffd3cb;
    }

    @media (max-width: 1120px) {
      .reader-frame {
        width: min(100vw - 18px, 1380px);
      }

      .reader-toolbar {
        align-items: flex-start;
        flex-direction: column;
      }

      .toolbar-controls {
        width: 100%;
        justify-content: flex-start;
      }

      .spread {
        min-height: 780px;
      }

      .folio,
      .folio__inner {
        min-height: 780px;
      }
    }

    @media (max-width: 960px) {
      .book-object {
        grid-template-columns: 1fr;
      }

      .book-spine {
        display: none;
      }

      .spread {
        grid-template-columns: 1fr;
        border-radius: 28px;
        min-height: 720px;
      }

      .spread::before {
        display: none;
      }

      .folio,
      .folio__inner {
        min-height: 720px;
      }

      .folio--right {
        display: none;
      }

      .source-desk__panel {
        border-radius: 24px;
      }

      .source-layout {
        grid-template-columns: 1fr;
      }

      .source-nav {
        max-height: 32vh;
        border-right: none;
        border-bottom: 1px solid var(--line-soft);
      }
    }

    @media (max-width: 720px) {
      .toolbar-controls {
        gap: 8px;
      }

      .toolbar-button,
      .toolbar-select,
      .toolbar-counter {
        width: 100%;
        justify-content: center;
      }

      .folio__inner {
        padding: 24px 22px 20px;
      }

      .atlas-grid,
      .details-grid {
        grid-template-columns: 1fr;
      }

      .source-head,
      .source-view__head {
        align-items: flex-start;
        flex-direction: column;
      }

      .source-view__links {
        justify-content: flex-start;
      }
    }
  `;

  document.head.appendChild(style);
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(text) {
  return escapeHtml(text).replaceAll('"', "&quot;");
}

function formatInline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return markdown;
  }

  const endIndex = markdown.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return markdown;
  }

  return markdown.slice(endIndex + 5);
}

function makeBlock(kind, html, text, weight, extra = {}) {
  return {
    kind,
    html,
    text,
    weight,
    ...extra,
  };
}

function splitSentenceUnits(text) {
  const rawUnits = String(text || "").match(/[^.!?]+(?:[.!?]+|$)/g) || [String(text || "")];
  const units = [];

  for (const rawUnit of rawUnits) {
    const unit = rawUnit.trim();
    if (!unit) {
      continue;
    }
    units.push(unit);
  }

  return units.length ? units : [String(text || "").trim()];
}

function splitParagraphForPagination(text, targetLength = 260) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  if (!compact || compact.length <= 320) {
    return compact ? [compact] : [];
  }

  const units = splitSentenceUnits(compact);
  if (units.length <= 1) {
    return [compact];
  }

  const segments = [];
  let current = "";

  for (const unit of units) {
    const next = current ? `${current} ${unit}` : unit;
    if (current && next.length > targetLength && current.length >= 120) {
      segments.push(current);
      current = unit;
      continue;
    }
    current = next;
  }

  if (current) {
    segments.push(current);
  }

  return segments.length > 1 ? segments : [compact];
}

function normalizeParagraphBlocks(blocks) {
  const normalized = [];

  for (const block of blocks) {
    const previous = normalized[normalized.length - 1];

    const canMergeParagraphs =
      previous &&
      previous.kind === "paragraph" &&
      block.kind === "paragraph" &&
      !/[.!?]["')\]]*$/.test(previous.text.trim()) &&
      /^[a-z(“"'\[]/.test(block.text.trim());

    if (canMergeParagraphs) {
      const text = `${previous.text.trim()} ${block.text.trim()}`.replace(/\s+/g, " ").trim();
      normalized[normalized.length - 1] = makeBlock(
        "paragraph",
        `<p>${formatInline(text)}</p>`,
        text,
        Math.min(340, text.length * 0.92 + 40)
      );
      continue;
    }

    normalized.push(block);
  }

  return normalized;
}

function prepareBlocksForPagination(blocks) {
  return blocks.flatMap((block) => {
    if (block.kind !== "paragraph") {
      return [block];
    }

    const segments = splitParagraphForPagination(block.text);
    if (segments.length <= 1) {
      return [block];
    }

    return segments.map((segment, index) =>
      makeBlock(
        "paragraph",
        `<p class="${index ? "paragraph-continued" : ""}">${formatInline(segment)}</p>`,
        segment,
        Math.min(220, segment.length * 0.72 + 28),
        {
          continued: index > 0,
        }
      )
    );
  });
}

function markdownToBlocks(markdown) {
  const lines = stripFrontmatter(markdown).replace(/\r/g, "").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      const text = code.join("\n");
      blocks.push(makeBlock("code", `<pre><code>${escapeHtml(text)}</code></pre>`, text, Math.min(440, text.length * 0.34 + 180)));
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      blocks.push(makeBlock("heading", `<h${level}>${formatInline(text)}</h${level}>`, text, level === 1 ? 180 : 124, { level }));
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quote = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quote.push(lines[index].slice(2).trim());
        index += 1;
      }
      const text = quote.join(" ");
      blocks.push(makeBlock("quote", `<blockquote>${quote.map(formatInline).join("<br>")}</blockquote>`, text, Math.min(260, text.length * 0.8 + 90)));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, "").trim());
        index += 1;
      }
      const text = items.join(" ");
      blocks.push(
        makeBlock(
          "ordered-list",
          `<ol>${items.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ol>`,
          text,
          Math.min(280, text.length * 0.72 + items.length * 28 + 60)
        )
      );
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^-\s+/, "").trim());
        index += 1;
      }
      const text = items.join(" ");
      blocks.push(
        makeBlock(
          "unordered-list",
          `<ul>${items.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ul>`,
          text,
          Math.min(280, text.length * 0.72 + items.length * 28 + 60)
        )
      );
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !lines[index].startsWith("> ") &&
      !lines[index].startsWith("```") &&
      !/^-\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }

    const text = paragraph.join(" ");
    blocks.push(makeBlock("paragraph", `<p>${formatInline(text)}</p>`, text, Math.min(300, text.length * 0.92 + 40)));
  }

  return blocks;
}

function markdownToHtml(markdown) {
  return markdownToBlocks(markdown).map((block) => block.html).join("\n");
}

function summarize(text, maxLength = 160) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  if (!compact || compact.length <= maxLength) {
    return compact;
  }
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isCompactSourceDeskViewport() {
  return window.innerWidth <= 960;
}

function getSourceDeskBounds() {
  const margin = isCompactSourceDeskViewport() ? 8 : 16;
  const width = Math.min(760, window.innerWidth - margin * 2);
  const height = Math.max(460, window.innerHeight - margin * 2);

  return {
    margin,
    width,
    height,
    maxLeft: Math.max(margin, window.innerWidth - width - margin),
    maxTop: Math.max(margin, window.innerHeight - height - margin),
  };
}

function normalizeSourceDeskWindow(windowState = {}) {
  const bounds = getSourceDeskBounds();
  const centeredLeft = Math.max(bounds.margin, Math.round((window.innerWidth - bounds.width) / 2));

  return {
    left: clampValue(windowState.left ?? centeredLeft, bounds.margin, bounds.maxLeft),
    top: clampValue(windowState.top ?? bounds.margin, bounds.margin, bounds.maxTop),
    width: bounds.width,
    height: bounds.height,
  };
}

function chunkBlocksByWeight(blocks, threshold = 760) {
  const pages = [];
  let current = [];
  let weight = 0;

  for (const block of blocks) {
    if (current.length && weight + block.weight > threshold) {
      pages.push(current);
      current = [block];
      weight = block.weight;
      continue;
    }

    current.push(block);
    weight += block.weight;
  }

  if (current.length) {
    pages.push(current);
  }

  return pages;
}

function getPaginationMetrics() {
  const viewportWidth = Math.max(window.innerWidth || 0, 360);
  const mobile = viewportWidth <= 960;
  const readerWidth = Math.min(1380, Math.max(320, viewportWidth - (viewportWidth <= 1120 ? 18 : 28)));
  const bookWidth = Math.min(1260, readerWidth);
  const folioWidth = mobile ? bookWidth : (bookWidth - 48) / 2;
  const folioHeight = mobile ? 720 : viewportWidth <= 1120 ? 780 : 820;

  return {
    mobile,
    folioWidth: Math.max(320, Math.floor(folioWidth)),
    folioHeight,
  };
}

function getPaginationKey(metrics) {
  return `${metrics.mobile ? "m" : "d"}:${metrics.folioWidth}:${metrics.folioHeight}`;
}

function createChapterPageMeasurer({ chapterTitle, chapterIndex, metrics }) {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  host.style.visibility = "hidden";
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";

  host.innerHTML = `
    <article class="folio" style="width:${metrics.folioWidth}px;min-height:${metrics.folioHeight}px;height:${metrics.folioHeight}px;">
      <div class="folio__inner" style="min-height:${metrics.folioHeight}px;height:${metrics.folioHeight}px;">
        <div class="folio__running">${escapeHtml(chapterTitle)}</div>
        <div class="folio-content book-markdown"></div>
        <div class="folio-footer">
          <span>Chapter ${chapterIndex}</span>
          <span class="folio-footer__number">0</span>
        </div>
      </div>
    </article>
  `;

  document.body.appendChild(host);

  const content = host.querySelector(".folio-content");

  return {
    fits(blocks) {
      content.innerHTML = blocks.map((block) => block.html).join("\n");
      return content.scrollHeight <= content.clientHeight + 8;
    },
    destroy() {
      host.remove();
    },
  };
}

function chunkBlocksMeasured(blocks, { chapterTitle, chapterIndex, metrics }) {
  if (typeof document === "undefined" || !blocks.length) {
    return chunkBlocksByWeight(blocks);
  }

  const measurer = createChapterPageMeasurer({ chapterTitle, chapterIndex, metrics });
  const pages = [];

  try {
    let start = 0;

    while (start < blocks.length) {
      let end = start;
      let lastFit = -1;
      const current = [];

      while (end < blocks.length) {
        current.push(blocks[end]);
        if (measurer.fits(current)) {
          lastFit = end;
          end += 1;
          continue;
        }
        current.pop();
        break;
      }

      if (lastFit < start) {
        pages.push([blocks[start]]);
        start += 1;
        continue;
      }

      pages.push(blocks.slice(start, lastFit + 1));
      start = lastFit + 1;
    }
  } finally {
    measurer.destroy();
  }

  return pages;
}

function compactAtlas(items, limit = 3) {
  return (items || []).slice(0, limit);
}

function flattenSourceEntries(groups) {
  return Object.values(groups || {}).flatMap((entries) => entries || []);
}

function firstSourceFile(manifest, tab) {
  const entries = flattenSourceEntries(manifest.sources?.[tab]);
  return entries[0]?.file || null;
}

function findSourceEntry(manifest, tab, file) {
  const entries = flattenSourceEntries(manifest.sources?.[tab]);
  return entries.find((entry) => entry.file === file) || null;
}

function removeLeadingTitle(blocks) {
  let removed = false;
  return blocks.filter((block) => {
    if (!removed && block.kind === "heading" && block.level === 1) {
      removed = true;
      return false;
    }
    return true;
  });
}

function buildChapterPages(chapter, chapterIndex, metrics) {
  const blocks = prepareBlocksForPagination(normalizeParagraphBlocks(removeLeadingTitle(markdownToBlocks(chapter.markdown))));
  const pages = [
    {
      kind: "chapter-opener",
      chapterId: chapter.id,
      chapterIndex: chapterIndex + 1,
      chapterPageIndex: 0,
      title: chapter.title,
      summary: chapter.summary,
      sourcePlanFile: chapter.sourcePlanFile,
      chapterFile: chapter.chapterFile,
    },
  ];

  let chapterPageIndex = 1;
  for (const chunk of chunkBlocksMeasured(blocks, { chapterTitle: chapter.title, chapterIndex: chapterIndex + 1, metrics })) {
    pages.push({
      kind: "chapter-page",
      chapterId: chapter.id,
      chapterIndex: chapterIndex + 1,
      chapterPageIndex,
      title: chapter.title,
      contentHtml: chunk.map((block) => block.html).join("\n"),
    });
    chapterPageIndex += 1;
  }

  return pages;
}

function buildPages(manifest, chapters, metrics) {
  const pages = [
    { kind: "cover" },
    { kind: "frontispiece" },
    { kind: "contents" },
    { kind: "atlas" },
  ];

  chapters.forEach((chapter, index) => {
    if (pages.length % 2 !== 0) {
      pages.push({ kind: "interleaf" });
    }
    pages.push(...buildChapterPages(chapter, index, metrics));
  });

  pages.push({ kind: "closing" });

  return pages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
  }));
}

function buildChapterStartMap(pages) {
  const map = {};
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    if (page.kind === "chapter-opener" && !(page.chapterId in map)) {
      map[page.chapterId] = index;
    }
  }
  return map;
}

function renderAtlasSection(title, items) {
  return `
    <section class="atlas-panel">
      <h3>${escapeHtml(title)}</h3>
      <ul>
        ${compactAtlas(items).map((item) => `
          <li>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(summarize(item.summary, 100))}</span>
          </li>
        `).join("")}
      </ul>
    </section>
  `;
}

function renderContentsPage(manifest, chapterStartMap) {
  return `
    <div class="folio__eyebrow">Table of Contents</div>
    <h2 class="folio__title">Built for reading first, sourced second.</h2>
    <p class="folio__subtitle">The main viewer behaves like a book demo. Specifications and generated chapter files stay available from the source desk whenever you need to inspect the pipeline behind the artifact.</p>
    <div class="toc-list">
      ${manifest.chapters.map((chapter, index) => `
        <button class="toc-item page-button" data-jump-chapter="${escapeAttribute(chapter.id)}">
          <span class="toc-item__index">${index + 1}</span>
          <span class="toc-item__text">
            <strong>${escapeHtml(chapter.title)}</strong>
            <span>${escapeHtml(chapter.summary || "")}</span>
          </span>
          <span class="toc-item__page">Page ${chapterStartMap[chapter.id] + 1}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderAtlasPage(manifest) {
  return `
    <div class="folio__eyebrow">Atlas</div>
    <h2 class="folio__title">World, cast, ideas.</h2>
    <p class="folio__subtitle">This page samples the book's specification layer. The full structured source remains available through the source desk.</p>
    <div class="atlas-grid">
      ${renderAtlasSection("Characters", manifest.atlas?.characters)}
      ${renderAtlasSection("Places", manifest.atlas?.places)}
      ${renderAtlasSection("Concepts", manifest.atlas?.concepts)}
      ${renderAtlasSection("Themes", manifest.atlas?.themes)}
      ${renderAtlasSection("Mechanics", manifest.atlas?.mechanics)}
      ${renderAtlasSection("Emotions", manifest.atlas?.emotions)}
    </div>
    <p class="atlas-note">The primary artifact stays in the foreground; the specification system stays inspectable without flattening the reading experience into a documentation page.</p>
  `;
}

function renderPageBody(page, manifest, chapterStartMap) {
  switch (page.kind) {
    case "cover":
      return `
        <div class="page-art page-art--cover">
          <div class="page-art__sheet page-art__sheet--cover">
            <img class="cover-image" src="${escapeAttribute(manifest.coverPageImage || manifest.coverImage)}" alt="${escapeAttribute(`${manifest.title} cover`)}">
          </div>
        </div>
      `;

    case "frontispiece":
      if (manifest.openingPageImage) {
        return `
          <div class="page-art page-art--opening">
            <div class="page-art__sheet page-art__sheet--opening">
              <img class="cover-image" src="${escapeAttribute(manifest.openingPageImage)}" alt="${escapeAttribute(`${manifest.title} opening page`)}">
            </div>
          </div>
        `;
      }

      return `
        <div class="folio__inner">
          <div class="frontispiece-wrap">
            <div class="frontispiece-mark">Enter</div>
            <p class="frontispiece-quote">${escapeHtml(manifest.philosophyQuote || manifest.logline || "")}</p>
            <p class="frontispiece-note">The cover carries the title visually. The opening spread uses this page for atmosphere instead of duplicating the same title treatment in HTML.</p>
          </div>
          <div class="folio-footer">
            <span>Frontispiece</span>
            <span class="folio-footer__number">${page.pageNumber}</span>
          </div>
        </div>
      `;

    case "title":
      return `
        <div class="folio__inner">
          <div class="folio__eyebrow">Title Page</div>
          <h2 class="folio__title">${escapeHtml(manifest.title)}</h2>
          <p class="folio__subtitle">${escapeHtml(manifest.subtitle || "")}</p>
          <p class="folio__summary">${escapeHtml(manifest.logline || "")}</p>
          <div class="details-grid">
            <div class="detail-card">
              <strong>Author</strong>
              <span>${escapeHtml(manifest.author || "Unknown")}</span>
            </div>
            <div class="detail-card">
              <strong>Tone</strong>
              <span>${escapeHtml(manifest.tone || "Unset")}</span>
            </div>
          </div>
          ${manifest.philosophyQuote ? `<div class="philosophy-quote">${escapeHtml(manifest.philosophyQuote)}</div>` : ""}
          <div class="folio__actions">
            <button class="page-button page-button--accent" data-open-source="specs">View Specifications</button>
            <button class="page-button page-button--warm" data-open-source="generated">View Generated Drafts</button>
          </div>
          <div style="flex:1"></div>
          <div class="folio-footer">
            <span>Demo reader</span>
            <span class="folio-footer__number">${page.pageNumber}</span>
          </div>
        </div>
      `;

    case "contents":
      return `
        <div class="folio__inner">
          ${renderContentsPage(manifest, chapterStartMap)}
          <div style="flex:1"></div>
          <div class="folio-footer">
            <span>Navigation spread</span>
            <span class="folio-footer__number">${page.pageNumber}</span>
          </div>
        </div>
      `;

    case "atlas":
      return `
        <div class="folio__inner">
          ${renderAtlasPage(manifest)}
          <div style="flex:1"></div>
          <div class="folio-footer">
            <span>Source-aware overview</span>
            <span class="folio-footer__number">${page.pageNumber}</span>
          </div>
        </div>
      `;

    case "chapter-opener":
      return `
        <div class="folio__inner">
          <span class="chapter-badge">Chapter ${page.chapterIndex}</span>
          <h2 class="folio__title">${escapeHtml(page.title)}</h2>
          <p class="folio__summary">${escapeHtml(page.summary || "")}</p>
          <div class="chapter-divider"></div>
          <p class="folio__subtitle">The primary reading flow stays in the spread. The source desk can open the chapter plan or the generated chapter file without leaving the demo.</p>
          <div class="folio__actions">
            <button class="page-button page-button--accent" data-open-source-tab="specs" data-open-source-file="${escapeAttribute(page.sourcePlanFile || "")}">Open Chapter Plan</button>
            <button class="page-button page-button--warm" data-open-source-tab="generated" data-open-source-file="${escapeAttribute(page.chapterFile || "")}">Open Generated Draft</button>
          </div>
          <div style="flex:1"></div>
          <div class="folio-footer">
            <span>${escapeHtml(page.title)}</span>
            <span class="folio-footer__number">${page.pageNumber}</span>
          </div>
        </div>
      `;

    case "chapter-page":
      return `
        <div class="folio__inner">
          <div class="folio__running">${escapeHtml(page.title)}</div>
          <div class="folio-content book-markdown">${page.contentHtml}</div>
          <div class="folio-footer">
            <span>Chapter ${page.chapterIndex}</span>
            <span class="folio-footer__number">${page.pageNumber}</span>
          </div>
        </div>
      `;

    case "interleaf":
      return `
        <div class="folio__inner">
          <div class="interleaf-mark">Turn</div>
        </div>
      `;

    case "closing":
      return `
        <div class="folio__inner">
          <div class="folio__eyebrow">Endpaper</div>
          <h2 class="folio__title">A finite world can still be vast.</h2>
          <p class="folio__summary">This demo keeps the reading object in front and the workflow behind it. The book remains a book. The specifications remain inspectable. The generated chapter materials remain traceable.</p>
          ${manifest.philosophyQuote ? `<div class="philosophy-quote">${escapeHtml(manifest.philosophyQuote)}</div>` : ""}
          <div class="folio__actions">
            <button class="page-button page-button--accent" data-open-source="specs">Inspect Book Specs</button>
            <button class="page-button page-button--warm" data-open-source="generated">Inspect Intermediate Outputs</button>
          </div>
          <div style="flex:1"></div>
          <div class="folio-footer">
            <span>Close the book, keep the structure.</span>
            <span class="folio-footer__number">${page.pageNumber}</span>
          </div>
        </div>
      `;

    default:
      return `
        <div class="folio__inner">
          <div class="source-empty">This page is intentionally blank.</div>
        </div>
      `;
  }
}

function renderFolio(page, side, manifest, chapterStartMap) {
  if (!page) {
    return `
      <article class="folio folio--${side} folio--blank">
        <div class="folio__inner">
          <div class="interleaf-mark">Blank</div>
        </div>
      </article>
    `;
  }

  return `
    <article class="folio folio--${side} folio--${escapeAttribute(page.kind)}">
      ${renderPageBody(page, manifest, chapterStartMap)}
    </article>
  `;
}

function renderSourceGroups(groups, selectedFile) {
  return Object.entries(groups || {})
    .filter(([, entries]) => entries && entries.length)
    .map(([groupKey, entries]) => `
      <section class="source-group">
        <h4>${escapeHtml(SOURCE_GROUP_LABELS[groupKey] || groupKey)}</h4>
        <ul class="source-list">
          ${entries.map((entry) => `
            <li>
              <button class="source-item ${entry.file === selectedFile ? "is-active" : ""}" data-source-select="${escapeAttribute(entry.file)}">
                <strong>${escapeHtml(entry.title)}</strong>
                <span>${escapeHtml(summarize(entry.summary || "", 92) || "No summary available.")}</span>
              </button>
            </li>
          `).join("")}
        </ul>
      </section>
    `)
    .join("");
}

function renderSourceDesk(manifest, state, selectedSource, selectedContent) {
  const groups = manifest.sources?.[state.sourceTab] || {};
  const compactViewport = isCompactSourceDeskViewport();
  const sourceWindow = normalizeSourceDeskWindow(state.sourceWindow);
  const sourceBounds = getSourceDeskBounds();
  const fullscreen = compactViewport || state.sourceFullscreen;
  const panelStyle = fullscreen
    ? `left:${sourceBounds.margin}px;top:${sourceBounds.margin}px;width:calc(100vw - ${sourceBounds.margin * 2}px);height:calc(100vh - ${sourceBounds.margin * 2}px);`
    : `left:${sourceWindow.left}px;top:${sourceWindow.top}px;width:${sourceWindow.width}px;height:${sourceWindow.height}px;`;

  return `
    <aside class="source-desk ${state.sourceOpen ? "is-open" : ""}">
      <div class="source-desk__backdrop" data-close-source></div>
      <section class="source-desk__panel ${fullscreen ? "is-fullscreen" : ""}" style="${panelStyle}">
        <header class="source-head ${fullscreen ? "is-static" : ""}" data-source-drag>
          <div class="source-head__title">
            <strong>Source Desk</strong>
            <span>Specifications and generated chapter files stay available as secondary material.</span>
          </div>
          <div class="source-head__actions">
            ${
              fullscreen
                ? `<button class="source-window-button source-window-button--accent" data-source-fullscreen="off">Window</button>`
                : `<button class="source-window-button source-window-button--drag" data-source-drag-handle>Drag</button>
                   <button class="source-window-button source-window-button--accent" data-source-fullscreen="on">Full Screen</button>`
            }
            <button class="source-window-button" data-close-source>Close</button>
          </div>
        </header>
        <div class="source-tabs">
          <button class="source-tab ${state.sourceTab === "specs" ? "is-active" : ""}" data-source-tab="specs">Specifications</button>
          <button class="source-tab ${state.sourceTab === "generated" ? "is-active" : ""}" data-source-tab="generated">Generated Drafts</button>
        </div>
        <div class="source-layout">
          <nav class="source-nav">
            ${renderSourceGroups(groups, state.selectedSource)}
          </nav>
          <div class="source-view">
            ${
              selectedSource
                ? `
                  <div class="source-view__head">
                    <div class="source-view__meta">
                      <strong>${escapeHtml(selectedSource.title)}</strong>
                      <p>${escapeHtml(selectedSource.summary || "No summary available.")}</p>
                    </div>
                    <div class="source-view__links">
                      <a class="source-link" href="${escapeAttribute(selectedSource.file)}" target="_blank" rel="noreferrer">Open File</a>
                      ${
                        selectedSource.sourcePlanFile
                          ? `<button class="page-button page-button--accent" data-open-source-tab="specs" data-open-source-file="${escapeAttribute(selectedSource.sourcePlanFile)}">Open Source Plan</button>`
                          : ""
                      }
                    </div>
                  </div>
                  <div class="source-view__content">
                    ${
                      state.sourceLoading
                        ? `<div class="source-empty">Loading source document...</div>`
                        : `<div class="book-markdown">${selectedContent?.html || `<div class="source-empty">No source content loaded.</div>`}</div>`
                    }
                  </div>
                `
                : `<div class="source-view__content"><div class="source-empty">Choose a source document to inspect.</div></div>`
            }
          </div>
        </div>
      </section>
    </aside>
  `;
}

export async function renderBook({ root, manifestUrl }) {
  ensureStyle();
  document.body.classList.add("book-preview-body");
  root.innerHTML = `<div class="book-loading">Loading book demo...</div>`;

  const sourceCache = new Map();

  try {
    const manifest = await fetch(manifestUrl).then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load manifest: ${response.status}`);
      }
      return response.json();
    });

    const chapters = await Promise.all(
      manifest.chapters.map(async (chapter) => {
        const markdown = await fetch(chapter.chapterFile).then((response) => {
          if (!response.ok) {
            throw new Error(`Could not load chapter: ${chapter.title}`);
          }
          return response.text();
        });

        return {
          ...chapter,
          markdown,
        };
      })
    );

    let paginationMetrics = getPaginationMetrics();
    let paginationKey = getPaginationKey(paginationMetrics);
    let pages = buildPages(manifest, chapters, paginationMetrics);
    let chapterStartMap = buildChapterStartMap(pages);
    const state = {
      currentIndex: 0,
      sourceOpen: false,
      sourceTab: "specs",
      selectedSource: firstSourceFile(manifest, "specs"),
      sourceLoading: false,
      sourceFullscreen: false,
      sourceWindow: normalizeSourceDeskWindow(),
    };

    const isMobile = () => window.matchMedia("(max-width: 960px)").matches;

    const normalizeIndex = (index) => {
      if (isMobile()) {
        return Math.max(0, Math.min(index, pages.length - 1));
      }

      const evenIndex = Math.max(0, Math.min(index, pages.length - 1));
      return evenIndex - (evenIndex % 2);
    };

    const selectedContent = () => sourceCache.get(state.selectedSource);
    const selectedSource = () => findSourceEntry(manifest, state.sourceTab, state.selectedSource);

    const currentPageAnchor = () => {
      const page = pages[state.currentIndex];
      if (!page) {
        return null;
      }

      return {
        kind: page.kind,
        chapterId: page.chapterId || null,
        chapterPageIndex: page.chapterPageIndex || 0,
      };
    };

    const restorePageAnchor = (anchor, fallbackIndex = 0) => {
      if (!anchor) {
        return normalizeIndex(fallbackIndex);
      }

      if (anchor.chapterId) {
        const exactIndex = pages.findIndex(
          (page) =>
            page.kind === anchor.kind &&
            page.chapterId === anchor.chapterId &&
            (page.chapterPageIndex || 0) === (anchor.chapterPageIndex || 0)
        );
        if (exactIndex !== -1) {
          return normalizeIndex(exactIndex);
        }

        const chapterIndex = pages.findIndex((page) => page.chapterId === anchor.chapterId);
        if (chapterIndex !== -1) {
          return normalizeIndex(chapterIndex);
        }
      }

      return normalizeIndex(fallbackIndex);
    };

    const repaginate = ({ preserveLocation = true } = {}) => {
      const anchor = preserveLocation ? currentPageAnchor() : null;
      const fallbackIndex = state.currentIndex;
      paginationMetrics = getPaginationMetrics();
      paginationKey = getPaginationKey(paginationMetrics);
      pages = buildPages(manifest, chapters, paginationMetrics);
      chapterStartMap = buildChapterStartMap(pages);
      state.currentIndex = restorePageAnchor(anchor, fallbackIndex);
    };

    const ensureSourceLoaded = async (file) => {
      if (!file || sourceCache.has(file)) {
        return;
      }

      state.sourceLoading = true;
      render();

      try {
        const raw = await fetch(file).then((response) => {
          if (!response.ok) {
            throw new Error(`Could not load source: ${file}`);
          }
          return response.text();
        });

        sourceCache.set(file, {
          raw,
          html: markdownToHtml(raw),
        });
      } catch (error) {
        sourceCache.set(file, {
          raw: "",
          html: `<div class="source-empty">${escapeHtml(error.message)}</div>`,
        });
      } finally {
        state.sourceLoading = false;
        render();
      }
    };

    const openSource = async (tab, file) => {
      state.sourceOpen = true;
      state.sourceTab = tab;
      state.selectedSource = file || firstSourceFile(manifest, tab);
      render();
      await ensureSourceLoaded(state.selectedSource);
    };

    const render = () => {
      const firstPage = pages[state.currentIndex];
      const secondPage = isMobile() ? null : pages[state.currentIndex + 1];
      const rangeLabel = isMobile()
        ? `Page ${state.currentIndex + 1} of ${pages.length}`
        : secondPage
          ? `Pages ${state.currentIndex + 1}-${state.currentIndex + 2} of ${pages.length}`
          : `Page ${state.currentIndex + 1} of ${pages.length}`;

      root.innerHTML = `
        <div class="demo-shell">
          <div class="reader-frame">
            <header class="reader-toolbar">
              <div class="toolbar-brand">
                <div class="toolbar-brand__eyebrow">Book Demo Viewer</div>
                <div class="toolbar-brand__title">${escapeHtml(manifest.title)}</div>
              </div>
              <div class="toolbar-controls">
                <button class="toolbar-button" data-nav="prev" ${state.currentIndex === 0 ? "disabled" : ""}>Previous</button>
                <button class="toolbar-button" data-nav="next" ${state.currentIndex >= pages.length - (isMobile() ? 1 : 2) ? "disabled" : ""}>Next</button>
                <div class="toolbar-counter">${escapeHtml(rangeLabel)}</div>
                <select class="toolbar-select" data-jump-select>
                  <option value="">Jump to chapter</option>
                  ${manifest.chapters.map((chapter) => `
                    <option value="${escapeAttribute(chapter.id)}">${escapeHtml(chapter.title)}</option>
                  `).join("")}
                </select>
                <button class="toolbar-button" data-open-source="specs">Specifications</button>
                <button class="toolbar-button" data-open-source="generated">Generated Drafts</button>
              </div>
            </header>

            <section class="book-stage">
              <div class="book-object">
                <div class="book-spine">
                  <div class="book-spine__label">${escapeHtml(manifest.title)}</div>
                </div>
                <div class="spread">
                  ${renderFolio(firstPage, "left", manifest, chapterStartMap)}
                  ${isMobile() ? "" : renderFolio(secondPage, "right", manifest, chapterStartMap)}
                </div>
              </div>
            </section>
          </div>
          ${renderSourceDesk(manifest, state, selectedSource(), selectedContent())}
        </div>
      `;

      root.querySelectorAll("[data-nav]").forEach((button) => {
        button.addEventListener("click", () => {
          const direction = button.getAttribute("data-nav");
          const step = isMobile() ? 1 : 2;
          state.currentIndex = normalizeIndex(state.currentIndex + (direction === "next" ? step : -step));
          render();
        });
      });

      root.querySelectorAll("[data-open-source]").forEach((button) => {
        button.addEventListener("click", () => {
          void openSource(button.getAttribute("data-open-source"));
        });
      });

      root.querySelectorAll("[data-open-source-tab]").forEach((button) => {
        button.addEventListener("click", () => {
          void openSource(button.getAttribute("data-open-source-tab"), button.getAttribute("data-open-source-file"));
        });
      });

      root.querySelectorAll("[data-source-tab]").forEach((button) => {
        button.addEventListener("click", () => {
          void openSource(button.getAttribute("data-source-tab"));
        });
      });

      root.querySelectorAll("[data-source-select]").forEach((button) => {
        button.addEventListener("click", () => {
          state.selectedSource = button.getAttribute("data-source-select");
          render();
          void ensureSourceLoaded(state.selectedSource);
        });
      });

      root.querySelectorAll("[data-close-source]").forEach((button) => {
        button.addEventListener("click", () => {
          state.sourceOpen = false;
          render();
        });
      });

      root.querySelectorAll("[data-source-fullscreen]").forEach((button) => {
        button.addEventListener("click", () => {
          state.sourceFullscreen = button.getAttribute("data-source-fullscreen") === "on";
          state.sourceWindow = normalizeSourceDeskWindow(state.sourceWindow);
          render();
        });
      });

      root.querySelectorAll("[data-jump-chapter]").forEach((button) => {
        button.addEventListener("click", () => {
          const chapterId = button.getAttribute("data-jump-chapter");
          state.currentIndex = normalizeIndex(chapterStartMap[chapterId] || 0);
          render();
        });
      });

      const jumpSelect = root.querySelector("[data-jump-select]");
      if (jumpSelect) {
        jumpSelect.addEventListener("change", () => {
          if (!jumpSelect.value) {
            return;
          }
          state.currentIndex = normalizeIndex(chapterStartMap[jumpSelect.value] || 0);
          render();
        });
      }

      const sourcePanel = root.querySelector(".source-desk__panel");
      const dragSurface = root.querySelector("[data-source-drag]");
      if (sourcePanel && dragSurface) {
        dragSurface.addEventListener("pointerdown", (event) => {
          const explicitHandle = event.target.closest("[data-source-drag-handle]");
          const interactiveTarget = event.target.closest("button, a, input, select, textarea");

          if (!explicitHandle && interactiveTarget) {
            return;
          }

          if (!state.sourceOpen || state.sourceFullscreen || isCompactSourceDeskViewport()) {
            return;
          }

          const startWindow = normalizeSourceDeskWindow(state.sourceWindow);
          const startX = event.clientX;
          const startY = event.clientY;

          const updatePanelPosition = (windowRect) => {
            sourcePanel.style.left = `${windowRect.left}px`;
            sourcePanel.style.top = `${windowRect.top}px`;
            sourcePanel.style.width = `${windowRect.width}px`;
            sourcePanel.style.height = `${windowRect.height}px`;
          };

          const handleMove = (moveEvent) => {
            state.sourceWindow = normalizeSourceDeskWindow({
              ...startWindow,
              left: startWindow.left + (moveEvent.clientX - startX),
              top: startWindow.top + (moveEvent.clientY - startY),
            });
            updatePanelPosition(state.sourceWindow);
          };

          const stopDragging = () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", stopDragging);
            window.removeEventListener("pointercancel", stopDragging);
          };

          window.addEventListener("pointermove", handleMove);
          window.addEventListener("pointerup", stopDragging);
          window.addEventListener("pointercancel", stopDragging);
          event.preventDefault();
        });
      }
    };

    window.addEventListener("resize", () => {
      const nextSourceWindow = normalizeSourceDeskWindow(state.sourceWindow);
      const sourceWindowChanged =
        nextSourceWindow.left !== state.sourceWindow.left ||
        nextSourceWindow.top !== state.sourceWindow.top ||
        nextSourceWindow.width !== state.sourceWindow.width ||
        nextSourceWindow.height !== state.sourceWindow.height;
      state.sourceWindow = nextSourceWindow;

      const nextMetrics = getPaginationMetrics();
      const nextKey = getPaginationKey(nextMetrics);

      if (nextKey !== paginationKey) {
        repaginate();
        render();
        return;
      }

      const normalized = normalizeIndex(state.currentIndex);
      if (normalized !== state.currentIndex || sourceWindowChanged) {
        state.currentIndex = normalized;
        render();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.sourceOpen) {
        state.sourceOpen = false;
        render();
        return;
      }

      if (event.key === "ArrowRight") {
        const step = isMobile() ? 1 : 2;
        state.currentIndex = normalizeIndex(state.currentIndex + step);
        render();
      }

      if (event.key === "ArrowLeft") {
        const step = isMobile() ? 1 : 2;
        state.currentIndex = normalizeIndex(state.currentIndex - step);
        render();
      }
    });

    render();
    await ensureSourceLoaded(state.selectedSource);
  } catch (error) {
    root.innerHTML = `<div class="book-error">${escapeHtml(error.message)}</div>`;
  }
}
