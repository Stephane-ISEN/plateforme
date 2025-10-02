#!/usr/bin/env python
"""
Speech Pipeline Example

This script demonstrates how to use the speech pipeline to process audio input,
generate a response, and convert the response to speech.
"""

import os
import asyncio
from app.connector.speech_pipeline import SpeechPipeline

async def run_example():
    """
    Run a simple example of the speech pipeline.
    """
    # Initialize the pipeline
    pipeline = SpeechPipeline()
    
    # Example conversation history
    history = [
        {
            "role": "system",
            "content": "You are a helpful assistant that provides concise and accurate information."
        },
        {
            "role": "user",
            "content": "Hello, who are you?"
        },
        {
            "role": "assistant",
            "content": "I'm an AI assistant designed to help answer your questions and assist with various tasks. How can I help you today?"
        }
    ]
    
    # Path to the input audio file
    # Replace with your own audio file
    input_file = "example_input.mp3"
    
    # Check if the input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        print("Please replace 'example_input.mp3' with the path to your audio file.")
        return
    
    try:
        # 1. Transcribe audio to text
        print("Transcribing audio...")
        text = await pipeline.transcribe(input_file)
        print(f"Transcription: {text}")
        
        # 2. Process text through chat model
        print("Processing through chat model...")
        reply, updated_history = await pipeline.chat(text, history)
        print(f"Chat response: {reply}")
        
        # 3. Convert chat response to speech
        print("Converting to speech...")
        output_file = "example_output.mp3"
        audio_bytes = pipeline.synthesize(reply, output_file)
        print(f"Speech saved to {output_file}")
        
        # Print the updated conversation history
        print("\nUpdated conversation history:")
        for message in updated_history:
            role = message["role"]
            content = message["content"]
            print(f"{role.capitalize()}: {content}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Run the example
    asyncio.run(run_example())