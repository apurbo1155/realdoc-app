import datetime
from typing import List, Dict
from .db import get_db

def recover_document(document_id: str) -> Dict:
    """Recover document state after server crash"""
    db = get_db()
    
    # Get the latest document version
    document = db.documents.find_one({"_id": document_id})
    if not document:
        return None
        
    # Get all edits since last known good state
    edits = list(db.edit_history.find(
        {"document_id": document_id},
        sort=[("timestamp", -1)]
    ))
    
    # Reconstruct document state by applying edits
    recovered_content = document.get("content", "")
    for edit in reversed(edits):
        recovered_content = apply_edit(recovered_content, edit["edit"])
    
    return {
        "document_id": document_id,
        "content": recovered_content,
        "recovered_at": datetime.datetime.utcnow()
    }

def apply_edit(content: str, edit: Dict) -> str:
    """Apply a single edit operation to the document content"""
    # Simple text replacement for now
    # In a real implementation, this would handle operational transforms
    if edit["type"] == "insert":
        return content[:edit["position"]] + edit["text"] + content[edit["position"]:]
    elif edit["type"] == "delete":
        return content[:edit["position"]] + content[edit["position"] + edit["length"]:]
    return content
