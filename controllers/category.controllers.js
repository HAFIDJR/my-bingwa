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
        data: { newCategory },
      });
    } catch (err) {
      next(err);
    }
  },

  showCategory: async (req, res, next) => {
    try {
      const { search } = req.query;

      const categories = await prisma.category.findMany({
        where: search ? { categoryName: { contains: search, mode: "insensitive" } } : {},
      });

      return res.status(200).json({
        status: true,
        message: "show all category successful",
        data: { categories },
      });
    } catch (err) {
      next(err);
    }
  },

  editCategory: async (req, res, next) => {
    try {
      const { idCategory } = req.params;
      const { categoryName } = req.body;

      let editedCategory = await prisma.category.update({
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
        data: { editedCategory },
      });
    } catch (err) {
      next(err);
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      const { idCategory } = req.params;
      let deletedCategory = await prisma.category.delete({
        where: {
          id: Number(idCategory),
        },
      });
      res.status(200).json({
        status: true,
        message: "delete category successful",
        data: { deletedCategory },
      });
    } catch (err) {
      next(err);
    }
  },
};
