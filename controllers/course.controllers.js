const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const getPagination = require("../utils/getPaggination");

module.exports = {
  createCourse: async (req, res, next) => {
    try {
      const { price, isPremium, categoryId, promotionId, averageRating } = req.body;

      if (averageRating !== undefined) {
        return res.status(400).json({
          status: false,
          message: "averageRating cannot be provided during course creation",
          data: null,
        });
      }

      if (!isPremium && price) {
        return res.status(400).json({
          status: false,
          message: "free class price must be 0",
          data: null,
        });
      }

      let category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });

      if (!category) {
        return res.status(404).json({
          status: false,
          message: "Category not found",
          data: null,
        });
      }

      if (promotionId) {
        promotion = await prisma.promotion.findUnique({
          where: { id: Number(promotionId) },
        });

        if (!promotion) {
          return res.status(404).json({
            status: false,
            message: "Promotion not found",
            data: null,
          });
        }
      }

      let newCourse = await prisma.course.create({
        data: {
          ...req.body,
        },
      });

      return res.status(201).json({
        status: true,
        message: "create Kelas successful",
        data: { newCourse },
      });
    } catch (err) {
      next(err);
    }
  },

  editCourse: async (req, res, next) => {
    try {
      const { idCourse } = req.params;

      const { averageRating } = req.body;

      const checkCourse = await prisma.course.findFirst({
        where: {
          id: Number(idCourse),
        },
      });
      if (!checkCourse) {
        return res.status(404).json({
          status: false,
          message: `Course Not Found With Id ${idCourse}`,
          data: null,
        });
      }

      if (averageRating !== undefined) {
        return res.status(400).json({
          status: false,
          message: "averageRating cannot be provided during course creation",
          data: null,
        });
      }

      let editedCourse = await prisma.course.update({
        where: {
          id: Number(idCourse),
        },
        data: {
          ...req.body,
        },
      });
      return res.status(200).json({
        status: true,
        message: "Update Kelas successful",
        data: { editedCourse },
      });
    } catch (err) {
      next(err);
    }
  },

  deleteCourse: async (req, res, next) => {
    try {
      const { idCourse } = req.params;
      let deletedCourse = await prisma.course.delete({
        where: {
          id: Number(idCourse),
        },
      });
      res.status(200).json({
        status: true,
        message: "delete Kelas successful",
        data: { deletedCourse },
      });
    } catch (err) {
      next(err);
    }
  },

  detailCourse: async (req, res, next) => {
    try {
      const { idCourse } = req.params;
      const checkCourse = await prisma.course.findFirst({
        where: {
          id: Number(idCourse),
        },
      });
      if (!checkCourse) {
        return res.status(404).json({
          status: false,
          message: `Course Not Found With Id ${idCourse}`,
          data: null,
        });
      }
      const course = await prisma.course.findUnique({
        where: {
          id: Number(idCourse),
        },
        include: {
          category: {
            select: {
              categoryName: true,
            },
          },
          chapter: {
            include: {
              lesson: true,
            },
          },
        },
      });
      res.status(200).json({
        status: true,
        message: ` Detail Kelas with id:${idCourse} successful`,
        data: { course },
      });
    } catch (err) {
      next(err);
    }
  },

  getMyCourse: async (req, res, next) => {
    try {
      const { email } = req.user;
      const { enrollment } = await prisma.user.findUnique({
        where: {
          email: email,
        },
        include: {
          enrollment: {
            select: {
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
                },
              },
            },
          },
        },
      });
      let courseUser = [];
      enrollment.forEach((val) => {
        courseUser.push(val["course"]);
      });
      res.json({
        status: true,
        message: "Success",
        data: courseUser,
      });
    } catch (error) {
      next(error);
    }
  },
  getCourse: async (req, res, next) => {
    try {
      const { filter, category, level } = req.query;
      if (filter || category || level) {
        const filterOptions = {
          populer: { orderBy: { rating: "desc" } },
          terbaru: { orderBy: { createdAt: "desc" } },
          promo: { where: { promotionId: { not: null } } },
        };
        const query = {
          ...filterOptions[filter],
          where: {
            category: {
              categoryName: typeof category !== "string" ? { in: [...category] } : { in: [category] },
            },
            ...(level && { level: level }),
          },
        };
        const courses = await prisma.course.findMany(query);
        res.status(200).json({
          status: true,
          message: "Get Course Success",
          data: courses,
        });
      } else if (req.query.search) {
        const { search } = req.query;
        const courses = await prisma.course.findMany({
          where: {
            courseName: {
              contains: search,
              mode: "insensitive",
            },
          },
        });

        res.status(200).json({
          status: true,
          message: "Get Course Success",
          data: courses,
        });
      } else {
        const { limit = 10, page = 1 } = req.query;
        const courses = await prisma.course.findMany({
          include: {
            category: {
              select: {
                categoryName: true,
              },
            },
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        });

        const { _count } = await prisma.course.aggregate({
          _count: { id: true },
        });

        const paggination = getPagination(req, _count.id, Number(page), Number(limit));

        res.status(200).json({
          status: true,
          message: "Show All Kelas successful",
          data: { paggination, courses },
        });
      }
    } catch (err) {
      next(err);
    }
  },
};
