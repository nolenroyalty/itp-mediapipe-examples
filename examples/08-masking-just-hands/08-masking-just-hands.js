import {
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  getHandTracePath,
  maskOutPath,
  outlinePath,
  addDebugValue,
  clearDebugValues,
} from "../../utilities.js";
import colors from "../../colors.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");

// bind ctrl-d to enable debug mode
enableDebugShortcut();

function doThingsWithLandmarks({ handLandmarkResults }) {
  const ctx = drawingCanvas.getContext("2d");

  if (handLandmarkResults && handLandmarkResults.length > 0) {
    ctx.save();
    ctx.fillStyle = colors.teal;
    // try adjusting this down!
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    ctx.restore();
    addDebugValue({
      label: "hand count",
      value: String(handLandmarkResults.length),
    });
    const handTracePath = getHandTracePath({ ctx, handLandmarkResults });
    outlinePath({
      ctx,
      path: handTracePath,
      outlineColor: colors.yellow,
      lineWidth: 60,
    });
    maskOutPath({
      ctx,
      path: handTracePath,
      lineWidth: 40,
    });
  } else {
    addDebugValue({
      label: "hand count",
      value: "0",
    });
  }
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestHandLandmarks: true,
  doThingsWithLandmarks,
  runBeforeProcessingVideoFrame: () => {
    // We need to clear the canvas so that the video isn't obscured and we can
    // detect hands! It's weird that this is necessary. Browsers are crazy.
    const ctx = drawingCanvas.getContext("2d");
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  },
  runOnce: () => {
    clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  },
  handLandmarkerArguments: {
    minDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
  },
});
