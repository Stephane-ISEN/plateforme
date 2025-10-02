// This is a simple test script to verify that buttons are clickable
// and that the SimpleVisualizer still functions properly.
// You can run this in the browser console when on the speech page.

console.log("Starting SimpleVisualizer interaction test...");

// Test 1: Verify that the fullscreen toggle button is clickable
const fullscreenButton = document.querySelector('button[class*="absolute top-4 right-4"]');
if (fullscreenButton) {
  console.log("Fullscreen button found, attempting to click...");
  // Simulate a click on the fullscreen button
  fullscreenButton.click();
  console.log("Fullscreen button clicked. Check if fullscreen mode toggled.");
} else {
  console.error("Fullscreen button not found!");
}

// Test 2: Verify that the RecorderSender component is clickable
setTimeout(() => {
  const recorderButton = document.querySelector('div[class*="absolute bottom-8"] button');
  if (recorderButton) {
    console.log("Recorder button found, attempting to click...");
    // Simulate a click on the recorder button
    recorderButton.click();
    console.log("Recorder button clicked. Check if recording started/stopped.");
  } else {
    console.error("Recorder button not found!");
  }
}, 1000);

// Test 3: Verify that the SimpleVisualizer still functions properly
setTimeout(() => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    console.log("Canvas found, attempting to click...");
    // Simulate a click on the canvas
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    canvas.dispatchEvent(event);
    console.log("Canvas clicked. Check if audio context initialized.");
  } else {
    console.error("Canvas not found!");
  }
}, 2000);

console.log("SimpleVisualizer interaction test complete.");
console.log("Manual verification required:");
console.log("1. Verify that the fullscreen button toggles fullscreen mode");
console.log("2. Verify that the recorder button starts/stops recording");
console.log("3. Verify that clicking on the visualizer initializes audio");
console.log("4. Verify that the audio visualization still works correctly");