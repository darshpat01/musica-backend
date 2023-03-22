const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const User = require("./Models/User");
const jwt = require("jsonwebtoken");

require("./passport");

const app = express();
const port = 3009;

genToken = (user) => {
  return jwt.sign(
    {
      iss: "Darshan",
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1),
    },
    process.env.SECRET
  );
};

app.use(bodyParser.json());

if (process.env.NODE_ENV !== "production") {
  require("dotenv/config");
}

mongoose.connect(process.env.DB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Database connected");
});

app.get("/", (req, res) => res.send("Hello World!"));

app.post("/register", async function (req, res, next) {
  const { name, email, password } = req.body;

  //Check If User Exists
  let foundUser = await User.findOne({ email });
  if (foundUser) {
    return res.status(403).json({ error: "Email is already in use" });
  }

  const newUser = new User({ name, email, password });
  //   encrypt password
  newUser.password = await newUser.encryptPassword(password);

  await newUser.save();
  // Generate JWT token
  const token = genToken(newUser);
  res.status(200).json({ token, user: newUser });
});

app.post("/login", async function (req, res, next) {
  const { email, password } = req.body;

  //Check If User Exists
  let foundUser = await User.findOne({ email });
  if (!foundUser) {
    return res.status(403).json({ error: "Invalid Credentials" });
  }

  // Check if password is correct
  const isMatch = await foundUser.isValidPassword(password);
  if (!isMatch) {
    return res.status(403).json({ error: "Invalid Credentials" });
  }

  // Generate JWT token
  const token = genToken(foundUser);
  res.status(200).json({ token, user: foundUser });
});

app.get(
  "/secret",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    res.json("Secret Data");
  }
);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
