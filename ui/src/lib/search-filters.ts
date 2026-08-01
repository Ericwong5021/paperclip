import {
  COMPANY_SEARCH_SORTS,
  type CompanySearchSort,
} from "@paperclipai/shared";
import { t } from "@/i18n";
import type { ParsedSearchQuery } from "./search-query-parser";

/**
 * The issue-scoped filter model for /search. This is the SAME shape the query
 * parser (search-query-parser.ts) and the URL round-trip already use — we build
 * the P2 filter-bar UI directly on top of it rather than inventing a second
 * scheme. `sort` lives alongside the filters but is tracked separately (it is not
 * part of the parser's filter set).
 */
export type SearchFilters = ParsedSearchQuery["filters"];

export const SORT_LABELS: Record<CompanySearchSort, string> = {
  relevance: "search.sort.relevance",
  updated: "search.sort.updated",
  created: "search.sort.created",
  priority: "search.sort.priority",
};

export function searchSortLabel(value: CompanySearchSort): string {
  return t(SORT_LABELS[value]);
}

const UPDATED_WITHIN_LABEL_KEYS: Record<string, string> = {
  "24h": "search.time.last24Hours",
  "7d": "search.time.last7Days",
  "30d": "search.time.last30Days",
  "90d": "search.time.last90Days",
};

export function updatedWithinLabel(value: string): string {
  const key = UPDATED_WITHIN_LABEL_KEYS[value];
  return key ? t(key) : t("search.filters.updatedAtMost", { value });
}

const SORT_SET = new Set<string>(COMPANY_SEARCH_SORTS);

export function parseSearchSort(params: URLSearchParams): CompanySearchSort {
  const raw = params.get("sort");
  return raw && SORT_SET.has(raw) ? (raw as CompanySearchSort) : "relevance";
}

/** Count active filter *dimensions* (assignee counts once regardless of shape). */
export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.status?.length) count += 1;
  if (filters.priority?.length) count += 1;
  if (filters.assigneeAgentId !== undefined || filters.assigneeUserId) count += 1;
  if (filters.projectId) count += 1;
  if (filters.labelId) count += 1;
  if (filters.updatedWithin || filters.updatedAfter) count += 1;
  return count;
}

// ---------------------------------------------------------------------------
// Assignee: the UI treats assignee as a single choice, but the wire model splits
// it across assigneeAgentId (string | null) and assigneeUserId (string). These
// helpers translate between a single opaque token and that split representation.
//   "me"          → assigneeUserId = currentUserId
//   "none"        → assigneeAgentId = null (unassigned)
//   "agent:<id>"  → assigneeAgentId
//   "user:<id>"   → assigneeUserId
// ---------------------------------------------------------------------------

export function assigneeToken(filters: SearchFilters, currentUserId: string | null): string | undefined {
  if (filters.assigneeAgentId === null) return "none";
  if (typeof filters.assigneeAgentId === "string") return `agent:${filters.assigneeAgentId}`;
  if (filters.assigneeUserId) {
    return filters.assigneeUserId === currentUserId ? "me" : `user:${filters.assigneeUserId}`;
  }
  return undefined;
}

export function applyAssigneeToken(
  filters: SearchFilters,
  token: string | undefined,
  currentUserId: string | null,
): SearchFilters {
  const next: SearchFilters = { ...filters };
  delete next.assigneeAgentId;
  delete next.assigneeUserId;
  if (!token) return next;
  if (token === "none") {
    next.assigneeAgentId = null;
  } else if (token === "me") {
    if (currentUserId) next.assigneeUserId = currentUserId;
  } else if (token.startsWith("agent:")) {
    next.assigneeAgentId = token.slice("agent:".length);
  } else if (token.startsWith("user:")) {
    next.assigneeUserId = token.slice("user:".length);
  }
  return next;
}

export interface FilterChipLookups {
  agentName: (id: string) => string | undefined;
  userName: (id: string) => string | undefined;
  projectName: (id: string) => string | undefined;
  labelName: (id: string) => string | undefined;
  currentUserId: string | null;
}

export interface FilterChip {
  id: string;
  label: string;
  remove: (filters: SearchFilters) => SearchFilters;
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  backlog: "search.values.status.backlog",
  todo: "search.values.status.todo",
  in_progress: "search.values.status.inProgress",
  in_review: "search.values.status.inReview",
  blocked: "search.values.status.blocked",
  done: "search.values.status.done",
  cancelled: "search.values.status.cancelled",
};

const PRIORITY_LABEL_KEYS: Record<string, string> = {
  critical: "search.values.priority.critical",
  high: "search.values.priority.high",
  medium: "search.values.priority.medium",
  low: "search.values.priority.low",
};

const FILTER_DIMENSION_LABEL_KEYS: Record<string, string> = {
  status: "search.filters.status",
  priority: "search.filters.priority",
  assignee: "search.filters.assignee",
  assigneeAgentId: "search.filters.assignee",
  assigneeUserId: "search.filters.assignee",
  project: "search.filters.project",
  projectId: "search.filters.project",
  label: "search.filters.label",
  labelId: "search.filters.label",
  updated: "search.filters.updated",
  updatedWithin: "search.filters.updated",
  updatedAfter: "search.filters.updated",
};

function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function searchStatusLabel(value: string): string {
  return STATUS_LABEL_KEYS[value] ? t(STATUS_LABEL_KEYS[value]) : humanize(value);
}

export function searchPriorityLabel(value: string): string {
  return PRIORITY_LABEL_KEYS[value] ? t(PRIORITY_LABEL_KEYS[value]) : humanize(value);
}

function searchFilterDimensionLabel(value: string): string {
  const key = FILTER_DIMENSION_LABEL_KEYS[value];
  return key ? t(key) : humanize(value);
}

function assigneeChipLabel(filters: SearchFilters, lookups: FilterChipLookups): string {
  if (filters.assigneeAgentId === null) return t("search.values.unassigned");
  if (typeof filters.assigneeAgentId === "string") {
    return lookups.agentName(filters.assigneeAgentId) ?? t("search.values.agent");
  }
  if (filters.assigneeUserId) {
    if (filters.assigneeUserId === lookups.currentUserId) return t("search.values.me");
    return lookups.userName(filters.assigneeUserId) ?? t("search.values.user");
  }
  return t("search.filters.assignee");
}

/** Removable chip descriptors for the active-filter row. */
export function buildFilterChips(filters: SearchFilters, lookups: FilterChipLookups): FilterChip[] {
  const chips: FilterChip[] = [];
  for (const status of filters.status ?? []) {
    chips.push({
      id: `status:${status}`,
      label: t("search.filters.chip", { label: t("search.filters.status"), value: searchStatusLabel(status) }),
      remove: (current) => {
        const next = { ...current };
        const remaining = (current.status ?? []).filter((value) => value !== status);
        if (remaining.length > 0) next.status = remaining;
        else delete next.status;
        return next;
      },
    });
  }
  for (const priority of filters.priority ?? []) {
    chips.push({
      id: `priority:${priority}`,
      label: t("search.filters.chip", { label: t("search.filters.priority"), value: searchPriorityLabel(priority) }),
      remove: (current) => {
        const next = { ...current };
        const remaining = (current.priority ?? []).filter((value) => value !== priority);
        if (remaining.length > 0) next.priority = remaining;
        else delete next.priority;
        return next;
      },
    });
  }
  if (filters.assigneeAgentId !== undefined || filters.assigneeUserId) {
    chips.push({
      id: "assignee",
      label: t("search.filters.chip", { label: t("search.filters.assignee"), value: assigneeChipLabel(filters, lookups) }),
      remove: (current) => {
        const next = { ...current };
        delete next.assigneeAgentId;
        delete next.assigneeUserId;
        return next;
      },
    });
  }
  if (filters.projectId) {
    chips.push({
      id: "project",
      label: t("search.filters.chip", { label: t("search.filters.project"), value: lookups.projectName(filters.projectId) ?? t("search.filters.project") }),
      remove: (current) => {
        const next = { ...current };
        delete next.projectId;
        return next;
      },
    });
  }
  if (filters.labelId) {
    chips.push({
      id: "label",
      label: t("search.filters.chip", { label: t("search.filters.label"), value: lookups.labelName(filters.labelId) ?? t("search.filters.label") }),
      remove: (current) => {
        const next = { ...current };
        delete next.labelId;
        return next;
      },
    });
  }
  if (filters.updatedWithin) {
    chips.push({
      id: "updated",
      label: t("search.filters.chip", { label: t("search.filters.updated"), value: updatedWithinLabel(filters.updatedWithin) }),
      remove: (current) => {
        const next = { ...current };
        delete next.updatedWithin;
        delete next.updatedAfter;
        return next;
      },
    });
  }
  return chips;
}

/** Human label for a backend zero-results loosen suggestion. */
export function describeLoosenSuggestion(filterKey: string, values: string[], lookups: FilterChipLookups): string {
  switch (filterKey) {
    case "status":
      return t("search.filters.chip", { label: t("search.filters.status"), value: values.map(searchStatusLabel).join(", ") });
    case "priority":
      return t("search.filters.chip", { label: t("search.filters.priority"), value: values.map(searchPriorityLabel).join(", ") });
    case "assigneeAgentId":
      return t("search.filters.chip", { label: t("search.filters.assignee"), value: values.map((id) => lookups.agentName(id) ?? t("search.values.agent")).join(", ") });
    case "assigneeUserId":
      return t("search.filters.chip", { label: t("search.filters.assignee"), value: values.map((id) => (id === lookups.currentUserId ? t("search.values.me") : lookups.userName(id) ?? t("search.values.user"))).join(", ") });
    case "projectId":
      return t("search.filters.chip", { label: t("search.filters.project"), value: values.map((id) => lookups.projectName(id) ?? t("search.filters.project")).join(", ") });
    case "labelId":
      return t("search.filters.chip", { label: t("search.filters.label"), value: values.map((id) => lookups.labelName(id) ?? t("search.filters.label")).join(", ") });
    case "updatedWithin":
    case "updatedAfter":
      return t("search.filters.updatedWindow");
    default:
      return searchFilterDimensionLabel(filterKey);
  }
}

/** Clear the filter dimension a loosen suggestion refers to. */
export function clearFilterDimension(filters: SearchFilters, filterKey: string): SearchFilters {
  const next: SearchFilters = { ...filters };
  switch (filterKey) {
    case "status":
      delete next.status;
      break;
    case "priority":
      delete next.priority;
      break;
    case "assigneeAgentId":
    case "assigneeUserId":
      delete next.assigneeAgentId;
      delete next.assigneeUserId;
      break;
    case "projectId":
      delete next.projectId;
      break;
    case "labelId":
      delete next.labelId;
      break;
    case "updatedWithin":
    case "updatedAfter":
      delete next.updatedWithin;
      delete next.updatedAfter;
      break;
    default:
      break;
  }
  return next;
}
