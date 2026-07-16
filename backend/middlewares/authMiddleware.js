import jwt from "jsonwebtoken";

// This function runs BEFORE any route it's attached to.
// If the token is valid, it calls next() to let the request continue.
// If not, it stops the request right here with an error response.
export function protect(req, res, next) {
  const authHeader = req.headers.authorization; // expected format: "Bearer <token>"

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // attach the user's id so later code can use it
    next();
  } catch (error) {
    return res.status(401).json({ error: "Not authorized, token invalid or expired" });
  }
}