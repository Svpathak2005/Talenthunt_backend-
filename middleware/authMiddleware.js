const jwt = require("jsonwebtoken");

function auth(allowedRoles = []) {
  return function (req, res, next) {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token, auth denied" });
    }

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(decodedToken.role)
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      req.user = decodedToken;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token is not valid" });
    }
  };
}

module.exports = auth;
