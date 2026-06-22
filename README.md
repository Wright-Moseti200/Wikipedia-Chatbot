# Wikipedia Chatbot

A sophisticated Node.js and Express backend that powers a conversational Wikipedia chatbot. It leverages LangChain, Google Gemini LLMs, and MongoDB Atlas Vector Search to intelligently retrieve and answer questions based on Wikipedia articles.

## Features

- **Wikipedia Integration**: Automatically searches Wikipedia for the user's query and retrieves relevant information.
- **Vector Search Cache**: Chunks and embeds Wikipedia articles using Google Gemini Embeddings (`gemini-embedding-001`), storing them in MongoDB Atlas. Future queries on the same topic will pull directly from the vector store cache to improve speed and reduce API calls.
- **Intelligent Q&A**: Uses Google's `gemini-2.5-flash-lite` model to synthesize and answer questions accurately based solely on the retrieved context.
- **Conversational Memory**: Maintains chat history in-memory to allow for follow-up questions and conversational continuity.
- **Fallback Mechanism**: If Wikipedia has no information on the queried topic, the chatbot gracefully falls back to using the LLM's own general knowledge.

## Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB Atlas cluster with a configured Vector Search index.
- Google Gemini API Key.

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd Wikipedia-Chatbot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root of the project and add your credentials:
   ```env
   MONGO_URI=your_mongodb_connection_string
   GEMINI_KEY=your_google_gemini_api_key
   ```

## MongoDB Atlas Vector Search Setup

To make the caching and semantic search work, you need to create a Vector Search Index in your MongoDB Atlas cluster:

1. Target the database `Wikipedia` and the collection `wikipediachunks`.
2. Create a Vector Search index named `vector_index`.
3. Configure it to map the `embedding` field as a vector type and `pageContent` as string.

## Usage

1. **Start the server**:
   ```bash
   node index.js
   ```
   The server will start on port `6000` (by default) and connect to the MongoDB database.

2. **API Endpoint**:
   - **POST `/question`**
     - **Body**: JSON containing the user's question.
       ```json
       {
         "question": "Who was Alan Turing?"
       }
       ```
     - **Response**: JSON containing the AI's answer.
       ```json
       {
         "answer": "Alan Mathison Turing was an English mathematician, computer scientist, logician, cryptanalyst, philosopher, and theoretical biologist..."
       }
       ```

## Technologies Used

- **Express.js**: Web server framework.
- **LangChain**: Framework for developing applications powered by language models.
- **Google Gemini**: Large language models for embeddings and text generation.
- **MongoDB Atlas & Mongoose**: Database and object data modeling, specifically utilizing Atlas Vector Search.
