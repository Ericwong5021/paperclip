import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { useCompany } from "../../context/CompanyContext";
import { useBreadcrumbs } from "../../context/BreadcrumbContext";
import { EmptyState } from "../../components/EmptyState";
import { AuditFeed } from "./AuditFeed";
import { t, useTranslation } from "../../i18n";

/**
 * Company-level agent audit page — a permission-gated
 * rich view in the unified codebase, matching the `tools:view_audit` precedent.
 * The feed itself renders the upsell/permission-denied state when the caller
 * lacks `audit:view_agent_actions` (server-authoritative, see `AuditFeed`).
 */
export function CompanyAudit() {
  const { t: translate } = useTranslation();
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: translate("auditPage.title") }]);
  }, [setBreadcrumbs, translate]);

  if (!selectedCompanyId) {
    return <EmptyState icon={ShieldCheck} message={t("auditPage.selectCompany")} />;
  }

  return <AuditFeed companyId={selectedCompanyId} />;
}
