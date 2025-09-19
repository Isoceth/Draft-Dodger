import * as Diff from "diff";

export type DiffHunk = Diff.IDiffResult;

export function diffLines(before: string, after: string): DiffHunk[] {
  return Diff.diffLines(before, after, { newlineIsToken: true });
}
