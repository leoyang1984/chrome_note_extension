// DeepSeek API服务 - 聊天对话版本

class DeepSeekService {
    constructor() {
        this.apiKey = null;
        this.conversationHistory = [];
        this.initialize();
    }

    /**
     * 初始化DeepSeek服务
     */
    async initialize() {
        await this.loadApiKey();
        // 初始化欢迎消息
        this.addToHistory('assistant', '您好！我是DeepSeek AI助手，可以帮您翻译英文内容或回答其他问题。请告诉我您需要什么帮助？');
    }

    /**
     * 从存储加载API密钥
     */
    async loadApiKey() {
        try {
            const result = await chrome.storage.local.get('deepseekApiKey');
            this.apiKey = result.deepseekApiKey || null;
            return this.apiKey;
        } catch (error) {
            console.error('加载API密钥失败:', error);
            return null;
        }
    }

    /**
     * 保存API密钥到存储
     * @param {string} apiKey - DeepSeek API密钥
     */
    async saveApiKey(apiKey) {
        try {
            await chrome.storage.local.set({ deepseekApiKey: apiKey });
            this.apiKey = apiKey;
            return true;
        } catch (error) {
            console.error('保存API密钥失败:', error);
            return false;
        }
    }

    /**
     * 添加消息到对话历史
     * @param {string} role - 角色 (user/assistant)
     * @param {string} content - 消息内容
     */
    addToHistory(role, content) {
        this.conversationHistory.push({
            role,
            content: content.trim()
        });
        
        // 限制历史记录长度，避免token超限
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
    }

    /**
     * 获取对话历史
     * @returns {Array} 对话历史
     */
    getHistory() {
        return this.conversationHistory;
    }

    /**
     * 清空对话历史（保留欢迎消息）
     */
    clearHistory() {
        this.conversationHistory = this.conversationHistory.filter(msg => 
            msg.role === 'assistant' && msg.content.includes('您好！我是DeepSeek AI助手')
        );
    }

    /**
     * 发送聊天消息
     * @param {string} message - 用户消息
     * @returns {Promise<string>} AI回复
     */
    async sendMessage(message) {
        if (!this.apiKey) {
            throw new Error('请先设置DeepSeek API密钥');
        }

        if (!message.trim()) {
            throw new Error('请输入消息内容');
        }

        // 添加用户消息到历史
        this.addToHistory('user', message);

        try {
            // 构建包含系统提示的消息数组
            const messages = [
                {
                    role: "system",
                    content: "请提供简洁明了的回答，避免冗长解释，专注于核心内容。回答请控制在300字以内。"
                },
                ...this.conversationHistory
            ];

            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: messages,
                    max_tokens: 400,
                    temperature: 0.3,
                    top_p: 0.9,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content || '未收到有效响应';
            
            // 清理响应格式并添加到历史
            const cleanedResponse = this.cleanResponseFormat(aiResponse);
            this.addToHistory('assistant', cleanedResponse);
            
            return cleanedResponse;
            
        } catch (error) {
            console.error('DeepSeek API调用失败:', error);
            
            // 从历史中移除失败的用户消息
            this.conversationHistory.pop();
            
            throw new Error(`发送失败: ${error.message}`);
        }
    }

    /**
     * 清理响应格式
     * @param {string} text - AI响应文本
     * @returns {string} 清理后的文本
     */
    cleanResponseFormat(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
            .replace(/\*(.*?)\*/g, '$1')     // 移除斜体
            .replace(/_(.*?)_/g, '$1')       // 移除下划线
            .replace(/`(.*?)`/g, '"$1"')     // 代码转引号
            .replace(/```[\s\S]*?```/g, '')  // 移除代码块
            .replace(/#{1,6}\s?/g, '')       // 移除标题
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接
            .replace(/\n{3,}/g, '\n\n')      // 限制连续换行
            .trim();
    }

    /**
     * 获取思考中的状态消息
     * @returns {string} 思考中消息
     */
    getThinkingMessage() {
        return '🤔 AI正在思考中...';
    }

    /**
     * 验证API密钥是否有效
     * @param {string} apiKey - 要验证的API密钥
     * @returns {Promise<boolean>} 是否有效
     */
    async validateApiKey(apiKey) {
        try {
            const response = await fetch('https://api.deepseek.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('验证API密钥失败:', error);
            return false;
        }
    }

    /**
     * 清除API密钥
     */
    async clearApiKey() {
        try {
            await chrome.storage.local.remove('deepseekApiKey');
            this.apiKey = null;
            this.clearHistory();
            return true;
        } catch (error) {
            console.error('清除API密钥失败:', error);
            return false;
        }
    }

    /**
     * 检查是否已设置API密钥
     * @returns {boolean} 是否已设置
     */
    hasApiKey() {
        return !!this.apiKey;
    }
}

// 创建全局实例
window.deepseekService = new DeepSeekService();

// 错误处理
window.deepseekService.initialize().catch(error => {
    console.error('DeepSeek服务初始化失败:', error);
});
