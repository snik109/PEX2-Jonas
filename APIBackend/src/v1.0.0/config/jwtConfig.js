const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { logError, logValidationError, logBadRequest, logGeneralError, logSuccess } = require("../logging/errorAndRequestLogging");

const envPath = path.resolve(__dirname, '../../../.env'); // adjust path if needed

// --- 1. Generate a strong random secret ---
function generateSecret() {
    return crypto.randomBytes(64).toString('hex'); // 512-bit
}

// --- 2. Save JWT_SECRET to .env ---
function saveSecretToEnv(secret) {
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (envContent.match(/^JWT_SECRET=.*/m)) {
        envContent = envContent.replace(/^JWT_SECRET=.*/m, `JWT_SECRET=${secret}`);
    } else {
        if (envContent.length && !envContent.endsWith('\n')) envContent += '\n';
        envContent += `JWT_SECRET=${secret}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
}

// --- 3. Ensure secret exists ---
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    JWT_SECRET = generateSecret();
    saveSecretToEnv(JWT_SECRET);
    console.log('Generated new JWT_SECRET and saved to .env');
    logSuccess('Generated new JWT_SECRET and saved to .env');
} else {
    console.log('JWT_SECRET already exists');
}

// --- 4. Calculate expiration until next 6 AM / 6 PM ---
function getNextExpiry() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    let nextExpiry;

    if (now.getHours() < 6) {
        nextExpiry = new Date(year, month, day, 6, 0, 0); // today 6 AM
    } else if (now.getHours() < 18) {
        nextExpiry = new Date(year, month, day, 18, 0, 0); // today 6 PM
    } else {
        nextExpiry = new Date(year, month, day + 1, 6, 0, 0); // tomorrow 6 AM
    }

    const expiresInSec = Math.floor((nextExpiry - now) / 1000);
    return expiresInSec;
}

// --- 5. Function to sign JWTs for users ---
function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: getNextExpiry() });
}

// --- 6. Function to verify JWTs ---
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(`Token verified for user: ${decoded.username || decoded.email || 'Unknown'}`);
        return {
            valid: true,
            user: decoded.username || decoded.email || 'Unknown',
            payload: decoded
        };
    } catch (err) {
        console.log(`Token verification failed: ${err.message}`);
        logGeneralError('Token verification failed', { error: err.message });
        throw new Error('Invalid or expired token');
    }
}

module.exports = {
    JWT_SECRET,
    signToken,
    verifyToken,
};
