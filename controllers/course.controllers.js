const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const getPagination = require("../utils/getPaggination");

module.exports = {
  createCourse: async (req, res, next) => {
    try {
      const { price, isPremium, categoryId, promotionId } = req.body;

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
      console.log(err);
      next(err);
    }
  },

  editCourse: async (req, res, next) => {
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
      let editCourse = await prisma.course.update({
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
        data: editCourse,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  deleteCourse: async (req, res, next) => {
    try {
      const { idCourse } = req.params;
      let deleteCourse = await prisma.course.delete({
        where: {
          id: Number(idCourse),
        },
      });
      res.status(200).json({
        status: true,
        message: "delete Kelas successful",
        data: deleteCourse,
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
      const detailCourse = await prisma.course.findUnique({
        where: {
          id: Number(idCourse),
        },
      });
      res.status(200).json({
        status: true,
        message: ` Detail Kelas with id:${idCourse} successful`,
        data: detailCourse,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
  showVidioByCourse: async (req, res, next) => {
    try {
      const { idCourse } = req.params;
      const findCourse = await prisma.course.findFirst({
        where: {
          id: Number(idCourse),
        },
      });
      if (!findCourse) {
        return res.status(404).json({
          status: false,
          message: `Course Not Found With Id ${idCourse}`,
          data: null,
        });
      }

      let filterVidio = await prisma.vidio.findMany({
        where: {
          idCourse,
        },
        include: {
          Course: {
            select: {
              courseName: true,
            },
          },
          Chapter: {
            select: {
              name: true,
            },
          },
        },
      });
      res.status(200).json({
        status: true,
        message: "Show All Vidio in Course ",
        data: filterVidio,
      });
    } catch (err) {
      next(err);
    }
  },
  getCourse: async (req, res, next) => {
    try {
      const {filter, category, level} = req.query
      if(filter || category || level){

        const filterOptions = {
          populer: { orderBy: { rating: 'desc' } },
        terbaru: { orderBy: { release: 'desc' } },
        promo: { where: { promotionId: { not: null } } },
      };
      console.log(typeof category === "string")
      const query = {
        ...filterOptions[filter],
        where: {
          category: {

            categoryName: typeof category !== "string" ? {in: [...category]} : {in: [category]} ,
          },
          ...(level && {level: level})
        },
      }
      const courses = await prisma.course.findMany(query);
      
      res.status(200).json({
        status: true,
        message: "Get Course Success",
        data: courses
      });
    }else if(req.query.search){
      const {search} = req.query
      const courses = await prisma.course.findMany({
        where: {
          courseName: {
            contains: search,
            mode: "insensitive"
          }
        }
      })

      res.status(200).json({
        status: true,
        message: "Get Course Success",
        data: courses
      });
    } else {
      const { limit = 10, page = 1 } = req.query;
      console.log(limit);

      const courses = await prisma.course.findMany({
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
    } catch (error) {
      console.log(error.message)
      next(error);
    }
  },
};
