import {
  drawHandLandmarks,
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  addDebugValue,
  clearDebugValues,
} from "../../utilities.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");

// bind ctrl-d to enable debug mode
enableDebugShortcut();

// All of the landmarks can be found in this image:
// https://ai.google.dev/static/edge/mediapipe/images/solutions/hand-landmarks.png
function DEBUG_indexFingerLocations(results) {
  if (!results.length) {
    return;
  }

  // We're don't always have both hands on the screen - maybe you're only showing your
  // right hand! So we clear the values on each tick to avoid having a "stale" value
  // (e.g. if your left hand was on the screen before but now your right hand is)
  clearDebugValues();
  // These coordinates are in the same space as the video feed. They go
  // from 0 to 1 - so (0, 0) is the top left corner, and (1, 1) is the bottom right.
  results.forEach(({ landmarks, label }) => {
    const indexFinger = landmarks[8];
    addDebugValue({
      label: `${label} index finger (x)`,
      value: `${indexFinger.x.toFixed(2)}`,
    });
    addDebugValue({
      label: `${label} index finger (y)`,
      value: `${indexFinger.y.toFixed(2)}`,
    });
  });
}

function doThingsWithLandmarks({ time, handLandmarkResults }) {
  clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  if (handLandmarkResults) {
    drawHandLandmarks({ results: handLandmarkResults, canvas: drawingCanvas });
    DEBUG_indexFingerLocations(handLandmarkResults);
  }
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestHandLandmarks: true,
  doThingsWithLandmarks,
  runOnce: () => {
    // Uncomment the below line (and comment out the clearCanvas call above) for something trippy
    // clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  },
});
