import { createWriteStream, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const LOG_FILE = "/tmp/logs/pi-quests/debug.log";

mkdirSync(dirname(LOG_FILE), { recursive: true });

export const logger = {
  debug: (namespace: string, event: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    const line = `[${timestamp}] [${namespace}] ${event}${metaStr}\n`;
    createWriteStream(LOG_FILE, { flags: "a" }).write(line);
  },
};
