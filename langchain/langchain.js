require("dotenv").config();
let {WikipediaQueryRun} = require("@langchain/community/tools/wikipedia_query_run");
let {RecursiveCharacterTextSplitter} = require("@langchain/textsplitters")
let {Document} = require("@langchain/core/documents");
let {ChatGoogleGenerativeAI,GoogleGenerativeAIEmbeddings} = require("@langchain/google-genai");
let {createStuffDocumentsChain}=require("@langchain/classic/chains/combine_documents");
let {ChatPromptTemplate, MessagesPlaceholder} = require("@langchain/core/prompts");
let {MongoDBAtlasVectorSearch} = require("@langchain/mongodb");
let {ChatMessageHistory} = require("@langchain/classic/stores/message/in_memory");
let mongoose = require("mongoose");


const similarityThreshold = 0.82;

let chatHistory = new ChatMessageHistory();

let langchain = async(question) =>{
    try{
        let wikipediacollection = mongoose.connection.db.collection("wikipediachunks");
        let geminiembeddings = new GoogleGenerativeAIEmbeddings({model:"gemini-embedding-001",apiKey:process.env.GEMINI_KEY})
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
        let docs = goodMatches.map(([document])=>document);
        let llm = new ChatGoogleGenerativeAI({model:"gemini-2.5-flash-lite",apiKey:process.env.GEMINI_KEY});
        let prompt = ChatPromptTemplate.fromMessages([
            ["system","Answer using only this context:\n\n{context}"],
            new MessagesPlaceholder("chat_history"),
            ["human","{input}"]
        ]);
        let docsChain = await createStuffDocumentsChain({llm,prompt});
        let answer = await docsChain.invoke({
            input:question,
            context:docs,
            chat_history:await chatHistory.getMessages()
        });
        await chatHistory.addUserMessage(question);
        await chatHistory.addAIMessage(answer);
        return answer;
      }

      console.log("Cache miss fetching from wikipedia");
      let wiki = new WikipediaQueryRun({topKResults:1,maxDocContentLength:5000});
      let rawText = await wiki.invoke(question);
      if(!rawText || rawText.startsWith("No good Wikipedia Search Result")){
          console.log(`No Wikipedia article found for: "${question}"-using models own knowledge`);
          let llm = new ChatGoogleGenerativeAI({model:"gemini-2.5-flash-lite",apiKey:process.env.GEMINI_KEY});
          let fallbackPrompt = ChatPromptTemplate.fromMessages([
            ["system","You are a helpful assistant. Wikipedia had no article on this topic, so answer using your own general knowledge instead."],
            new MessagesPlaceholder("chat_history"),
            ["human","{input}"]
          ]);
          let fallbackchain = fallbackPrompt.pipe(llm);
          let result = await fallbackchain.invoke({
            input:question,
            chat_history:await chatHistory.getMessages()
          });
          let answer = result.content;
          await chatHistory.addUserMessage(question);
          await chatHistory.addAIMessage(answer);
          return answer;
      }
      let splitter = new RecursiveCharacterTextSplitter({
        chunkSize:1000,
        chunkOverlap:150
      });

     let chunks = await splitter.splitDocuments([new Document({pageContent:rawText,metadata:{topic:question}})]);
     await vectorSearch.addDocuments(chunks);
     let llm = new ChatGoogleGenerativeAI({model:"gemini-2.5-flash-lite",apiKey:process.env.GEMINI_KEY});
        let prompt = ChatPromptTemplate.fromMessages([
            ["system","Answer using only this context:\n\n{context}"],
            new MessagesPlaceholder("chat_history"),
            ["human","{input}"]
        ]);
        let docsChain = await createStuffDocumentsChain({llm,prompt});
        let answer = await docsChain.invoke({
            input:question,
            context:chunks,
            chat_history:await chatHistory.getMessages()
        });
        await chatHistory.addUserMessage(question);
        await chatHistory.addAIMessage(answer);
        return answer;
    }
    catch(error){
        console.log(error.message);
    }
}

module.exports={langchain}
