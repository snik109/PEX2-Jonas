const httpStatusCodes = require("./httpStatusCodes.json");
const { logError } = require("../logging/errorAndRequestLogging.js");

function respond(res, options = {}) {
    const {
        status,     // if you want to manually force a status code
        data,
        error,
        notFound,
        created,
        noContent,
        unauthorized,
        forbidden,
        conflict,
        tooManyRequests,
        badRequest
    } = options;

    // 1. Highest priority: explicit status override
    if (status) {
        return send(res, status, data, error);
    }

    // 2. Auto-detection logic
    if (badRequest) return send(res, 400, null, badRequest);
    if (unauthorized) return send(res, 401, null, unauthorized);
    if (forbidden) return send(res, 403, null, forbidden);
    if (notFound) return send(res, 404, null, notFound);
    if (conflict) return send(res, 409, null, conflict);
    if (tooManyRequests) return send(res, 429, null, tooManyRequests);
    if (created) return send(res, 201, data, null);

    if (noContent || data === null) {
        // 204 cannot include a JSON body
        return res.status(204).send();
    }

    if (error) {
        logError(error);
        return send(res, 500, null, error);
    }

    // Default successful response
    return send(res, 200, data, null);
}

/**
 * Internal sender that uses the status code map
 */
function send(res, statusCode, data, error) {
    const message = (`Status ${statusCode.toString()}: ${httpStatusCodes[statusCode]}`);



    const payload = {
        status: statusCode,
        success: statusCode < 400,
        message,
    };

    if (data !== null && data !== undefined) payload.data = data;
    if (error) payload.error = error;

    return res.status(statusCode).json(payload);
}

module.exports = respond;