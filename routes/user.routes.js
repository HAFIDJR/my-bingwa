const router = require("express").Router();
const { register, login, verifyOtp, resendOtp, forgetPasswordUser, updatePasswordUser, authenticateUser, changePasswordUser } = require("../controllers/user.controllers");
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");

router.post("/register", register);
router.post("/login", login);
router.put("/verify-otp", verifyOtp);
router.put("/resend-otp", resendOtp);
router.post("/forget-password", forgetPasswordUser);
router.put("/update-password", updatePasswordUser);
router.get("/authenticate", Auth, checkRole(["user", "admin"]), authenticateUser);
router.put("/change-password", Auth, checkRole(["user", "admin"]), changePasswordUser);


module.exports = router;
