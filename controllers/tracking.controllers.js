const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  updateTracking: async (req, res, next) => {
    try {
      const lessonId = req.params.lessonId;

      if (isNaN(lessonId) || lessonId <= 0) {
        return res.status(400).json({
          status: false,
          message: "Invalid lessonId parameter",
          data: null,
        });
      }

      const lesson = await prisma.lesson.findUnique({
        where: { id: Number(lessonId) },
      });

      if (!lesson) {
        return res.status(404).json({
          status: false,
          message: "Lesson not found",
          data: null,
        });
      }

      const tracking = await prisma.tracking.update({
        where: {
          userId: Number(req.user.id),
          lessonId: Number(lessonId),
        },
        data: {
          status: true,
        },
      });

      res.status(200).json({
        status: true,
        message: "Tracking updated successfully",
        data: { tracking },
      });
    } catch (err) {
      next(err);
    }
  },
};
