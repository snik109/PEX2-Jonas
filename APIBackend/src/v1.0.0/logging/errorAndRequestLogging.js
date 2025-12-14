const fs = require('fs');
const path = require('path');

const logErrorFilePath = path.join(__dirname, 'errors.log');
const logBadRequestFilePath = path.join(__dirname, 'badRequests.log');
const logSuccessFilePath = path.join(__dirname, 'success.log');

const rotateLogFile = (filePath, maxSizeInBytes) => {
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size >= maxSizeInBytes) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                fs.renameSync(filePath, `${filePath}.${timestamp}`);
            }
        }
    } catch (err) {
        console.error(`Error rotating log file ${filePath}:`, err);
    }
};

const logError = (errorType, errorMessage, additionalInfo = {}) => {
    rotateLogFile(logErrorFilePath, 5 * 1024 * 1024); // 5 MB
    const timestamp = new Date().toISOString();

    const logEntry = {
        timestamp,
        errorType,
        errorMessage,
        ...additionalInfo
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    // Append to the log file
    fs.appendFileSync(logErrorFilePath, logLine, 'utf8');
};

const logBadRequestError = (errorType, errorMessage, additionalInfo = {}) => {
    rotateLogFile(logBadRequestFilePath, 5 * 1024 * 1024); // 5 MB
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        errorType,
        errorMessage,
        ...additionalInfo
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFileSync(logBadRequestFilePath, logLine, 'utf8');
}

const logSuccess = (message, additionalInfo = {}) => {
    rotateLogFile(logSuccessFilePath, 5 * 1024 * 1024); // 5 MB
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        message,
        ...additionalInfo
    }

    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFileSync(logSuccessFilePath, logLine, 'utf8');
};

const logValidationError = (errorMessage, additionalInfo = {}) => {
    logBadRequestError('BAD_REQUEST', errorMessage, additionalInfo);
};

const logBadRequest = (errorMessage, additionalInfo = {}) => {
    logBadRequestError('BAD_REQUEST', errorMessage, additionalInfo);
};

const logGeneralError = (errorMessage, additionalInfo = {}) => {
    logError('GENERAL_ERROR', errorMessage, additionalInfo);
};



module.exports = {
    logError,
    logValidationError,
    logBadRequest,
    logGeneralError,
    logSuccess
};
