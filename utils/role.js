module.exports = {
  authorize: (req, res, next) => {
    const role = req.user.role;
    if (!role.toLocaleLowerCase().includes("admin")) {
      return res.status(403).send({ error: "Access denied. You are Not Admin" });
    }
    next();
  },
};
