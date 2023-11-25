const router = require("express").Router();
const {
  createCategory,
  deleteCategory,
  editCategory,
  showCategory,
} = require("../controllers/category.controllers");
const Auth = require("../middlewares/authentication");
const { authorize } = require("../utils/role");
router.use(Auth);
router.post("/", authorize, createCategory);
router.get("/", authorize, showCategory);
router.put("/:idCategory", editCategory);
router.delete("/:idCategory", deleteCategory);

module.exports = router;
