const router = require("express").Router();
const { register, login, verifyOtp, resendOtp, forgetPasswordUser, updatePasswordUser, authenticateUser } = require("../controllers/user.controllers");
const Auth = require("../middlewares/authentication");

router.post("/register", register);
router.post("/login", login);
router.put("/verify-otp", verifyOtp);
router.put("/resend-otp", resendOtp);
router.post("/forget-password", forgetPasswordUser);
router.put("/update-password", updatePasswordUser);
router.get("/authenticate", Auth, authenticateUser);

module.exports = router;
