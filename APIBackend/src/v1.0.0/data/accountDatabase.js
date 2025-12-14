const fs = require("fs").promises;
const path = require("path");

const DB_PATH = path.join(__dirname, "accounts.json");

const allowedFields = ['username', 'password', 'email', 'fullName', 'profilePicture', 'theme', 'notifications', 'isAdmin'];

// Validate ticket object - returns {valid: boolean, error: string|null}
const validateObject = (object) => {
    const keys = Object.keys(object);
    for (let key of keys) {
        if (!allowedFields.includes(key)) {
            console.log(key);
            console.log(allowedFields);
            return { valid: false, error: `Field "${key}" is not allowed. Allowed fields are: ${allowedFields.join(', ')}` };
        }
    }
    return { valid: true, error: null };
};
/**
 * Reads the JSON database safely.
 */
async function readDB() {
    try {
        const data = await fs.readFile(DB_PATH, "utf8");
        return JSON.parse(data);
    } catch (err) {
        // If file doesn't exist, create it
        if (err.code === "ENOENT") {
            await fs.writeFile(DB_PATH, JSON.stringify([], null, 2));
            return [];
        }
        throw err;
    }
}

/**
 * Writes to the JSON database safely.
 */
async function writeDB(accounts) {
    await fs.writeFile(DB_PATH, JSON.stringify(accounts, null, 2));
}

/**
 * Get all accounts.
 */
async function getAllAccounts() {
    return await readDB();
}

/**
 * Get one account by username.
 */
async function getAccountByUsername(username) {
    const accounts = await readDB();
    return accounts.find(acc => acc.username === username);
}

/**
 * Create a new account.
 * Automatically assigns a unique id.
 */
async function createAccount(account) {
    const accounts = await readDB();

    const maxId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) : 0;
    const newAccount = {
        id: maxId + 1,
        ...account
    };

    accounts.push(newAccount);
    await writeDB(accounts);

    return newAccount;
}

async function deleteAccountByUsername(username) {
    let accounts = await readDB();
    const initialLength = accounts.length;
    accounts = accounts.filter(acc => acc.username !== username);

    if (accounts.length === initialLength) {
        return false; // No account was deleted
    }

    await writeDB(accounts);
    return true; // Account was deleted
}

/**
 * Update account by username.
 */
async function updateAccount(username, updates) {
    const accounts = await readDB();
    const account = accounts.find(acc => acc.username === username);

    if (!account) {
        return null;
    }

    // Only update allowed fields
    const allowedUpdateFields = ['email', 'fullName', 'profilePicture', 'theme', 'notifications', 'isAdmin', 'passwordHash'];
    for (const field of allowedUpdateFields) {
        if (field in updates) {
            account[field] = updates[field];
        }
    }

    await writeDB(accounts);
    return account;
}

module.exports = {
    getAllAccounts,
    getAccountByUsername,
    createAccount,
    validateObject,
    deleteAccountByUsername,
    updateAccount
};