// 后台服务工作者 - 处理扩展的核心逻辑

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('笔记扩展已安装');
  
  // 设置侧边栏默认行为
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .then(() => console.log('侧边栏行为设置成功'))
    .catch(error => console.error('侧边栏设置失败:', error));
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 打开侧边栏
  chrome.sidePanel.open({ windowId: tab.windowId })
    .then(() => console.log('侧边栏已打开'))
    .catch(error => console.error('打开侧边栏失败:', error));
});

// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'SAVE_NOTE':
      // 处理保存笔记请求（这里只是示例，实际文件操作在侧边栏中处理）
      console.log('收到保存笔记请求:', request.data);
      sendResponse({ success: true, message: '保存请求已接收' });
      break;

    default:
      console.warn('未知消息类型:', request.type);
      sendResponse({ error: '未知消息类型' });
  }
});

// 错误处理
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('外部消息:', request);
});

// 存储管理
async function getStorageData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

async function setStorageData(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}

// 导出函数供其他模块使用
// 在service worker环境中，使用chrome.storage直接访问
// 其他模块可以通过消息通信来使用这些功能
