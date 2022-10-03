const validUrl = require("valid-url");
const shortid = require("shortid");
const redis = require("redis");

const { promisify } = require("util");

const urlModel = require("../models/urlModel");
//const Url = require('../models/urlModel')

const redisClient = redis.createClient(
  13976,//port
  "redis-13976.c212.ap-south-1-1.ec2.cloud.redislabs.com",//ip address
  { no_ready_check: true }
);
redisClient.auth("ooNQopKCz1I0vcZbxchS2EpLz7pAQNEE", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const baseUrl = "http://localhost:3000/";

const urlRegex = (value) => {
  //  USING THIS REGEX TO VALIDATE URL PATTERN
  let urlRegex =
    /^(?:(?:(?:https?|http):)?\/\/.*\.(?:png|gif|webp|com|in|org|co|co.in|net|jpeg|jpg))/i;
  if (urlRegex.test(value)) return true;
};

const createUrl = async function (req, res) {
  try {
    let data = req.body;

    if (Object.keys(data).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Body should not be empty" });
    }

    const keys = ["longUrl"];

    if (!Object.keys(req.body).every((elem) => keys.includes(elem))) {
      return res
        .status(400)
        .send({ status: false, message: "wrong Parameters" });
    }


    const isValid = function (value) {
      if (typeof value === 'undefined' || value === null) return false
      if (typeof value === 'string' && value.trim().length === 0) return false
      return true
    }

    if (!isValid(data.longUrl)) {
      return res.status(400).send({ status: false, message: "Data should be in string" })
    }


    if (!urlRegex(data.longUrl))
      return res.status(400).send({ status: false, message: "Wrong Url" });


    // let validurl = isValid.isValidUrl(data)
    //     if (validurl) {
    //         return res.status(400).send({ status: false, message: validurl})
    //       }

    //"http://localhost:3000/"
    let permanentUrl = await urlModel
      .findOne({ longUrl: data.longUrl })
      .select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0 });

    if (!permanentUrl) {
      let urlCode = shortid.generate().toLocaleLowerCase();
      let shortUrl = baseUrl + urlCode;
      data.urlCode = urlCode;
      data.shortUrl = shortUrl;
      await urlModel.create(data);
      res.status(201).send({ status: true, data: data });
    } else {
      return res
        .status(200)
        .send({ status: true, message: "Already generated", data: permanentUrl });
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

const getUrl = async function (req, res) {
  try {
    // find a document match to the code in req.params.code
    let urlCode=req.params.urlCode
    let cahcedLinkData = await GET_ASYNC(urlCode)
    if (cahcedLinkData) {
      cahcedLinkData = JSON.parse(cahcedLinkData)
      console.log(cahcedLinkData)
      return res.redirect(cahcedLinkData.longUrl)
    }
    else{
    const url = await urlModel.findOne({ urlCode:urlCode }).select({longUrl:1});
    //validation
    await SET_ASYNC(urlCode, JSON.stringify(url))
   return res.redirect({ data: url });
    
  }
}

  catch (err) {
    // exception handler
    console.error(err);
    res.status(500).send({ status: false, message: "Server Error" });
  }
}




module.exports.createUrl = createUrl;
module.exports.getUrl = getUrl;

