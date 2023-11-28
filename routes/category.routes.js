const router = require("express").Router();
const { createCategory, deleteCategory, editCategory, showCategory } = require("../controllers/category.controllers");
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");

router.post("/", Auth, checkRole(["admin"]), createCategory);
router.get("/", Auth, checkRole(["admin"]), showCategory);
router.put("/:idCategory", editCategory);
router.delete("/:idCategory", deleteCategory);

module.exports = router;
