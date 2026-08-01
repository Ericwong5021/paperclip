import { Database, Gauge, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/i18n";

export function AccountingModelCard() {
  const { t } = useTranslation();
  const surfaces = [
    {
      title: t("costsResidual.accounting.inferenceLedger"),
      description: t("costsResidual.accounting.inferenceDescription"),
      icon: Database,
      points: [t("costsResidual.accounting.inferenceTokens"), t("costsResidual.accounting.providerBillerModel"), t("costsResidual.accounting.subscriptionOverage")],
      tone: "from-sky-500/12 via-sky-500/6 to-transparent",
    },
    {
      title: t("costsResidual.accounting.financeLedger"),
      description: t("costsResidual.accounting.financeDescription"),
      icon: ReceiptText,
      points: [t("costsResidual.accounting.financeTopUps"), t("costsResidual.accounting.financeBedrock"), t("costsResidual.accounting.financeAdjustments")],
      tone: "from-amber-500/14 via-amber-500/6 to-transparent",
    },
    {
      title: t("costsResidual.accounting.liveQuotas"),
      description: t("costsResidual.accounting.liveQuotasDescription"),
      icon: Gauge,
      points: [t("costsResidual.accounting.providerWindows"), t("costsResidual.accounting.billerSystems"), t("costsResidual.accounting.errorsDirectly")],
      tone: "from-emerald-500/14 via-emerald-500/6 to-transparent",
    },
  ];
  return (
    <Card className="relative overflow-hidden border-border/70">
      <div className="absolute inset-0 bg-(image:--gradient-extract-3)" />
      <CardHeader className="relative px-5 pt-5 pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
          {t("costsResidual.accounting.model")}
        </CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6">
          {t("costsResidual.accounting.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative grid gap-3 px-5 pb-5 md:grid-cols-3">
        {surfaces.map((surface) => {
          const Icon = surface.icon;
          return (
            <div
              key={surface.title}
              className={`rounded-2xl border border-border/70 bg-gradient-to-br ${surface.tone} p-4 shadow-sm`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{surface.title}</div>
                  <div className="text-xs text-muted-foreground">{surface.description}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {surface.points.map((point) => (
                  <div key={point}>{point}</div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
