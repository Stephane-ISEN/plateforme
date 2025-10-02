#!/usr/bin/env python3
"""
Test script to verify the fix for the TTS error.
This script tests the synthesize_speech method to ensure it returns a readable buffer.
"""

import sys
import os

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastApiProject.app.connector.openai_voice_client import voice_agent

def test_synthesize_speech():
    """Test that synthesize_speech returns a readable buffer."""
    print("Testing synthesize_speech method...")
    
    # Test text
    test_text = "This is a test of the text-to-speech functionality."
    
    try:
        # Call the synthesize_speech method
        audio_buf = voice_agent.synthesize_speech(test_text)
        
        # Check if the buffer is readable
        try:
            audio_data = audio_buf.read()
            print(f"Success! Buffer is readable. Read {len(audio_data)} bytes.")
            
            # Write the audio to a file for manual verification
            with open("test_tts_output.mp3", "wb") as f:
                f.write(audio_data)
            print("Audio saved to test_tts_output.mp3 for manual verification.")
            
            return True
        except Exception as e:
            print(f"Error reading from buffer: {e}")
            return False
    except Exception as e:
        print(f"Error calling synthesize_speech: {e}")
        return False

if __name__ == "__main__":
    success = test_synthesize_speech()
    if success:
        print("Test passed! The fix was successful.")
        sys.exit(0)
    else:
        print("Test failed! The fix did not resolve the issue.")
        sys.exit(1)