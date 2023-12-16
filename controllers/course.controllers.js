const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const getPagination = require("../utils/getPaggination");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  createCourse: async (req, res, next) => {
    try {
      const { price, isPremium, categoryId, promotionId, averageRating, createdAt, updatedAt } = req.body;

      if (isPremium !== undefined || averageRating !== undefined || createdAt !== undefined || updatedAt !== undefined) {
        return res.status(400).json({
          status: false,
          message: "isPremium, averageRating, createdAt, or updateAt cannot be provided during course creation",
          data: null,
        });
      }

      const updatedIsPremium = price > 0 ? true : false;

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
          isPremium: updatedIsPremium,
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
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

      const { price, isPremium, averageRating, createdAt, updatedAt } = req.body;

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

      if (isPremium !== undefined || averageRating !== undefined || createdAt !== undefined || updatedAt !== undefined) {
        return res.status(400).json({
          status: false,
          message: "isPremium, averageRating, createdAt, or updateAt cannot be provided during course update",
          data: null,
        });
      }

      const updatedIsPremium = price > 0 ? true : false;

      let editedCourse = await prisma.course.update({
        where: {
          id: Number(idCourse),
        },
        data: {
          ...req.body,
          isPremium: updatedIsPremium,
          updatedAt: formattedDate(new Date()),
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
            select: {
              name: true,
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
          enrollment: {
            select: {
              review: {
                select: {
                  userRating: true,
                  userComment: true,
                  createdAt: true,
                },
              },
            },
          },
          _count: {
            select: {
              chapter: true,
            },
          },
        },
      });
      // Modify object property count to modul
      course["modul"] = course._count.chapter;
      delete course["_count"];
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
      const { id } = req.user;
      const { search, filter, category, level, page = 1, limit = 10 } = req.query;

      const countEnrollCourse = await prisma.course.count({
        where: {
          enrollment: {
            some: {
              userId: {
                equals: Number(id),
              },
            },
          },
        },
      });

      const pagination = getPagination(req, countEnrollCourse, Number(page), Number(limit));

      let coursesQuery = {
        where: {},
      };

      if (search) {
        coursesQuery.where.OR = [{ courseName: { contains: search, mode: "insensitive" } }, { mentor: { contains: search, mode: "insensitive" } }];
      }

      if (filter) {
        coursesQuery.orderBy = [];
        if (filter.includes("newest")) {
          coursesQuery.orderBy.push({ createdAt: "desc" });
        }
        if (filter.includes("populer")) {
          coursesQuery.orderBy.push({ averageRating: "desc" });
        }
        if (filter.includes("promo")) {
          coursesQuery.where.promotionId = { not: null };
        }
      }

      if (category) {
        const categories = Array.isArray(category) ? category.map((c) => c.toLowerCase()) : [category.toLowerCase()];
        coursesQuery.where.category = {
          categoryName: { in: categories, mode: "insensitive" },
        };
      }

      if (level) {
        const levels = Array.isArray(level) ? level : [level];
        coursesQuery.where.level = { in: levels };
      }
      let courseNotEnrol = await prisma.course.findMany({
        where: {
          enrollment: {
            none: {
              userId: {
                equals: Number(id),
              },
            },
          },
        },
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
              id: true,
              categoryName: true,
            },
          },
          _count: {
            select: {
              chapter: true,
            },
          },
        },
      });

      let course = await prisma.course.findMany({
        where: {
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          enrollment: {
            some: {
              userId: {
                equals: Number(id),
              },
            },
          },
          ...coursesQuery.where,
        },
        select: {
          id: true,
          courseName: true,
          mentor: true,
          averageRating: true,
          duration: true,
          level: true,
          price: true,
          isPremium: true,
          category: {
            select: {
              id: true,
              categoryName: true,
            },
          },
          enrollment: {
            select: {
              id: true,
              progres: true,
            },
          },
          _count: {
            select: {
              chapter: true,
            },
          },
        },
      });

      // Modify object property count to modul
      course = course.map((val) => {
        val["modul"] = val._count.chapter;
        delete val["_count"];
        return val;
      });
      courseNotEnrol = courseNotEnrol.map((val) => {
        val["modul"] = val._count.chapter;
        delete val["_count"];
        return val;
      });
      res.json({
        status: true,
        message: "Success",
        data: { course, pagination },
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  detailMyCourse: async (req, res, next) => {
    try {
      const { idCourse } = req.params;
      const findCourse = await prisma.enrollment.findFirst({
        where: {
          courseId: Number(idCourse),
          userId: req.user.id,
        },
      });
      if (!findCourse) {
        return res.status(400).json({
          status: false,
          message: "You Not Enroll this course ",
          data: null,
        });
      }
      const course = await prisma.course.findFirst({
        where: {
          enrollment: {
            some: {
              userId: {
                equals: Number(req.user.id),
              },
              courseId: {
                equals: Number(idCourse),
              },
            },
          },
        },
        include: {
          category: {
            select: {
              categoryName: true,
            },
          },
          enrollment: {
            select: {
              progres: true,
            },
          },
          chapter: {
            select: {
              name: true,
              lesson: {
                include: {
                  tracking: {
                    select: {
                      status: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              chapter: true,
            },
          },
        },
      });
      // Modify object property count to modul
      course["modul"] = course._count.chapter;
      delete course["_count"];

      res.status(200).json({
        status: true,
        message: "Succes to Show detail Course",
        data: course,
      });
    } catch (err) {
      next(err);
    }
  },
  getCourse: async (req, res, next) => {
    try {
      const { search, filter, category, level, page = 1, limit = 10 } = req.query;

      let coursesQuery = {
        where: {},
      };

      if (search) {
        coursesQuery.where.OR = [{ courseName: { contains: search, mode: "insensitive" } }, { mentor: { contains: search, mode: "insensitive" } }];
      }

      if (filter) {
        coursesQuery.orderBy = [];
        if (filter.includes("newest")) {
          coursesQuery.orderBy.push({ createdAt: "desc" });
        }
        if (filter.includes("populer")) {
          coursesQuery.orderBy.push({ averageRating: "desc" });
        }
        if (filter.includes("promo")) {
          coursesQuery.where.promotionId = { not: null };
        }
        if (filter.includes("premium")) {
          coursesQuery.where.isPremium = true;
        }
        if (filter.includes("free")) {
          coursesQuery.where.isPremium = false;
        }
      }

      if (category) {
        const categories = Array.isArray(category) ? category.map((c) => c.toLowerCase()) : [category.toLowerCase()];
        coursesQuery.where.category = {
          categoryName: { in: categories, mode: "insensitive" },
        };
      }

      if (level) {
        const levels = Array.isArray(level) ? level : [level];
        coursesQuery.where.level = { in: levels };
      }

      let courses = await prisma.course.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: coursesQuery.where,
        orderBy: coursesQuery.orderBy,
        include: {
          promotion: {
            select: {
              discount: true,
              startDate: true,
              endDate: true,
            },
          },
          category: {
            select: {
              categoryName: true,
            },
          },
          _count: {
            select: {
              chapter: true,
              enrollment: {
                include: {
                  _count: {
                    select: {
                      review: {
                        select: {
                          id: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          enrollment: {
            select: {
              progres: true,
              review: {
                select: {
                  userRating: true,
                  userComment: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      const totalCourses = courses.length;
      const pagination = getPagination(req, totalCourses, Number(page), Number(limit));

      courses = courses.map((val) => {
        val["modul"] = val._count.chapter;
        val["totalReviews"] = val.enrollment.reduce((sum, enrollment) => {
          return sum + (enrollment.review ? 1 : 0);
        }, 0);
        delete val["_count"];
        return val;
      });

      return res.status(200).json({
        status: true,
        message: "Courses retrieved successfully",
        data: { pagination, courses },
      });
    } catch (err) {
      next(err);
    }
  },
};
