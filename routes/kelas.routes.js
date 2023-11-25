const router = require("express").Router();
const {
  createCourse,
  editCourse,
  deleteCourse,
  detailCourse,
  showAllCourse,
} = require("../controllers/kelas.controllers");
const Auth = require("../middlewares/authentication");
const { authorize } = require("../utils/role");
router.use(Auth);
router.get("/", authorize, showAllCourse);
router.get("/:idCourse", authorize, detailCourse);
router.post("/", authorize, createCourse);
router.put("/:idCourse", authorize, editCourse);
router.delete("/:idCourse", authorize, deleteCourse);

module.exports = router;
