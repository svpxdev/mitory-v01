//jshint esversion:6

//Require all the modules
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const _ = require("lodash");
const ejs = require("ejs");
const User = require("./userSchema");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const session = require("express-session");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

//initial express

const app = express();

//middleware
app.use(session({
  secret: process.env.SECRETS,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set("view engine", "ejs");

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
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


//Facebook oauth20
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

mongoose.connect(process.env.MONGO_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true
}, function(err) {
  if (!err) {
    console.log("Connection successful");
  } else {
    console.log("Error Connecting..");
  }
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

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
      username: username,
      fname: firstName,
      lname: lastName
    }, password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/success");
        });
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
        res.redirect("/success");
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
    res.render("posts", {
      pageTitle: "Posts"
    });
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/posts',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("posts", {
      pageTitle: "Posts"
    });
  });


app.route("/posts")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render("posts", {
        pageTitle: "Posts"
      });
    } else {
      res.redirect("/login");
    }
  });

app.route("/success")
  .get((req, res) => {
    res.send("Login Success!");
  });



//Start the Server
const port = process.env.PORT || 4500;
app.listen(port, function() {
  console.log(`The server started on port ${port}`);
});