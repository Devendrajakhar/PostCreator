const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const userModel = require('./Models/user');
const userPost = require('./Models/post');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const port = 3002;

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 🏠 Home Page
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
  res.render('register');
});

// 👤 Profile (protected route)
app.get('/profile', isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate('posts');
  res.render('profile', { user });
});

// POST REQUEST FOR ADDING POST
app.post('/post', isLoggedIn, async (req, res) => {
  let user = await userModel.findById(req.user.userid);
  let { content, title } = req.body;
  let post = await userPost.create({
    user: user._id,
    content, title
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile');
});

// 🔐 Register
app.post('/register', async (req, res) => {
  try {
    const { username, name, email, age, password } = req.body;

    let existingUser = await userModel.findOne({ email });
    if (existingUser) return res.redirect("/login");

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      username,
      name,
      email,
      age,
      password: hash
    });

    const token = jwt.sign({ email: user.email, userid: user._id }, 'hello');
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering user");
  }
});

// 🔑 Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.send("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.redirect("login");

    const token = jwt.sign({ email: user.email, userid: user._id }, 'hello');
    res.cookie('token', token, { httpOnly: true });
    res.redirect('profile');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging in");
  }
});

// 🚪 Logout
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// 🧩 Middleware
function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const data = jwt.verify(token, 'hello');
    req.user = data;
    next();
  } catch (err) {
    console.error("Invalid token:", err);
    res.redirect('/login');
  }
}

app.get('/login', (req, res) => {
  res.render('login');
});


app.get('/like/:id', isLoggedIn, async (req, res) => {
  let post = await userPost.findOne({ _id: req.params.id }).populate('user');
  if (post.like.indexOf(req.user.userid) === -1) {
    post.like.push(req.user.userid);
  } else {
    let index = post.like.indexOf(req.user.userid);
    post.like.splice(index, 1);
  }

  await post.save();
  res.redirect('/profile');
});

app.get('/profile/post/edit/:id', isLoggedIn, async (req, res) => {
  let post = await userPost.findOne({ _id: req.params.id }).populate('user');
  res.render('edit', { post });
});


app.post('/post/update/:id', isLoggedIn, async (req, res) => {
  let post = await userPost.findOneAndUpdate({ _id: req.params.id }, { title: req.body.title, content: req.body.content });
  res.redirect('/profile');
});

app.get('/profile/post/delete/:id', isLoggedIn, async (req, res) => {
  let post = await userPost.findOneAndDelete({ _id: req.params.id }).populate('user');
  res.redirect('/profile');
});



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
