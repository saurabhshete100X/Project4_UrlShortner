const validUrl = require("valid-url");
const shortid = require("shortid");
const redis = require("redis");

const { promisify } = require("util");

const urlModel = require("../models/urlModel");


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
    let urlCode = req.params.urlCode                // urlCode
    let cachedLinkData = await GET_ASYNC(urlCode)  // Check On Caching Server

    if (cachedLinkData) {                        // if we found data in cachedLinkData then simply redirected.
      console.log(cachedLinkData)
      return res.status(302).redirect(cachedLinkData)
    }
    else {
      const url = await urlModel.findOne({ urlCode })
      if (!url) return res.status(404).send({ status: false, message: "url not found" })
      await SET_ASYNC(urlCode, url.longUrl)
      return res.status(302).redirect(url.longUrl);
    }
  }

  catch (err) {
    console.error(err);
    res.status(500).send({ status: false, message: "Server Error" });
  }
}



module.exports.createUrl = createUrl;
module.exports.getUrl = getUrl;

