require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const shortId = require("shortid");
const dns = require("dns");
const url = require("url");
const app = express();

// DataBase

mongoose.connect(process.env.MONGO_URI);

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const Url = mongoose.model("Url", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

const inValidUrl = function(requestURL){
  if(requestURL.slice(0,8) != "https://" && requestURL.slice(0,7) != "http://") {
    return true;
  }
  requestURL = new url.URL(requestURL);
  requestHostName = requestURL.hostname;
  let condition = false;
  dns.lookup(requestHostName,(err, addresses, family)=> {
    if(err) {
      condition = true;
    }
  })
  return condition;
}

app.post("/api/shorturl", (req, res) => {
  let original_url = req.body.url;
  let short_url = shortId.generate(original_url);
  if(inValidUrl(original_url)) {
    res.json({ error: 'invalid url' });
  }
  else {
    Url.findOne({original_url}).select("-_id -__v")
      .then(data => {
        if(data) {
          res.json(data);
        }
        else {
          let tmp = new Url({original_url,short_url});
          tmp.save();
          res.json({original_url,short_url});
        }
      })
      .catch( err => {
        console.err(err);
      });
  }
});

app.get("/api/shorturl/:id", (req, res)=>{
  const id = req.params.id;
  Url.findOne({short_url:id})
    .then(data => {
      if(data) {
        res.redirect(data.original_url);
      }
      else {
        res.json({ error: 'invalid url' });
      }
    })
    .catch(err=>{
      console.log(err);
    })
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});