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
    const { lessonName, videoURL, chapterId } = req.body;

    const chapter = await findChapterById(chapterId);

    if (!chapter) {
      return res.status(404).json({
        status: false,
        message: "Chapter not found",
        data: null,
      });
    }

    const newLesson = await prisma.lesson.create({
      data: { lessonName, videoURL, chapterId },
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
    const { lessonName, videoURL, chapterId } = req.body;

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
    const { chapter, lesson, course } = req.query;
    if (chapter || lesson || course) {
      let filterLesson = await prisma.lesson.findMany({
        where: {
          OR: [
            {
              lessonName: {
                contains: lesson,
                mode: "insensitive",
              },
            },
            {
              chapter: {
                name: {
                  contains: chapter,
                  mode: "insensitive",
                },
              },
            },
            {
              chapter: {
                course: {
                  courseName: {
                    contains: course,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        },
        include: {
          chapter: {
            include: {
              course: {
                select: {
                  courseName: true,
                },
              },
            },
          },
        },
      });
      return res.status(200).json({
        status: true,
        message: "Success Filter Or Search Video",
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

async function showLessonByCourse(req, res, next) {
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

    let filterLesson = await prisma.chapter.findMany({
      where: {
        courseId: Number(idCourse),
      },
      include: {
        lesson: {
          select: {
            lessonName: true,
            videoURL: true,
          },
        },
      },
    });
    res.status(200).json({
      status: true,
      message: "Show All Vidio in Course",
      data: filterLesson,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

module.exports = {
  createLesson,
  getAllLessons,
  getDetailLesson,
  updateDetailLesson,
  deleteLessonById,
  searchLesson,
  showLessonByCourse,
};
