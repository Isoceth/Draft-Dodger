import React, { useEffect, useMemo, useState } from "react";
import { DiffEditor } from "@monaco-editor/react";
import * as Diff from "diff";
import { motion } from "framer-motion";
import { Check, ClipboardList, Hammer, X } from "lucide-react";

type HunkKind = "equal" | "replace" | "insert" | "delete";

interface Hunk {
  id: string;
  kind: HunkKind;
  oldText: string;
  newText: string;
  accepted: boolean;
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function buildHunks(current: string, proposed: string): Hunk[] {
  const parts = Diff.diffLines(current, proposed, { newlineIsToken: true });
  const hunks: Hunk[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (!part.added && !part.removed) {
      hunks.push({ id: uuid(), kind: "equal", oldText: part.value, newText: part.value, accepted: true });
      continue;
    }

    if (part.removed) {
      const next = parts[i + 1];
      if (next && next.added) {
        hunks.push({ id: uuid(), kind: "replace", oldText: part.value, newText: next.value, accepted: true });
        i++;
      } else {
        hunks.push({ id: uuid(), kind: "delete", oldText: part.value, newText: "", accepted: false });
      }
      continue;
    }

    if (part.added) {
      hunks.push({ id: uuid(), kind: "insert", oldText: "", newText: part.value, accepted: false });
    }
  }
  return hunks;
}

function applyHunks(hunks: Hunk[]): string {
  let out = "";
  for (const h of hunks) {
    if (h.kind === "equal") {
      out += h.oldText;
    } else if (h.kind === "replace") {
      out += h.accepted ? h.newText : h.oldText;
    } else if (h.kind === "insert") {
      if (h.accepted) out += h.newText;
    } else if (h.kind === "delete") {
      if (!h.accepted) out += h.oldText;
    }
  }
  return out;
}

const sampleBase = `# Session: Using AI without losing the plot\n\n## Context\nWe want a split-view app: chat on the left, source-of-truth doc on the right.\nThe AI proposes edits; the user accepts/rejects.\n`;

const sampleUserEdits = `# Session: Using AI without losing the plot\n\n## Context\nSplit view: chat (left) + document (right).\nThe AI proposes edits; the user accepts/rejects. Export as Markdown at the end.\n`;

const sampleProposal = `# Session: Using AI without losing the plot\n\n## Goals\n1. Keep the AI anchored to a user-approved doc.\n2. Produce exportable notes and a project outline.\n\n## Context\nSplit view: chat (left) + document (right).\nThe AI proposes edits; the user accepts/rejects. Export as Markdown and PDF.\n\n## Next Steps\n- Wire Monaco Diff for review.\n- Add per-hunk accept/reject.\n- Save history (base/current) for audit.\n`;

export default function DiffReviewPlayground() {
  const [base, setBase] = useState<string>(sampleBase);
  const [current, setCurrent] = useState<string>(sampleUserEdits);
  const [proposed, setProposed] = useState<string>(sampleProposal);
  const [hunks, setHunks] = useState<Hunk[]>([]);

  useEffect(() => {
    setHunks(buildHunks(current, proposed));
  }, [current, proposed]);

  const acceptedCount = useMemo(() => hunks.filter(h => h.kind !== "equal" && h.accepted).length, [hunks]);
  const totalChanges = useMemo(() => hunks.filter(h => h.kind !== "equal").length, [hunks]);

  function updateHunk(id: string, accepted: boolean) {
    setHunks(prev => prev.map(h => (h.id === id ? { ...h, accepted } : h)));
  }

  function acceptAll() {
    setHunks(prev => prev.map(h => (h.kind === "equal" ? h : { ...h, accepted: true })));
  }

  function rejectAll() {
    setHunks(prev => prev.map(h => (h.kind === "equal" ? h : { ...h, accepted: false })));
  }

  function applyAccepted() {
    const next = applyHunks(hunks);
    setCurrent(next);
    setBase(next);
    setProposed(next);
    setHunks(buildHunks(next, next));
  }

  return (
    <div className="w-full min-h-screen bg-neutral-50 p-6 text-neutral-900">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white shadow-sm">
          <header className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Conversation</h2>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs uppercase tracking-wide text-neutral-500">stub</span>
          </header>
          <div className="space-y-4 px-6 py-4">
            <label className="block text-sm font-medium text-neutral-600">Chat transcript</label>
            <textarea
              className="h-32 w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm"
              value={"Pretend this is your chat with the AI. Wire your model here to generate a proposal."}
              readOnly
            />

            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-700">Buffers</p>
              <label className="block text-xs font-medium uppercase text-neutral-500">Base (approved)</label>
              <textarea
                value={base}
                onChange={event => setBase(event.target.value)}
                className="h-28 w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2 font-mono text-xs"
              />
              <label className="block text-xs font-medium uppercase text-neutral-500">Current (user-edited)</label>
              <textarea
                value={current}
                onChange={event => setCurrent(event.target.value)}
                className="h-40 w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2 font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase text-neutral-500">Proposed (from AI)</label>
              <textarea
                value={proposed}
                onChange={event => setProposed(event.target.value)}
                className="h-60 w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2 font-mono text-xs"
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="rounded-xl border bg-white shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Review changes</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {acceptedCount}/{totalChanges} selected
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1 text-sm text-neutral-600 transition hover:bg-neutral-100"
                  onClick={rejectAll}
                >
                  <X className="h-4 w-4" />
                  Reject all
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1 text-sm text-white transition hover:bg-black"
                  onClick={acceptAll}
                >
                  <Check className="h-4 w-4" />
                  Accept all
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700"
                  onClick={applyAccepted}
                >
                  <Hammer className="h-4 w-4" />
                  Apply
                </button>
              </div>
            </header>
            <div className="max-h-72 space-y-3 overflow-y-auto px-6 py-4">
              {hunks.filter(h => h.kind !== "equal").map((h, idx) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="space-y-3 rounded-xl border border-neutral-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">{h.kind}</span>
                        <span className="text-neutral-400">change #{idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-sm transition ${
                            h.accepted
                              ? "border-green-600 bg-green-600 text-white hover:bg-green-700"
                              : "border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                          }`}
                          onClick={() => updateHunk(h.id, !h.accepted)}
                        >
                          {h.accepted ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} {h.accepted ? "Accepted" : "Rejected"}
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3 text-xs md:grid-cols-2">
                      <div className="whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-2 font-mono">
                        {h.oldText || "(insertion)"}
                      </div>
                      <div className="whitespace-pre-wrap rounded-lg border border-green-200 bg-green-50 p-2 font-mono">
                        {h.newText || "(deletion)"}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {totalChanges === 0 && <p className="text-sm text-neutral-500">No pending changes.</p>}
            </div>
          </div>

          <div className="flex-1 rounded-xl border bg-white shadow-sm">
            <header className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Diff preview (current vs proposed)</h2>
            </header>
            <div className="h-[48vh] px-6 py-4">
              <DiffEditor
                height="100%"
                original={current}
                modified={proposed}
                options={{ readOnly: true, renderSideBySide: true, automaticLayout: true }}
                language="markdown"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
