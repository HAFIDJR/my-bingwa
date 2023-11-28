const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createChapter = async (req, res, next) => {
  try {
    const { name } = req.body;

    const chapter = await prisma.chapter.create({
      data: {
        name,
      },
    });

    res.status(201).json({
      status: true,
      message: "Create Chapter Success",
      data: chapter,
    });
  } catch (error) {
    next(error);
  }
};

const getChapters = async (req, res, next) => {
  try {
    const chapters = await prisma.chapter.findMany();

    res.status(200).json({
      status: true,
      message: "Get chapters success",
      data: chapters,
    });
  } catch (error) {
    next(error);
  }
};

const getChapterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!chapter)
      return res
        .status(404)
        .json({ status: false, message: "chapter not found", data: null });

    res.status(201).json({
      status: true,
      message: "Get Detail chapter succes",
      data: chapter,
    });
  } catch (error) {
    next(error);
  }
};

const updateCHapter = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isExistChapter = await prisma.chapter.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!isExistChapter)
      return res
        .status(404)
        .json({ status: false, message: "chapter not found", data: null });

    const chapter = await prisma.chapter.update({
      where: {
        id: Number(id),
      },
      data: {
        ...req.body,
      },
    });

    res.status(200).json({
      status: true,
      message: "Chapter updated success",
      data: chapter,
    });
  } catch (error) {
    next(error);
  }
};

const deleteChapter = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isExistChapter = await prisma.chapter.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!isExistChapter)
      return res
        .status(404)
        .json({ status: false, message: "chapter not found", data: null });

    await prisma.chapter.delete({
      where: {
        id: Number(id),
      },
    });

    res.status(200).json({
      status: true,
      message: "Delete chpater success",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChapter,
  getChapters,
  getChapterById,
  updateCHapter,
  deleteChapter,
};
