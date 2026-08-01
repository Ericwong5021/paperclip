export const routinesStatusLocaleMessages = {
  en: {
    routinesStatus: {
      managed: {
        empty: "No managed routines.", configure: "Configure", managedBy: "Managed by {{name}}",
        schedule: "Schedule {{cron}}", missing: "Missing {{refs}}", repairDefaults: "Routine defaults can be repaired.",
        reconciling: "Reconciling…", reconcile: "Reconcile", resetting: "Resetting…", reset: "Reset",
      },
      resource: {
        ready: { label: "Ready", title: "Materialized and matches the shipped default" },
        needs_setup: { label: "Needs setup", title: "Present but not usable yet" },
        missing: { label: "Missing", title: "Expected resource absent; reconcile will recreate it" },
        error: { label: "Error", title: "Failed to load or reconcile" },
        update_available: { label: "Update available", title: "Unedited — a newer shipped default can be applied" },
        drifted: { label: "Drifted", title: "You've edited this; your changes are kept, not overwritten" },
        schedule_off: { label: "Schedule off", title: "No background work runs until you enable it — costs zero tokens" },
        schedule_on: { label: "Weekly", title: "Runs on the weekly schedule" },
        pending_approval: { label: "Pending approval", title: "Waiting on board hire approval before it can run" },
        proposal_pending: { label: "Proposal pending", title: "A proposed update is waiting for your review" },
      },
      external: {
        objects: "External objects", total: "{{count}} total", stale: "{{count}} stale",
        liveness: { stale: "stale", fresh: "fresh", unknown: "unknown" },
        category: { unknown: "unknown", running: "running" },
      },
      status: {
        active: "Active", archived: "Archived", draft: "Draft", enabled: "Enabled", disabled: "Disabled",
        paused: "Paused", running: "Running", queued: "Queued", pending: "Pending", succeeded: "Succeeded",
        failed: "Failed", cancelled: "Cancelled", error: "Error", unknown: "Unknown",
      },
    },
  },
  "zh-CN": {
    routinesStatus: {
      managed: {
        empty: "暂无托管例行任务。", configure: "配置", managedBy: "由 {{name}} 管理",
        schedule: "计划 {{cron}}", missing: "缺少 {{refs}}", repairDefaults: "可以修复例行任务默认值。",
        reconciling: "正在重新协调…", reconcile: "重新协调", resetting: "正在重置…", reset: "重置",
      },
      resource: {
        ready: { label: "就绪", title: "已物化，并与当前发布的默认值一致" },
        needs_setup: { label: "需要设置", title: "资源存在，但尚不可用" },
        missing: { label: "缺失", title: "预期资源不存在；重新协调会重建它" },
        error: { label: "错误", title: "加载或重新协调失败" },
        update_available: { label: "有可用更新", title: "未编辑过；可以应用更新的默认值" },
        drifted: { label: "已偏离", title: "你编辑过此项；会保留你的改动，不会覆盖" },
        schedule_off: { label: "计划已关闭", title: "启用前不会运行后台任务，不消耗 Token" },
        schedule_on: { label: "每周", title: "按每周计划运行" },
        pending_approval: { label: "等待审批", title: "等待看板批准后才能运行" },
        proposal_pending: { label: "提案待处理", title: "有一项拟议更新等待审核" },
      },
      external: {
        objects: "外部对象", total: "共 {{count}} 个", stale: "{{count}} 个已过期",
        liveness: { stale: "已过期", fresh: "最新", unknown: "未知" },
        category: { unknown: "未知", running: "运行中" },
      },
      status: {
        active: "活跃", archived: "已归档", draft: "草稿", enabled: "已启用", disabled: "已停用", paused: "已暂停",
        running: "运行中", queued: "排队中", pending: "待处理", succeeded: "成功", failed: "失败", cancelled: "已取消",
        error: "错误", unknown: "未知",
      },
    },
  },
} as const;
