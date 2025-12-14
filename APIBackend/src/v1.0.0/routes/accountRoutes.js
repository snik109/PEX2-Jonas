const express = require('express');
const router = express.Router();
const { checkLogIn, register, deleteLogins, updateProfile, getProfile, getAllAccounts, updateAccountAdmin, changePassword } = require('../controllers/accountController');
const { auth, authAdmin } = require('../authorization/auth');

//Post | www.localhost:3872/api/v1/accounts
router.post("/", checkLogIn);
router.post("/register", authAdmin, register);
router.post("/change-password", auth, changePassword);
router.delete("/", authAdmin, deleteLogins);
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);
router.put("/:username", authAdmin, updateAccountAdmin);
router.get("/", authAdmin, getAllAccounts);

module.exports = router;
