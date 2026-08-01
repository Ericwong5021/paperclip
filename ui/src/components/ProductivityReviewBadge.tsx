import { Eye } from "lucide-react";
import type { IssueProductivityReview } from "@paperclipai/shared";
import { Link } from "../lib/router";
import { cn } from "../lib/utils";
import { createIssueDetailPath } from "../lib/issueDetailBreadcrumb";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { t, useTranslation } from "../i18n";

const TRIGGER_LABELS: Record<string, string> = {
  no_comment_streak: "inboxResidual.productivityReview.triggers.noCommentStreak",
  long_active_duration: "inboxResidual.productivityReview.triggers.longActiveDuration",
  high_churn: "inboxResidual.productivityReview.triggers.highChurn",
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  todo: "inboxResidual.productivityReview.statuses.open",
  in_progress: "inboxResidual.productivityReview.statuses.inProgress",
  in_review: "inboxResidual.productivityReview.statuses.inReview",
  blocked: "inboxResidual.productivityReview.statuses.blocked",
  backlog: "inboxResidual.productivityReview.statuses.open",
};

export function productivityReviewTriggerLabel(
  trigger: IssueProductivityReview["trigger"],
): string {
  if (!trigger) return t("inboxResidual.productivityReview.triggers.default");
  return t(TRIGGER_LABELS[trigger] ?? "inboxResidual.productivityReview.triggers.default");
}

export function ProductivityReviewBadge({
  review,
  className,
  hideLabel = false,
}: {
  review: IssueProductivityReview;
  className?: string;
  hideLabel?: boolean;
}) {
  const { t } = useTranslation();
  const label = productivityReviewTriggerLabel(review.trigger);
  const reviewIdentifier = review.reviewIdentifier ?? review.reviewIssueId.slice(0, 8);
  const reviewPath = createIssueDetailPath(review.reviewIdentifier ?? review.reviewIssueId);
  const statusLabel = REVIEW_STATUS_LABELS[review.status]
    ? t(REVIEW_STATUS_LABELS[review.status])
    : review.status.replace(/_/g, " ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={reviewPath}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-(length:--text-nano) font-medium text-amber-700 dark:text-amber-300 shrink-0 hover:bg-amber-500/20 transition-colors",
            className,
          )}
          aria-label={t("inboxResidual.productivityReview.aria", { identifier: reviewIdentifier, label })}
        >
          <Eye className="h-3 w-3" aria-hidden />
          {hideLabel ? null : <span>{t("inboxResidual.productivityReview.underReview")}</span>}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <div className="font-semibold">{t("inboxResidual.productivityReview.open")}</div>
          <div>
            <span className="text-muted-foreground">{t("inboxResidual.productivityReview.trigger")}</span> {label}
          </div>
          {typeof review.noCommentStreak === "number" && review.noCommentStreak > 0 ? (
            <div>
              <span className="text-muted-foreground">{t("inboxResidual.productivityReview.noCommentStreak")}</span>{" "}
              {t("inboxResidual.productivityReview.runs", { count: review.noCommentStreak })}
            </div>
          ) : null}
          <div>
            <span className="text-muted-foreground">{t("inboxResidual.productivityReview.review")}</span> {reviewIdentifier} ({statusLabel})
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
