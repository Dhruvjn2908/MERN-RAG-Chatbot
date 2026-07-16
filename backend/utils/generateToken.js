import jwt from "jsonwebtoken";

// Creates a signed token containing the user's id.
// Anyone can read the payload (it's not encrypted), but nobody can
// forge or modify it without knowing JWT_SECRET.
export function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // token stops being valid after 7 days
  });
}