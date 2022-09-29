const express = require('express');
var bodyParser = require('body-parser');

const route = require('../src/routes/route')
const app = express();
const mongoose=require('mongoose')
mongoose.connect("mongodb+srv://NehaVerma009:A9CEHRbpunBJ90to@cluster0.r6xdcuv.mongodb.net/group48Database", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )



app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', route);

app.use(function(req,res){
    return res.status(404).send({status:false,message:"Path not Found."})
  })
  
app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});


