const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET || "araft";  // Use environment variable or fallback

const auth = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    
    if (!authorizationHeader) {
      return res.status(401).json({ message: "Authorization header missing!" });
    }

    const token = authorizationHeader.split(" ")[1]; // Expect "Bearer <token>"
    
    if (!token) {
      return res.status(403).json({ message: "Token not provided!" });
    }

    const isCustomAuth = token.length < 500; // Custom JWT token check
    let decodedToken;

    if (isCustomAuth) {
      // Verifying custom JWT
      decodedToken = jwt.verify(token, jwtSecret);
      req.userId = decodedToken?.id || decodedToken?._id; // Using decoded token's id
    } else {
      // Handling OAuth tokens if applicable (e.g., Google tokens)
      decodedToken = jwt.decode(token);
      req.userId = decodedToken?.sub; // OAuth tokens typically use 'sub' for user ID
    }

    if (!req.userId) {
      return res.status(403).json({ message: "Invalid token!" });
    }

    next();  // Pass control to the next middleware
  } catch (error) {
    console.error("Authentication error: ", error);
    res.status(403).json({ message: "Not authenticated!" });
  }
};

module.exports = auth;
