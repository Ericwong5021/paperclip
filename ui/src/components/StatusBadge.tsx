import type { CSSProperties } from "react";
import { cn } from "../lib/utils";
import {
  statusBadge,
  statusBadgeDefault,
  agentStatusMotion,
  agentStatusVar,
  agentStatusVarDefault,
  taskStatusVar,
  taskStatusVarDefault,
} from "../lib/status-colors";
import { StatusGlyph } from "./StatusGlyph";
import { getLocale, t } from "@/i18n";

const statusTranslationKeys: Record<string, string> = {
  backlog: "charts.backlog",
  todo: "charts.todo",
  in_progress: "charts.inProgress",
  in_review: "charts.inReview",
  done: "charts.done",
  blocked: "charts.blocked",
  cancelled: "charts.cancelled",
  succeeded: "charts.succeeded",
  failed: "charts.failed",
  active: "agentsPage.active",
  planned: "goalsPage.values.planned",
  achieved: "goalsPage.values.achieved",
  approved: "approvalsPage.statuses.approved",
  rejected: "approvalsPage.statuses.rejected",
  revision_requested: "approvalsPage.statuses.revision_requested",
  pending: "approvalsPage.statuses.pending",
  running: "dashboard.liveNow",
  paused: "agentsPage.paused",
  error: "agentsPage.error",
  idle: "agentsPage.active",
};

const routinesStatusTranslationKeys: Record<string, string> = {
  active: "routinesStatus.status.active",
  archived: "routinesStatus.status.archived",
  draft: "routinesStatus.status.draft",
  enabled: "routinesStatus.status.enabled",
  disabled: "routinesStatus.status.disabled",
  paused: "routinesStatus.status.paused",
  running: "routinesStatus.status.running",
  queued: "routinesStatus.status.queued",
  pending: "routinesStatus.status.pending",
  succeeded: "routinesStatus.status.succeeded",
  failed: "routinesStatus.status.failed",
  cancelled: "routinesStatus.status.cancelled",
  error: "routinesStatus.status.error",
};

function translatedStatus(status: string) {
  const key = statusTranslationKeys[status] ?? routinesStatusTranslationKeys[status];
  return getLocale() === "zh-CN" && key
    ? t(key)
    : status.replace(/[_-]/g, " ");
}

/** Inline `--sc` local var pointing a status helper at a base-hue CSS var. */
function scStyle(cssVar: string): CSSProperties {
  return { "--sc": `var(${cssVar})` } as CSSProperties;
}

/** "in_review" → "In review" (sentence case). */
function sentenceCaseStatus(status: string): string {
  const s = status.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Generic status badge for runs / goals / approvals (not task status).
 */
// design-allow(pill-pattern): DECISION-SHEET.md C8 - status badges keep the bespoke WCAG-tuned
// .status-chip color-mix mechanic and do not wrap the Badge primitive.
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0",
        statusBadge[status] ?? statusBadgeDefault
      )}
    >
      {label ?? translatedStatus(status)}
    </span>
  );
}

/**
 * Agent status chip — bordered chip recoloured from the editable
 * `--status-agent-*` base hue via the `.status-chip` color-mix helper. `active`
 * renders as "idle" (alias for dead code).
 */
export function AgentStatusBadge({ status }: { status: string }) {
  const cssVar = agentStatusVar[status] ?? agentStatusVarDefault;
  const label = status === "active" ? "idle" : status;
  return (
    <span
      className="status-chip inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium leading-none whitespace-nowrap shrink-0"
      style={scStyle(cssVar)}
    >
      {translatedStatus(label)}
    </span>
  );
}

/**
 * Agent status indicator — heartbeat capsule (vertical 8x16, r4) filled from the
 * editable `--status-agent-*` base hue. Running agents pulse, broken (error)
 * agents blink; both honor `prefers-reduced-motion`.
 */
export function AgentStatusCapsule({ status }: { status: string }) {
  const cssVar = agentStatusVar[status] ?? agentStatusVarDefault;
  const motion = agentStatusMotion[status] ?? "";
  return (
    <span
      aria-hidden
      className={cn("status-fill inline-block h-4 w-2 rounded-(--rad-4) shrink-0", motion)}
      style={scStyle(cssVar)}
    />
  );
}

/**
 * Issue/task status chip — bordered chip recoloured from the editable
 * `--status-task-*` base hue via `.status-chip`, carrying the unified
 * {@link StatusGlyph} (one distinct, color-blind-safe shape per status), a
 * sentence-cased label and regular weight. `cancelled` is struck through.
 * Distinct from the generic {@link StatusBadge} so run/goal/approval badges are
 * unaffected.
 */
export function IssueStatusBadge({ status }: { status: string }) {
  const cssVar = taskStatusVar[status] ?? taskStatusVarDefault;
  return (
    <span
      className={cn(
        "status-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-normal leading-none whitespace-nowrap shrink-0",
        status === "cancelled" && "line-through"
      )}
      style={scStyle(cssVar)}
    >
      <StatusGlyph status={status} size="sm" />
      {getLocale() === "zh-CN" ? translatedStatus(status) : sentenceCaseStatus(status)}
    </span>
  );
}
