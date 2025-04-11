# Real-time Collaborative Document Editor (realdoc-app)

A distributed, real-time collaborative document editor with MongoDB persistence and crash recovery.

## Features

- Real-time document collaboration using WebSockets
- Distributed state across multiple server instances
- Automatic recovery from server crashes using MongoDB
- Operational transform for conflict resolution
- Persistent document storage with edit history

## Setup

1. Clone the repository
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file from `.env.example` and configure your MongoDB URI
5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## MongoDB Configuration

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Get your connection string and add it to `.env`
3. The database will automatically create the required collections

## Deployment to Render

1. Push your code to a GitHub repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Set the following environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `PORT`: 8000
   - `JWT_SECRET`: A strong secret key
5. Deploy!

## API Documentation

After running the server, access the interactive API docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## WebSocket Protocol

Connect to `ws://localhost:8000/ws/{document_id}` to:
- Receive real-time updates
- Send document edits
- Sync with other clients
- Handle recovery events
