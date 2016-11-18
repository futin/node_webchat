var levels = ['info', 'debug', 'error', 'production'];

var logger = {
    debugLevel: 'production',
    info: (message) => {
        printLog(message, 'info');
    },
    debug: (message) => {
        printLog(message, 'debug');
    },
    error: (message) => {
        printLog(message, 'error');
    }
};

function printLog(message, level) {
    if (levels.indexOf(level) >= levels.indexOf(logger.debugLevel)) {
        if (typeof message !== 'string') {
            message = JSON.stringify(message);
        }
        console.log(message);
    }
}

module.exports = {
    logger: logger
};