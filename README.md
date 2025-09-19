# Draft Dodger

A split-view web app that keeps your technical chats with an AI on the rails. On the left: your freewheeling conversation. On the right: the **one true document** the AI isn’t allowed to mangle without your say‑so. The AI proposes edits, you approve or reject them like a benevolent tyrant. At the end you walk away with tidy meeting notes or a project outline instead of a fever dream.

## Features
- **Split view:** Chat on the left, curated doc on the right.
- **Diff & merge:** Uses `jsdiff` under the hood for line‑based hunks.
- **Accept/reject controls:** Be as picky as you like.
- **Monaco diff preview:** Side‑by‑side, editor‑quality view.
- **Export‑ready:** Keep the document in Markdown. Convert to PDF/HTML if you feel fancy.
- **Track edits:** The “base/current/proposed” buffers model makes sure your changes survive the AI’s enthusiasm.

## Screenshot
Imagine a tidy UI here: conversation window, a neat diff viewer, buttons that say things like *Reject All* and *Apply*. It looks like you’re winning an argument with your AI, because for once you are.

## Getting Started
Clone the repo, install deps, run dev. The usual.
```bash
git clone https://github.com/yourname/draft-dodger.git
cd draft-dodger
npm install
npm run dev
```

## Tech Stack
- React + Vite (or Next.js, if you insist)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for diff view
- [jsdiff](https://www.npmjs.com/package/diff) for hunks
- [shadcn/ui](https://ui.shadcn.com/) for components
- [Framer Motion](https://www.framer.com/motion/) for making the UI feel alive

## Roadmap
- Word‑level diffs inside hunks
- Export straight to PDF/Word/whatever makes your boss stop asking
- Optional CRDT layer (Yjs) if you really want multi‑user chaos
- “AI propose” wired up to your model of choice

## Contributing
PRs welcome. Keep it clean, keep it witty. If you must add a feature, at least give it a good name.

## License
MIT. Because nobody wants to argue about licensing when there are diffs to reject.

---
**Draft Dodger**: Saving humans from bad drafts, one rejected hunk at a time.
