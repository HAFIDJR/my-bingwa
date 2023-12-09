const router = require("express").Router();
const { getAllPayments, getPaymentHistory, createPayment, getDetailPayment } = require("../controllers/payment.controllers");
const Auth = require("../middlewares/authentication");
const checkRole = require("../middlewares/checkRole");

router.get("/", Auth, checkRole(["admin"]), getAllPayments);
router.get("/history", Auth, checkRole(["user", "admin"]), getPaymentHistory);
router.get("/:idCourse/course", getDetailPayment);
router.post("/:idCourse/course", Auth, checkRole(["user", "admin"]), createPayment);

module.exports = router;
