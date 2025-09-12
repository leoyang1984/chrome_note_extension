// Logseq服务模块 - 处理与Logseq HTTP API的交互

class LogseqService {
    constructor() {
        this.baseURL = 'http://127.0.0.1:12316';
        this.token = 'Abc123!'; // 默认API token
        this.isConnected = false;
        this.initialize();
    }

    /**
     * 初始化服务
     */
    async initialize() {
        await this.loadConfig();
    }

    /**
     * 加载配置
     */
    async loadConfig() {
        try {
            const config = await chrome.storage.local.get(['logseqConfig']);
            if (config.logseqConfig) {
                this.baseURL = config.logseqConfig.baseURL || this.baseURL;
                this.token = config.logseqConfig.token || this.token;
            }
            return {
                baseURL: this.baseURL,
                token: this.token
            };
        } catch (error) {
            console.error('加载配置失败:', error);
            return {
                baseURL: this.baseURL,
                token: this.token
            };
        }
    }

    /**
     * 保存配置
     * @param {Object} config - 配置对象
     */
    async saveConfig(config) {
        try {
            await chrome.storage.local.set({
                logseqConfig: {
                    baseURL: config.baseURL,
                    token: config.token
                }
            });
            
            // 更新当前实例的配置
            this.baseURL = config.baseURL;
            this.token = config.token;
            this.isConnected = false; // 重置连接状态
            
            return true;
        } catch (error) {
            console.error('保存配置失败:', error);
            throw new Error('保存配置失败');
        }
    }

    /**
     * 生成Logseq格式的日期页面名称
     * @returns {string} 格式化的日期字符串，如 "Sep 2nd, 2025"
     */
    getLogseqDateFormat() {
        const date = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = date.getDate();
        
        // 生成日期后缀
        const suffix = day % 10 === 1 && day !== 11 ? 'st' :
                      day % 10 === 2 && day !== 12 ? 'nd' :
                      day % 10 === 3 && day !== 13 ? 'rd' : 'th';
        
        return `${months[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
    }

    /**
     * 生成Logseq格式的笔记内容
     * @param {Object} noteData - 笔记数据
     * @returns {string} 格式化后的Markdown内容
     */
    generateLogseqContent(noteData) {
        const { title, content } = noteData;
        
        // 只包含标题和内容，属性通过properties参数单独设置
        if (title) {
            return `## ${title}\n\n${content}`;
        }
        return content;
    }

    /**
     * 测试Logseq连接
     * @returns {Promise<boolean>} 连接是否成功
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    method: 'logseq.UI.showMsg',
                    args: ['Chrome笔记扩展连接测试成功']
                })
            });

            if (response.ok) {
                this.isConnected = true;
                return true;
            }
            
            this.isConnected = false;
            return false;
            
        } catch (error) {
            console.error('Logseq连接测试失败:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * 保存笔记到Logseq
     * @param {Object} noteData - 笔记数据
     * @returns {Promise<Object>} 保存结果
     */
    async saveToLogseq(noteData) {
        const { title, content } = noteData;
        
        try {
            // 验证笔记内容
            const validation = window.utils.validateNote(title, content);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            // 生成页面名称和内容
            const pageName = this.getLogseqDateFormat();
            const logseqContent = this.generateLogseqContent(noteData);

            // 调用Logseq API
            const response = await fetch(`${this.baseURL}/api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    method: 'logseq.Editor.appendBlockInPage',
                    args: [
                        pageName,
                        logseqContent,
                        {
                            properties: {
                                source: noteData.metadata?.url || '',
                                'page-title': noteData.metadata?.title || '',
                                created: new Date().toISOString()
                            }
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP错误: ${response.status}`);
            }

            const result = await response.json();
            
            return {
                success: true,
                message: '笔记已成功保存到Logseq',
                page: pageName,
                result: result
            };

        } catch (error) {
            console.error('保存到Logseq失败:', error);
            return {
                success: false,
                error: error.message,
                message: `保存到Logseq失败: ${error.message}`
            };
        }
    }

    /**
     * 显示Logseq消息
     * @param {string} message - 消息内容
     * @returns {Promise<boolean>} 是否成功
     */
    async showMessage(message) {
        try {
            const response = await fetch(`${this.baseURL}/api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    method: 'logseq.UI.showMsg',
                    args: [message]
                })
            });

            return response.ok;
        } catch (error) {
            console.error('显示Logseq消息失败:', error);
            return false;
        }
    }

    /**
     * 获取连接状态
     * @returns {boolean} 是否已连接
     */
    getConnectionStatus() {
        return this.isConnected;
    }
}

// 创建全局Logseq服务实例
window.logseqService = new LogseqService();
