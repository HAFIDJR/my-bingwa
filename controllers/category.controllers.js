const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  createCategory: async (req, res, next) => {
    try {
      const { categoryName } = req.body;
      let newCategory = await prisma.category.create({
        data: {
          categoryName,
        },
      });
      return res.status(201).json({
        status: true,
        message: "create category successful",
        data: newCategory,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  showCategory: async (req, res, next) => {
    try {
      let allCategory = await prisma.category.findMany();
      return res.status(200).json({
        status: true,
        message: "show all category successful",
        data: allCategory,
      });
    } catch (err) {
      next(err);
    }
  },

  editCategory: async (req, res, next) => {
    try {
      const { idCategory } = req.params;
      const { categoryName } = req.body;

      let editCategory = await prisma.category.update({
        where: {
          id: Number(idCategory),
        },
        data: {
          categoryName,
        },
      });
      res.status(200).json({
        status: true,
        message: "update category successful",
        data: editCategory,
      });
    } catch (err) {
      console.log(err.message);
      next(err);
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      const { idCategory } = req.params;
      let deleteCategory = await prisma.category.delete({
        where: {
          id: Number(idCategory),
        },
      });
      res.status(200).json({
        status: true,
        message: "delete category successful",
        data: deleteCategory,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
