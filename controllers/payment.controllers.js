const midtransClient = require("midtrans-client");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const nodemailer = require("../utils/nodemailer");
const { formattedDate } = require("../utils/formattedDate");

const { PAYMENT_CLIENT_KEY, PAYMENT_SERVER_KEY } = process.env;

module.exports = {
  createPayment: async (req, res, next) => {
    try {
      const { idCourse } = req.params;
      const { methodPayment, createdAt, updatedAt } = req.body;
      let PPN = 11 / 100;
      let amount;

      if (createdAt !== undefined || updatedAt !== undefined) {
        return res.status(400).json({
          status: false,
          message: "createdAt or updateAt cannot be provided during payment creation",
          data: null,
        });
      }

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
      if (!course.isPremium) {
        return res.status(400).json({
          status: false,
          message: `Course Free Not Able to Buy`,
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
            createAt: formattedDate(new Date()),
            updatedAt: formattedDate(new Date()),
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

      let payments = await prisma.payment.findMany({
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
        select: {
          id: true,
          status: true,
          createAt: true,
          methodPayment: true,
          course: {
            select: {
              courseName: true,
              category: {
                select: {
                  categoryName: true,
                },
              },
            },
          },
        },
      });
      payments = payments.map((val) => {
        let localDate = new Date(val.createAt);
        let timeString = localDate.toLocaleTimeString();
        let dateString = localDate.toDateString();
        val.createAt = `${dateString},${timeString}`;
        return val;
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
      let payments = await prisma.payment.findMany({
        where: {
          userId: Number(req.user.id),
        },
        select: {
          id: true,
          status: true,
          course: {
            select: {
              id: true,
              courseName: true,
              mentor: true,
              averageRating: true,
              duration: true,
              level: true,
              price: true,
              category: {
                select: {
                  categoryName: true,
                },
              },
              _count: {
                select: {
                  chapter: true,
                },
              },
            },
          },
        },
      });
      // Modify object property _count to modul
      payments = payments.map((val) => {
        val.course.modul = val.course._count.chapter;
        delete val.course._count;
        return val;
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

  createPaymentMidtrans: async (req, res, next) => {
    try {
      const courseId = req.params.courseId;
      const { methodPayment, cardNumber, cvv, expiryDate } = req.body;

      let month = expiryDate.slice(0, 2);
      let year = expiryDate.slice(3);

      const response = await axios.get(`https://api.sandbox.midtrans.com/v2/token?client_key=${PAYMENT_CLIENT_KEY}&card_number=${cardNumber}&card_cvv=${cvv}&card_exp_month=${month}&card_exp_year=${`20${year}`}`);

      const token_id = response.data.token_id;

      let core = new midtransClient.CoreApi({
        // Set to true if you want Production Environment (accept real transaction).
        isProduction: false,
        serverKey: PAYMENT_SERVER_KEY,
        clientKey: PAYMENT_CLIENT_KEY,
      });

      const user = await prisma.user.findUnique({
        where: { id: Number(req.user.id) },
        include: {
          userProfile: true,
        },
      });

      const course = await prisma.course.findUnique({
        where: { id: Number(courseId) },
      });

      const totalPrice = (course.price * 0, 11) + course.price;

      let newPayment = await prisma.payment.create({
        data: {
          amount: totalPrice,
          methodPayment,
          courseId: Number(courseId),
          userId: Number(req.user.id),
        },
      });

      let parameter = {
        payment_type: "credit_card",
        transaction_details: {
          order_id: 100 + newPayment.id,
          gross_amount: totalPrice,
        },
        credit_card: {
          token_id: token_id,
          authentication: true,
        },
        customer_details: {
          first_name: user.userProfile.fullName,
          email: user.email,
          phone: user.userProfile.phoneNumber,
        },
      };

      let transaction = await core.charge(parameter);

      res.status(201).json({
        status: true,
        message: "Payment initiated successfully",
        data: {
          newPayment,
          transaction,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  handlePaymentNotification: async (req, res) => {
    try {
      let core = new midtransClient.CoreApi({
        isProduction: false,
        serverKey: PAYMENT_SERVER_KEY,
        clientKey: PAYMENT_CLIENT_KEY,
      });

      let notification = {
        currency: req.body.currency,
        fraud_status: req.body.fraud_status,
        gross_amount: req.body.gross_amount,
        order_id: req.body.order_id,
        payment_type: req.body.payment_type,
        status_code: req.body.status_code,
        status_message: req.body.status_message,
        transaction_id: req.body.transaction_id,
        transaction_status: req.body.transaction_status,
        transaction_time: req.body.transaction_time,
        merchant_id: req.body.merchant_id,
      };

      let data = await core.transaction.notification(notification);

      const updatedPayment = await prisma.payment.update({
        where: { id: data.order_id },
        data: {
          status: "Paid",
          methodPayment: data.payment_type,
          updatedAt: new Date(),
        },
      });

      res.status(200).json({
        status: true,
        message: "Payment notification processed successfully",
        data: { updatedPayment },
      });
    } catch (err) {
      next(err);
    }
  },
};
