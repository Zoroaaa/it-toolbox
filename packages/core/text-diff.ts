import * as Diff from 'diff'

export interface DiffResult {
  type: 'added' | 'removed' | 'unchanged'
  value: string
}

export function diffText(oldText: string, newText: string, mode: 'chars' | 'words' | 'lines' = 'lines'): DiffResult[] {
  const diffFn = {
    chars: Diff.diffChars,
    words: Diff.diffWords,
    lines: Diff.diffLines,
  }[mode]

  const changes = diffFn(oldText, newText)
  const result: DiffResult[] = []

  for (const change of changes) {
    if (change.added) {
      result.push({ type: 'added', value: change.value })
    } else if (change.removed) {
      result.push({ type: 'removed', value: change.value })
    } else {
      result.push({ type: 'unchanged', value: change.value })
    }
  }

  return result
}
