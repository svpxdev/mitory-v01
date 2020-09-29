//jshint esversion:6

//Require all the modules
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const _ = require("lodash");
const ejs = require("ejs");
const {
  User
} = require("./userSchema");
const {
  Post
} = require("./userSchema");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const session = require("express-session");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

var check = true;

//initial express

const app = express();

//middleware
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));
app.set("view engine", "ejs");

app.use(session({
  secret: process.env.SECRETS,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



//Google oauth20
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:4500/auth/google/posts",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      fname: profile.name.givenName,
      lname: profile.name.familyName,
      googleId: profile.id,

    }, function(err, user) {
      return cb(err, user);
    });
  }
));


//Facebook oauth20
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:4500/auth/facebook/posts"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


//MongoDB Connection
mongoose.set("useCreateIndex", true);
mongoose.connect(process.env.MONGO_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true
}, function(err) {
  if (!err) {
    console.log("Connection successful");
  } else {
    console.log("Error Connecting..");
    console.log(err);
  }
});

//testbed




//Routing
app.route("/")
  .get((req, res) => {
    res.render("home", {
      pageTitle: "Home Page"
    });
  });

app.route("/register")
  .get((req, res) => {
    res.render("register", {
      pageTitle: "Register"
    });
  })
  .post(function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var firstName = req.body.fname;
    var lastName = req.body.lname;

    User.register({
      username: username
    }, password, function(err, user) {
      if (!err) {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/posts");
        });
      } else {
        console.log(err);
      }
    });
  });

app.route("/login")
  .get((req, res) => {
    res.render("login", {
      pageTitle: "Login"
    });
  })
  .post((req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    const user = new User({
      username: username,
      password: password
    });

    req.login(user, function(err) {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        res.redirect("/posts");
      }
    });
  });

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  }));

app.get('/auth/google/posts',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, render posts.

    console.log(req.user);
    res.redirect("/posts");
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/posts',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/posts");
  });


app.route("/posts")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      // console.log(req.user.id);
      const defaultList = new Post({
        title: "Its a bit lonely here...",
        content: "Your stories will appear here! Go ahead write something beautiful!",
        linkedUserId: req.user.id
      });
      // defaultList.save();
      Post.find({
        linkedUserId: req.user.id
      }, function(err, foundPost) {
        if (!err) {
          if (foundPost.length !== 0) {
            console.log(foundPost);
            console.log("I am insidr the if statemetn");
            res.render("posts", {
              pageTitle: "Mitory | Posts",
              fName: req.user.fname,
              posts: foundPost
            });
          } else {
            defaultList.save();
            console.log("I am inside else");
            res.redirect("/posts");
          }
        } else {
          console.log(err);
        }
      });


    } else {
      res.redirect("/login");
    }
  });

app.route("/compose")
  .get((req, res) => {
    res.render("compose", {
      pageTitle: "Mitory | Compose",
      fName: "Suryaveer"
    });
  })
  .post((req, res) => {
    if (req.isAuthenticated()) {
      const blogpost = new Post({
        title: req.body.title,
        content: req.body.content,
        linkedUserId: req.user.id
      });
      blogpost.save();
      res.redirect("/posts");
    } else {
      console.log("Something a brewing!");
    }
  });

app.route("/page/:postName")
  .get((req, res) => {
    var queryTitle = (req.params.postName);
    Post.findById(queryTitle,
      function(err, foundArt) {
        if (!err) {
          console.log(foundArt);
          res.render("articles", {
            pageTitle: "Miroty | Article",
            article: foundArt
          });
        } else {
          console.log("Cannot find article");
        }
      });
  });

app.route("/delete/:postName")
  .get((req, res) => {
    var queryTitle = (req.params.postName);
    console.log(queryTitle);
    Post.deleteOne({
      _id: queryTitle
    }, (err) => {
      if (err) {
        console.log(err);
      }
    });
    res.redirect("/posts");
  });

//Start the Server
const port = process.env.PORT || 4500;
app.listen(port, function() {
  console.log(`The server started on port ${port}`);
});