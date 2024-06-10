import {
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  addDebugValue,
  extractFacialBlendshape,
} from "../../utilities.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");
const waterPot = document.querySelector("#waterPot");

// Properly calibrating this number is hard; faces are very different!
// This is a good starting point for the workshop, but you should think carefully
// about this is and do lots of testing if you're launching something into the world!
const EYES_CLOSED_THRESHOLD = 0.45;

// bind ctrl-d to enable debug mode
enableDebugShortcut();

function DEBUG_blinkValue({ leftOrRight, value }) {
  addDebugValue({
    label: `${leftOrRight} value`,
    value,
    showValueBar: value !== null,
  });
}

function DEBUG_eyesClosed({ leftOrRight, eyesClosed }) {
  addDebugValue({
    label: `${leftOrRight} closed?`,
    value: eyesClosed ? "yes" : "no",
  });
}

function eyeIsClosed(value) {
  return value > EYES_CLOSED_THRESHOLD;
}

let hasClosedEyes = false;
function maybeBoil({ eyesClosed }) {
  if (hasClosedEyes) {
    return;
  }

  if (eyesClosed) {
    waterPot.src = "/assets/images/water-boiling.jpeg";
    hasClosedEyes = true;
  }
}

function doThingsWithLandmarks({ faceLandmarkResults }) {
  if (faceLandmarkResults && faceLandmarkResults.faceLandmarks) {
    const closedLeftScore = extractFacialBlendshape({
      faceLandmarkResults,
      label: "eyeBlinkLeft",
    });
    const closedRightScore = extractFacialBlendshape({
      faceLandmarkResults,
      label: "eyeBlinkRight",
    });
    const eyeClosedLeft = eyeIsClosed(closedLeftScore);
    const eyeClosedRight = eyeIsClosed(closedRightScore);
    const eyesClosed = eyeClosedLeft && eyeClosedRight;
    maybeBoil({ eyesClosed });

    DEBUG_blinkValue({ leftOrRight: "Left", value: closedLeftScore });
    DEBUG_blinkValue({ leftOrRight: "Right", value: closedRightScore });
    DEBUG_eyesClosed({ leftOrRight: "Left", eyesClosed: eyeClosedLeft });
    DEBUG_eyesClosed({ leftOrRight: "Right", eyesClosed: eyeClosedRight });
    DEBUG_eyesClosed({ leftOrRight: "Both", eyesClosed });
  }
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestFaceLandmarks: true,
  doThingsWithLandmarks,
  runOnce: () => {
    clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  },
});
