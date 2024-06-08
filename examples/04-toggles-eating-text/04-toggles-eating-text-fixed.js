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
const eatableText = document.querySelector("#eatableText");

const JAW_OPEN_THRESHOLD = 0.45;
const JAW_CLOSED_THRESHOLD = 0.15;
let jawState = "closed";
// Fun example of this problem: https://x.com/itseieio/status/1795192413847199938
// See https://en.wikipedia.org/wiki/Hysteresis for more

// bind ctrl-d to enable debug mode
enableDebugShortcut();

function DEBUG_jawOpenScore({ value }) {
  addDebugValue({
    label: `jawOpenAmount`,
    value,
    showValueBar: value !== null,
  });
}

function DEBUG_jawState() {
  addDebugValue({
    label: `jaw state`,
    value: jawState,
  });
}

function updateJawState({ jawOpenScore }) {
  if (jawState === "open") {
    // If our jaw is open, wait for our score to be low to flip back
    // to closed
    if (jawOpenScore < JAW_CLOSED_THRESHOLD) {
      jawState = "closed";
    }
  } else {
    // If our jaw is closed, wait for our score to be high to flip back
    // to open
    if (jawOpenScore > JAW_OPEN_THRESHOLD) {
      jawState = "open";
    }
  }
}

function eatACharacter() {
  const currentText = eatableText.innerText;
  if (currentText.length === 0) {
    return;
  }
  eatableText.innerText = currentText.slice(0, -1);
}

function doThingsWithLandmarks({ faceLandmarkResults }) {
  if (faceLandmarkResults && faceLandmarkResults.faceLandmarks) {
    const jawOpenScore = extractFacialBlendshape({
      faceLandmarkResults,
      label: "jawOpen",
    });
    const oldJawState = jawState;
    updateJawState({ jawOpenScore });
    if (oldJawState === "open" && jawState === "closed") {
      console.log("eat");
      eatACharacter();
    }
    DEBUG_jawOpenScore({ value: jawOpenScore });
    DEBUG_jawState();
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
