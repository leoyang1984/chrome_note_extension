# Chrome笔记扩展 - Logseq集成项目概要

## 项目目标
为现有的Chrome笔记扩展添加一键保存到Logseq的功能，实现浏览器内容快速保存到个人知识管理系统。

## 核心功能
- 在Chrome侧边栏中编辑Markdown笔记
- 支持保存为本地文件或一键保存到Logseq
- 自动获取当前网页信息作为笔记元数据
- 集成AI助手功能（DeepSeek、Grok、Gemini）

## Logseq集成特性
- 使用Logseq HTTP API进行通信
- 自动保存到当日日志页面（格式：Sep 2nd, 2025）
- 包含完整的frontmatter元数据
- 安全的API token认证机制
