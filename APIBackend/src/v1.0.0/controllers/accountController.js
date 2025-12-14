const { signToken } = require('../config/jwtConfig');
const bcrypt = require('bcryptjs');
const { getAccountByUsername, createAccount, validateObject, deleteAccountByUsername, updateAccount } = require('../data/accountDatabase');

const checkLogIn = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await getAccountByUsername(username);
        if (!user) return res.status(401).json({ message: 'Authentication failed' });
        const token = signToken({ id: user.id, username: user.username });
        if (user.passwordHash === undefined) return res.status(200).json({ message: 'Authentication successful due to no password assuming temporary account', token });
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return res.status(401).json({ message: 'Authentication failed' });

        return res.status(200).json({ message: 'Authentication successful', token });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const register = async (req, res) => {
    const {
        username,
        password,
        email,
        fullName,
        isAdmin
    } = req.body;

    const validation = validateObject(req.body);
    if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
    }

    const existing = await getAccountByUsername(username);
    if (existing) {
        return res.status(400).json({ message: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 14);

    const newUser = await createAccount({
        username,
        passwordHash,
        email,
        fullName,
        isAdmin: !!isAdmin
    });

    return res.status(201).json({
        message: "Account created",
        user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.fullName,
            isAdmin: newUser.isAdmin
        }
    });
};


const deleteLogins = async (req, res) => {
    const { usernames } = req.body;
    if (!Array.isArray(usernames) || usernames.length === 0) {
        return res.status(400).json({ message: "No usernames provided" });
    }
    let deletedCount = 0;
    for (const username of usernames) {
        const deleted = await deleteAccountByUsername(username);
        if (deleted) deletedCount++;
    }

    return res.status(200).json({ message: `${deletedCount} accounts deleted` });
};

const updateProfile = async (req, res) => {
    const { email, fullName, profilePicture, theme, notifications } = req.body;
    const username = req.user.username;

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const updates = {};
        if (email !== undefined) updates.email = email;
        if (fullName !== undefined) updates.fullName = fullName;
        if (profilePicture !== undefined) updates.profilePicture = profilePicture;
        if (theme !== undefined) updates.theme = theme;
        if (notifications !== undefined) updates.notifications = notifications;

        const updated = await updateAccount(username, updates);
        if (!updated) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'Profile updated', user: updated });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getProfile = async (req, res) => {
    const username = req.user.username;

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await getAccountByUsername(username);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Don't send password hash
        const { passwordHash, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllAccounts = async (req, res) => {
    try {
        const allAccounts = require('../data/accountDatabase').getAllAccounts;
        const all = await allAccounts();
        // Remove password hashes from response
        const safe = all.map(({ passwordHash, ...account }) => account);
        return res.status(200).json(safe);
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateAccountAdmin = async (req, res) => {
    const { username, email, fullName, profilePicture, theme, notifications, isAdmin } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        const updates = {};
        if (email !== undefined) updates.email = email;
        if (fullName !== undefined) updates.fullName = fullName;
        if (profilePicture !== undefined) updates.profilePicture = profilePicture;
        if (theme !== undefined) updates.theme = theme;
        if (notifications !== undefined) updates.notifications = notifications;
        if (isAdmin !== undefined) updates.isAdmin = isAdmin;

        const updated = await updateAccount(username, updates);
        if (!updated) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'Account updated', user: updated });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const username = req.user.username;

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old password and new password are required' });
    }

    try {
        const user = await getAccountByUsername(username);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const passwordMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Old password is incorrect' });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 14);
        const updated = await updateAccount(username, { passwordHash: newPasswordHash });

        if (!updated) {
            return res.status(500).json({ message: 'Failed to update password' });
        }

        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    checkLogIn,
    register,
    deleteLogins,
    updateProfile,
    getProfile,
    getAllAccounts,
    updateAccountAdmin,
    changePassword
};