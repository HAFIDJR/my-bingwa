const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");

const imagekit = require("../libs/imagekit");

module.exports = {
  updateProfile: async (req, res, next) => {
    try {
      const { fullName, phoneNumber, city, country } = req.body;
      const file = req.file;
      let imageURL;

      if (file) {
        const strFile = file.buffer.toString("base64");

        const { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(req.file.originalname),
          file: strFile,
        });

        imageURL = url;
      }

      const newUserProfile = await prisma.userProfile.update({
        where: {
          userId: Number(req.user.id),
        },
        data: { profilePicture: imageURL, fullName, phoneNumber, city, country },
      });

      return res.status(200).json({
        status: true,
        message: "Profile updated successfully",
        data: { newUserProfile },
      });
    } catch (err) {
      next(err);
    }
  },
};
