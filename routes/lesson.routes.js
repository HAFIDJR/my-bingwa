const router = require("express").Router();
const {
  createLesson,
  getAllLessons,
  getDetailLesson,
  updateDetailLesson,
  deleteLessonById,
  searchLesson,
} = require("../controllers/lesson.controllers");
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");

router.post("/", Auth, checkRole(["admin"]), createLesson);
router.get("/", getAllLessons);
router.get("/search", Auth, checkRole(["admin"]), searchLesson); //search Lesson for Admin
router.get("/:id", Auth, checkRole(["user", "admin"]), getDetailLesson);
router.put("/:id", Auth, checkRole(["admin"]), updateDetailLesson);
router.delete("/:id", Auth, checkRole(["admin"]), deleteLessonById);

module.exports = router;
