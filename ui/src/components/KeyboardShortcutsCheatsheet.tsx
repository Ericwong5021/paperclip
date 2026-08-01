import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "../i18n";

interface ShortcutEntry {
  keys: string[];
  labelKey: string;
  /** Render keys as a simultaneous chord (joined with "+") rather than a
   *  "then" sequence. */
  combo?: boolean;
}

// Platform-appropriate label for the Cmd/Ctrl modifier so the cheatsheet shows
// the same key the user actually presses (re-pointed in the collapsible sidebar
// work — Cmd/Ctrl+B toggles the rail).
function getPlatformLabel() {
  if (typeof navigator === "undefined") return "";
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return nav.userAgentData?.platform || navigator.userAgent || "";
}

const META_KEY = /Mac|iPhone|iPad|iPod/.test(getPlatformLabel()) ? "⌘" : "Ctrl";

interface ShortcutSection {
  titleKey: string;
  shortcuts: ShortcutEntry[];
}

const sections: ShortcutSection[] = [
  {
    titleKey: "inbox",
    shortcuts: [
      { keys: ["j"], labelKey: "moveDown" },
      { keys: ["↓"], labelKey: "moveDown" },
      { keys: ["k"], labelKey: "moveUp" },
      { keys: ["↑"], labelKey: "moveUp" },
      { keys: ["←"], labelKey: "collapseGroup" },
      { keys: ["→"], labelKey: "expandGroup" },
      { keys: ["Enter"], labelKey: "openItem" },
      { keys: ["a"], labelKey: "archiveItem" },
      { keys: ["y"], labelKey: "archiveItem" },
      { keys: ["r"], labelKey: "markRead" },
      { keys: ["U"], labelKey: "markUnread" },
    ],
  },
  {
    titleKey: "taskDetail",
    shortcuts: [
      { keys: ["y"], labelKey: "archiveToInbox" },
      { keys: ["g", "i"], labelKey: "goInbox" },
      { keys: ["g", "c"], labelKey: "focusComment" },
    ],
  },
  {
    titleKey: "decisions",
    shortcuts: [
      { keys: ["j"], labelKey: "moveDown" },
      { keys: ["↓"], labelKey: "moveDown" },
      { keys: ["k"], labelKey: "moveUp" },
      { keys: ["↑"], labelKey: "moveUp" },
      { keys: ["Enter"], labelKey: "toggleDecision" },
      { keys: ["x"], labelKey: "dismissDecision" },
    ],
  },
  {
    titleKey: "global",
    shortcuts: [
      { keys: ["/"], labelKey: "search" },
      { keys: ["c"], labelKey: "newTask" },
      { keys: ["["], labelKey: "toggleSidebar" },
      { keys: [META_KEY, "B"], labelKey: "collapseSidebar", combo: true },
      { keys: ["]"], labelKey: "togglePanel" },
      { keys: ["?"], labelKey: "showShortcuts" },
    ],
  },
];

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-foreground shadow-(--shadow-extract-10)">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsCheatsheetContent() {
  const { t } = useTranslation();
  return (
    <>
      <div className="divide-y divide-border border-t border-border">
        {sections.map((section) => (
          <div key={section.titleKey} className="px-5 py-3">
            <h3 className="mb-2 text-(length:--text-micro) font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`commonComponents.shortcuts.sections.${section.titleKey}`)}
            </h3>
            <div className="space-y-1.5">
              {section.shortcuts.map((shortcut, shortcutIndex) => (
                <div
                  key={`${shortcut.labelKey}-${shortcut.keys.join()}-${shortcutIndex}`}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-foreground/90">{t(`commonComponents.shortcuts.actions.${shortcut.labelKey}`)}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={key} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {shortcut.combo ? "+" : t("commonComponents.shortcuts.then")}
                          </span>
                        )}
                        <KeyCap>{key}</KeyCap>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {t("commonComponents.shortcuts.press")} <KeyCap>Esc</KeyCap> {t("commonComponents.shortcuts.closeHint")}
        </p>
      </div>
    </>
  );
}

export function KeyboardShortcutsCheatsheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">{t("commonComponents.shortcuts.title")}</DialogTitle>
        </DialogHeader>
        <KeyboardShortcutsCheatsheetContent />
      </DialogContent>
    </Dialog>
  );
}
