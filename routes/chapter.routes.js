const router = require('express').Router()
const { createChapter, getChapters, getChapterById, updateCHapter, deleteChapter } = require("../controllers/chapter.controllers")
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");

router.post("/", Auth, checkRole(["admin"]), createChapter)
router.get("/", getChapters)
router.get("/:id", getChapterById)
router.put("/:id", Auth, checkRole(["admin"]), updateCHapter)
router.delete("/:id", Auth, checkRole(["admin"]), deleteChapter)

module.exports = router