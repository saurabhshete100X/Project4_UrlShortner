//const validUrl = require("valid-url");
const shortid = require("shortid");
const redis = require("redis");//temporary database, which used to store temporary data for quick response.

const  {promisify} = require("util");//util is a package & promisify is its one of the function.
const urlModel = require("../models/urlModel");


const redisClient = redis.createClient(
  17983,//port
  "redis-17983.c212.ap-south-1-1.ec2.cloud.redislabs.com",     //ip address
  { no_ready_check: true}
);

redisClient.auth("3pLDCvebl3GLDREqI9yoALqNaxt9dbHF", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {             //to connect...Event Listener
  console.log("Connected to Redis..");
});

const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
//const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const baseUrl = "http://localhost:3000/";                  //Local Domain (IP Address)

const isValid = function (value) {
  if (typeof value === 'undefined' || value === null) return false
  if (typeof value === 'string' && value.trim().length === 0) return false
  return true
}


const urlRegex = (value) => {
  //  USING THIS REGEX TO VALIDATE URL PATTERN
  let urlRegex =
    /^(?:(?:(?:https?|http):)?\/\/.*\.(?:png|gif|webp|com|in|org|co|co.in|net|jpeg|jpg))/i;
  if (urlRegex.test(value)) return true;
};

const createUrl = async function (req, res) {
  try {
    let data = req.body;

    if (Object.keys(data).length == 0) {     //Object.keys returns an array
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

    if (!isValid(data.longUrl)) {
      return res.status(400).send({ status: false, message: "URL should be in string" })
    }


    if (!urlRegex(data.longUrl))
      return res.status(400).send({ status: false, message: "Wrong Url" });


      
      const cachedData= await GET_ASYNC(`${data.longUrl}`)
      if(cachedData){
        let data = JSON.parse(cachedData)
        return res
        .status(200)
        .send({ status: true, message: "Data from cache", data: data });
      }


    let permanentUrl = await urlModel
      .findOne({ longUrl: data.longUrl })
      .select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0 });

      if(permanentUrl){
        await SETEX_ASYNC(`${data.longUrl}`,10,JSON.stringify(permanentUrl)) //setting in cache 
      return res
      .status(200)
      .send({ status: true, message: "Data from DB", data: permanentUrl });
  }


    if (!permanentUrl) {
      let urlCode = shortid.generate().toLowerCase();        
      let shortUrl = baseUrl + urlCode;
      data.urlCode = urlCode;
      data.shortUrl = shortUrl;
     const savedData= await urlModel.create(data);
      await SETEX_ASYNC(`${data.longUrl}`,10, JSON.stringify(savedData))

     return res.status(201).send({ status: true,message:"Data created...data coming from db", data: data });
     }
    //  else {
    //   return res
    //     .status(200)
    //     .send({ status: true, message: "Already generated", data: permanentUrl });
    // }
  } catch (err) {
   return res.status(500).send({ status: false, message: err.message });
  }
};


//*************************GET API********************************** */

const getUrl = async function (req, res) {
  try {
    // find a document match to the code in req.params.code
    let urlCode = req.params.urlCode                // urlCode

    if(!shortid.isValid(urlCode)){
      return res.status(400).send({ status: false, message: "urlCode is not valid" })
    }



    let cachedLinkData = await GET_ASYNC(urlCode)  // Check On Caching Server

    if (cachedLinkData) {                        // if we found data in cachedLinkData then simply redirected.
     // console.log(cachedLinkData)
      return res.status(302).redirect(cachedLinkData)
    }
    else {
      const url = await urlModel.findOne({ urlCode:urlCode})
      if (!url) return res.status(404).send({ status: false, message: "url not found" })
      await SETEX_ASYNC(`${req.params.urlCode}`,10, url.longUrl)
      return res.status(302).redirect(url.longUrl);
    }
  }

  catch (err) {
    console.error(err);
   return res.status(500).send({ status: false, message: "Server Error" });
  }
}



module.exports.createUrl = createUrl;
module.exports.getUrl = getUrl;
