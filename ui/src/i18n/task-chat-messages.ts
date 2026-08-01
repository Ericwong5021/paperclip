const en = {
  taskChat: {
    tools: {
      runningCommand: "Running a command",
      searching: "Searching",
      readingFiles: "Reading files",
      editingFiles: "Editing files",
      fetchingWeb: "Fetching the web",
      delegating: "Delegating",
      working: "Working",
      using: "Using {{name}}",
      generic: "Tool",
    },
    status: {
      responding: "Responding",
      thinking: "Thinking",
      running: "Running",
      thoughtFor: "Thought for {{duration}}",
    },
  },
} as const;

const zhCN = {
  taskChat: {
    tools: {
      runningCommand: "正在运行命令",
      searching: "正在搜索",
      readingFiles: "正在读取文件",
      editingFiles: "正在编辑文件",
      fetchingWeb: "正在获取网页内容",
      delegating: "正在委派",
      working: "工作中",
      using: "正在使用 {{name}}",
      generic: "工具",
    },
    status: {
      responding: "正在回复",
      thinking: "思考中",
      running: "运行中",
      thoughtFor: "思考了 {{duration}}",
    },
  },
} as const;

export const taskChatLocaleMessages = { en, "zh-CN": zhCN } as const;
