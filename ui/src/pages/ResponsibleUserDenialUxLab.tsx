import type { ReactNode } from "react";
import { ResponsibleUserDenialNotice } from "@/components/ResponsibleUserDenialNotice";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

function LabSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="rounded-2xl border border-border/70 bg-background/85 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function BeforeAfter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-label={label} className="space-y-2">
      <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
        {label}
      </div>
      <Card className="block border-border/60 p-3">{children}</Card>
    </div>
  );
}

function RunLedgerRow({
  onBehalfOf,
  denial,
  t,
}: {
  onBehalfOf?: string | null;
  denial?: ReactNode;
  t: (key: string) => string;
}) {
  return (
    <article aria-label={t("bootstrapResponsibleLab.responsible.runIdentityAria")} className="space-y-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium text-foreground">{t("bootstrapResponsibleLab.responsible.run")}</span>
        <span className="min-w-0 max-w-full truncate font-mono text-foreground">a1b2c3d4</span>
        <span>{t("bootstrapResponsibleLab.responsible.by")} CodexCoder</span>
        {onBehalfOf ? (
          <span className="min-w-0 max-w-full truncate text-muted-foreground">
            {t("bootstrapResponsibleLab.responsible.onBehalfOf")} <span className="text-foreground">{onBehalfOf}</span>
          </span>
        ) : null}
        <span className="rounded-md border border-border px-1.5 py-0.5 text-(length:--text-micro) capitalize text-muted-foreground">
          {denial ? t("bootstrapResponsibleLab.responsible.failed") : t("bootstrapResponsibleLab.responsible.succeeded")}
        </span>
        <span className="ml-auto shrink-0">2m ago</span>
      </div>
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div className="min-w-0"><span className="text-foreground">{t("bootstrapResponsibleLab.responsible.elapsed")}</span> 1m 4s</div>
        <div className="min-w-0"><span className="text-foreground">{t("bootstrapResponsibleLab.responsible.lastUsefulAction")}</span> 2m ago</div>
        <div className="min-w-0"><span className="text-foreground">{t("bootstrapResponsibleLab.responsible.stop")}</span> {denial ? t("bootstrapResponsibleLab.responsible.denied") : t("bootstrapResponsibleLab.responsible.completed")}</div>
      </div>
      {denial}
    </article>
  );
}

function RunDetailHeader({
  onBehalfOf,
  denial,
  t,
}: {
  onBehalfOf?: string | null;
  denial?: ReactNode;
  t: (key: string) => string;
}) {
  return (
    <div aria-label={t("bootstrapResponsibleLab.responsible.runIdentityAria")} className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-foreground">{t("bootstrapResponsibleLab.responsible.run")} a1b2c3d4</span>
        <span className="rounded-md border border-border px-1.5 py-0.5 text-(length:--text-micro) capitalize text-muted-foreground">
          {denial ? t("bootstrapResponsibleLab.responsible.failedLower") : t("bootstrapResponsibleLab.responsible.succeededLower")}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-(length:--text-micro) text-muted-foreground">
        <span title={t("bootstrapResponsibleLab.responsible.codexLocal")} className="rounded bg-muted px-1.5 py-0.5 text-(length:--text-nano) font-medium uppercase tracking-wide">
          {t("bootstrapResponsibleLab.responsible.codexLocal")}
        </span>
        <span>{t("bootstrapResponsibleLab.responsible.anthropicModel")}</span>
      </div>
      {onBehalfOf ? (
        <div className="text-xs text-muted-foreground">
          {t("bootstrapResponsibleLab.responsible.onBehalfOfLabel")} <span className="text-foreground">{onBehalfOf}</span>
        </div>
      ) : null}
      {denial}
    </div>
  );
}

export function ResponsibleUserDenialUxLab() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <div className="text-(length:--text-micro) font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">{t("bootstrapResponsibleLab.responsible.issueReference")}</div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">{t("bootstrapResponsibleLab.responsible.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("bootstrapResponsibleLab.responsible.description")}</p>
        </header>

        <LabSection title={t("bootstrapResponsibleLab.responsible.identityTitle")} description={t("bootstrapResponsibleLab.responsible.identityDescription")}>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.beforeRunLedger")}><RunLedgerRow t={t} /></BeforeAfter>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.afterRunLedger")}><RunLedgerRow t={t} onBehalfOf="Ada Lovelace" /></BeforeAfter>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.beforeRunDetail")}><RunDetailHeader t={t} /></BeforeAfter>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.afterRunDetail")}><RunDetailHeader t={t} onBehalfOf="Ada Lovelace" /></BeforeAfter>
        </LabSection>

        <LabSection title={t("bootstrapResponsibleLab.responsible.denialUnauthorizedTitle")} description={t("bootstrapResponsibleLab.responsible.denialUnauthorizedDescription")}>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.beforeGenericFailure")}>
            <div aria-label={t("bootstrapResponsibleLab.responsible.unauthorizedDenialAria")} className="text-xs">
              <span className="text-red-600 dark:text-red-400">{t("bootstrapResponsibleLab.responsible.genericForbidden")}</span>
              <span className="ml-1 text-muted-foreground">({t("bootstrapResponsibleLab.responsible.unauthorizedCode")})</span>
            </div>
          </BeforeAfter>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.afterActionableDenial")}>
            <ResponsibleUserDenialNotice code="RESPONSIBLE_USER_UNAUTHORIZED" userName="Ada Lovelace" />
          </BeforeAfter>
        </LabSection>

        <LabSection title={t("bootstrapResponsibleLab.responsible.agentDeniedTitle")} description={t("bootstrapResponsibleLab.responsible.agentDeniedDescription")}>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.agentFailure")}>
            <div aria-label={t("bootstrapResponsibleLab.responsible.agentDenialAria")} className="text-xs">
              <span className="text-red-600 dark:text-red-400">{t("bootstrapResponsibleLab.responsible.agentForbidden")}</span>
              <span className="ml-1 text-muted-foreground">({t("bootstrapResponsibleLab.responsible.missingMembershipCode")})</span>
            </div>
          </BeforeAfter>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.noResponsibleNotice")}>
            <div className="text-xs text-muted-foreground">{t("bootstrapResponsibleLab.responsible.absentNotice")}</div>
          </BeforeAfter>
        </LabSection>

        <LabSection title={t("bootstrapResponsibleLab.responsible.unavailableTitle")} description={t("bootstrapResponsibleLab.responsible.unavailableDescription")}>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.beforeGenericFailure")}>
            <div aria-label={t("bootstrapResponsibleLab.responsible.unavailableDenialAria")} className="text-xs">
              <span className="text-red-600 dark:text-red-400">{t("bootstrapResponsibleLab.responsible.unavailableFailure")}</span>
              <span className="ml-1 text-muted-foreground">({t("bootstrapResponsibleLab.responsible.unavailableCode")})</span>
            </div>
          </BeforeAfter>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.afterActionableDenial")}>
            <ResponsibleUserDenialNotice code="RESPONSIBLE_USER_UNAVAILABLE" userName="Grace Hopper" />
          </BeforeAfter>
        </LabSection>

        <LabSection title={t("bootstrapResponsibleLab.responsible.contextTitle")} description={t("bootstrapResponsibleLab.responsible.contextDescription")}>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.unauthorized")}>
            <RunLedgerRow t={t} onBehalfOf="Ada Lovelace" denial={<ResponsibleUserDenialNotice code="RESPONSIBLE_USER_UNAUTHORIZED" userName="Ada Lovelace" />} />
          </BeforeAfter>
          <BeforeAfter label={t("bootstrapResponsibleLab.responsible.unavailable")}>
            <RunLedgerRow t={t} onBehalfOf="Grace Hopper" denial={<ResponsibleUserDenialNotice code="RESPONSIBLE_USER_UNAVAILABLE" userName="Grace Hopper" />} />
          </BeforeAfter>
        </LabSection>

        <p className={cn("text-center text-(length:--text-micro) text-muted-foreground")}>
          {t("bootstrapResponsibleLab.responsible.copySource")} <code title={t("bootstrapResponsibleLab.responsible.copyContract")}>{t("bootstrapResponsibleLab.responsible.copyContract")}</code> contract.
        </p>
      </div>
    </div>
  );
}
