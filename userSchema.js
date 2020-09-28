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
});

userSchema.plugin("passportLocalMongoose");
userSchema.plugin("findOrCreate");

const User = mongoose.model("User", userSchema);

module.exports = User;