import {
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  getHandTracePath,
  getMouthTracePath,
  getLeftEyeTracePath,
  getRightEyeTracePath,
  getOuterFaceTracePath,
  maskOutPath,
  outlinePath,
  addDebugValue,
  extractFacialBlendshape,
} from "../../utilities.js";
import colors from "../../colors.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");

// bind ctrl-d to enable debug mode
enableDebugShortcut();

function doThingsWithLandmarks({ faceLandmarkResults, handLandmarkResults }) {
  const ctx = drawingCanvas.getContext("2d");
  const hasFaceLandmarks =
    faceLandmarkResults && faceLandmarkResults.faceLandmarks.length > 0;
  const hasHandLandmarks =
    handLandmarkResults && handLandmarkResults.length > 0;

  let globalAlpha = 1;

  if (hasFaceLandmarks) {
    const jawOpenScore = extractFacialBlendshape({
      faceLandmarkResults,
      label: "jawOpen",
    });
    globalAlpha = 0.2 + jawOpenScore;
  }

  const thresholdToDraw = 0.4;

  if (hasFaceLandmarks || hasHandLandmarks) {
    ctx.save();
    ctx.fillStyle = colors.teal;
    if (globalAlpha > thresholdToDraw) {
      ctx.globalAlpha = globalAlpha;
      ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }
    ctx.restore();
  } else {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  }

  if (globalAlpha > thresholdToDraw) {
    if (hasFaceLandmarks) {
      const mouthTracePath = getMouthTracePath({ ctx, faceLandmarkResults });
      outlinePath({
        ctx,
        path: mouthTracePath,
        outlineColor: colors.red,
        lineWidth: 10,
      });
      const rightEyeTracePath = getRightEyeTracePath({
        ctx,
        faceLandmarkResults,
      });
      outlinePath({
        ctx,
        path: rightEyeTracePath,
        outlineColor: colors.blue,
        lineWidth: 10,
      });
      const leftEyeTracePath = getLeftEyeTracePath({
        ctx,
        faceLandmarkResults,
      });
      outlinePath({
        ctx,
        path: leftEyeTracePath,
        outlineColor: colors.blue,
        lineWidth: 10,
      });
      const outerFaceTracePath = getOuterFaceTracePath({
        ctx,
        faceLandmarkResults,
      });
      outlinePath({
        ctx,
        path: outerFaceTracePath,
        outlineColor: colors.green,
        lineWidth: 10,
      });
    }

    if (hasHandLandmarks) {
      const handTracePath = getHandTracePath({ ctx, handLandmarkResults });
      outlinePath({
        ctx,
        path: handTracePath,
        outlineColor: colors.yellow,
        lineWidth: 20,
      });
    }
  }
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestFaceLandmarks: true,
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
