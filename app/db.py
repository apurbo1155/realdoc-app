from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from typing import Optional

def get_db():
    """Connect to MongoDB and return database instance"""
    try:
        client = MongoClient(os.getenv("MONGODB_URI"))
        db = client.get_database()
        # Verify the connection
        client.admin.command('ping')
        return db
    except ConnectionFailure as e:
        raise Exception(f"Failed to connect to MongoDB: {str(e)}")

def save_document(document_id: str, content: str):
    """Save document content to MongoDB"""
    db = get_db()
    db.documents.update_one(
        {"_id": document_id},
        {"$set": {"content": content}},
        upsert=True
    )

def get_document(document_id: str) -> Optional[dict]:
    """Retrieve document from MongoDB"""
    db = get_db()
    return db.documents.find_one({"_id": document_id})

def save_edit_history(document_id: str, edit: dict):
    """Save edit history for recovery"""
    db = get_db()
    db.edit_history.insert_one({
        "document_id": document_id,
        "edit": edit,
        "timestamp": datetime.datetime.utcnow()
    })
