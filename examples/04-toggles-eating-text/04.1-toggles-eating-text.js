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
let jawState = "closed";

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

function naivelyUpdateJawState({ jawOpenScore }) {
  if (jawOpenScore > JAW_OPEN_THRESHOLD) {
    jawState = "open";
  } else {
    jawState = "closed";
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
    naivelyUpdateJawState({ jawOpenScore });
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
