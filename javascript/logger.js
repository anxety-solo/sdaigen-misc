const LOG_STYLES = {
    info: 'color: #00FFFF',
    warn: 'color: #FFA500',
    error: 'color: #FF005D',
    debug: 'color: #00FF8C'
};

function createLogger(prefix) {
    const basePrefix = `[sdAIgen-misc${prefix ? ` (${prefix})` : ''}]:`;

    const logMessage = (level, ...args) => {
        const style = LOG_STYLES[level] || LOG_STYLES.info;
        console[level](`%c${basePrefix}`, style, ...args);
    };

    const log = (...args) => logMessage('info', ...args);
    log.info = (...args) => logMessage('info', ...args);
    log.warn = (...args) => logMessage('warn', ...args);
    log.error = (...args) => logMessage('error', ...args);
    log.debug = (...args) => logMessage('debug', ...args);

    return log;
}

if (typeof window !== 'undefined') {
    window.createLogger = createLogger;
}