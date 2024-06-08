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
const appearingText = document.querySelector("#appearingText");

// Properly calibrating this number is hard; faces are very different!
// This is a good starting point for the workshop, but you should think carefully
// about this is and do lots of testing if you're launching something into the world!
const BLINK_THREHSOLD = 0.35;

// bind ctrl-d to enable debug mode
enableDebugShortcut();

function DEBUG_blinkValue({ leftOrRight, value }) {
  addDebugValue({
    label: `${leftOrRight} value`,
    value,
    showValueBar: value !== null,
  });
}

function DEBUG_blinking({ leftOrRight, isBlinking }) {
  addDebugValue({
    label: `${leftOrRight} blinking`,
    value: isBlinking ? "yes" : "no",
  });
}

function determineIsBlinking(value) {
  return value > BLINK_THREHSOLD;
}

function hideOrShowText({ isBlinking }) {
  if (isBlinking) {
    appearingText.classList.remove("transparent");
  } else {
    appearingText.classList.add("transparent");
  }
}

function doThingsWithLandmarks({ time, faceLandmarkResults }) {
  if (faceLandmarkResults && faceLandmarkResults.faceLandmarks) {
    const blinkLeft = extractFacialBlendshape({
      faceLandmarkResults,
      label: "eyeBlinkLeft",
    });
    const blinkRight = extractFacialBlendshape({
      faceLandmarkResults,
      label: "eyeBlinkRight",
    });
    const isBlinkingLeft = determineIsBlinking(blinkLeft);
    const isBlinkingRight = determineIsBlinking(blinkRight);
    const isBlinkingBoth = isBlinkingLeft && isBlinkingRight;
    hideOrShowText({ isBlinking: isBlinkingBoth });

    DEBUG_blinkValue({ leftOrRight: "Left", value: blinkLeft });
    DEBUG_blinkValue({ leftOrRight: "Right", value: blinkRight });
    DEBUG_blinking({ leftOrRight: "Left", isBlinking: isBlinkingLeft });
    DEBUG_blinking({ leftOrRight: "Right", isBlinking: isBlinkingRight });
    DEBUG_blinking({ leftOrRight: "Both", isBlinking: isBlinkingBoth });
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
