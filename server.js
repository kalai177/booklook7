const express = require("express");
const app = express();
const path = require("path");
const port = 80;
const User = require("./models/user");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const JWT_SECRET = "fdnajkrbhgvikdrwopaijkawjXdsfevbheeeqrukcgtrhcrqe";

const url =
  "mongodb+srv://bookwebuser:Y5ZETyjBJfmcxo@cluster0.pmi8d.mongodb.net/kalaidb?retryWrites=true&w=majority";

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
mongoose
  .connect(url, connectionParams)
  .then(() => {
    console.log("Connected to database ");
  })
  .catch((err) => {
    console.error(`Error connecting to the database. \n${err}`);
  });

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.json());
app.get("/", function (req, res) {
  res.render("index", { title: "Bookblurb" });
});

app.get("/login", function (req, res) {
  res.render("login", { title: "loginuser" });
});

app.get("/register", function (req, res) {
  res.render("register", { title: "registeruser" });
});

const authorization = (req, res, next) => {
  const tokenn = req.cookies.access_token;
  console.log(tokenn);
  if (!tokenn) res.sendStatus(403);
  try {
    const data = jwt.verify(tokenn, JWT_SECRET);
    req.usernamee = data.username;
    console.log(req.usernamee);
    return next();
  } catch {
    res.sendStatus(403);
  }
};
app.get("/dash", authorization, function (req, res) {
  res.render("home", { title: req.usernamee });
});

app.post("/api/login", express.json(), async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).lean();
  if (!user) return res.json({ status: "error", error: "invalid username" });
  try {
    await bcrypt.compare(password, user.passcode);
   
     
  } catch (error) {
    return res.json({ status: "error", error: "invalid username or password" });
  }
  return res.json({ status: "ok" });
});

app.post("/api/register", express.json(), async (req, res) => {
  const { username, password } = req.body;

  if (!username || typeof username !== "string") {
    return res.json({ status: "error", error: "Invalid username" });
  }

  if (!password || typeof password !== "string") {
    return res.json({ status: "error", error: "Invalid password" });
  }

  if (password.length < 5) {
    return res.json({
      status: "error",
      error: "Password too small. Should be atleast 6 characters",
    });
  }

  const passcode = await bcrypt.hash(password, 10);

  try {
    const respond = await User.create({
      username,
      passcode,
    });
    console.log("User created successfully: ", respond);

    const token = jwt.sign(
      {
        id: respond._id,
        username: username,
      },
      JWT_SECRET
    );

    return res
      .cookie("access_token", token, {
        httpOnly: false,
        secure: true,
      })
      .json({ status: "ok" });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ status: "error", error: "Username already in use" });
    }
    throw error;
  }
});

app.listen(port, function () {
  console.log('success')
}).on('error',function(error){
  console.log(error);
});
