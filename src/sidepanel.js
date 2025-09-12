// 侧边栏主逻辑

class SidepanelApp {
    constructor() {
        this.currentTabInfo = { url: '', title: '' };
        this.isSaving = false;
        this.inputState = {
            title: '',
            content: ''
        };
        this.initialize();
    }

    /**
     * 初始化侧边栏应用
     */
    async initialize() {
        try {
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupApp());
            } else {
                this.setupApp();
            }
        } catch (error) {
            console.error('侧边栏初始化失败:', error);
            window.utils.showStatus('初始化失败，请刷新重试', 'error', 5000);
        }
    }

    /**
     * 设置应用界面和事件监听
     */
    async setupApp() {
        // 更新界面信息
        await this.updatePageInfo();
        this.updateTimeDisplay();

        // 设置事件监听
        this.setupEventListeners();

        // 设置自动保存时间显示
        this.setupAutoUpdate();

        window.utils.showStatus('就绪', 'success', 2000);
    }

    /**
     * 更新页面信息
     * @param {boolean} forceUpdate - 是否强制更新标题（用于更新按钮）
     */
    async updatePageInfo(forceUpdate = false) {
        try {
            this.currentTabInfo = await window.utils.getCurrentTabInfo();
            
            const pageUrlElement = document.getElementById('pageUrl');
            if (pageUrlElement) {
                // 显示简化的URL - 添加URL有效性检查
                let displayUrl = this.currentTabInfo.url;
                try {
                    // 尝试创建URL对象，如果失败则使用原始URL
                    const url = new URL(this.currentTabInfo.url);
                    displayUrl = `${url.hostname}${url.pathname}`;
                } catch (error) {
                    // 对于无效URL（如chrome://页面），显示原始URL或简化显示
                    if (this.currentTabInfo.url.startsWith('chrome://')) {
                        displayUrl = 'chrome内部页面';
                    } else if (this.currentTabInfo.url.startsWith('about:')) {
                        displayUrl = 'about页面';
                    } else {
                        // 截断过长的URL
                        displayUrl = this.currentTabInfo.url.length > 50
                            ? this.currentTabInfo.url.substring(0, 50) + '...'
                            : this.currentTabInfo.url;
                    }
                }
                pageUrlElement.textContent = displayUrl;
                
                // 更新标题（如果是强制更新或者标题为空）
                const titleInput = document.getElementById('noteTitle');
                if (titleInput && this.currentTabInfo.title) {
                    if (forceUpdate || !titleInput.value) {
                        titleInput.value = this.currentTabInfo.title;
                        // 焦点移到内容输入框
                        const contentInput = document.getElementById('noteContent');
                        if (contentInput) {
                            contentInput.focus();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('获取页面信息失败:', error);
        }
    }

    /**
     * 更新时间显示
     */
    updateTimeDisplay() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleString('zh-CN');
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // Logseq保存按钮点击事件
        const saveToLogseqBtn = document.getElementById('saveToLogseqBtn');
        if (saveToLogseqBtn) {
            saveToLogseqBtn.addEventListener('click', () => this.handleSaveToLogseq());
        }

        // 设置按钮点击事件
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettingsModal());
        }

        // 设置模态框事件
        const settingsModal = document.getElementById('settingsModal');
        const modalOverlay = document.getElementById('modalOverlay');
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        const settingsForm = document.querySelector('.settings-form');

        if (cancelSettingsBtn) {
            cancelSettingsBtn.addEventListener('click', () => this.hideSettingsModal());
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.hideSettingsModal());
        }

        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => this.testLogseqConnection());
        }

        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.handleSettingsSave(e));
        }


        // 更新按钮点击事件
        const updateBtn = document.getElementById('updateBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.handleUpdate());
        }

        // 视图切换按钮点击事件
        const editTab = document.getElementById('editTab');
        const previewTab = document.getElementById('previewTab');
        const deepseekTab = document.getElementById('deepseekTab');
        
        if (editTab && previewTab && deepseekTab) {
            editTab.addEventListener('click', () => this.switchView('edit'));
            previewTab.addEventListener('click', () => this.switchView('preview'));
            deepseekTab.addEventListener('click', () => this.switchView('deepseek'));
        }

        // DeepSeek查询功能
        const deepseekInput = document.getElementById('deepseekInput');
        const deepseekSend = document.getElementById('deepseekSend');
        const deepseekConfigBtn = document.getElementById('deepseekConfigBtn');
        
        if (deepseekInput && deepseekSend) {
            // 发送按钮点击事件
            deepseekSend.addEventListener('click', () => this.handleDeepSeekQuery());
            
            // 输入框回车键支持 (Enter发送，Shift+Enter换行)
            deepseekInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (e.shiftKey) {
                        // Shift+Enter: 插入换行
                        return;
                    } else {
                        // Enter: 发送消息
                        e.preventDefault();
                        this.handleDeepSeekQuery();
                    }
                }
            });
        }

        if (deepseekConfigBtn) {
            deepseekConfigBtn.addEventListener('click', () => this.showDeepSeekConfig());
        }

        // 内容变化时自动更新预览
        const contentInputForPreview = document.getElementById('noteContent');
        if (contentInputForPreview) {
            const debouncedPreview = window.utils.debounce(() => {
                this.updatePreview();
            }, 500);
            
            contentInputForPreview.addEventListener('input', debouncedPreview);
        }

        // 输入框快捷键支持
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');

        if (titleInput && contentInput) {
            // Ctrl/Cmd + S 保存到Logseq
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.handleSaveToLogseq();
                }
            });

            // 输入框变化时更新状态
            const debouncedUpdate = window.utils.debounce(() => {
                this.updateSaveButtonState();
            }, 300);

            titleInput.addEventListener('input', debouncedUpdate);
            contentInput.addEventListener('input', debouncedUpdate);
        }
    }

    /**
     * 切换视图
     * @param {string} view - 视图名称 (edit/preview/deepseek)
     */
    switchView(view) {
        // 保存当前编辑状态
        this.saveEditState();
        
        // 获取所有选项卡和视图
        const tabs = {
            edit: document.getElementById('editTab'),
            preview: document.getElementById('previewTab'),
            deepseek: document.getElementById('deepseekTab')
        };

        const views = {
            edit: document.getElementById('editView'),
            preview: document.getElementById('previewView'),
            deepseek: document.getElementById('deepseekView')
        };

        // 移除所有active类
        Object.values(tabs).forEach(tab => tab?.classList.remove('active'));
        Object.values(views).forEach(view => view?.classList.remove('active'));

        // 激活选中的选项卡和视图
        if (tabs[view]) tabs[view].classList.add('active');
        if (views[view]) views[view].classList.add('active');

        // 特殊处理预览视图
        if (view === 'preview') {
            this.updatePreview();
        }
        
        // 恢复编辑状态（如果切换到编辑视图）
        if (view === 'edit') {
            this.restoreEditState();
        }
    }

    /**
     * 保存编辑状态
     */
    saveEditState() {
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');
        
        if (titleInput) {
            this.inputState.title = titleInput.value;
        }
        
        if (contentInput) {
            this.inputState.content = contentInput.value;
        }
    }

    /**
     * 恢复编辑状态
     */
    restoreEditState() {
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');
        
        if (titleInput && this.inputState.title !== undefined) {
            titleInput.value = this.inputState.title;
        }
        
        if (contentInput && this.inputState.content !== undefined) {
            contentInput.value = this.inputState.content;
        }
    }

    /**
     * 更新Markdown预览
     */
    updatePreview() {
        const contentInput = document.getElementById('noteContent');
        const previewElement = document.getElementById('markdownPreview');
        
        if (!contentInput || !previewElement) return;

        const markdown = contentInput.value;
        
        if (!markdown.trim()) {
            previewElement.innerHTML = '<p class="text-muted">输入内容以查看预览...</p>';
            return;
        }

        try {
            // 使用marked.js解析Markdown
            const html = marked.parse(markdown);
            previewElement.innerHTML = html;
        } catch (error) {
            console.error('Markdown解析错误:', error);
            previewElement.innerHTML = '<p class="text-muted">预览解析失败</p>';
        }
    }

    /**
     * 设置自动更新
     */
    setupAutoUpdate() {
        // 每分钟更新时间显示
        setInterval(() => {
            this.updateTimeDisplay();
        }, 60000);

        // 每30秒检查页面信息（如果页面切换）
        setInterval(() => {
            this.updatePageInfo();
        }, 30000);
    }

    /**
     * 更新保存按钮状态
     */
    updateSaveButtonState() {
        const saveToLogseqBtn = document.getElementById('saveToLogseqBtn');
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');

        if (saveToLogseqBtn && titleInput && contentInput) {
            const hasContent = titleInput.value.trim() || contentInput.value.trim();
            saveToLogseqBtn.disabled = this.isSaving || !hasContent;
        }
    }


    /**
     * 处理保存到Logseq操作
     */
    async handleSaveToLogseq() {
        if (this.isSaving) return;

        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');

        if (!titleInput || !contentInput) return;

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        // 验证输入
        const validation = window.utils.validateNote(title, content);
        if (!validation.valid) {
            window.utils.showStatus(validation.message, 'error', 3000);
            return;
        }

        this.setSavingState(true, 'logseq');

        try {
            console.log('开始保存到Logseq...');
            const result = await window.logseqService.saveToLogseq({
                title: title,
                content: content,
                metadata: {
                    url: this.currentTabInfo.url,
                    title: this.currentTabInfo.title
                }
            });

            console.log('Logseq保存结果:', result);
            
            if (result.success) {
                // 显示成功弹窗
                alert('✅ 保存成功！笔记已成功保存到Logseq');
                
                // 在Logseq中显示成功消息，防止用户重复点击
                await window.logseqService.showMessage('✅ 笔记已从Chrome扩展保存');
                
                // 使用原生Chrome通知显示保存成功
                this.showChromeNotification('保存成功', '笔记已成功保存到Logseq');
            } else {
                console.error('保存到Logseq失败:', result.error);
                // 显示错误弹窗
                alert(`❌ 保存失败: ${result.message}\n\n请检查Logseq API端口和Token设置是否正确。`);
            }
        } catch (error) {
            console.error('保存到Logseq处理错误:', error);
            // 显示错误弹窗
            alert(`❌ 保存失败: ${error.message}\n\n请检查Logseq API端口和Token设置是否正确。`);
        } finally {
            this.setSavingState(false, 'logseq');
        }
    }

    /**
     * 处理更新操作
     */
    async handleUpdate() {
        try {
            // 显示更新中状态
            const updateBtn = document.getElementById('updateBtn');
            if (updateBtn) {
                updateBtn.disabled = true;
                updateBtn.textContent = '更新中...';
            }

            // 更新页面信息（强制更新标题）
            await this.updatePageInfo(true);
            
            // 显示成功状态
            window.utils.showStatus('页面信息已更新', 'success', 2000);
            
        } catch (error) {
            console.error('更新页面信息失败:', error);
            window.utils.showStatus('更新失败，请重试', 'error', 3000);
        } finally {
            // 恢复按钮状态
            const updateBtn = document.getElementById('updateBtn');
            if (updateBtn) {
                updateBtn.disabled = false;
                updateBtn.textContent = '🔄';
                updateBtn.title = '更新页面信息';
            }
        }
    }

    /**
     * 设置保存状态
     * @param {boolean} saving - 是否正在保存
     * @param {string} type - 保存类型 ('logseq')
     */
    setSavingState(saving, type = 'logseq') {
        this.isSaving = saving;
        
        const saveToLogseqBtn = document.getElementById('saveToLogseqBtn');
        
        if (saveToLogseqBtn) {
            saveToLogseqBtn.disabled = saving && type === 'logseq';
            // 按钮文本保持不变，只改变禁用状态
            saveToLogseqBtn.textContent = '💾 保存到Logseq';
        }

        // 禁用或启用输入框
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');
        
        if (titleInput && contentInput) {
            titleInput.disabled = saving;
            contentInput.disabled = saving;
        }
    }

    /**
     * 获取当前笔记数据
     * @returns {Object} 笔记数据
     */
    getNoteData() {
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');

        return {
            title: titleInput ? titleInput.value.trim() : '',
            content: contentInput ? contentInput.value.trim() : '',
            metadata: {
                url: this.currentTabInfo.url,
                title: this.currentTabInfo.title,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * 处理DeepSeek聊天消息
     */
    async handleDeepSeekQuery() {
        const input = document.getElementById('deepseekInput');
        const chatContainer = document.getElementById('deepseekChat');
        const sendBtn = document.getElementById('deepseekSend');
        
        if (!input || !chatContainer || !sendBtn) return;

        const message = input.value.trim();
        if (!message) return;

        // 添加用户消息到聊天界面
        this.addMessageToChat('user', message);
        input.value = '';

        // 添加思考中消息
        const thinkingMessage = window.deepseekService.getThinkingMessage();
        const thinkingElement = this.addMessageToChat('assistant', thinkingMessage, true);
        
        // 禁用按钮，显示加载状态
        sendBtn.disabled = true;
        sendBtn.classList.add('loading');

        try {
            const response = await window.deepseekService.sendMessage(message);
            // 替换思考消息为实际回复
            this.replaceThinkingMessage(thinkingElement, response);
            
        } catch (error) {
            // 替换思考消息为错误消息
            this.replaceThinkingMessage(thinkingElement, `❌ ${error.message}`);
        } finally {
            // 恢复按钮状态
            sendBtn.disabled = false;
            sendBtn.classList.remove('loading');
            
            // 滚动到底部
            this.scrollChatToBottom();
        }
    }

    /**
     * 添加消息到聊天界面
     * @param {string} role - 角色 (user/assistant)
     * @param {string} content - 消息内容
     * @param {boolean} isThinking - 是否为思考中消息
     * @returns {HTMLElement} 消息元素
     */
    addMessageToChat(role, content, isThinking = false) {
        const chatContainer = document.getElementById('deepseekChat');
        if (!chatContainer) return null;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        if (isThinking) {
            messageDiv.classList.add('thinking-message');
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // 处理消息内容中的换行
        const formattedContent = content.replace(/\n/g, '<br>');
        contentDiv.innerHTML = `<p>${formattedContent}</p>`;
        
        // 为AI消息添加复制按钮
        if (role === 'assistant' && !isThinking) {
            const copyButton = this.createCopyButton(content);
            contentDiv.appendChild(copyButton);
        }
        
        messageDiv.appendChild(contentDiv);
        chatContainer.appendChild(messageDiv);
        
        // 滚动到底部
        this.scrollChatToBottom();
        
        return messageDiv;
    }

    /**
     * 替换思考消息为实际内容
     * @param {HTMLElement} thinkingElement - 思考消息元素
     * @param {string} content - 实际内容
     */
    replaceThinkingMessage(thinkingElement, content) {
        if (!thinkingElement) return;

        // 移除思考样式
        thinkingElement.classList.remove('thinking-message');
        
        const contentDiv = thinkingElement.querySelector('.message-content');
        if (contentDiv) {
            // 处理消息内容中的换行
            const formattedContent = content.replace(/\n/g, '<br>');
            contentDiv.innerHTML = `<p>${formattedContent}</p>`;
            
            // 添加复制按钮
            const copyButton = this.createCopyButton(content);
            contentDiv.appendChild(copyButton);
        }
    }

    /**
     * 创建复制按钮
     * @param {string} text - 要复制的文本
     * @returns {HTMLElement} 复制按钮元素
     */
    createCopyButton(text) {
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.innerHTML = '📋';
        button.title = '复制到剪贴板';
        
        button.addEventListener('click', () => {
            this.copyToClipboard(text);
            button.innerHTML = '✅';
            button.title = '已复制';
            
            // 2秒后恢复原状
            setTimeout(() => {
                button.innerHTML = '📋';
                button.title = '复制到剪贴板';
            }, 2000);
        });
        
        return button;
    }

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            window.utils.showStatus('已复制到剪贴板', 'success', 2000);
        } catch (error) {
            console.error('复制失败:', error);
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            window.utils.showStatus('已复制到剪贴板', 'success', 2000);
        }
    }

    /**
     * 滚动聊天到底部
     */
    scrollChatToBottom() {
        const chatContainer = document.getElementById('deepseekChat');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    /**
     * 显示DeepSeek配置界面
     */
    async showDeepSeekConfig() {
        const currentKey = await window.deepseekService.loadApiKey();
        const maskedKey = currentKey ? `${currentKey.substring(0, 8)}...${currentKey.substring(currentKey.length - 4)}` : '未设置';
        
        const apiKey = prompt(`当前API密钥: ${maskedKey}\n\n请输入新的DeepSeek API密钥:`, '');
        
        if (apiKey === null) return; // 用户取消
        
        if (apiKey.trim()) {
            const isValid = await window.deepseekService.validateApiKey(apiKey.trim());
            if (isValid) {
                await window.deepseekService.saveApiKey(apiKey.trim());
                window.utils.showStatus('API密钥设置成功', 'success', 3000);
            } else {
                window.utils.showStatus('API密钥无效，请检查后重试', 'error', 5000);
            }
        } else if (apiKey === '') {
            // 清空密钥
            await window.deepseekService.clearApiKey();
            window.utils.showStatus('API密钥已清除', 'success', 3000);
        }
    }

    /**
     * 重置表单
     */
    resetForm() {
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');

        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';

        this.updateSaveButtonState();
    }

    /**
     * 显示设置模态框
     */
    async showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const overlay = document.getElementById('modalOverlay');
        
        if (modal && overlay) {
            // 加载当前设置
            await this.loadSettings();
            
            modal.classList.add('active');
            overlay.classList.add('active');
        }
    }

    /**
     * 隐藏设置模态框
     */
    hideSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const overlay = document.getElementById('modalOverlay');
        
        if (modal && overlay) {
            modal.classList.remove('active');
            overlay.classList.remove('active');
        }
    }

    /**
     * 加载设置
     */
    async loadSettings() {
        try {
            const config = await window.logseqService.loadConfig();
            document.getElementById('logseqApiUrl').value = config.baseURL;
            document.getElementById('logseqApiToken').value = config.token;
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    /**
     * 处理设置保存
     */
    async handleSettingsSave(event) {
        event.preventDefault();
        
        const apiUrl = document.getElementById('logseqApiUrl').value.trim();
        const apiToken = document.getElementById('logseqApiToken').value.trim();

        if (!apiUrl || !apiToken) {
            window.utils.showStatus('API地址和Token不能为空', 'error', 3000);
            return;
        }

        try {
            await window.logseqService.saveConfig({
                baseURL: apiUrl,
                token: apiToken
            });
            
            window.utils.showStatus('设置已保存', 'success', 2000);
            this.hideSettingsModal();
            
        } catch (error) {
            console.error('保存设置失败:', error);
            window.utils.showStatus('保存设置失败', 'error', 3000);
        }
    }

    /**
     * 测试Logseq连接
     */
    async testLogseqConnection() {
        const testBtn = document.getElementById('testConnectionBtn');
        const apiUrl = document.getElementById('logseqApiUrl').value.trim();
        const apiToken = document.getElementById('logseqApiToken').value.trim();

        if (!apiUrl || !apiToken) {
            window.utils.showStatus('请先填写API地址和Token', 'error', 3000);
            return;
        }

        // 保存临时配置用于测试
        const originalConfig = { ...window.logseqService };
        window.logseqService.baseURL = apiUrl;
        window.logseqService.token = apiToken;

        testBtn.disabled = true;
        testBtn.textContent = '测试中...';

        try {
            const isConnected = await window.logseqService.testConnection();
            if (isConnected) {
                window.utils.showStatus('连接成功！', 'success', 3000);
            } else {
                window.utils.showStatus('连接失败，请检查配置', 'error', 3000);
            }
        } catch (error) {
            console.error('连接测试失败:', error);
            window.utils.showStatus('连接测试失败', 'error', 3000);
        } finally {
            // 恢复原始配置
            window.logseqService.baseURL = originalConfig.baseURL;
            window.logseqService.token = originalConfig.token;
            
            testBtn.disabled = false;
            testBtn.textContent = '测试连接';
        }
    }

    /**
     * 显示Chrome原生通知
     * @param {string} title - 通知标题
     * @param {string} message - 通知内容
     */
    showChromeNotification(title, message) {
        // 检查Chrome通知API是否可用
        if (!chrome.notifications) {
            console.warn('Chrome通知API不可用，使用备用方案');
            window.utils.showStatus(message, 'success', 2000);
            return;
        }

        // 创建通知ID（使用时间戳确保唯一性）
        const notificationId = 'logseq-save-' + Date.now();

        // 创建通知
        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: title,
            message: message,
            priority: 0,
            requireInteraction: false // 允许自动关闭
        }, (notificationId) => {
            if (chrome.runtime.lastError) {
                console.error('创建通知失败:', chrome.runtime.lastError);
                window.utils.showStatus(message, 'success', 2000);
                return;
            }

            // 2秒后自动关闭通知
            setTimeout(() => {
                chrome.notifications.clear(notificationId, () => {
                    if (chrome.runtime.lastError) {
                        console.warn('关闭通知失败:', chrome.runtime.lastError);
                    }
                });
            }, 2000);
        });

        // 监听通知点击事件（用户手动关闭）
        chrome.notifications.onClicked.addListener(function onClicked(clickedNotificationId) {
            if (clickedNotificationId === notificationId) {
                chrome.notifications.clear(notificationId);
                chrome.notifications.onClicked.removeListener(onClicked);
            }
        });

        // 监听通知关闭事件（清理监听器）
        chrome.notifications.onClosed.addListener(function onClosed(closedNotificationId) {
            if (closedNotificationId === notificationId) {
                chrome.notifications.onClicked.removeListener(onClicked);
                chrome.notifications.onClosed.removeListener(onClosed);
            }
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.sidepanelApp = new SidepanelApp();
});

// 错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    window.utils.showStatus('发生错误，请刷新页面', 'error', 5000);
});

// 未处理的Promise rejection
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise rejection:', event.reason);
    window.utils.showStatus('操作失败，请重试', 'error', 5000);
});
