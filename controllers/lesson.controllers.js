const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { formattedDate } = require("../utils/formattedDate");

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
    const { lessonName, videoURL, chapterId, createdAt, updatedAt } = req.body;

    if (!lessonName || !videoURL || !chapterId) {
      return res.status(400).json({
        status: false,
        message: "Please provide lessonName, videoURL, and chapterId",
        data: null,
      });
    }

    if (createdAt !== undefined || updatedAt !== undefined) {
      return res.status(400).json({
        status: false,
        message: "createdAt or updateAt cannot be provided during lesson creation",
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

    const users = await prisma.user.findMany();

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: { in: users.map((user) => user.id) },
        courseId: chapter.courseId,
      },
    });
    const newLesson = await prisma.lesson.create({
      data: {
        lessonName,
        videoURL,
        chapterId,
        createdAt: formattedDate(new Date()),
        updatedAt: formattedDate(new Date()),
      },
    });

    // menambahkan fitur update progres jika sudah enrol course
    const trackingRecords = await Promise.all(
      enrollments.map(async (enrollment) => {
        return prisma.tracking.create({
          data: {
            userId: Number(enrollment.userId),
            lessonId: Number(newLesson.id),
            courseId: Number(chapter.courseId),
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
      message: "Lesson created successfully",
      data: { newLesson, trackingRecords },
    });
  } catch (err) {
    next(err);
  }
};

const getAllLessons = async (req, res, next) => {
  try {
    const { search } = req.query;

    const lessons = await prisma.lesson.findMany({
      where: {
        OR: [
          { lessonName: { contains: search, mode: "insensitive" } },
          { chapter: { name: { contains: search, mode: "insensitive" } } },
          {
            chapter: {
              course: { courseName: { contains: search, mode: "insensitive" } },
            },
          },
          {
            chapter: {
              course: {
                category: {
                  categoryName: { contains: search, mode: "insensitive" },
                },
              },
            },
          },
        ],
      },
      include: {
        chapter: {
          select: {
            name: true,
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
    const { lessonName, videoURL, chapterId, createdAt, updatedAt } = req.body;

    if (!lessonName || !videoURL || !chapterId) {
      return res.status(400).json({
        status: false,
        message: "Please provide lessonName, videoURL, and chapterId",
        data: null,
      });
    }

    if (createdAt !== undefined || updatedAt !== undefined) {
      return res.status(400).json({
        status: false,
        message: "createdAt or updateAt cannot be provided during lesson update",
        data: null,
      });
    }

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
        updatedAt: formattedDate(new Date()),
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

const filterLesson = async (req, res, next) => {
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
  filterLesson,
  showLessonByCourse,
};
