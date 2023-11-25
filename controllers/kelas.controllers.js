const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  createCourse: async (req, res, next) => {
    try {
      let newCourse = await prisma.course.create({
        data: {
          ...req.body,
        },
      });
      const price = req.body.price;
      const isPremium = req.body.isPaid;
      if (!isPremium && price) {
        return res.status(400).json({
          status: false,
          message: "free class price must be 0 ",
          data: null,
        });
      }
      
      return res.status(201).json({
        status: true,
        message: "create Kelas successful",
        data: newCourse,
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
      return res.status(201).json({
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
  showAllCourse: async (req, res, next) => {
    try {
      let allCourse = await prisma.course.findMany();
      res.status(200).json({
        status: true,
        message: "Show All Kelas successful",
        data: allCourse,
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
};
