const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  courseEnrollment: async (req, res, next) => {
    try {
      const { courseId } = req.params;

      if (isNaN(courseId)) {
        return res.status(400).json({
          status: false,
          message: "Invalid courseId provided",
          data: null,
        });
      }

      const course = await prisma.course.findUnique({
        where: {
          id: Number(courseId),
        },
      });

      if (!course) {
        return res.status(404).json({
          status: false,
          message: `Course not found with id ${courseId}`,
          data: null,
        });
      }

      const statusEnrollUser = await prisma.enrollment.findFirst({
        where: {
          courseId: Number(courseId),
          userId: Number(req.user.id),
        },
      });

      if (statusEnrollUser) {
        return res.status(400).json({
          status: false,
          message: `User Alrady Enroll this Course`,
          data: null,
        });
      }

      if (course.isPremium) {
        return res.status(400).json({
          status: false,
          message: "This course is premium. You must pay before enrolling.",
          data: null,
        });
      }

      let enrollCourse = await prisma.enrollment.create({
        data: {
          userId: Number(req.user.id),
          courseId: Number(courseId),
        },
      });

      const lessons = await prisma.lesson.findMany({
        where: {
          chapter: {
            courseId: Number(courseId),
          },
        },
      });

      const trackingRecords = await Promise.all(
        lessons.map(async (lesson) => {
          return prisma.tracking.create({
            data: {
              userId: Number(req.user.id),
              lessonId: lesson.id,
              courseId: Number(courseId),
              status: false,
              createdAt: formattedDate(new Date()),
              updatedAt: formattedDate(new Date()),
            },
            include: {
              lesson: {
                select: {
                  lessonName: true,
                },
              },
            },
          });
        })
      );

      setTimeout(async () => {
        const allTracking = await prisma.tracking.findMany({
          where: { userId: Number(req.user.id), status: true },
        });

        if (allTracking.length === 0 || !allTracking[0].status) {
          await prisma.notification.create({
            data: {
              title: "Reminder",
              message: "You have incomplete lessons. Please continue your learning.",
              userId: Number(req.user.id),
              createdAt: formattedDate(new Date()),
            },
          });
        }
      }, 24 * 60 * 60 * 1000);

      res.status(201).json({
        status: true,
        message: "Succes To Enroll Course",
        data: { enrollCourse, trackingRecords },
      });
    } catch (err) {
      next(err);
    }
  },

  getAllEnrollment: async (req, res, next) => {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: req.user.id },
        include: {
          course: {
            select: {
              courseName: true,
              level: true,
              mentor: true,
              duration: true,
              courseImg: true,
              createdAt: true,
              categoryId: true,
              category: {
                select: {
                  categoryName: true,
                },
              },
              chapter: {
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                  duration: true,
                  lesson: {
                    select: {
                      lessonName: true,
                      videoURL: true,
                      createdAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      return res.status(200).json({
        status: true,
        message: "Get all enrollments successful",
        data: { enrollments },
      });
    } catch (err) {
      next(err);
    }
  },

  getDetailEnrollment: async (req, res, next) => {
    try {
      const enrollmentId = req.params.id;

      if (isNaN(enrollmentId)) {
        return res.status(400).json({
          status: false,
          message: "Invalid enrollmentId provided",
          data: null,
        });
      }

      let enrollment = await prisma.enrollment.findUnique({
        where: { id: Number(enrollmentId) },
        include: {
          course: {
            select: {
              courseName: true,
              level: true,
              mentor: true,
              duration: true,
              courseImg: true,
              createdAt: true,
              categoryId: true,
              category: {
                select: {
                  categoryName: true,
                },
              },
              chapter: {
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                  duration: true,
                  lesson: {
                    select: {
                      lessonName: true,
                      videoURL: true,
                      createdAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!enrollment) {
        return res.status(404).json({
          status: false,
          message: "Enrollment not found",
          data: null,
        });
      }

      return res.status(200).json({
        status: true,
        message: "Get detail enrollment successful",
        data: { enrollment },
      });
    } catch (err) {
      next(err);
    }
  },
};
