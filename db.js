const mongoose = require("mongoose");
const mongoUrl =
  "mongodb+srv://agnivchakraborty5:gC1zMKxzhYVfmlVV@cluster0.fm7gyxb.mongodb.net/";

function connectToMongo() {
  mongoose.connect(mongoUrl).then(() => {
    console.log("Connected to Mongo");
    // console.log(process.env.REACT_APP_MONGO);
  });
}

module.exports = connectToMongo;
