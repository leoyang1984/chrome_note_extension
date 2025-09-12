# 系统架构模式 - Logseq集成

## 架构概述

### 核心模块关系
```
Sidepanel App (sidepanel.js)
    │
    ├── FileHandler (fileHandler.js) → 本地文件保存
    │
    └── LogseqService (logseqService.js) → Logseq云保存
        │
        └── HTTP API → Logseq桌面应用
```

### 数据流模式
1. **用户输入** → 编辑界面获取笔记内容
2. **内容处理** → 生成Markdown + frontmatter
3. **目标选择** → 用户选择保存目标（本地/Logseq）
4. **API调用** → 通过HTTP与Logseq通信
5. **结果反馈** → 显示保存状态给用户

## 关键设计决策

### 1. Token管理策略
**当前实现**: 硬编码（开发阶段）
```javascript
// src/logseqService.js
this.token = 'Abc123!'; // 需要改为配置化
```

**推荐方案**: Chrome Storage API
```javascript
// 存储token
chrome.storage.sync.set({ logseqToken: 'Abc123!' });

// 读取token
chrome.storage.sync.get(['logseqToken'], (result) => {
  this.token = result.logseqToken || 'default_token';
});
```

### 2. 页面命名约定
**自动生成日期格式**: 
- 格式: "Sep 2nd, 2025"
- 算法: 月份缩写 + 日期 + 后缀 + 年份
- 兼容性: 与Logseq每日日志页面完全一致

### 3. 错误处理模式
```javascript
// 分层错误处理
try {
  // API调用
  const response = await fetch(...);
  if (!response.ok) throw new Error('HTTP错误');
  
  // 业务逻辑错误
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  
} catch (error) {
  // 网络错误 → 用户提示
  // 认证错误 → 重新配置
  // 业务错误 → 具体提示
}
```

## 配置管理模式

### 环境特定的配置方案

#### 开发环境 (Development)
```javascript
// 使用硬编码token，方便测试
const config = {
  apiUrl: 'http://127.0.0.1:12316',
  token: 'Abc123!',
  autoConnect: true
};
```

#### 生产环境 (Production)
```javascript
// 从存储中读取配置
const config = {
  apiUrl: await getStoredConfig('logseqApiUrl'),
  token: await getStoredConfig('logseqToken'),
  autoConnect: false // 需要用户明确授权
};
```

#### 多平台配置模板
```json
// Windows默认配置
{
  "apiUrl": "http://127.0.0.1:12316",
  "token": "windows_default_token_123"
}

// macOS默认配置  
{
  "apiUrl": "http://127.0.0.1:12316", 
  "token": "macos_default_token_456"
}

// Linux默认配置
{
  "apiUrl": "http://127.0.0.1:12316",
  "token": "linux_default_token_789"
}
```

## 安全模式

### Token安全存储
1. **加密存储**: 使用浏览器提供的加密API
2. **内存缓存**: Token只在内存中使用，不持久化到磁盘
3. **自动清理**: 页面关闭时清理内存中的token

### 网络通信安全
1. **本地网络**: 只允许访问localhost
2. **HTTPS优先**: 如果支持HTTPS则优先使用
3. **CORS处理**: 正确处理跨域请求

## 扩展性模式

### 插件架构
```javascript
// 可插拔的保存处理器
const saveHandlers = {
  local: FileHandler,
  logseq: LogseqService,
  // 未来可添加: notion, obsidian, evernote等
};

// 使用选择的处理器
const handler = saveHandlers[selectedHandler];
await handler.save(noteData);
```

### 配置导入/导出
```javascript
// 导出配置
function exportConfig() {
  const config = {
    version: '1.0',
    logseq: { apiUrl: this.apiUrl, token: this.token },
    // 其他配置...
  };
  return JSON.stringify(config);
}

// 导入配置  
function importConfig(configJson) {
  const config = JSON.parse(configJson);
  this.apiUrl = config.logseq.apiUrl;
  this.token = config.logseq.token;
}
```

## 性能优化模式

### 连接池管理
```javascript
// 复用HTTP连接
const connectionPool = new Map();

async getConnection(apiUrl) {
  if (!connectionPool.has(apiUrl)) {
    connectionPool.set(apiUrl, this.createConnection(apiUrl));
  }
  return connectionPool.get(apiUrl);
}
```

### 请求批处理
```javascript
// 批量保存多个笔记
async saveBatch(notes) {
  const batchRequest = notes.map(note => ({
    method: 'logseq.Editor.appendBlockInPage',
    args: [note.page, note.content, note.properties]
  }));
  
  return await this.batchApiCall(batchRequest);
}
```

这些模式确保了系统的可维护性、安全性和扩展性，为未来的功能扩展奠定了基础。
