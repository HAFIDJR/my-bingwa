const router = require("express").Router();
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const User = require("./user.routes");
const UserProfile = require("./userProfile.routes");
const Category = require("./category.routes");
const Course = require("./kelas.routes")
const file = fs.readFileSync("docs/swagger.yaml", "utf8");

// API Docs
const swaggerDocument = YAML.parse(file);
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API
router.use("/api/v1/users", User);
router.use("/api/v1/user-profiles", UserProfile);
router.use("/api/v1/category", Category);
router.use("/api/v1/course", Course);
module.exports = router;
