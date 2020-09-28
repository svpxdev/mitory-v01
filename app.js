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

//initial express

const app = express();

//middleware

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set("view engine", "ejs");


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
  .post((req, res) => {
    console.log(req.body);
    res.redirect("/");
  });



//Start the Server
const port = process.env.PORT || 4500;
app.listen(port, function() {
  console.log(`The server started on port ${port}`);
});