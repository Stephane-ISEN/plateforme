from fastapi import APIRouter, Depends, HTTPException, Security, Body
from fastapi.responses import PlainTextResponse
import httpx
import os
from dotenv import load_dotenv

from app.api.dependencies import get_current_user, check_user_role
from app.crud.transcript_crud import TranscriptCRUD
from app.models.transcript_model import TranscriptCreate

# Load environment variables
load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_KEY")
if not OPENAI_KEY:
    raise ValueError("OPENAI_KEY missing in environment")

router = APIRouter(tags=["realtime"])
transcript_crud = TranscriptCRUD()

@router.post("/webrtc-offer", response_class=PlainTextResponse)
async def webrtc_offer(
    sdp: str = Body(..., media_type="application/sdp"),
    model: str = "gpt-4o-realtime-preview",
    current_user=Security(get_current_user),
):
    """
    Proxies WebRTC SDP offer to OpenAI Realtime API and returns the SDP answer.
    
    This endpoint securely handles the WebRTC negotiation without exposing the OpenAI API key to the client.
    """
    # Check user role
    check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])
    
    # Forward the SDP offer to OpenAI
    url = f"https://api.openai.com/v1/realtime?model={model}"
    headers = {
        "Authorization": f"Bearer {OPENAI_KEY}",
        "Content-Type": "application/sdp"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, content=sdp, headers=headers)
            
            # Check if the response contains a valid SDP answer, even if status code is not 200
            response_text = resp.text
            if response_text.startswith("v=0"):
                # This appears to be a valid SDP answer, return it regardless of status code
                return response_text
            elif resp.status_code != 200:
                # Only raise an exception if it's not a valid SDP answer and status code is not 200
                raise HTTPException(500, f"OpenAI Realtime API error: {response_text}")
            
            return response_text  # Return the SDP answer
    except httpx.RequestError as e:
        raise HTTPException(500, f"Request to OpenAI failed: {str(e)}")

@router.post("/transcripts")
async def save_transcript(
    data: TranscriptCreate,
    current_user=Security(get_current_user),
):
    """
    Saves a transcript received from the WebRTC data channel to MongoDB.
    """
    # Check user role
    check_user_role(current_user, ["SuperAdmin", "Formateur-int", "Formateur-ext", "Formé"])
    
    # Ensure the user_id matches the authenticated user
    if data.user_id != current_user.id:
        raise HTTPException(403, "Cannot save transcript for another user")
    
    # Save the transcript
    result = await transcript_crud.create_transcript(data)
    return {"id": result["id"]}