# 技术上下文 - Logseq集成

## 技术栈
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **浏览器扩展**: Chrome Manifest V3
- **API通信**: Fetch API, RESTful HTTP
- **数据格式**: Markdown with YAML frontmatter

## Logseq API配置

### API端点
- **基础URL**: `http://127.0.0.1:12316/api`
- **认证方式**: Bearer Token认证
- **请求格式**: JSON

### 认证Token设置
当前实现使用硬编码token（在开发阶段）：
```javascript
// src/logseqService.js 中的配置
this.token = 'Abc123!'; // 用户提供的固定token
```

### 推荐的Token管理方案

#### 方案1：配置界面（推荐）
```javascript
// 在设置页面添加Logseq配置
async configureLogseq() {
  const token = prompt('请输入Logseq API Token:');
  if (token) {
    await this.saveTokenToStorage(token);
    this.token = token;
  }
}
```

#### 方案2：环境变量（跨平台）
```javascript
// 通过manifest.json的权限获取环境变量
const token = process.env.LOGSEQ_TOKEN || 'Abc123!';
```

#### 方案3：用户输入（首次使用）
```javascript
// 首次使用时提示输入token
if (!this.token) {
  this.showTokenInputDialog();
}
```

## 文件结构
```
src/
├── logseqService.js    # Logseq服务核心模块
├── sidepanel.js        # 主界面逻辑（已集成Logseq功能）
├── sidepanel.html      # 界面布局（已添加Logseq按钮）
└── utils.js           # 工具函数
```

## API调用模式

### 保存笔记到Logseq
```javascript
{
  method: 'logseq.Editor.appendBlockInPage',
  args: [
    "Sep 2nd, 2025",    // 页面名称（自动生成的日期格式）
    "笔记内容...",       // Markdown格式的笔记内容
    {
      properties: {     // 元数据属性
        source: "https://example.com",
        "page-title": "网页标题",
        created: "2025-09-02T21:30:00.000Z"
      }
    }
  ]
}
```

### 测试连接
```javascript
{
  method: 'logseq.UI.showMsg',
  args: ['连接测试消息']
}
```

## 跨平台配置建议

1. **Token存储**: 使用Chrome Storage API进行安全存储
2. **配置导出**: 提供配置导出/导入功能
3. **默认设置**: 为不同平台提供默认配置模板
4. **错误处理**: 完善的网络错误和认证错误处理

## 依赖关系
- 需要Logseq桌面版运行并启用HTTP服务器
- 需要在Logseq中配置相同的API token
- 需要网络权限访问localhost:12316
