How to Use This
**Step 1 **— Run the meta-prompt above in Claude. You get five document-generation prompts.
**Step 2** — Run each prompt in a fresh Claude conversation. Save each output as a .md file:
lore-docs/
  01-prd.md
  02-design-system.md
  03-tech-architecture.md
  04-component-spec.md
  05-agent-playbook.md
**Step 3 **— Set up your Angular project:
bashng new lore --standalone --routing --style=scss
cd lore
npm install @anthropic-ai/sdk
**Step 4 **— Choose your coding agent and feed it your documents:
ToolHow to useKiroDrop 03-tech-architecture.md + 04-component-spec.md into the spec panel. Kiro generates steering files. Then run agent per feature area using Prompt 5 chunks.GitHub Copilot WorkspaceOpen a new workspace, attach the PRD and component spec, then use agent prompts from Playbook one feature at a time.Claude CodeRun claude in your project root. Paste each agent prompt from the playbook directly. Claude Code reads your file tree and writes real files.
**Step 5 **— Build order (recommended):
1. Design tokens + SCSS variables (from Design System doc)
2. AppShell + routing + NavRail
3. Sidebar + ShelfTree + NoteItem
4. PaperCanvas + single pane editor
5. Block system (all 14 types)
6. [[Linker + backlinks
7. Split pane (2 and 3 columns)
8. Dark mode (global token swap)
9. AI integration (@mention, live Claude API)
10. Prompt Library + Cron scheduler
11. HTML Notes view
12. Knowledge Graph
13. Search, Zen, QuickCapture
14. Settings (all 6 tabs)
15. Notification Center + Share panel