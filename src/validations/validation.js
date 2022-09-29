

function  validRegex(url){
    return /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g.test(url)
}


const isValid= function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}

const isValidUrl = function (url) {  
    try {
if(!url){
    return "Please Inpur URl"
}

if(!isValid(url)){
    return "url invalid"
}


if(!validRegex(url)){
    return "Invalid URL"
}
    }
    catch(err){
        return res.status(500).send(err.message)
    }
}


module.exports.isValidUrl= isValidUrl