import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Plus, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { queryKeys } from "@/lib/queryKeys";
import { toolsApi } from "@/api/tools";
import { useToast } from "@/context/ToastContext";
import { t } from "@/i18n";
import { LoadingState, ErrorState, RelativeTime } from "./shared";

const ENV_KEY_RE = /^[A-Z_][A-Z0-9_]*$/i;

/** Slugify a display name into a `safeKeyPattern`-valid template id. */
function toTemplateId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return slug;
}

/** Split a typed command line into command + args on whitespace. */
function splitCommand(raw: string): { command: string; args: string[] } {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  return { command: parts[0] ?? "", args: parts.slice(1) };
}

type KeyRow = { id: number; value: string };

/**
 * M8b — "Run your own" tab on the Advanced door (PAP-10862, plan D8).
 *
 * Admin-only surface over P5a's command-template routes
 * (`POST /companies/:id/tools/stdio-templates`). Registers a command that
 * Paperclip will run in the company's isolated workspace and the keys it
 * expects. One of the two M8 screens where "MCP" vocabulary is allowed.
 */
export function RunYourOwnTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { pushToast } = useToast();

  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [keyRows, setKeyRows] = useState<KeyRow[]>([]);
  const [nextRowId, setNextRowId] = useState(1);

  const templates = useQuery({
    queryKey: queryKeys.tools.stdioTemplates(companyId),
    queryFn: () => toolsApi.listStdioTemplates(companyId),
  });

  const envKeys = useMemo(
    () => keyRows.map((row) => row.value.trim()).filter(Boolean),
    [keyRows],
  );
  const invalidKeys = envKeys.filter((key) => !ENV_KEY_RE.test(key));
  const parsed = splitCommand(command);
  const templateId = toTemplateId(name);
  const canSubmit =
    name.trim().length > 0 &&
    parsed.command.length > 0 &&
    templateId.length > 0 &&
    invalidKeys.length === 0;

  const createMutation = useMutation({
    mutationFn: () =>
      toolsApi.createStdioTemplate(companyId, {
        templateId,
        name: name.trim(),
        command: parsed.command,
        args: parsed.args,
        envKeys,
      }),
    onSuccess: () => {
      pushToast({ title: t("appsTools.toolAdded", { defaultValue: "工具已添加" }), body: `"${name.trim()}" ${t("appsTools.readyToConnect", { defaultValue: "已准备好连接。" })}`, tone: "success" });
      setName("");
      setCommand("");
      setKeyRows([]);
      qc.invalidateQueries({ queryKey: queryKeys.tools.stdioTemplates(companyId) });
    },
  });

  const addKeyRow = () => {
    setKeyRows((rows) => [...rows, { id: nextRowId, value: "" }]);
    setNextRowId((id) => id + 1);
  };

  const adminTemplates = (templates.data?.templates ?? []).filter((t) => t.source === "admin");

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-muted-foreground">
        {t("appsTools.runYourOwnHint", { defaultValue: "适用于通过命令运行的工具。Paperclip 会在公司独立工作区中运行它。仅限管理员。" })}
      </p>

      <div className="space-y-5 rounded-lg border border-border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="ryo-name">{t("appsTools.name", { defaultValue: "名称" })}</Label>
          <Input
            id="ryo-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("appsTools.toolNamePlaceholder", { defaultValue: "例如 Acme tools" })}
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground">{t("appsTools.toolNameInAppsHint", { defaultValue: "此名称会显示在应用列表中。" })}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ryo-command">{t("appsTools.command", { defaultValue: "命令" })}</Label>
          <Input
            id="ryo-command"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder={t("appsTools.commandPlaceholder", { defaultValue: "例如 npx -y @acme/mcp-tool" })}
            spellCheck={false}
            className="bg-slate-900 font-mono text-(length:--text-compact) text-slate-100 placeholder:text-slate-500 focus-visible:ring-slate-400"
          />
          <p className="text-xs text-muted-foreground">{t("appsTools.commandHint", { defaultValue: "用于运行工具的命令，来自工具的 README。" })}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <Label>{t("appsTools.keysNeeded", { defaultValue: "所需密钥" })}</Label>
            <span className="text-xs text-muted-foreground">· {t("appsTools.optionalDepends", { defaultValue: "可选，取决于工具" })}</span>
          </div>
          {keyRows.length > 0 ? (
            <div className="space-y-2">
              {keyRows.map((row) => {
                const value = row.value.trim();
                const invalid = value.length > 0 && !ENV_KEY_RE.test(value);
                return (
                  <div key={row.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        value={row.value}
                        onChange={(event) =>
                          setKeyRows((rows) =>
                            rows.map((r) => (r.id === row.id ? { ...r, value: event.target.value } : r)),
                          )
                        }
                        placeholder="API_KEY"
                        spellCheck={false}
                        className={`font-mono text-(length:--text-compact) ${invalid ? "border-destructive" : ""}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("appsTools.removeKey", { defaultValue: "移除密钥" })}
                        onClick={() => setKeyRows((rows) => rows.filter((r) => r.id !== row.id))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {invalid ? (
                      <p className="text-xs text-destructive">
                        {t("appsTools.envKeyFormat", { defaultValue: "请使用字母、数字和下划线，并以字母或下划线开头（例如 API_KEY）。" })}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={addKeyRow} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {t("appsTools.addKey", { defaultValue: "添加密钥" })}
          </Button>
        </div>

        <div className="flex items-start gap-2.5 rounded-md bg-muted/50 px-3 py-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="text-xs">
            <p className="font-medium text-foreground">
              {t("appsTools.isolatedWorkspaceHint", { defaultValue: "此工具会在公司独立工作区中运行，与其他内容隔离。" })}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" />
              {t("appsTools.adminOnly", { defaultValue: "只有管理员可以看到此选项。" })}
            </p>
          </div>
        </div>

        {createMutation.isError ? <ErrorState error={createMutation.error} /> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => createMutation.mutate()} disabled={!canSubmit || createMutation.isPending}>
            {createMutation.isPending ? t("appsTools.adding", { defaultValue: "添加中…" }) : t("appsTools.checkContinue", { defaultValue: "检查并继续" })}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("appsTools.registerCommandHint", { defaultValue: "Paperclip 将注册此命令及其所需密钥。" })}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{t("appsTools.yourOwnTools", { defaultValue: "你的工具" })}</h3>
        {templates.isLoading ? (
          <LoadingState />
        ) : templates.isError ? (
          <ErrorState error={templates.error} onRetry={() => templates.refetch()} />
        ) : adminTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("appsTools.noOwnTools", { defaultValue: "你还没有添加自己的工具。" })}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">{t("appsTools.name", { defaultValue: "名称" })}</th>
                  <th className="px-4 py-2.5">{t("appsTools.command", { defaultValue: "命令" })}</th>
                  <th className="px-4 py-2.5">{t("appsTools.keys", { defaultValue: "密钥" })}</th>
                  <th className="px-4 py-2.5">{t("appsTools.added", { defaultValue: "添加时间" })}</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {adminTemplates.map((template) => (
                  <RunYourOwnRow key={template.templateId} companyId={companyId} template={template} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RunYourOwnRow({
  companyId,
  template,
}: {
  companyId: string;
  template: import("@/api/tools").StdioTemplateSummary;
}) {
  const qc = useQueryClient();
  const { pushToast } = useToast();
  const disableMutation = useMutation({
    mutationFn: () => toolsApi.disableStdioTemplate(companyId, template.templateId),
    onSuccess: () => {
      pushToast({ title: t("appsTools.toolTurnedOff", { defaultValue: "工具已关闭" }), tone: "success" });
      qc.invalidateQueries({ queryKey: queryKeys.tools.stdioTemplates(companyId) });
    },
    onError: (error) => {
      pushToast({
        title: t("appsTools.couldNotTurnOff", { defaultValue: "无法关闭工具" }),
        body: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
    },
  });
  const disabled = template.status === "disabled";
  const fullCommand = [template.command ?? "", ...(template.args ?? [])].join(" ").trim();

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{template.name}</div>
        {disabled ? <Badge variant="outline">{t("appsTools.off", { defaultValue: "关闭" })}</Badge> : null}
      </td>
      <td className="px-4 py-3">
        <code className="font-mono text-(length:--text-micro) text-muted-foreground">{fullCommand || "—"}</code>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {template.envKeys.length > 0 ? template.envKeys.join(", ") : t("appsTools.none", { defaultValue: "无" })}
      </td>
      <td className="px-4 py-3">
        <RelativeTime value={template.createdAt} />
      </td>
      <td className="px-4 py-3 text-right">
        {disabled ? null : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => disableMutation.mutate()}
            disabled={disableMutation.isPending}
          >
            {t("appsTools.turnOff", { defaultValue: "关闭" })}
          </Button>
        )}
      </td>
    </tr>
  );
}
