import { t } from "@/i18n";

type SkillSummaryInput = {
  tagline?: string | null;
  description?: string | null;
  key?: string | null;
  name?: string | null;
  sourceBadge?: string | null;
  sourceLabel?: string | null;
};

const BUILTIN_SUMMARY_KEYS: Record<string, string> = {
  paperclip: "skills.summaryPaperclip",
  "paperclip-board": "skills.summaryPaperclipBoard",
  "paperclip-converting-plans-to-tasks": "skills.summaryPaperclipConvertingPlansToTasks",
  "paperclip-create-agent": "skills.summaryPaperclipCreateAgent",
  "para-memory-files": "skills.summaryParaMemoryFiles",
  "reflection-coach": "skills.summaryReflectionCoach",
  "summarize-status": "skills.summarySummarizeStatus",
};

const BUILTIN_TAG_KEYS: Record<string, string> = {
  operations: "skills.tagOperations",
  coaching: "skills.tagCoaching",
  reflection: "skills.tagReflection",
  reporting: "skills.tagReporting",
  skills: "skills.tagSkills",
  status: "skills.tagStatus",
  summary: "skills.tagSummary",
};

function isStaleYamlBlockScalarIndicator(raw: string) {
  return /^[>|][+-]?$/.test(raw.trim());
}

export function sanitizeSkillSummaryText(raw: string | null | undefined): string | null {
  const cleaned = (raw ?? "").trim();
  if (isStaleYamlBlockScalarIndicator(cleaned)) return null;
  return cleaned.length > 0 ? cleaned : null;
}

function builtinSkillSlug(skill: SkillSummaryInput): string | null {
  const key = skill.key?.trim() ?? "";
  const sourceLabel = skill.sourceLabel?.trim().toLowerCase() ?? "";
  const isBundled = key.startsWith("paperclipai/bundled/")
    || skill.sourceBadge === "paperclip"
    || sourceLabel === "paperclip bundled";
  if (!isBundled) return null;
  const keySlug = key.split("/").at(-1)?.trim().toLowerCase();
  const nameSlug = skill.name?.trim().toLowerCase();
  return keySlug && keySlug in BUILTIN_SUMMARY_KEYS ? keySlug : nameSlug && nameSlug in BUILTIN_SUMMARY_KEYS ? nameSlug : null;
}

export function displaySkillTag(raw: string): string {
  const key = raw.trim().toLowerCase();
  const translationKey = BUILTIN_TAG_KEYS[key];
  return translationKey ? t(translationKey) : raw;
}

export function resolveSkillSummaryText(
  skill: SkillSummaryInput,
  options: { fallbackKey?: boolean } = {},
): string | null {
  const builtinSlug = builtinSkillSlug(skill);
  if (builtinSlug) return t(BUILTIN_SUMMARY_KEYS[builtinSlug]!);

  const summary = sanitizeSkillSummaryText(skill.tagline) ?? sanitizeSkillSummaryText(skill.description);
  if (summary) return summary;

  if (options.fallbackKey) {
    const fallbackKey = skill.key?.trim();
    if (fallbackKey) return fallbackKey;
  }

  return null;
}
