const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { generatedOTP } = require("../utils/otpGenerator");
const nodemailer = require("../utils/nodemailer");
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  register: async (req, res, next) => {
    try {
      let { fullName, email, phoneNumber, password } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          status: false,
          message: "Email already exists",
          data: null,
        });
      }

      const otp = generatedOTP();

      let encryptedPassword = await bcrypt.hash(password, 10);
      let newUser = await prisma.user.create({
        data: {
          email,
          password: encryptedPassword,
          otp,
        },
      });

      let newUserProfile = await prisma.userProfile.create({
        data: {
          fullName,
          phoneNumber,
          userId: newUser.id,
        },
      });

      const html = await nodemailer.getHtml("verify-otp.ejs", { email, otp });
      nodemailer.sendEmail(email, "Email Activation", html);

      res.status(201).json({
        status: true,
        message: "Registration successful",
        data: { newUser, newUserProfile },
      });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      let { emailOrPhoneNumber, password } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: emailOrPhoneNumber }, { userProfile: { phoneNumber: emailOrPhoneNumber } }],
        },
      });

      if (!user) {
        return res.status(401).json({
          status: false,
          message: "Invalid Email or Password!",
          data: null,
        });
      }

      let isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({
          status: false,
          message: "Invalid Email or Password!",
          data: null,
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          status: false,
          message: "Account not verified. Please check your email!",
          data: null,
        });
      }

      let token = jwt.sign({ id: user.id }, JWT_SECRET_KEY);

      return res.status(200).json({
        status: true,
        message: "Login successful",
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  },

  verifyOtp: async (req, res, next) => {
    try {
      let { email, otp } = req.body;

      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
          data: null,
        });
      }

      if (user.otp !== otp) {
        return res.status(401).json({
          status: false,
          message: "Invalid OTP",
          data: null,
        });
      }

      let updateUser = await prisma.user.update({
        where: { email },
        data: { isVerified: true },
      });

      res.status(200).json({
        status: true,
        message: "Activation successful",
        data: updateUser,
      });
    } catch (err) {
      next(err);
    }
  },

  resendOtp: async (req, res, next) => {
    try {
      const { email } = req.body;

      const otp = generatedOTP();

      const html = await nodemailer.getHtml("verify-otp.ejs", { email, otp });
      nodemailer.sendEmail(email, "Email Activation", html);

      const updateOtp = await prisma.user.update({
        where: { email },
        data: { otp },
      });

      res.status(200).json({
        status: true,
        message: "Resend OTP successful",
        data: updateOtp,
      });
    } catch (err) {
      next(err);
    }
  },

  forgetPasswordUser: async (req, res, next) => {
    try {
      let { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "Email not found",
          data: null,
        });
      }

      let token = jwt.sign({ email: user.email }, JWT_SECRET_KEY);
      const html = await nodemailer.getHtml("email-password-reset.ejs", {
        email,
        token,
      });
      nodemailer.sendEmail(email, "Reset Password", html);

      res.status(200).json({
        status: true,
        message: "Email sent successfully",
        data: { email, token },
      });
    } catch (err) {
      next(err);
    }
  },

  updatePasswordUser: async (req, res, next) => {
    try {
      let { token } = req.query;
      let { password, passwordConfirmation } = req.body;

      if (password !== passwordConfirmation) {
        return res.status(400).json({
          status: false,
          message:
            "Please ensure that the password and password confirmation match!",
          data: null,
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);

      jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
          return res.status(400).json({
            status: false,
            message: "Bad request",
            err: err.message,
            data: null,
          });
        }

        let updateUser = await prisma.user.update({
          where: { email: decoded.email },
          data: { password: encryptedPassword },
        });

        let newNotification = await prisma.notification.create({
          data: {
            title: "Notifikasi",
            message: "Password berhasil diubah!",
            userId: updateUser.id,
          },
        });

        res.status(200).json({
          status: true,
          message: "Your password has been updated successfully!",
          data: { updateUser, newNotification },
        });
      });
    } catch (err) {
      next(err);
    }
  },

  authenticateUser: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(req.user.id) },
      });

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
          data: null,
        });
      }

      return res.status(200).json({
        status: true,
        message: "Authentication successful",
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },

  changePasswordUser: async (req, res, next) => {
    try {
      const { oldPassword, newPassword, newPasswordConfirmation } = req.body;

      let isOldPasswordCorrect = await bcrypt.compare(
        oldPassword,
        req.user.password
      );
      if (!isOldPasswordCorrect) {
        return res.status(401).json({
          status: false,
          message: "Incorrect old password",
          data: null,
        });
      }

      if (newPassword !== newPasswordConfirmation) {
        return res.status(400).json({
          status: false,
          message:
            "Please ensure that the new password and confirmation match!",
          data: null,
        });
      }

      let encryptedNewPassword = await bcrypt.hash(newPassword, 10);

      let updateUser = await prisma.user.update({
        where: { id: Number(req.user.id) },
        data: { password: encryptedNewPassword },
      });

      let newNotification = await prisma.notification.create({
        data: {
          title: "Notification",
          message: "Password successfully changed!",
          userId: req.user.id,
        },
      });

      res.status(200).json({
        status: true,
        message: "Your password has been successfully changed",
        data: { updateUser, newNotification },
      });
    } catch (err) {
      next(err);
    }
  },
};
