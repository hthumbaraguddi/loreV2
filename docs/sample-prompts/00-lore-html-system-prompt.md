# Lore HTML Output System Prompt

**What this is:** A reusable instruction block you prepend to any AI prompt to get HTML output that renders correctly in Lore.

Copy the block below and paste it at the **start** of your prompt before describing what you want.

---

## The System Prompt

```
You are generating a styled HTML document to be imported into Lore, a personal knowledge app.

OUTPUT RULES — follow these exactly:

1. Return a complete HTML document starting with <!DOCTYPE html>.
2. Use inline CSS only — no external stylesheets, no <link rel="stylesheet"> to third-party CSS frameworks (Tailwind, Bootstrap, etc.). Google Fonts <link> tags are allowed.
3. Do NOT include any <script> tags or JavaScript of any kind.
4. Do NOT use CSS animations, transitions, or keyframes. All content must be fully visible in its final state without any interaction or delay.
5. Do NOT use CSS classes that hide content by default (e.g. display:none, visibility:hidden, opacity:0). Every element must be visible on load.
6. Do NOT use position:fixed or position:sticky — these break inside an iframe viewer.
7. Constrain the layout to a max-width of 800px centered on the page (margin: 0 auto).
8. Use only web-safe fallback fonts or Google Fonts loaded via <link>. Do not reference local system fonts that may not exist.
9. Set a <title> tag that clearly names the document — Lore uses this as the note title.
10. Images: only use publicly accessible URLs (https://). Do not use base64-encoded images or local file paths.

DESIGN GUIDELINES:
- Use a clean, readable layout with clear visual hierarchy.
- Prefer card-based or section-based layouts with padding and soft shadows.
- Use a consistent color palette — pick 2–3 accent colors and stick to them.
- Body font size should be 15–16px for readability.
- Headings should use a larger weight/size to create clear hierarchy.
- Add sufficient padding (at least 24px) around content sections.

Now generate the following:
```

---

## How to use

1. Copy the block above (everything inside the triple backticks)
2. Paste it at the **start** of your message in Claude, ChatGPT, or any AI chat
3. On the next line, describe what you want — e.g. *"A weekly habit tracker for April 2026 with 7 habits and a progress summary"*
4. Send the message
5. Copy the full HTML response
6. In Lore: open a notebook → New Note → Rich Note → **Import File** or **Paste AI Response**
7. Import or paste — Lore renders the HTML inside the note card

---

## Why these rules matter

| Rule | Why |
|------|-----|
| Inline CSS only | Lore renders HTML in a sandboxed iframe — external CSS files are blocked |
| No JavaScript | Scripts are stripped during import for security |
| No animations/hidden states | The containment CSS Lore injects forces visibility, but starting clean avoids conflicts |
| No fixed/sticky positioning | These elements escape the iframe bounds and overlap the Lore UI |
| max-width 800px | Matches the note card width so content doesn't overflow horizontally |
| `<title>` tag | Lore extracts this as the note title automatically |

---

## Example: combining this with a custom prompt

```
You are generating a styled HTML document to be imported into Lore, a personal knowledge app.

OUTPUT RULES — follow these exactly:
[... paste the full rules block here ...]

Now generate the following:

A monthly budget summary for April 2026 for a freelancer.
Include:
- A header with the month and total income vs total expenses
- A breakdown table: Category | Budgeted | Actual | Difference
  - Rent: $1,800 / $1,800 / $0
  - Groceries: $400 / $520 / -$120
  - Software subscriptions: $150 / $210 / -$60
  - Transport: $200 / $175 / +$25
  - Savings: $500 / $300 / -$200
- A "Health Score" section with a simple colored bar (green/yellow/red) based on overspend
- A short notes section at the bottom

Use a clean, professional design. Color palette: dark navy header, white cards, green for positive, red for negative.
```
