const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

module.exports = function (req, res, next) {
  let { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized",
      err: "missing token on header!",
      data: null,
    });
  }

  const token = authorization.split("Bearer ")[1];

  jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
        err: err.message,
        data: null,
      });
    }

    try {
      req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
    } catch (err) {
      next(err);
    }

    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "unauthenticated",
        err: "email is not register",
        data: null,
      });
    }
    if (!req.user.isVerified) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
        err: "You need to verify your email to continue",
        data: null,
      });
    }

    next();
  });
};
