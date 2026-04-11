import type { Theme } from "@mariozechner/pi-coding-agent";
import { Key, matchesKey, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { logger } from "../logger.js";
import type { Quest } from "../quest/types.js";

export class QuestListWidget {
  private cachedWidth?: number;
  private cachedLines?: string[];
  private page = 0;
  private readonly pageSize = 10;

  constructor(
    private quests: Quest[],
    private theme: Theme,
    private onClose: () => void,
  ) {
    logger.debug("quests:widget", "create", { questCount: quests.length });
  }

  handleInput(data: string): void {
    logger.debug("quests:widget", "handleInput", { data });
    if (matchesKey(data, Key.escape) || data === "q" || data === "Q") {
      logger.debug("quests:widget", "close");
      this.onClose();
      return;
    }

    if (matchesKey(data, Key.tab)) {
      this.nextPage();
      return;
    }

    if (matchesKey(data, Key.shift(Key.tab))) {
      this.prevPage();
      return;
    }
  }

  private get totalPages(): number {
    return Math.max(1, Math.ceil(this.quests.length / this.pageSize));
  }

  private nextPage(): void {
    const next = (this.page + 1) % this.totalPages;
    logger.debug("quests:widget", "nextPage", {
      from: this.page,
      to: next,
      totalPages: this.totalPages,
    });

    this.page = next;
    this.invalidate();
  }

  private prevPage(): void {
    const prev = (this.page - 1 + this.totalPages) % this.totalPages;
    logger.debug("quests:widget", "prevPage", {
      from: this.page,
      to: prev,
      totalPages: this.totalPages,
    });

    this.page = prev;
    this.invalidate();
  }

  render(width: number): string[] {
    if (this.cachedWidth === width && this.cachedLines) {
      return this.cachedLines;
    }
    logger.debug("quests:widget", "render", {
      width,
      page: this.page,
      totalPages: this.totalPages,
      totalQuests: this.quests.length,
    });

    const th = this.theme;
    const lines: string[] = [];
    const total = this.quests.length;
    const doneCount = this.quests.filter((q) => q.done).length;

    // Top accent border
    lines.push(th.fg("accent", "─".repeat(width)));

    // Header with title and completion stats
    const title = th.fg("accent", th.bold("  Quest Log "));
    const stats = total > 0 ? th.fg("muted", `${doneCount}/${total} completed  `) : "";
    const headerGap = Math.max(0, width - visibleWidth(title) - visibleWidth(stats));
    lines.push(truncateToWidth(title + " ".repeat(headerGap) + stats, width));

    lines.push("");

    if (this.quests.length === 0) {
      lines.push(
        truncateToWidth(
          `  ${th.fg("dim", "No active quests. Add one with /quests add <description>")}`,
          width,
        ),
      );
    } else {
      // Mini progress bar
      const barWidth = Math.min(width - 4, 24);
      const filled = Math.round((doneCount / total) * barWidth);
      const empty = barWidth - filled;
      const bar = th.fg("success", "█".repeat(filled)) + th.fg("dim", "░".repeat(empty));

      lines.push(truncateToWidth(`  ${bar}  ${th.fg("muted", `${doneCount}/${total}`)}`, width));
      lines.push("");

      const start = this.page * this.pageSize;
      const pageQuests = this.quests.slice(start, start + this.pageSize);
      for (let i = 0; i < pageQuests.length; i++) {
        const q = pageQuests[i];
        const pos = start + i + 1;
        const marker = q.done ? th.fg("success", "  ✓ ") : th.fg("muted", "  ○ ");
        const idStr = th.fg(q.done ? "dim" : "accent", `#${pos}`);
        const desc = q.done
          ? th.fg("dim", th.strikethrough(q.description))
          : th.fg("text", q.description);
        const row = `${marker}${idStr} ${desc}`;

        lines.push(truncateToWidth(row, width));
      }

      if (this.totalPages > 1) {
        const pageInfo = `  Page ${this.page + 1}/${this.totalPages}  ${th.fg("dim", "· Tab/Shift+Tab to navigate")}`;

        lines.push("");
        lines.push(truncateToWidth(pageInfo, width));
      }
    }

    lines.push("");
    lines.push(truncateToWidth(`  ${th.fg("dim", "Press q or Esc to close")}`, width));

    // Bottom accent border
    lines.push(th.fg("accent", "─".repeat(width)));

    this.cachedWidth = width;
    this.cachedLines = lines;
    return lines;
  }

  invalidate(): void {
    logger.debug("quests:widget", "invalidate");
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
  }
}
