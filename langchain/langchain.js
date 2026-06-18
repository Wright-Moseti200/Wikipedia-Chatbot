require("dotenv").config();
let {WikipediaQueryRun} = require("@langchain/community/tools/wikipedia_query_run");
let {RecursiveCharacterTextSplitter} = require("@langchain/textsplitters")
let {Document} = require("@langchain/core/documents");
let {ChatGoogleGenerativeAI,GoogleGenerativeAIEmbeddings} = require("@langchain/google-genai");
let {createRetrievalChain} = require("@langchain/classic/chains/retrieval");
let {createStuffDocumentsChain}=require("@langchain/classic/chains/combine_documents");
let {ChatPromptTemplate} = require("@langchain/core/prompts");
let {MongoDBAtlasVectorSearch} = require("@langchain/mongodb")
let mongoose = require("mongoose");

const similarityThreshold = 0.82;

let langchain = async(question) =>{
    try{
        let wikipediacollection = mongoose.connection.db.collection("wikipediachunks");
        let geminiembeddings = new GoogleGenerativeAIEmbeddings({model:"gemini-embedding-001",apiKey:""})
        let vectorSearch = new MongoDBAtlasVectorSearch(geminiembeddings,{
            collection:wikipediacollection,
            indexName:"vector_index",
            textKey:"pageContent",
            embeddingKey:"embedding"
        });
       let results = await vectorSearch.similaritySearchWithScore(question,10);
      let goodMatches =  results.filter(([,score])=> score >= similarityThreshold);
      
      if(goodMatches.length>0){
        console.log(`[Cache hit] Found ${goodMatches.length} relevant chunks in MongoDB`);
        let docs = goodMatches.map(([document])=>document.pageContent);
      }
 
    }
    catch(error){
        console.log(error.message);
    }
}

module.exports={langchain}
