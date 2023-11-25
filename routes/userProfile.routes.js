const router = require("express").Router();
const { updateProfile } = require("../controllers/userProfile.controllers");
const { image } = require("../libs/multer");
const Auth = require("../middlewares/authentication");

router.put("/update-profile", Auth, image.single("image"), updateProfile);

module.exports = router;
