const en = {
  workflowResidual: {
    stageSecrets: {
      unavailable: "Secrets are available only to step automation. Pick an agent to run this step, then add the secrets it needs.",
      setupAutomation: "Set up automation",
      responsibleAgent: "the responsible agent",
      injectionBefore: "These environment variables are injected when",
      injectionAfter: "runs this step. They override matching project and agent environment variables when names collide.",
      reservedNames: "names are reserved.",
      loading: "Loading secrets…",
      saving: "Saving…",
      save: "Save secrets",
      unsaved: "Unsaved changes",
    },
    worktree: {
      label: "Worktree",
      copyTitle: "Click to copy worktree name",
      copied: "Copied!",
    },
    references: {
      added: "Added references",
      removed: "Removed references",
    },
  },
} as const;

const zhCN = {
  workflowResidual: {
    stageSecrets: {
      unavailable: "密钥仅能提供给步骤自动化。请先选择运行此步骤的 Agent，再添加它所需的密钥。",
      setupAutomation: "设置自动化",
      responsibleAgent: "负责此步骤的 Agent",
      injectionBefore: "运行此步骤时，以下环境变量会注入到",
      injectionAfter: "。若名称冲突，它们会覆盖项目和 Agent 中的同名环境变量。",
      reservedNames: "名称为系统保留。",
      loading: "正在加载密钥…",
      saving: "正在保存…",
      save: "保存密钥",
      unsaved: "有未保存的更改",
    },
    worktree: {
      label: "工作树",
      copyTitle: "点击复制工作树名称",
      copied: "已复制！",
    },
    references: {
      added: "新增引用",
      removed: "移除引用",
    },
  },
} as const;

export const workflowResidualLocaleMessages = { en, "zh-CN": zhCN } as const;
