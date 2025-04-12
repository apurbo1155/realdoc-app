from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
import httpx
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from app.websocket import ConnectionManager
from app.db import get_db
from app.auth.login import router as auth_router
import os

app = FastAPI()
app.include_router(auth_router)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Verify token with backend API
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8001/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.json()

from fastapi import Depends, HTTPException
from app.db import get_db
from pydantic import BaseModel

class Document(BaseModel):
    content: str

@app.get("/")
async def root():
    return {
        "message": "Welcome to RealDoc API",
        "endpoints": {
            "documents": "/api/documents/{doc_id}",
            "websocket": "/ws/{document_id}",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

@app.get("/api/documents/{doc_id}")
async def get_document(doc_id: str, db=Depends(get_db)):
    document = await db.documents.find_one({"_id": doc_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.post("/api/documents/{doc_id}")
async def save_document(doc_id: str, document: Document, db=Depends(get_db)):
    await db.documents.update_one(
        {"_id": doc_id},
        {"$set": {"content": document.content}},
        upsert=True
    )
    return {"status": "success"}

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket manager
manager = ConnectionManager()

@app.websocket("/ws/{document_id}")
async def websocket_endpoint(websocket: WebSocket, document_id: str):
    await manager.connect(websocket, document_id)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data, document_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, document_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
