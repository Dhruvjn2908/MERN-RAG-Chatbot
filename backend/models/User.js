import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, // this will store the HASH, never the plain password
    },
  },
  { timestamps: true }, // adds createdAt / updatedAt automatically
);

// This runs automatically right before a User document is saved to MongoDB
userSchema.pre("save", async function () {
  // Only re-hash the password if it was actually changed
  // (otherwise every unrelated update would re-hash an already-hashed password)
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method: lets us call user.comparePassword("typed-password")
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
