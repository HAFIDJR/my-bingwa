const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
module.exports = {
  detailDashboard: async (req, res, next) => {
    try {
      let countUser = await prisma.user.count();
      let allCourse = await prisma.course.count();
      let coursePremium = await prisma.course.count({
        where: {
          isPremium: true,
        },
      });
      res.status(200).json({
        status: true,
        message: "Succes to show detail data dashboard",
        data: {
          countUser,
          allCourse,
          coursePremium,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
