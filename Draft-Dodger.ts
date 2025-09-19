import React, { useEffect, useMemo, useState } from "react";
import { DiffEditor } from "@monaco-editor/react";
import * as Diff from "diff";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Check, X, Hammer, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

// -------------------------------------------------------------
// Minimal AI-on-rails diff/merge playground
// - Three buffers: base (approved), current (user-edited), proposed (AI)
// - Compute line-based hunks with jsdiff
// - Per-hunk accept/reject, then apply to produce the next current
// - Monaco Diff shows current vs proposed
// This is intentionally plain-text (Markdown-friendly). Keep rich text out of v1.
// -------------------------------------------------------------

// Types for our hunk model
interface Hunk {
  id: string;
  kind: "equal" | "replace" | "insert" | "delete";
  oldText: string; // text in current
  newText: string; // text in proposed
  accepted: boolean; // whether the user wants to accept this change
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function buildHunks(current: string, proposed: string): Hunk[] {
  // Use line-based diff for predictable UX on prose and code
  const parts = Diff.diffLines(current, proposed, { newlineIsToken: true });

  const hunks: Hunk[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p.added && !p.removed) {
      hunks.push({ id: uuid(), kind: "equal", oldText: p.value, newText: p.value, accepted: true });
      continue;
    }

    // Replace = removed followed immediately by added
    if (p.removed) {
      const next = parts[i + 1];
      if (next && next.added) {
        hunks.push({ id: uuid(), kind: "replace", oldText: p.value, newText: next.value, accepted: true });
        i++; // skip paired add
      } else {
        // Pure delete
        hunks.push({ id: uuid(), kind: "delete", oldText: p.value, newText: "", accepted: false });
      }
      continue;
    }
    if (p.added) {
      hunks.push({ id: uuid(), kind: "insert", oldText: "", newText: p.value, accepted: false });
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
      if (!h.accepted) out += h.oldText; // keep if rejected
    }
  }
  return out;
}

const sampleBase = `# Session: Using AI without losing the plot\n\n## Context\nWe want a split-view app: chat on the left, source-of-truth doc on the right.\nThe AI proposes edits; the user accepts/rejects.\n`;

const sampleUserEdits = `# Session: Using AI without losing the plot\n\n## Context\nSplit view: chat (left) + document (right).\nThe AI proposes edits; the user accepts/rejects. Export as Markdown at the end.\n`;

const sampleProposal = `# Session: Using AI without losing the plot\n\n## Goals\n1. Keep the AI anchored to a user-approved doc.\n2. Produce exportable notes and a project outline.\n\n## Context\nSplit view: chat (left) + document (right).\nThe AI proposes edits; the user accepts/rejects. Export as Markdown and PDF.\n\n## Next Steps\n- Wire Monaco Diff for review.\n- Add per-hunk accept/reject.\n- Save history (base/current) for audit.\n`;

export default function App() {
  const [base, setBase] = useState<string>(sampleBase);
  const [current, setCurrent] = useState<string>(sampleUserEdits);
  const [proposed, setProposed] = useState<string>(sampleProposal);

  const [hunks, setHunks] = useState<Hunk[]>([]);

  useEffect(() => {
    setHunks(buildHunks(current, proposed));
  }, [current, proposed]);

  const acceptedCount = useMemo(() => hunks.filter(h => h.kind !== "equal" && h.accepted).length, [hunks]);
  const totalChanges = useMemo(() => hunks.filter(h => h.kind !== "equal").length, [hunks]);

  function acceptAll() {
    setHunks(hunks.map(h => (h.kind === "equal" ? h : { ...h, accepted: true })));
  }
  function rejectAll() {
    setHunks(hunks.map(h => (h.kind === "equal" ? h : { ...h, accepted: false })));
  }
  function applyAccepted() {
    const next = applyHunks(hunks);
    setCurrent(next);
    setBase(next); // promote approved to base
    setProposed(next); // clear proposal to reflect no pending changes
    setHunks(buildHunks(next, next));
  }

  return (
    <div className="w-full h-screen grid grid-cols-2 gap-4 p-4 bg-neutral-50">
      {/* LEFT: Chat stub */}
      <Card className="h-full shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Conversation</CardTitle>
          <Badge variant="secondary">stub</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-[120px]"
            value={"Pretend this is your chat with the AI. In your real app, wire your model here and generate a proposed doc."}
            readOnly
          />
          <Separator />
          <Tabs defaultValue="buffers">
            <TabsList>
              <TabsTrigger value="buffers">Buffers</TabsTrigger>
              <TabsTrigger value="proposal">Propose</TabsTrigger>
            </TabsList>
            <TabsContent value="buffers" className="space-y-2">
              <label className="text-sm font-medium">Base (approved)</label>
              <Textarea value={base} onChange={e => setBase(e.target.value)} className="min-h-[120px] font-mono" />
              <label className="text-sm font-medium">Current (user-edited)</label>
              <Textarea value={current} onChange={e => setCurrent(e.target.value)} className="min-h-[160px] font-mono" />
            </TabsContent>
            <TabsContent value="proposal" className="space-y-2">
              <label className="text-sm font-medium">Proposed (from AI)</label>
              <Textarea value={proposed} onChange={e => setProposed(e.target.value)} className="min-h-[240px] font-mono" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* RIGHT: Review + Diff */}
      <div className="h-full flex flex-col gap-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              <CardTitle className="text-xl">Review changes</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{acceptedCount}/{totalChanges} selected</Badge>
              <Button variant="secondary" onClick={rejectAll}><X className="w-4 h-4 mr-1"/>Reject all</Button>
              <Button onClick={acceptAll}><Check className="w-4 h-4 mr-1"/>Accept all</Button>
              <Button onClick={applyAccepted}><Hammer className="w-4 h-4 mr-1"/>Apply</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64 pr-4">
              <div className="space-y-2">
                {hunks.filter(h => h.kind !== "equal").map((h, idx) => (
                  <motion.div key={h.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="rounded-2xl border p-3 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={h.kind === "replace" ? "default" : "secondary"}>{h.kind}</Badge>
                          <span className="text-xs text-neutral-500">change #{idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant={h.accepted ? "default" : "secondary"} onClick={() => setHunks(hunks.map(x => x.id === h.id ? { ...x, accepted: !x.accepted } : x))}>
                            {h.accepted ? <><Check className="w-4 h-4 mr-1"/>Accepted</> : <><X className="w-4 h-4 mr-1"/>Rejected</>}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="font-mono whitespace-pre-wrap p-2 rounded-xl bg-red-50 border">{h.oldText || "(insertion)"}</div>
                        <div className="font-mono whitespace-pre-wrap p-2 rounded-xl bg-green-50 border">{h.newText || "(deletion)"}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {totalChanges === 0 && (
                  <div className="text-sm text-neutral-500">No pending changes.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex-1 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl">Diff preview (current vs proposed)</CardTitle>
          </CardHeader>
          <CardContent className="h-[48vh]">
            <DiffEditor
              height="100%"
              original={current}
              modified={proposed}
              options={{ readOnly: true, renderSideBySide: true, automaticLayout: true }}
              language="markdown"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}