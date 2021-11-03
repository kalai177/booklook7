const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT || 3000;
const User = require("./models/user");
const Post = require("./models/post");
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
  const token = req.cookies.access_token;

  if (!token) res.sendStatus(403);
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.username = data.username;
    return next();
  } catch {
    res.sendStatus(403);
  }
};
app.get("/dash", authorization, async function (req, res) {
  const name = req.username;
  const result = await Post.find({ name: name }).exec();

  res.render("home", { title: name, data: result });
});

app.get("/newblog", function (req, res) {
  res.render("newblog");
});

app.get("/updatepost/:id",authorization, express.json(), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Post.findById(id).exec();
    try{
      if(result.name!==req.username) res.sendStatus(403);
      res.render("update", { data: result });
    }catch(err){
     res.sendStatus(403);
    }
  } catch (err) {
    console.log(err);
  }
});
app.put("/api/updatedata", express.json(), async (req, res) => {
  const { title, review, id } = req.body;
  try {
    const result = await Post.findByIdAndUpdate(id, {
      title: title,
      review: review,
    });
    return res.json({ status: "ok" });
  } catch (err) {
    console.log(err);
    return res.json({ status: "error", error: err });
  }
});

app.post("/api/dash", express.json(), authorization, async (req, res) => {
  console.log("called logpost");
  const { title, review } = req.body;
  if (!title || !review)
    return res.json({
      status: "error",
      error: "title or review field not filled properly",
    });
  const name = req.username;
  console.log(name);
  const _id = new mongoose.Types.ObjectId();
  console.log(_id);
  try {
    console.log("try");
    const var1 = await Post.create({
      name,
      title,
      review,
      _id,
    });
    console.log(var1);
    return res.json({ status: "ok" });
  } catch (error) {
    return res.json({ status: "error", error: "failed" });
  }
});

app.post("/api/login", express.json(), async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).lean();
  if (!user) return res.json({ status: "error", error: "invalid username" });
  try {
    await bcrypt.compare(password, user.passcode);
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
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
    return res.json({ status: "error", error: "invalid username or password" });
  }
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
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ status: "error", error: "Username already in use" });
    }
    throw error;
  }
  return res.json({ status: "ok" });
});

app.delete("/api/delete", express.json(), async (req, res) => {
  console.log(req.body.id);
  try {
    const user = await Post.findByIdAndDelete({ _id: req.body.id });
    console.log(user.name);
    return res.json({ status: "ok" });
  } catch (err) {
    console.log(err);
    return res.json({ status: "error", error: "failed to delete" });
  }
});

app
  .listen(port, function () {
    console.log("success http://localhost:3000/");
  })
  .on("error", function (error) {
    console.log(error);
  });
