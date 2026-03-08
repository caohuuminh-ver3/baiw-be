# FSDS Academy Back End - Starter

This project is a backend application built with **TypeScript**, **Express**, **MongoDB**, **JWT**, and **class-validator**.

## Prerequisites

Before getting started, ensure you have the following installed on your machine:

- **Node.js** (v20 or higher recommended)
- **npm** (Node Package Manager)
- **Docker** & **Docker Compose** (for running MongoDB locally)

## Getting Started

Follow these steps to set up the project locally:

### 1. Install Dependencies

Install the necessary node modules:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on the example provided:

```bash
cp .env.example .env
```

The `.env` file should contain configuration like this:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/fsds
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Start Database (MongoDB)

Use Docker Compose to start a local MongoDB instance and Mongo Express (database management UI):

```bash
docker-compose up -d
```

- **MongoDB** will run on port `27017`.
- **Mongo Express** will be accessible at `http://localhost:8081`.

### 4. Run the Application

Start the development server with hot-reload:

```bash
npm run dev
```

The server will start at `http://localhost:3056`.

## Scripts

- `npm run dev`: Runs the app in development mode using `ts-node-dev`.
- `npm run build`: Compiles TypeScript code to JavaScript in the `dist` folder.
- `npm start`: Runs the compiled code from `dist/server.js`.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run format`: Formats code using Prettier.

## Hybrid RAG Chatbot Setup

The chatbot uses a Hybrid RAG (Retrieval-Augmented Generation) architecture combining:
- **Vector Search** (semantic similarity using embeddings)
- **Full-Text Search** (keyword matching)
- **Reciprocal Rank Fusion (RRF)** for result combination

### Prerequisites

1. **MongoDB Atlas** account with a cluster
2. **Gemini API Key** (for embeddings and chat)

### Setup Steps

#### 1. Configure Environment Variables

Add the following to your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 2. Create Atlas Vector Search Index

The vector search requires a special index in MongoDB Atlas. Follow these steps:

**Option A: Using Atlas UI**

1. Go to your MongoDB Atlas cluster
2. Click on "Search" in the left sidebar
3. Click "Create Search Index"
4. Select "JSON Editor" and use this configuration:

```json
{
  "name": "course_vector_index",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 768,
        "similarity": "cosine"
      }
    ]
  }
}
```

5. Select the `Courses` collection
6. Click "Create Search Index"

**Option B: Using MongoDB Shell (mongosh)**

```javascript
db.Courses.createSearchIndex({
  name: "course_vector_index",
  type: "vectorSearch",
  definition: {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: 768,
        similarity: "cosine"
      }
    ]
  }
});
```

#### 3. Generate Embeddings for Existing Courses

Run the embedding generation script:

```bash
# Generate embeddings for courses without them
npx ts-node scripts/generate-embeddings.ts

# Force regenerate all embeddings
npx ts-node scripts/generate-embeddings.ts --force

# Preview without making changes
npx ts-node scripts/generate-embeddings.ts --dry-run
```

### How It Works

```
User Query
    │
    ├──────────────────────────────┐
    ▼                              ▼
┌──────────────┐          ┌──────────────────┐
│Vector Search │          │Full-Text Search  │
│(Semantic)    │          │(Keyword)         │
│              │          │                  │
│• Gemini      │          │• MongoDB Text    │
│  Embedding   │          │  Index           │
│• Cosine      │          │• Relevance Score │
│  Similarity  │          │                  │
└──────┬───────┘          └────────┬─────────┘
       │                           │
       └─────────┬─────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ RRF Fusion &       │
        │ Deduplication      │
        └─────────┬──────────┘
                  │
                  ▼
        ┌────────────────────┐
        │ Gemini Generation  │
        │ with Context       │
        └────────────────────┘
```

### Troubleshooting

- **Vector search not working**: Ensure the Atlas Vector Search index is created and the index status is "Active"
- **No embeddings generated**: Check that `GEMINI_API_KEY` is set correctly
- **Rate limit errors**: The script includes delays between batches; increase `DELAY_BETWEEN_BATCHES_MS` if needed
