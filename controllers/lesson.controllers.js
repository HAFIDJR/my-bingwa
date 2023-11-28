const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const findChapterById = async (chapterId) => {
  return await prisma.chapter.findUnique({
    where: { id: Number(chapterId) },
  });
};

const findLessonById = async (lessonId) => {
  return await prisma.lesson.findUnique({
    where: { id: Number(lessonId) },
    include: {
      chapter: {
        select: {
          name: true,
        },
      },
    },
  });
};

const createLesson = async (req, res, next) => {
  try {
    const { lessonName, videoURL, chapterId, courseId } = req.body;

    const chapter = await findChapterById(chapterId);

    if (!chapter) {
      return res.status(404).json({
        status: false,
        message: "Chapter not found",
        data: null,
      });
    }

    const newLesson = await prisma.lesson.create({
      data: { lessonName, videoURL, chapterId, courseId },
    });

    res.status(201).json({
      status: true,
      message: "Lesson created successfully",
      data: { newLesson },
    });
  } catch (err) {
    next(err);
  }
};

const getAllLessons = async (req, res, next) => {
  try {
    const lessons = await prisma.lesson.findMany({
      include: {
        chapter: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      status: true,
      message: "Get all lessons successful",
      data: { lessons },
    });
  } catch (err) {
    next(err);
  }
};

const getDetailLesson = async (req, res, next) => {
  try {
    const lessonId = req.params.id;

    const lesson = await findLessonById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found",
        data: null,
      });
    }

    res.status(200).json({
      status: true,
      message: "Get detail lesson successful",
      data: { lesson },
    });
  } catch (err) {
    next(err);
  }
};

const updateDetailLesson = async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const { lessonName, videoURL, chapterId, courseId } = req.body;

    const lesson = await findLessonById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found",
        data: null,
      });
    }

    const chapter = await findChapterById(chapterId);

    if (!chapter) {
      return res.status(404).json({
        status: false,
        message: "Chapter not found",
        data: null,
      });
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: Number(lessonId) },
      data: {
        lessonName,
        videoURL,
        chapterId,
        courseId,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      status: true,
      message: "Lesson updated successfully",
      data: { updatedLesson },
    });
  } catch (err) {
    next(err);
  }
};

const deleteLessonById = async (req, res, next) => {
  try {
    const lessonId = req.params.id;

    const lesson = await findLessonById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        status: false,
        message: "Lesson not found",
        data: null,
      });
    }

    const deletedLesson = await prisma.lesson.delete({
      where: { id: Number(lessonId) },
    });

    res.status(200).json({
      status: true,
      message: "Lesson deleted successfully",
      data: { deletedLesson },
    });
  } catch (err) {
    next(err);
  }
};

const searchLesson = async (req, res, next) => {
  try {
    const { chapter, lessonName, course } = req.query;
    if (chapter || title || course) {
      let filterLesson = await prisma.lesson.findMany({
        where: {
          OR: [
            {
              lessonName: {
                contains: lessonName || "a",
                mode: "insensitive",
              },
            },
          ],
          chapter: {
            OR: [
              {
                name: {
                  contains: chapter || "a", //adakah solusi lebih clean untuk query filter chapter ?
                  mode: "insensitive",
                },
              },
            ],
          },
          Course: {
            OR: [
              {
                courseName: {
                  contains: course || "a",
                  mode: "insensitive",
                },
              },
            ],
          },
        },
        include: {
          chapter: {
            select: {
              name: true,
            },
          },
          Course: {
            select: {
              courseName: true,
            },
          },
        },
      });
      return res.status(200).json({
        status: true,
        message: "Succes Filter Or Search Vidio",
        data: filterLesson,
      });
    }
    res.status(400).json({
      status: false,
      message: "Bad Request",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLesson,
  getAllLessons,
  getDetailLesson,
  updateDetailLesson,
  deleteLessonById,
  searchLesson,
};
