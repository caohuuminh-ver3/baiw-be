# Render Deployment Guide for Node.js Backend

## Prerequisites

1. **GitHub Account** - Sign up at https://github.com if you don't have one
2. **Render Account** - Sign up at https://render.com (use GitHub login for easy integration)
3. **Git installed** - Download from https://git-scm.com
4. **MongoDB Atlas Account** - For production database: https://www.mongodb.com/cloud/atlas
5. **Gemini API Key** - For chatbot functionality: https://aistudio.google.com/apikey

## Step 1: Prepare Your Environment Variables

Before deploying, ensure you have the following environment variables ready:

| Variable           | Description                                      | Example                                          |
| ------------------ | ------------------------------------------------ | ------------------------------------------------ |
| `PORT`             | Server port (Render provides this automatically) | `3000`                                           |
| `CLIENT_URL`       | Frontend URL (for CORS)                          | `https://your-frontend.onrender.com`             |
| `MONGO_URI`        | MongoDB Atlas connection string                  | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `GEMINI_API_KEY`   | Google Gemini API key                            | `AIza...`                                        |
| `GEMINI_MODEL`     | Gemini model to use                              | `gemini-3.5-preview-flash`                       |
| `FPGROWTH_API_URL` | FP-Growth recommendation API URL                 | `https://your-recsys.onrender.com`               |

## Step 2: Push Your Code to GitHub

```bash
# Initialize git (skip if already done)
git init

# Add all files
git add .

# Commit
git commit -m "Add backend API"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Render

### Option A: Via Render Dashboard (Recommended for Beginners)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository
5. Configure the service:
   - **Name**: `fsds-backend-api` (or your preferred name)
   - **Root Directory**: `backend` (if backend is in a subdirectory)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add **Environment Variables**:
   - Click "Advanced" and add all required environment variables from Step 1
   - Note: `PORT` is automatically provided by Render
7. Click **"Create Web Service"**
8. Wait for deployment to complete (~3-5 minutes)

### Option B: Via Blueprint (render.yaml)

Create a `render.yaml` file in your repository root:

```yaml
services:
  - type: web
    name: fsds-backend-api
    runtime: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: CLIENT_URL
        sync: false # Set manually in dashboard
      - key: MONGO_URI
        sync: false # Set manually in dashboard
      - key: GEMINI_API_KEY
        sync: false # Set manually in dashboard
      - key: GEMINI_MODEL
        value: gemini-2.0-flash
      - key: FPGROWTH_API_URL
        sync: false # Set manually in dashboard
```

Then:

1. Go to https://dashboard.render.com/blueprints
2. Click **"New Blueprint Instance"**
3. Select your repository
4. Click **"Apply"**
5. Add the sensitive environment variables in the dashboard

## Step 4: Test Your API

After deployment, Render will give you a URL like `https://fsds-backend-api.onrender.com`

Test the API:

```bash
# Health check (if implemented)
curl "https://fsds-backend-api.onrender.com/v1/api/health"

# Test a public endpoint
curl "https://fsds-backend-api.onrender.com/v1/api/courses"
```

Or open in browser:

```
https://fsds-backend-api.onrender.com/v1/api/courses
```

## Project Structure for Render

```
backend/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── server.ts           # Server entry point
│   ├── controllers/        # Route controllers
│   ├── services/           # Business logic
│   ├── models/             # MongoDB models
│   ├── routers/            # API routes
│   ├── middlewares/        # Express middlewares
│   ├── utils/              # Utility functions
│   └── db/                 # Database configuration
├── dist/                   # Compiled JavaScript (generated)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── .env.example            # Environment variables template
```

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your local settings
```

### 3. Start MongoDB (using Docker)

```bash
docker-compose up -d
```

### 4. Run Development Server

```bash
npm run dev
```

### Test locally

```bash
curl "http://localhost:3000/v1/api/courses"
```

## MongoDB Atlas Setup

For production, you need a MongoDB Atlas cluster:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0 is free forever)
3. Click **"Connect"** → **"Drivers"**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Add the connection string as `MONGO_URI` in Render

### Important: Network Access

Add Render's IP to MongoDB Atlas whitelist:

1. Go to **"Network Access"** in Atlas
2. Click **"Add IP Address"**
3. Add `0.0.0.0/0` (allow from anywhere) OR
4. Add Render's static IPs (requires paid Render plan)

### Create Vector Search Index (for Chatbot)

If using the Hybrid RAG chatbot, create the vector search index:

1. Go to your Atlas cluster → **"Search"**
2. Click **"Create Search Index"**
3. Use JSON Editor with this config:

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

4. Select the `Courses` collection and create

## Troubleshooting

### Common Issues

1. **Build fails with TypeScript errors**
   - Ensure all type definitions are installed: `npm install`
   - Check that `tsconfig.build.json` exists and is correct

2. **MongoDB connection timeout**
   - Verify `MONGO_URI` is correct
   - Check MongoDB Atlas network access settings
   - Ensure cluster is running

3. **CORS errors on frontend**
   - Set `CLIENT_URL` environment variable to your frontend URL
   - Include protocol: `https://your-frontend.onrender.com`

4. **Gemini API errors**
   - Verify `GEMINI_API_KEY` is valid
   - Check API quota limits in Google AI Studio

5. **Cold start issues**
   - Free tier services spin down after 15 minutes of inactivity
   - First request may take ~30 seconds

### View Logs

In Render dashboard:

1. Go to your service
2. Click **"Logs"** tab
3. View real-time logs and errors

## Render Limits (Free Tier)

- 750 hours/month of running time
- Services spin down after 15 minutes of inactivity
- First request after spin-down may take ~30 seconds (cold start)
- 512MB RAM
- 100GB bandwidth/month
