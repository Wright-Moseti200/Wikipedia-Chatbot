let express = require("express");
let cors = require("cors");
const { mongodb } = require("./mongodb/mongodb");
let app = express();
let port = 6000;

app.get("/",(req,res)=>{
    res.send("Express server is running");
});

app.use(cors(),express.json());

app.post("question",(req,res)=>{
try{

}
catch(error){
    console.log(error.message);
}
})

mongodb().then(()=>
app.listen(port,()=>{
    console.log(`Express server is running on port ${port}`);
}))