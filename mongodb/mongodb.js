let mongoose = require("mongoose");
require("dotenv").config();

let mongodb = async()=>{
    try{
        await mongoose.connect()
    }
    catch(error){
        console.log(error.message);
    }
}

module.exports={mongodb};