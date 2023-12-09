const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const nodemailer = require("../utils/nodemailer");
module.exports = {
  createPayment: async (req, res, next) => {
    try {
      const { idCourse } = req.params;
      const { methodPayment } = req.body;
      let PPN = 11 / 100;
      let amount;
      // find Course
      let course = await prisma.course.findFirst({
        where: {
          id: Number(idCourse),
        },
      });
      if (!course) {
        return res.status(404).json({
          status: false,
          message: `Course Not Found With Id ${idCourse}`,
          data: null,
        });
      }
      // end find course

      // check user alredy enroll course or not
      const statusEnrollUser = await prisma.enrollment.findFirst({
        where: {
          courseId: Number(idCourse),
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
      // end check user alredy enroll course or not

      // create payment
      amount = course.price * PPN + course.price;

      if (!methodPayment || typeof methodPayment != "string") {
        return res.status(400).json({
          status: false,
          message: `Bad Request for method payment`,
          data: null,
        });
      }
      try {
        let newPayment = await prisma.payment.create({
          data: {
            amount,
            courseId: Number(idCourse),
            userId: Number(req.user.id),
            status: "paid",
            methodPayment,
          },
        });
        const html = await nodemailer.getHtml("transaction-succes.ejs", {
          course: course.courseName,
        });
        nodemailer.sendEmail(req.user.email, "Email Transaction", html);

        // update data enrollment when payment succesfully
        await prisma.enrollment.create({
          data: {
            userId: Number(req.user.id),
            courseId: Number(idCourse),
          },
        });

        const lessons = await prisma.lesson.findMany({
          where: {
            chapter: {
              courseId: Number(idCourse),
            },
          },
        });

        await Promise.all(
          lessons.map(async (lesson) => {
            return prisma.tracking.create({
              data: {
                userId: Number(req.user.id),
                lessonId: lesson.id,
                status: false,
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

        res.status(201).json({
          status: true,
          message: "succes to Create Payment",
          data: { newPayment },
        });
      } catch (err) {
        res.status(400).json({
          status: false,
          message: "Error When Create Payment,make sure request is valid type",
          error: err.message,
        });
      }
      // end create payment
    } catch (err) {
      next(err);
    }
  },
  getDetailPayment: async (req, res, next) => {
    try {
      const { idCourse } = req.params;
      const PPN = 11 / 100;
      let amount;
      // find course
      let course = await prisma.course.findFirst({
        where: {
          id: Number(idCourse),
        },
        select: {
          id: true,
          courseName: true,
          price: true,
          mentor: true,
          category: {
            select: {
              categoryName: true,
            },
          },
        },
      });
      if (!course) {
        return res.status(404).json({
          status: false,
          message: `Course Not Found With Id ${idCourse}`,
          data: null,
        });
      }
      // end find course
      amount = course.price * PPN + course.price;
      res.status(200).json({
        status: true,
        message: `Succes To Show Detail Payment`,
        data: {
          course,
          PPN: PPN * course.price,
          amount,
        },
      });
    } catch (err) {
      next(err);
    }
  },
  getAllPayments: async (req, res, next) => {
    try {
      const { search } = req.query;

      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { status: { contains: search, mode: "insensitive" } },
            {
              course: { courseName: { contains: search, mode: "insensitive" } },
            },
            {
              user: {
                userProfile: {
                  fullName: { contains: search, mode: "insensitive" },
                },
              },
            },
            {
              course: {
                category: {
                  categoryName: { contains: search, mode: "insensitive" },
                },
              },
            },
          ],
        },
        include: {
          user: {
            include: {
              userProfile: true,
            },
          },
          course: {
            include: {
              category: true,
            },
          },
        },
      });

      res.status(200).json({
        status: true,
        message: "Get all payments successful",
        data: { payments },
      });
    } catch (err) {
      next(err);
    }
  },
  getPaymentHistory: async (req, res, next) => {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          userId: Number(req.user.id),
        },
        include: {
          course: {
            include: {
              category: true,
            },
          },
        },
      });

      res.status(200).json({
        status: true,
        message: "Get all payment history successful",
        data: { payments },
      });
    } catch (err) {
      next(err);
    }
  },
};
