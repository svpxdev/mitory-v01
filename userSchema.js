//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");




const userSchema = new mongoose.Schema({
  username: {
    type: String
  },
  password: {
    type: String
  },
  fname: {
    type: String
  },
  lname: {
    type: String
  },
  googleId: {
    type: String
  },
  facebookId: {
    type: String
  }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);


const postSchema = new mongoose.Schema({
  title: {
    type: String
  },
  content: {
    type: String
  },
  linkedUserId: {
    type: String
  }
});

postSchema.plugin(passportLocalMongoose);
postSchema.plugin(findOrCreate);

const Post = mongoose.model("Post", postSchema);


module.exports = {
  User,
  Post
};