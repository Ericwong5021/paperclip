type CatalogLocale = "en" | "zh-CN";

const messages = {
  en: {
    app: "App",
    tabs: {
      setup: "Setup",
      review: "Review",
      permissions: "Permissions",
      activity: "Activity",
      test: "Test",
      advanced: "Advanced",
    },
    gatewayTabs: {
      overview: "Overview",
      apps: "Apps & tools",
      tokens: "Tokens",
      activity: "Activity",
      advanced: "Advanced",
    },
    officialApps: {
      zapier: { name: "Zapier", description: "Connect Zapier MCP tools to your agents." },
      github: { name: "GitHub", description: "Let agents work with repositories, issues, and pull requests." },
      slack: { name: "Slack", description: "Let agents read and send messages in Slack." },
      notion: { name: "Notion", description: "Let agents search and update your Notion workspace." },
      linear: { name: "Linear", description: "Let agents manage Linear issues and projects." },
      "google-sheets": { name: "Google Sheets", description: "Let agents read and update shared Google Sheets." },
      context7: { name: "Context7", description: "Give agents current library documentation and examples." },
    },
  },
  "zh-CN": {
    app: "应用",
    tabs: {
      setup: "设置",
      review: "审核",
      permissions: "权限",
      activity: "活动",
      test: "测试",
      advanced: "高级",
    },
    gatewayTabs: {
      overview: "概览",
      apps: "应用与工具",
      tokens: "令牌",
      activity: "活动",
      advanced: "高级",
    },
    officialApps: {
      zapier: { name: "Zapier", description: "连接 Zapier MCP 工具，让 Agent 可以使用。" },
      github: { name: "GitHub", description: "让 Agent 使用代码仓库、Issue 和 Pull Request。" },
      slack: { name: "Slack", description: "让 Agent 在 Slack 中读取和发送消息。" },
      notion: { name: "Notion", description: "让 Agent 搜索并更新 Notion 工作区。" },
      linear: { name: "Linear", description: "让 Agent 管理 Linear Issue 和项目。" },
      "google-sheets": { name: "Google Sheets", description: "让 Agent 读取和更新共享的 Google 表格。" },
      context7: { name: "Context7", description: "为 Agent 提供最新的库文档和示例。" },
    },
  },
} as const;

function locale(): CatalogLocale {
  try {
    const stored = window.localStorage.getItem("paperclip.locale");
    if (stored === "zh-CN") return "zh-CN";
  } catch {
  }
  return typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh")
    ? "zh-CN"
    : "en";
}

export function appsCatalogT<K extends keyof typeof messages.en>(key: K): (typeof messages.en)[K] {
  return messages[locale()][key] as (typeof messages.en)[K];
}

export type OfficialAppSlug = keyof typeof messages.en.officialApps;

export function officialAppMetadata(slug: string | null | undefined) {
  if (!slug || !(slug in messages.en.officialApps)) return null;
  const key = slug as OfficialAppSlug;
  return messages[locale()].officialApps[key];
}
