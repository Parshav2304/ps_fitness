from fastapi import APIRouter, HTTPException, Depends
import logging

from app.database import get_database
from app.auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])

@router.get("/chat/history")
async def get_chat_history(current_user_id: str = Depends(get_current_user_id)):
    """Get user's chat history"""
    try:
        db = get_database()
        cursor = db.chat_history.find({"user_id": current_user_id}).sort("created_at", -1).limit(50)
        recent_docs = await cursor.to_list(length=50)
        
        history = []
        for doc in reversed(recent_docs):
            history.append({'role': 'user', 'content': doc['message'], 'timestamp': doc['created_at'].isoformat()})
            history.append({'role': 'assistant', 'content': doc['response'], 'timestamp': doc['created_at'].isoformat()})
            
        return history
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting chat history: {str(e)}"
        )
