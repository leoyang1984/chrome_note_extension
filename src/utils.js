// 工具函数模块

/**
 * 格式化时间为YYYYMMDD-HHMM格式
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的时间字符串
 */
function formatTimestamp(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}`;
}

/**
 * 生成YAML frontmatter元数据
 * @param {Object} metadata - 元数据对象
 * @returns {string} YAML frontmatter字符串
 */
function generateFrontmatter(metadata = {}) {
    const {
        title = '',
        url = '',
        created = new Date().toISOString(),
        tags = ['学习笔记', '待分类'] // 默认标签
    } = metadata;

    let frontmatter = '---\n';
    frontmatter += `title: "${escapeYamlString(title)}"\n`;
    frontmatter += `source: "${escapeYamlString(url)}"\n`;
    frontmatter += `created: "${created}"\n`;
    
    if (tags && tags.length > 0) {
        frontmatter += `tags:\n`;
        tags.forEach(tag => {
            frontmatter += `  - "${escapeYamlString(tag)}"\n`;
        });
    }
    
    frontmatter += '---\n\n';
    return frontmatter;
}

/**
 * 转义YAML字符串中的特殊字符
 * @param {string} str - 要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeYamlString(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

/**
 * 生成文件名
 * @param {string} title - 笔记标题
 * @param {Date} date - 日期对象
 * @returns {string} 生成的文件名
 */
function generateFilename(title = '', date = new Date()) {
    const timestamp = formatTimestamp(date);
    const cleanTitle = title
        .trim()
        .replace(/[^\w\u4e00-\u9fa5]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
    
    if (cleanTitle) {
        return `${timestamp}-${cleanTitle}.md`;
    }
    return `${timestamp}.md`;
}

/**
 * 显示状态消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, warning)
 * @param {number} duration - 显示持续时间(毫秒)
 */
function showStatus(message, type = 'info', duration = 3000) {
    const statusElement = document.getElementById('statusMessage');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    
    if (duration > 0) {
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'status';
        }, duration);
    }
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间(毫秒)
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 检查File System Access API是否可用
 * @returns {boolean} API是否可用
 */
function isFileSystemAccessAPIAvailable() {
    return 'showDirectoryPicker' in window && 'FileSystemHandle' in window;
}

/**
 * 获取当前标签页信息
 * @returns {Promise<Object>} 标签页信息
 */
async function getCurrentTabInfo() {
    return new Promise((resolve) => {
        try {
            // 尝试使用chrome.tabs API获取当前标签页信息
            if (chrome.tabs && chrome.tabs.query) {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs && tabs[0]) {
                        resolve({
                            url: tabs[0].url || '',
                            title: tabs[0].title || ''
                        });
                    } else {
                        resolve({ url: '', title: '' });
                    }
                });
            } else {
                // 如果tabs API不可用，返回空信息
                resolve({ url: '', title: '' });
            }
        } catch (error) {
            console.warn('获取标签页信息失败:', error);
            resolve({ url: '', title: '' });
        }
    });
}

/**
 * 验证笔记内容
 * @param {string} title - 笔记标题
 * @param {string} content - 笔记内容
 * @returns {Object} 验证结果
 */
function validateNote(title, content) {
    if (!title.trim() && !content.trim()) {
        return { valid: false, message: '标题和内容不能同时为空' };
    }
    
    if (title.length > 100) {
        return { valid: false, message: '标题长度不能超过100个字符' };
    }
    
    if (content.length > 10000) {
        return { valid: false, message: '内容长度不能超过10000个字符' };
    }
    
    return { valid: true, message: '' };
}

/**
 * 主题管理功能
 */
const ThemeManager = {
    /**
     * 获取当前主题
     * @returns {string} 当前主题
     */
    getCurrentTheme() {
        return localStorage.getItem('noteTheme') || 'light';
    },

    /**
     * 设置主题
     * @param {string} theme - 主题名称 (light/dark)
     */
    setTheme(theme) {
        const validThemes = ['light', 'dark'];
        if (!validThemes.includes(theme)) {
            console.warn(`无效的主题: ${theme}`);
            return;
        }

        localStorage.setItem('noteTheme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        
        // 更新主题切换按钮图标
        const themeButton = document.getElementById('themeToggle');
        if (themeButton) {
            themeButton.textContent = theme === 'dark' ? '☀️' : '🌙';
            themeButton.title = theme === 'dark' ? '切换到浅色主题' : '切换到深色主题';
        }
    },

    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },

    /**
     * 初始化主题
     */
    initTheme() {
        const savedTheme = this.getCurrentTheme();
        this.setTheme(savedTheme);
        
        // 检测系统主题偏好
        if (savedTheme === 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // 如果用户没有设置过主题，且系统偏好深色，则使用深色主题
            this.setTheme('dark');
        }
    }
};

// 导出工具函数
window.utils = {
    formatTimestamp,
    generateFrontmatter,
    generateFilename,
    showStatus,
    debounce,
    isFileSystemAccessAPIAvailable,
    getCurrentTabInfo,
    validateNote,
    escapeYamlString,
    ThemeManager
};
