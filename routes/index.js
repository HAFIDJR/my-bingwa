const router = require("express").Router();
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");

const User = require("./user.routes");
const UserProfile = require("./userProfile.routes");
const Category = require("./category.routes");
const Course = require("./course.routes");
const Chapter = require("./chapter.routes");
const Lesson = require("./lesson.routes");

const file = fs.readFileSync("docs/swagger.yaml", "utf8");

// API Docs
const swaggerDocument = YAML.parse(file);
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API
router.use("/api/v1/users", User);
router.use("/api/v1/user-profiles", UserProfile);
router.use("/api/v1/categories", Category);
router.use("/api/v1/courses", Course);
router.use("/api/v1/chapters", Chapter);
router.use("/api/v1/lessons", Lesson);

module.exports = router;
