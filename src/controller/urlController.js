const validUrl = require("valid-url");
const shortid = require("shortid");
//const isValid = require('../validations/validation')
const urlModel = require("../models/urlModel");
//const Url = require('../models/urlModel')

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


    const isValid= function (value) {
        if (typeof value === 'undefined' || value === null) return false
        if (typeof value === 'string' && value.trim().length === 0) return false
        return true
    }

     if(!isValid(data.longUrl)){
        return res.status(400).send({status: false, message: "Data should be in string"})
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
    const url = await urlModel.findOne({
      urlCode: req.params.urlCode,
    });
    if (url) {
      // when valid we perform a redirect
      return res.redirect(url.longUrl);
    } else {
      // else return a not found 404 status
      return res.status(404).send({ status: false, message: "No URL Found" });
    }
  } catch (err) {
    // exception handler
    console.error(err);
    res.status(500).send({ status: false, message: "Server Error" });
  }
};

module.exports.createUrl = createUrl;
module.exports.getUrl = getUrl;
