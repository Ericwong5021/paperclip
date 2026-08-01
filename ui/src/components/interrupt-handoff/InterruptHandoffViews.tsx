import { AlertTriangle, Info, PauseCircle, User, X } from "lucide-react";
import { t } from "@/i18n";
import { cn } from "../../lib/utils";
import { AgentIcon } from "../AgentIconPicker";
import {
  classifyAssigneeHandoff,
  resolveRunStatusPresentation,
  type ComposerHandoffPreview,
  type PauseAffectsSummary,
  type PlainAgentNameCandidate,
  type ReassignInterruptCopy,
  type TimelineAssigneeLike,
} from "../../lib/interrupt-handoff";

/**
 * Presentational views for the interrupt-handoff UX clarity surfaces (PAP-10669).
 * All logic lives in `lib/interrupt-handoff.ts`; these components only render it,
 * so they can be exercised in isolation by component tests and Storybook.
 */

export interface HandoffAgentLike {
  name: string;
  icon?: string | null;
}

export interface HandoffChipResolvers {
  agentMap?: ReadonlyMap<string, HandoffAgentLike> | null;
  resolveUserLabel?: (userId: string) => string | null;
  currentUserId?: string | null;
}

function agentName(agentId: string, resolvers: HandoffChipResolvers): string {
  return resolvers.agentMap?.get(agentId)?.name ?? agentId.slice(0, 8);
}

function agentIcon(agentId: string, resolvers: HandoffChipResolvers): string | null {
  return resolvers.agentMap?.get(agentId)?.icon ?? null;
}

function userLabel(userId: string, resolvers: HandoffChipResolvers): string {
  const label = resolvers.resolveUserLabel?.(userId) ?? null;
  const base = label ?? t("taskDetail.board");
  return resolvers.currentUserId && resolvers.currentUserId === userId ? `${base} (${t("taskDetail.you")})` : base;
}

function localizedRunStatus(status: string, operatorInterrupted: boolean): string {
  if (operatorInterrupted) return t("interactions.handoffInterrupted");
  const keyByStatus: Record<string, string> = {
    queued: "interactions.interactionStatusQueued",
    running: "interactions.interactionStatusRunning",
    succeeded: "interactions.interactionStatusSucceeded",
    failed: "interactions.interactionStatusFailed",
    timed_out: "interactions.interactionStatusTimedOut",
    pending: "interactions.interactionStatusPending",
    error: "interactions.interactionStatusError",
  };
  const key = keyByStatus[status];
  return key ? t(key) : status.replace(/_/g, " ");
}

function localizedWakeText(wakeText: string, kind: string): string {
  if (kind === "agent_wake") {
    const match = wakeText.match(/^queued for (.*?)( \(interrupted run attached\))?$/);
    if (match) {
      return t("interactions.handoffQueuedFor", {
        name: match[1],
        suffix: match[2] ? t("interactions.handoffInterruptedRunAttached") : "",
      });
    }
  }
  if (kind === "user_handoff") return t("interactions.handoffNotCreatedUser");
  return t("interactions.handoffNotCreatedAgent");
}

function localizedPreviewText(preview: ComposerHandoffPreview): string {
  switch (preview.kind) {
    case "interrupt_handoff_agent":
      return t("interactions.handoffInterruptCurrent");
    case "wake_agent":
      return t("interactions.handoffWake");
    case "user_handoff":
      return t("interactions.handoffTo");
    case "clear_assignee":
      return t("interactions.handoffClearResponsible");
    case "notify_agent":
      return t("interactions.handoffNotify");
    case "plain_text_only":
      return t("interactions.handoffNoAgentNotify");
    default:
      return preview.text;
  }
}

function localizedPreviewSuffix(preview: ComposerHandoffPreview): string | undefined {
  if (preview.kind === "user_handoff") return t("interactions.handoffNoAgentNotified");
  if (preview.kind === "notify_agent" && preview.suffix) return t("interactions.handoffMentionedAgent");
  return undefined;
}

const CHIP_CLASS =
  "inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs";

/** A labelled assignee chip — agent, user, or unassigned — that never lets a
 * user owner read like an agent. */
export function AssigneeChip({
  assignee,
  resolvers,
  className,
}: {
  assignee: TimelineAssigneeLike;
  resolvers: HandoffChipResolvers;
  className?: string;
}) {
  if (assignee.agentId) {
    return (
      <span className={cn(CHIP_CLASS, className)} data-testid="handoff-assignee-chip" data-kind="agent">
        <span className="sr-only">{t("interactions.handoffAgentPrefix")}</span>
        <AgentIcon icon={agentIcon(assignee.agentId, resolvers)} className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="max-w-(--sz-12rem) truncate">{agentName(assignee.agentId, resolvers)}</span>
      </span>
    );
  }
  if (assignee.userId) {
    return (
      <span className={cn(CHIP_CLASS, className)} data-testid="handoff-assignee-chip" data-kind="user">
        <span className="sr-only">{t("interactions.handoffUserPrefix")}</span>
        <User className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="max-w-(--sz-12rem) truncate">{userLabel(assignee.userId, resolvers)}</span>
      </span>
    );
  }
  return (
    <span
      className={cn("text-xs italic text-muted-foreground", className)}
      data-testid="handoff-assignee-chip"
      data-kind="unassigned"
    >
      <span className="sr-only">{t("interactions.handoffNoResponsible")}</span>
      {t("interactions.handoffUnassigned")}
    </span>
  );
}

/** The "Wake" sub-row that makes each handoff state self-describing: a queued
 * agent wake, a board-user handoff with no wake, or no agent selected. */
export function HandoffWakeRow({
  to,
  resolvers,
  interruptedRunAttached = false,
}: {
  to: TimelineAssigneeLike;
  resolvers: HandoffChipResolvers;
  interruptedRunAttached?: boolean;
}) {
  const info = classifyAssigneeHandoff(to, {
    agentName: to.agentId ? agentName(to.agentId, resolvers) : null,
    interruptedRunAttached,
  });
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 text-xs"
      data-testid="handoff-wake-row"
      data-kind={info.kind}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("interactions.handoffWake")}</span>
      <span className={cn(info.kind === "agent_wake" ? "text-foreground" : "text-muted-foreground")}>
        {localizedWakeText(info.wakeText, info.kind)}
      </span>
    </div>
  );
}

/** Run status text that distinguishes an intentional operator interrupt
 * (amber "interrupted") from a generic muted "cancelled". */
export function RunStatusBadge({
  status,
  operatorInterrupted = false,
  className,
}: {
  status: string;
  operatorInterrupted?: boolean;
  className?: string;
}) {
  const p = resolveRunStatusPresentation(status, { operatorInterrupted });
  return (
    <span
      className={cn("font-medium", p.className, className)}
      data-testid="run-status-badge"
      data-interrupted={operatorInterrupted ? "true" : "false"}
    >
      {localizedRunStatus(status, operatorInterrupted)}
      {p.srHint ? <span className="sr-only"> · {t("interactions.handoffInterruptedByBoard")}</span> : null}
    </span>
  );
}

function PreviewChip({
  chip,
  resolvers,
}: {
  chip: NonNullable<ComposerHandoffPreview["chip"]>;
  resolvers: HandoffChipResolvers;
}) {
  return (
    <AssigneeChip
      assignee={chip.kind === "agent" ? { agentId: chip.id, userId: null } : { agentId: null, userId: chip.id }}
      resolvers={resolvers}
    />
  );
}

/** One-line interpretation of what submitting the comment will durably do. */
export function ComposerHandoffPreviewRow({
  preview,
  resolvers,
}: {
  preview: ComposerHandoffPreview;
  resolvers: HandoffChipResolvers;
}) {
  if (preview.kind === "none") return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-1.5 text-xs",
        preview.tone === "warn" ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground",
      )}
      data-testid="composer-handoff-preview"
      data-kind={preview.kind}
      role="status"
      aria-live="polite"
    >
      <span>{localizedPreviewText(preview)}</span>
      {preview.chip ? <PreviewChip chip={preview.chip} resolvers={resolvers} /> : null}
      {preview.suffix ? <span>{localizedPreviewSuffix(preview) ?? preview.suffix}</span> : null}
    </div>
  );
}

/** Inline coach shown when the body contains a plain agent name without a chip,
 * offering a one-click upgrade to a real mention. */
export function ComposerMentionCoach({
  candidate,
  agentDisplayName,
  onInsert,
  onDismiss,
}: {
  candidate: PlainAgentNameCandidate;
  agentDisplayName: string;
  onInsert: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-md border border-amber-300/40 bg-amber-50/70 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
      data-testid="composer-mention-coach"
      role="alert"
      aria-live="polite"
    >
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        {t("interactions.handoffDidYouMean")} <span className="font-medium">@{candidate.matchedText}</span>？{t("interactions.handoffPlainTextWarning")}
      </span>
      <button
        type="button"
        onClick={onInsert}
        className="shrink-0 rounded border border-amber-400/50 px-1.5 py-0.5 font-medium hover:bg-amber-100/60 dark:hover:bg-amber-500/20"
        aria-label={t("interactions.handoffInsertMentionFor", { name: agentDisplayName })}
      >
        {t("interactions.handoffInsertMention")}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 hover:bg-amber-100/60 dark:hover:bg-amber-500/20"
        aria-label={t("interactions.handoffDismissSuggestion")}
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

/** Live banner shown at the top of the responsible picker while a run is in flight,
 * warning that reassigning will interrupt it. (design surface 2) */
export function AssigneeRunningBanner({
  copy,
  className,
}: {
  copy: ReassignInterruptCopy;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="assignee-running-banner"
      className={cn(
        "flex items-start gap-1.5 rounded-md border border-amber-300/40 bg-amber-50/70 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        {t("interactions.handoffRunningBanner", {
          name: copy.banner.replace(/ is running .*$/, ""),
        })}
      </span>
    </div>
  );
}

/** "Interrupt & assign" confirm step shown when an operator picks a different
 * target while a run is live. (design surface 2) */
export function InterruptAssignConfirm({
  copy,
  to,
  resolvers,
  onConfirm,
  onCancel,
}: {
  copy: ReassignInterruptCopy;
  /** The target the operator selected. */
  to: TimelineAssigneeLike;
  resolvers: HandoffChipResolvers;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      data-testid="interrupt-assign-confirm"
      className="space-y-2 rounded-md border border-amber-300/40 bg-amber-50/70 p-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
    >
      <div className="flex items-start gap-1.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{t("interactions.handoffConfirmTitle")}</p>
          <p className="flex flex-wrap items-center gap-1 text-amber-700/90 dark:text-amber-300/90">
            <span>{t("interactions.handoffTo")}</span>
            <AssigneeChip assignee={to} resolvers={resolvers} />
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-amber-400/50 px-2 py-0.5 font-medium hover:bg-amber-100/60 dark:hover:bg-amber-500/20"
        >
          {t("interactions.handoffCancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          data-testid="interrupt-assign-confirm-action"
          className="rounded bg-amber-600 px-2 py-0.5 font-medium text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400"
        >
          {t("interactions.handoffConfirmAction")}
        </button>
      </div>
    </div>
  );
}

/** "What this affects" bucket summary for the pause/hold dialog. (design surface 4) */
export function PauseAffectsSummaryView({
  summary,
  className,
}: {
  summary: PauseAffectsSummary;
  className?: string;
}) {
  const visibleBuckets = summary.buckets.filter((bucket) => bucket.count > 0);
  return (
    <div
      data-testid="pause-affects-summary"
      className={cn("space-y-2 rounded-md border border-border bg-muted/30 p-3", className)}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <PauseCircle className="h-3.5 w-3.5" aria-hidden />
          {t("interactions.handoffWhatAffects")}
      </div>
      {summary.nothingLive ? (
        <p role="status" className="text-xs text-muted-foreground" data-testid="pause-nothing-live">
          {t("interactions.handoffNothingLive")}
        </p>
      ) : null}
      {visibleBuckets.length > 0 ? (
        <ul className="space-y-1">
          {visibleBuckets.map((bucket) => (
            <li
              key={bucket.key}
              data-bucket={bucket.key}
              className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs"
            >
              <span className="font-medium text-foreground">
                {t(`interactions.handoffBucket${bucket.key === "live_runs" ? "LiveRuns" : bucket.key === "queued_wakes" ? "QueuedWakes" : bucket.key === "agent_owned" ? "AgentOwned" : bucket.key === "human_owned" ? "HumanOwned" : "Static"}`)}:
              </span>
              <span className="tabular-nums text-foreground">{bucket.count}</span>
              <span className="text-muted-foreground">· {t(`interactions.handoffBucket${bucket.key === "live_runs" ? "LiveDetail" : bucket.key === "queued_wakes" ? "QueuedDetail" : bucket.key === "agent_owned" ? "AgentDetail" : bucket.key === "human_owned" ? "HumanDetail" : "StaticDetail"}`)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{t("interactions.handoffNoTasksAffected")}</p>
      )}
    </div>
  );
}
