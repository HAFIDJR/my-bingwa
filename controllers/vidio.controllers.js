const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const imagekit = require("../libs/imagekit");

module.exports = {
  postVidio: async (req, res, next) => {
    try {
      const { idCourse } = req.body;
      const file = req.file;
      let vidioUrl = null;
      if (!file) {
        return res.status(400).json({
          status: false,
          message: "Vidio file is not found",
          data: null,
        });
      }
    } catch (err) {
      next(err);
    }
  },
};
