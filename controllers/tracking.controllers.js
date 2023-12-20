const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { formattedDate } = require("../utils/formattedDate");

let reminderTimeout;

module.exports = {
  updateTracking: async (req, res, next) => {
    try {
      const lessonId = req.params.lessonId;
      const { createdAt, updatedAt } = req.body;

      if (isNaN(lessonId) || lessonId <= 0) {
        return res.status(400).json({
          status: false,
          message: "Invalid lessonId parameter",
          data: null,
        });
      }

      if (createdAt !== undefined || updatedAt !== undefined) {
        return res.status(400).json({
          status: false,
          message: "createdAt or updateAt cannot be provided during tracking update",
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

      // find id traking lesson
      const trackingId = await prisma.tracking.findFirst({
        where: {
          lessonId: Number(lessonId),
          userId: Number(req.user.id),
        },
        select: {
          id: true,
        },
      });
      const tracking = await prisma.tracking.update({
        where: {
          id: trackingId.id,
        },
        data: {
          status: true,
          updatedAt: new Date(),
        },
      });

      // update progres course
      let courseId = tracking.courseId;
      let lessonLenght;
      let lessonTrue = 0;
      let newProgres;
      const lessonUser = await prisma.tracking.findMany({
        where: {
          userId: Number(req.user.id),
          courseId: Number(courseId),
        },
      });

      lessonLenght = lessonUser.length;
      lessonUser.forEach((val) => {
        if (val.status == true) {
          lessonTrue++;
        }
      });
      newProgres = (100 / lessonLenght) * lessonTrue;

      // find enrollment id
      const enrolId = await prisma.enrollment.findFirst({
        where: {
          userId: Number(req.user.id),
          courseId: Number(courseId),
        },
        select: {
          id: true,
        },
      });
      const data = await prisma.enrollment.update({
        where: {
          id: enrolId.id,
        },
        data: {
          progres: newProgres.toFixed(1),
          updatedAt: formattedDate(new Date()),
        },
      });
      // end update progres

      if (reminderTimeout) {
        clearTimeout(reminderTimeout);
      }

      const allTracking = await prisma.tracking.findMany({
        where: { userId: Number(req.user.id), status: false },
      });

      if (allTracking.length > 0 && !allTracking[0].status) {
        reminderTimeout = setTimeout(async () => {
          const lastUpdate = new Date(tracking.updatedAt).getTime();
          const currentTime = new Date().getTime();
          const timeDifference = currentTime - lastUpdate;

          if (timeDifference >= 24 * 60 * 60 * 1000) {
            await prisma.notification.create({
              data: {
                title: "Reminder",
                message: "You haven't updated your progress in the last 24 hours. Please continue learning.",
                userId: Number(req.user.id),
                createdAt: formattedDate(new Date()),
              },
            });
          }
        }, 24 * 60 * 60 * 1000);
      }

      res.status(200).json({
        status: true,
        message: "Tracking updated successfully",
        data: { tracking },
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
