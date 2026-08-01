import { AlertTriangle } from "lucide-react";
import type { ToolProfileWithDetails } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ProfileActionDialogKind = "archive" | "delete" | "restore";

export function ProfileActionDialog({
  kind,
  profile,
  pending,
  onClose,
  onArchive,
  onRestore,
  onDelete,
}: {
  kind: ProfileActionDialogKind | null;
  profile: ToolProfileWithDetails | null;
  pending: boolean;
  onClose: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  if (!kind || !profile) return null;

  const defaultDeleteBlocked = kind === "delete" && profile.summary.isCompanyDefault;
  const copy = {
    archive: {
      title: t("appsTools.archiveProfile", { defaultValue: "归档配置档案" }),
      body: t("appsTools.archiveProfileHint", { defaultValue: "此配置档案将不再应用于 {{count}} 个 Agent，之后可以恢复。", count: profile.summary.appliesToAgentCount }),
      confirm: t("appsTools.archive", { defaultValue: "归档" }),
      action: onArchive,
    },
    restore: {
      title: t("appsTools.restoreProfile", { defaultValue: "恢复配置档案" }),
      body: t("appsTools.restoreProfileHint", { defaultValue: "此配置档案将重新启用，并可以分配给 Agent。" }),
      confirm: t("appsTools.restore", { defaultValue: "恢复" }),
      action: onRestore,
    },
    delete: {
      title: t("appsTools.deleteProfile", { defaultValue: "删除配置档案" }),
      body: defaultDeleteBlocked
        ? t("appsTools.defaultProfileDeleteHint", { defaultValue: "此配置档案是公司默认配置。请先将公司默认配置改为其他配置档案，再删除它。" })
        : t("appsTools.deleteProfileHint", { defaultValue: "这将永久删除配置档案，并移除 {{count}} 个分配。", count: profile.summary.assignmentCount }),
      confirm: t("appsTools.delete", { defaultValue: "删除" }),
      action: onDelete,
    },
  }[kind];

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        {defaultDeleteBlocked ? (
          <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("appsTools.chooseOtherDefaultProfile", { defaultValue: "请先选择其他访问配置档案并将其设为公司默认。" })}</span>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t("appsTools.cancel", { defaultValue: "取消" })}</Button>
          <Button
            variant={kind === "delete" ? "destructive" : "default"}
            disabled={pending || defaultDeleteBlocked}
            onClick={copy.action}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
