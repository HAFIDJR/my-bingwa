const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  createReview: async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const { userRating, userComment } = req.body;

      if (isNaN(courseId) || courseId <= 0) {
        return res.status(400).json({
          status: false,
          message: "Invalid courseId provided",
          data: null,
        });
      }

      if (!Number.isInteger(userRating) || userRating < 1 || userRating > 5) {
        return res.status(400).json({
          status: false,
          message: "Invalid userRating provided. It must be an integer between 1 and 5.",
          data: null,
        });
      }

      let enrollment = await prisma.enrollment.findFirst({
        where: { userId: Number(req.user.id), courseId: Number(courseId) },
        include: { course: true },
      });

      if (!enrollment) {
        return res.status(404).json({
          status: false,
          message: "Please enroll in this course to review it",
          data: null,
        });
      }

      const existingReview = await prisma.review.findFirst({
        where: { enrollmentId: enrollment.id },
      });

      if (existingReview) {
        return res.status(400).json({
          status: false,
          message: "You have already submitted a review for this course",
          data: null,
        });
      }

      let newReview = await prisma.review.create({
        data: { userRating, userComment, enrollmentId: enrollment.id },
      });

      const existingReviews = await prisma.review.findMany({
        where: { enrollment: { courseId: Number(courseId) } },
      });

      const totalRating = existingReviews.reduce((sum, review) => sum + review.userRating, 0);
      const newAverageRating = totalRating / existingReviews.length;

      const updatedCourse = await prisma.course.update({
        where: { id: Number(courseId) },
        data: { averageRating: newAverageRating },
      });

      return res.status(200).json({
        status: true,
        message: "Create Review User successfully",
        data: { newReview, updatedCourse },
      });
    } catch (err) {
      next(err);
    }
  },
};
