import type { Theme } from "@mariozechner/pi-coding-agent";
import { visibleWidth } from "@mariozechner/pi-tui";
import type { Quest, SubQuest } from "../quest/types.js";

export function formatQuestRow(
  theme: Theme,
  q: Quest | SubQuest,
  idLength: number,
  pos?: number,
): string {
  const isSub = "parentId" in q && q.parentId;

  // position test is only relevant for quests, not subquests
  const posText = isSub ? "" : pos !== undefined ? `#${pos}` : "";
  const posWidth = visibleWidth(posText);
  const idText = `[${q.id}]`;

  // spacing is added to keep text aligned
  const spacing = " ".repeat(visibleWidth(`${16 ** idLength}`) - posWidth);
  const idStr = `${theme.fg("muted", idText)} ${theme.fg(q.done ? "dim" : "accent", `${posText}`)}${spacing}`;

  // for subquests, use a different marker and indent
  const markerNotDone = isSub ? theme.fg("muted", " └── ○ ") : theme.fg("muted", " ○ ");
  const markerDone = isSub ? theme.fg("muted", " └── ✓ ") : theme.fg("success", " ✓ ");
  const marker = q.done ? markerDone : markerNotDone;

  // for subquests, use dim text to contrast with the parent quests
  const descColor = q.done || isSub ? "dim" : "text";
  const desc = q.done
    ? theme.fg(descColor, theme.strikethrough(q.description))
    : theme.fg(descColor, q.description);

  const line = `  ${idStr}${marker} ${desc}`;
  return line;
}

export function formatSubQuestSpacerLine(theme: Theme, idLength: number): string {
  const idTextLength = visibleWidth(`${16 ** idLength}`);
  // spacing for `[id](position string)`
  const spacerStr = `${" ".repeat(idTextLength + 2)}${" ".repeat(idTextLength)}`;

  const marker = theme.fg("muted", " │   ");

  return `  ${spacerStr}${marker}`;
}
