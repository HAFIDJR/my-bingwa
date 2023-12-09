const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  createPromotion: async (req, res, next) => {
    try {
      const { discount, startDate, endDate } = req.body;

      if (!discount || !startDate || !endDate) {
        return res.status(400).json({
          status: false,
          message: "All fields must be filled",
        });
      }

      const users = await prisma.user.findMany({
        select:{
          id: true
        }
      })

      const blastNotif = users.forEach((user) => ({
        userId: user.id,
        title: "Promo",
        message: `Diskon ${discount}% berlaku dari ${new Date(startDate).toLocaleDateString("id-ID")} sampai ${new Date(endDate).toLocaleDateString("id-ID")}`
      }))

      await prisma.$transaction([
        await prisma.notification.createMany({
          data: blastNotif
        })
      ])
      
      const newPromotion = await prisma.promotion.create({
        data: { discount, startDate, endDate },
      });

      res.status(201).json({
        status: true,
        message: "Promotion created successfully",
        data: { newPromotion },
      });
    } catch (err) {
      next(err);
    }
  },

  getAllPromotions: async (req, res, next) => {
    try {
      const { search } = req.query;

      const promotions = await prisma.promotion.findMany({
        where: search
          ? {
              OR: [search && { discount: parseFloat(search) }, search && { startDate: { contains: search, mode: "insensitive" } }, search && { endDate: { contains: search, mode: "insensitive" } }].filter(Boolean),
            }
          : {},
      });

      res.status(200).json({
        status: true,
        message: "Get all promotions successful",
        data: { promotions },
      });
    } catch (err) {
      next(err);
    }
  },

  getPromotionById: async (req, res, next) => {
    try {
      const promotionId = req.params.id;

      if (!promotionId || isNaN(promotionId)) {
        return res.status(400).json({
          status: false,
          message: "Invalid promotion ID",
          data: null,
        });
      }

      const promotion = await prisma.promotion.findUnique({
        where: { id: Number(promotionId) },
      });

      if (!promotion) {
        return res.status(404).json({
          status: false,
          message: "Promotion not found",
          data: null,
        });
      }

      res.status(200).json({
        status: true,
        message: "Get detail promotion successful",
        data: { promotion },
      });
    } catch (err) {
      next(err);
    }
  },

  editPromotionById: async (req, res, next) => {
    try {
      const promotionId = req.params.id;
      const { discount, startDate, endDate } = req.body;

      if (!promotionId || isNaN(promotionId)) {
        return res.status(400).json({
          status: false,
          message: "Invalid promotion ID",
          data: null,
        });
      }

      const promotion = await prisma.promotion.findUnique({
        where: { id: Number(promotionId) },
      });

      if (!promotion) {
        return res.status(404).json({
          status: false,
          message: "Promotion not found",
          data: null,
        });
      }

      if (!discount || !startDate || !endDate) {
        return res.status(400).json({
          status: false,
          message: "All fields must be filled",
        });
      }

      const updatedPromotion = await prisma.promotion.update({
        where: { id: Number(promotionId) },
        data: { discount, startDate, endDate },
      });

      res.status(200).json({
        status: true,
        message: "Promotion edited successfully",
        data: { updatedPromotion },
      });
    } catch (err) {
      next(err);
    }
  },

  deletePromotionById: async (req, res, next) => {
    try {
      const promotionId = req.params.id;

      if (!promotionId || isNaN(promotionId)) {
        return res.status(400).json({
          status: false,
          message: "Invalid promotion ID",
          data: null,
        });
      }

      const promotion = await prisma.promotion.findUnique({
        where: { id: Number(promotionId) },
      });

      if (!promotion) {
        return res.status(404).json({
          status: false,
          message: "Promotion not found",
          data: null,
        });
      }

      const deletedPromotion = await prisma.promotion.delete({
        where: { id: Number(promotionId) },
      });

      res.status(200).json({
        status: true,
        message: "Promotion deleted successfully",
        data: { deletedPromotion },
      });
    } catch (err) {
      next(err);
    }
  },
};
