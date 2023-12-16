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

      if (!fullName || !phoneNumber || !city || !country) {
        return res.status(400).json({
          status: false,
          message: "Please provide fullName, phoneNumber, city, and country",
          data: null,
        });
      }

      if (fullName.length > 50) {
        return res.status(400).json({
          status: false,
          message: "Invalid full name length. It must be at most 50 characters.",
          data: null,
        });
      }

      if (phoneNumber) {
        if (!/^\d+$/.test(phoneNumber)) {
          return res.status(400).json({
            status: false,
            message: "Invalid phone number format. It must contain only numeric characters.",
            data: null,
          });
        }

        if (phoneNumber.length < 10 || phoneNumber.length > 12) {
          return res.status(400).json({
            status: false,
            message: "Invalid phone number length. It must be between 10 and 12 characters.",
            data: null,
          });
        }
      }

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
