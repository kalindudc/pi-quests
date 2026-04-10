import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJsonPath = resolve(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

export const VERSION: string = packageJson.version;
export const CHANGELOG_PATH: string = resolve(__dirname, "../CHANGELOG.md");
