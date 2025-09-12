# 简易笔记 Chrome 扩展

一个简洁的Chrome扩展，用于在侧边栏中快速记录笔记并保存为Markdown文件。

## 功能特性

- 🎯 **侧边栏笔记**：点击扩展图标打开侧边栏，不影响当前页面
- 📝 **Markdown格式**：笔记保存为标准Markdown格式
- 💾 **下载保存**：通过浏览器下载功能保存笔记文件
- 🏷️ **自动元数据**：自动生成包含页面信息的YAML frontmatter
- ⚡ **简洁界面**：专注于记录功能的简洁设计
- 🔗 **完美兼容**：与Obsidian、Logseq等笔记工具无缝集成

## 安装和使用

### 开发者模式安装

1. 打开Chrome浏览器，进入扩展管理页面：`chrome://extensions/`
2. 开启右上角的"开发者模式"开关
3. 点击"加载已解压的扩展程序"按钮
4. 选择本项目文件夹
5. 扩展将被加载并可以使用

### 使用方法

1. 点击扩展图标打开侧边栏
2. 输入笔记标题和内容
3. 点击"保存笔记"或使用Ctrl/Cmd+S快捷键保存
4. 通过浏览器下载对话框选择保存位置
5. 笔记将保存为Markdown文件到指定位置

## 文件结构

```
chrome-note-extension/
├── manifest.json          # 扩展配置文件
├── icons/                 # 扩展图标（需要添加）
│   ├── icon16.png        # 16x16图标
│   ├── icon32.png        # 32x32图标
│   ├── icon48.png        # 48x48图标
│   └── icon128.png       # 128x128图标
├── src/                  # 源代码目录
│   ├── background.js     # 后台服务工作者
│   ├── sidepanel.html    # 侧边栏界面
│   ├── sidepanel.css     # 侧边栏样式
│   ├── sidepanel.js      # 侧边栏主逻辑
│   ├── fileHandler.js    # 文件处理模块
│   └── utils.js          # 工具函数模块
├── memory-bank/          # 项目文档
│   ├── projectbrief.md   # 项目概要
│   ├── productContext.md # 产品上下文
│   ├── activeContext.md  # 当前工作焦点
│   ├── systemPatterns.md # 系统架构
│   ├── techContext.md    # 技术上下文
│   └── progress.md       # 进度跟踪
└── README.md            # 说明文档
```

## 添加图标

为了完整的功能，请添加以下尺寸的PNG图标到`icons/`目录：

- `icon16.png` - 16x16像素
- `icon32.png` - 32x32像素  
- `icon48.png` - 48x48像素
- `icon128.png` - 128x128像素

可以使用简单的笔记图标或文本图标。

## 技术栈

- Chrome Extensions API (Manifest V3)
- HTML5/CSS3/JavaScript (ES6+)
- 浏览器下载API
- Markdown格式

## 浏览器要求

- Chrome 88+ (支持Manifest V3)
- 所有现代浏览器都支持下载功能

## 开发说明

本项目采用模块化架构设计，代码结构清晰：

1. **background.js** - 处理扩展核心逻辑和消息通信
2. **sidepanel.js** - 侧边栏界面逻辑和用户交互
3. **fileHandler.js** - 文件操作和保存功能
4. **utils.js** - 工具函数和辅助方法

## 许可证

MIT License
