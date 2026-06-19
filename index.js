let express = require("express");
let cors = require("cors");
const { mongodb } = require("./mongodb/mongodb");
const { langchain } = require("./langchain/langchain");
let app = express();
let port = 6000;

app.get("/",(req,res)=>{
    res.send("Express server is running");
});

app.use(cors(),express.json());

app.post("/question", async (req,res)=>{
try{
    let { question } = req.body;
    let answer = await langchain(question);
    res.json({ answer });
}
catch(error){
    console.log(error.message);
    res.status(500).json({ error: error.message });
}
})

mongodb().then(()=>
app.listen(port,()=>{
    console.log(`Express server is running on port ${port}`);
}))