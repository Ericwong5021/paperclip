import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Download, ScrollText, ShieldAlert } from "lucide-react";
import type { Agent } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Identity } from "@/components/Identity";
import { AgentIcon } from "@/components/AgentIconPicker";
import { cn, relativeTime } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { formatActivityVerb } from "@/lib/activity-format";
import { buildCompanyUserProfileMap, type CompanyUserProfile } from "@/lib/company-members";
import { auditApi, type AuditActionRecord, type AuditActionFilters } from "@/api/audit";
import { agentsApi } from "@/api/agents";
import { accessApi } from "@/api/access";
import { ApiError } from "@/api/client";
import { useToastActions } from "@/context/ToastContext";
import { t, useTranslation } from "@/i18n";

const PAGE_SIZE = 50;
const ALL = "__all";

/** Action-domain prefixes offered in the filter (server does a prefix match). */
const ACTION_DOMAINS: { value: string; label: string }[] = [
  { value: ALL, label: "All actions" },
  { value: "issue.", label: "Tasks" },
  { value: "agent.", label: "Agents" },
  { value: "heartbeat.", label: "Runs" },
  { value: "approval.", label: "Approvals" },
  { value: "project.", label: "Projects" },
  { value: "goal.", label: "Goals" },
  { value: "tool_gateway.", label: "Tools" },
  { value: "cost.", label: "Costs" },
  { value: "company.", label: "Company" },
];

/** Entity types offered in the filter (server does an exact match). */
const ENTITY_TYPES: { value: string; label: string }[] = [
  { value: ALL, label: "All entities" },
  { value: "issue", label: "Task" },
  { value: "agent", label: "Agent" },
  { value: "project", label: "Project" },
  { value: "goal", label: "Goal" },
  { value: "company", label: "Company" },
];

function auditActionDomainLabel(value: string, fallback: string) {
  const key = value === ALL ? "allActions" : value === "issue." ? "tasks" : value === "agent." ? "agents" : value === "heartbeat." ? "runs" : value === "approval." ? "approvals" : value === "project." ? "projects" : value === "goal." ? "goals" : value === "tool_gateway." ? "tools" : value === "cost." ? "costs" : value === "company." ? "company" : null;
  return key ? t(`auditPage.${key}`) : fallback;
}

function auditEntityTypeLabel(value: string, fallback: string) {
  const key = value === ALL ? "allEntities" : value === "issue" ? "task" : value === "agent" ? "agent" : value === "project" ? "project" : value === "goal" ? "goal" : value === "company" ? "company" : null;
  return key ? t(`auditPage.${key}`) : fallback;
}

export interface AuditFeedProps {
  companyId: string;
  /**
   * When set, the feed is pinned to a single agent (per-agent Audit tab) — the
   * agent filter is hidden and every query/export carries this agentId.
   */
  lockedAgentId?: string;
  /** Hide the section header/description (the AgentDetail tab supplies its own chrome). */
  hideHeader?: boolean;
}

function toStartIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toEndIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Actor avatar + name — agents render their icon glyph, humans their avatar. */
function AuditActor({
  record,
  agentMap,
  userProfileMap,
}: {
  record: AuditActionRecord;
  agentMap: Map<string, Agent>;
  userProfileMap: Map<string, CompanyUserProfile>;
}) {
  const agent = record.agentId ? agentMap.get(record.agentId) : null;
  if (agent) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5" title={agent.name}>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <AgentIcon icon={agent.icon} className="h-3 w-3" />
        </span>
        <span className="truncate font-medium text-foreground">{agent.name}</span>
      </span>
    );
  }
  if (record.actorType === "user" && record.actorId) {
    const profile = userProfileMap.get(record.actorId);
    return (
      <Identity
        name={profile?.label ?? t("auditPage.user")}
        avatarUrl={profile?.image ?? null}
        size="sm"
        className="font-medium text-foreground"
      />
    );
  }
  const label = record.actorType === "plugin" ? t("auditPage.plugin") : t("auditPage.system");
  return <Identity name={label} size="sm" className="font-medium text-foreground" />;
}

/**
 * The clickable entity node inside the humanized sentence. The verb from
 * `formatActivityVerb` already encodes the relationship ("commented on",
 * "created document for", …) and expects the issue reference to follow it, so
 * this renders the task link (or a document/plain fallback) — never a phrase
 * that would duplicate the verb.
 */
function AuditEntityNode({ record }: { record: AuditActionRecord }) {
  const { issue, document } = record.entity;
  const issueRef = issue?.identifier ?? issue?.id ?? null;

  if (issueRef) {
    return (
      <Link to={`/issues/${issueRef}`} className="font-medium text-primary hover:underline">
        {issue?.identifier ? `${issue.identifier}${issue.title ? ` · ${issue.title}` : ""}` : t("auditPage.taskFallback")}
      </Link>
    );
  }
  if (document) {
    return <span className="font-medium text-foreground">{document.key}</span>;
  }
  // Non-linkable entities (company, agent, goal, …) — show a plain descriptor.
  return <span className="text-muted-foreground">{t("auditPage.entityTypeFallback")}</span>;
}

function AuditRow({
  record,
  agentMap,
  userProfileMap,
}: {
  record: AuditActionRecord;
  agentMap: Map<string, Agent>;
  userProfileMap: Map<string, CompanyUserProfile>;
}) {
  const verb = formatActivityVerb(record.action, record.details, { agentMap, userProfileMap });
  const responsible = record.responsibleUserId ? userProfileMap.get(record.responsibleUserId) : null;
  // Suppress the "on behalf of" chip when the human actor *is* the responsible user.
  const showOnBehalf = Boolean(
    record.responsibleUserId
      && !(record.actorType === "user" && record.actorId === record.responsibleUserId),
  );
  const responsibleLabel = responsible?.label ?? (record.responsibleUserId ? t("auditPage.aUser") : null);
  const excerpt = record.entity.comment?.excerpt?.trim();
  // Show the document key only when it isn't already the linked entity node.
  const documentKey = record.entity.issue && record.entity.document ? record.entity.document.key : null;

  return (
    <li className="px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-foreground">
            <AuditActor record={record} agentMap={agentMap} userProfileMap={userProfileMap} />
            <span className="text-muted-foreground">{verb}</span>
            <AuditEntityNode record={record} />
          </div>
          {excerpt ? (
            <p className="line-clamp-2 border-l-2 border-border pl-2 text-muted-foreground">
              “{excerpt}”
            </p>
          ) : null}
          {documentKey ? (
            <p className="text-xs text-muted-foreground">
              {t("auditPage.document")} <span className="font-mono text-(length:--text-micro)">{documentKey}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {showOnBehalf && responsibleLabel ? (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
                {t("auditPage.onBehalfOf", { name: responsibleLabel })}
              </span>
            ) : null}
            {record.runId && record.agentId ? (
              <Link
                to={`/agents/${record.agentId}/runs/${record.runId}`}
                className="text-primary hover:underline"
              >
                {t("auditPage.viewRun")}
              </Link>
            ) : null}
            <span className="font-mono text-(length:--text-micro) opacity-70">{record.action}</span>
          </div>
        </div>
        <time
          className="shrink-0 whitespace-nowrap text-xs text-muted-foreground"
          dateTime={record.createdAt}
          title={new Date(record.createdAt).toLocaleString()}
        >
          {relativeTime(record.createdAt)}
        </time>
      </div>
    </li>
  );
}

/** The permission-denied / upsell state shown when the caller lacks the grant. */
function AuditUpsell() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium text-foreground">{t("auditPage.agentEnterpriseTitle")}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t("auditPage.agentEnterpriseDescription")} {" "}
            <span className="font-mono text-(length:--text-micro)">audit:view_agent_actions</span>{" "}
            {t("auditPage.permission")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AuditFeed({ companyId, lockedAgentId, hideHeader }: AuditFeedProps) {
  const { t } = useTranslation();
  const { pushToast } = useToastActions();
  const [agent, setAgent] = useState<string>(ALL);
  const [responsibleUser, setResponsibleUser] = useState<string>(ALL);
  const [actionDomain, setActionDomain] = useState<string>(ALL);
  const [entityType, setEntityType] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  const agents = useQuery({
    queryKey: queryKeys.agents.list(companyId),
    queryFn: () => agentsApi.list(companyId),
  });
  const userDirectory = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(companyId),
    queryFn: () => accessApi.listUserDirectory(companyId),
    retry: false,
  });

  const agentMap = useMemo(
    () => new Map((agents.data ?? []).map((a) => [a.id, a])),
    [agents.data],
  );
  const userProfileMap = useMemo(
    () => buildCompanyUserProfileMap(userDirectory.data?.users),
    [userDirectory.data],
  );

  const filters: AuditActionFilters = {
    agentId: lockedAgentId ?? (agent === ALL ? undefined : agent),
    responsibleUserId: responsibleUser === ALL ? undefined : responsibleUser,
    action: actionDomain === ALL ? undefined : actionDomain,
    entityType: entityType === ALL ? undefined : entityType,
    from: toStartIso(dateFrom),
    to: toEndIso(dateTo),
  };

  const hasActiveFilters = Boolean(
    (!lockedAgentId && agent !== ALL)
      || responsibleUser !== ALL
      || actionDomain !== ALL
      || entityType !== ALL
      || dateFrom
      || dateTo,
  );

  const feed = useInfiniteQuery({
    queryKey: queryKeys.audit.agentActions(companyId, {
      agentId: filters.agentId,
      responsibleUserId: filters.responsibleUserId,
      action: filters.action,
      entityType: filters.entityType,
      from: filters.from,
      to: filters.to,
    }),
    queryFn: ({ pageParam }) =>
      auditApi.listAgentActions(companyId, { ...filters, limit: PAGE_SIZE, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    retry: (count, error) => !(error instanceof ApiError && error.status === 403) && count < 2,
  });

  const items = useMemo(
    () => feed.data?.pages.flatMap((page) => page.items) ?? [],
    [feed.data],
  );

  const permissionDenied = feed.error instanceof ApiError && feed.error.status === 403;

  const clearFilters = () => {
    setAgent(ALL);
    setResponsibleUser(ALL);
    setActionDomain(ALL);
    setEntityType(ALL);
    setDateFrom("");
    setDateTo("");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await auditApi.exportAgentActionsCsv(companyId, {
        agentId: filters.agentId,
        responsibleUserId: filters.responsibleUserId,
        action: filters.action,
        entityType: filters.entityType,
        from: filters.from,
        to: filters.to,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `agent-audit-${companyId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Browsers may read blob URLs lazily after click(), so keep the URL alive
      // long enough for the download to start.
      window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
      pushToast({ title: t("auditPage.auditExported"), body: t("auditPage.exportStarted"), tone: "success" });
    } catch (error) {
      pushToast({
        title: t("auditPage.exportFailed"),
        body: error instanceof Error ? error.message : t("auditPage.exportUnavailable"),
        tone: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  if (permissionDenied) {
    return <AuditUpsell />;
  }

  return (
    <div className="space-y-4">
      {!hideHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{t("auditPage.title")}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("auditPage.description")}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {!lockedAgentId ? (
          <Select value={agent} onValueChange={setAgent}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("auditPage.agent")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("auditPage.allAgents")}</SelectItem>
              {(agents.data ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Select value={responsibleUser} onValueChange={setResponsibleUser}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("auditPage.responsibleUser")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("auditPage.allResponsibleUsers")}</SelectItem>
            {(userDirectory.data?.users ?? []).map((u) => (
              <SelectItem key={u.principalId} value={u.principalId}>
                {u.user?.name ?? u.user?.email ?? u.principalId.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionDomain} onValueChange={setActionDomain}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t("auditPage.action")} />
          </SelectTrigger>
          <SelectContent>
            {ACTION_DOMAINS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {auditActionDomainLabel(d.value, d.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t("auditPage.entity")} />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {auditEntityTypeLabel(e.value, e.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          aria-label={t("auditPage.fromDate")}
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-36"
        />
        <Input
          type="date"
          aria-label={t("auditPage.toDate")}
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-36"
        />
        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t("auditPage.clearFilters")}
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={handleExport}
          disabled={exporting || feed.isLoading || items.length === 0}
        >
          <Download className="mr-1.5 h-4 w-4" />
          {exporting ? t("auditPage.exporting") : t("auditPage.exportCsv")}
        </Button>
      </div>

      {feed.isLoading ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">{t("auditPage.loading")}</CardContent>
        </Card>
      ) : feed.error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm text-muted-foreground">
              {feed.error instanceof Error ? feed.error.message : t("auditPage.loadFailed")}
            </p>
            <Button variant="outline" size="sm" onClick={() => feed.refetch()}>
              {t("auditPage.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {hasActiveFilters ? t("auditPage.noFilteredActions") : t("auditPage.nothingYet")}
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {hasActiveFilters
                  ? t("auditPage.widerFilters")
                  : t("auditPage.emptyDescription")}
              </p>
            </div>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {t("auditPage.clearFilters")}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0 py-0">
            <ul className={cn("divide-y divide-border")}>
              {items.map((record) => (
                <AuditRow
                  key={record.id}
                  record={record}
                  agentMap={agentMap}
                  userProfileMap={userProfileMap}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {feed.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => feed.fetchNextPage()}
            disabled={feed.isFetchingNextPage}
          >
            {feed.isFetchingNextPage ? t("auditPage.loading") : t("auditPage.loadMore")}
          </Button>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {t("auditPage.immutableNotice")}
      </p>
    </div>
  );
}
