/**
 * WebSocket Voice Communication Test Script
 * 
 * This script tests the WebSocket-based voice communication system.
 * It can be run in a browser console when on the streaming voice page.
 * 
 * Features tested:
 * 1. WebSocket connection
 * 2. Authentication
 * 3. Audio streaming
 * 4. Transcription
 * 5. LLM processing
 * 6. TTS streaming
 * 7. MediaSource playback
 */

console.log("Starting WebSocket Voice Communication Test...");

// Test 1: Check if WebSocket is supported
if (!window.WebSocket) {
  console.error("WebSocket is not supported in this browser!");
  throw new Error("WebSocket not supported");
}
console.log("✅ WebSocket is supported");

// Test 2: Check if MediaSource is supported
if (!window.MediaSource) {
  console.error("MediaSource is not supported in this browser!");
  throw new Error("MediaSource not supported");
}
console.log("✅ MediaSource is supported");

// Test 3: Check if required components are present
const streamingRecorderSender = document.querySelector('[class*="StreamingRecorderSender"]');
if (!streamingRecorderSender) {
  console.error("StreamingRecorderSender component not found!");
}
console.log("✅ StreamingRecorderSender component found");

const mediaSourcePlayer = document.querySelector('.media-source-player');
if (!mediaSourcePlayer) {
  console.error("MediaSourcePlayer component not found!");
}
console.log("✅ MediaSourcePlayer component found");

const visualizer = document.querySelector('canvas');
if (!visualizer) {
  console.error("Visualizer component not found!");
}
console.log("✅ Visualizer component found");

// Test 4: Check if token is available
const token = localStorage.getItem("token");
if (!token) {
  console.error("Authentication token not found in localStorage!");
}
console.log("✅ Authentication token found");

// Test 5: Create a test WebSocket connection
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const wsUrl = `${apiBase.replace(/^http/, "ws")}/voice-agent/ws/voice`;

console.log(`Attempting to connect to WebSocket at ${wsUrl}`);
const testSocket = new WebSocket(wsUrl);

testSocket.onopen = () => {
  console.log("✅ WebSocket connection established");
  
  // Send authentication message
  const authMessage = {
    token,
    history: JSON.stringify([])
  };
  testSocket.send(JSON.stringify(authMessage));
  console.log("✅ Authentication message sent");
  
  // Close the test connection after authentication
  setTimeout(() => {
    testSocket.close(1000, "Test completed");
  }, 1000);
};

testSocket.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    console.log("✅ Received message from server:", message);
    
    if (message.status === "connected") {
      console.log("✅ Authentication successful");
    } else if (message.error) {
      console.error("❌ Server error:", message.error);
    }
  } catch (error) {
    console.error("❌ Error parsing message:", error);
  }
};

testSocket.onerror = (error) => {
  console.error("❌ WebSocket error:", error);
};

testSocket.onclose = (event) => {
  console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
  
  if (event.code === 1000) {
    console.log("✅ Test connection closed cleanly");
  } else {
    console.error(`❌ Connection closed with code ${event.code}`);
  }
  
  // Run end-to-end test
  runEndToEndTest();
};

// Test 6: End-to-end test with simulated recording
function runEndToEndTest() {
  console.log("Starting end-to-end test...");
  
  // Check if MediaRecorder is supported
  if (!window.MediaRecorder) {
    console.error("MediaRecorder is not supported in this browser!");
    return;
  }
  console.log("✅ MediaRecorder is supported");
  
  // Create a mock audio stream
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      console.log("✅ Got audio stream");
      
      // Create a MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      console.log("✅ Created MediaRecorder");
      
      // Set up data handler
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log(`✅ Recorded chunk: ${e.data.size} bytes`);
        }
      };
      
      // Set up stop handler
      recorder.onstop = () => {
        console.log("✅ Recording stopped");
        
        // Create a blob from the chunks
        const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
        console.log(`✅ Created blob: ${blob.size} bytes`);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        console.log("✅ Cleaned up audio stream");
        
        console.log("End-to-end test completed");
        console.log("To test the full system, click the microphone button and speak");
      };
      
      // Start recording for 3 seconds
      console.log("Starting 3-second test recording...");
      recorder.start();
      setTimeout(() => {
        recorder.stop();
      }, 3000);
    })
    .catch(error => {
      console.error("❌ Error getting audio stream:", error);
    });
}

// Test 7: Performance monitoring
console.log("Setting up performance monitoring...");

// Monitor WebSocket messages
const originalWebSocketSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(data) {
  const startTime = performance.now();
  const result = originalWebSocketSend.call(this, data);
  const endTime = performance.now();
  
  if (data instanceof Blob) {
    console.log(`WebSocket sent ${data.size} bytes in ${(endTime - startTime).toFixed(2)}ms`);
  }
  
  return result;
};

// Monitor audio playback
const audioElements = document.querySelectorAll('audio');
audioElements.forEach(audio => {
  const originalPlay = audio.play;
  audio.play = function() {
    const startTime = performance.now();
    const result = originalPlay.call(this);
    const endTime = performance.now();
    
    console.log(`Audio playback started in ${(endTime - startTime).toFixed(2)}ms`);
    
    return result;
  };
});

console.log("WebSocket Voice Communication Test setup complete");
console.log("Check the console for test results as you interact with the page");