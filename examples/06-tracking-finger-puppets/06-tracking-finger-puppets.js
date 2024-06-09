import {
  drawHandLandmarks,
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  addDebugValue,
  clearDebugValues,
  getFingertip,
  moveToPositionInVideo,
} from "../../utilities.js";
import { projectOntoVideoSpace } from "../../videoUtilities.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");
const leftFingerPuppet = document.querySelector("#leftFingerPuppet");
const rightFingerPuppet = document.querySelector("#rightFingerPuppet");

// bind ctrl-d to enable debug mode
enableDebugShortcut();

// All of the landmarks can be found in this image:
// https://ai.google.dev/static/edge/mediapipe/images/solutions/hand-landmarks.png
function DEBUG_indexFingerLocations({ leftLoc, rightLoc }) {
  clearDebugValues();
  if (leftLoc) {
    addDebugValue({
      label: `left index finger (x)`,
      value: `${leftLoc.x.toFixed(2)}`,
    });
    addDebugValue({
      label: `left index finger (y)`,
      value: `${leftLoc.y.toFixed(2)}`,
    });
  }
  if (rightLoc) {
    addDebugValue({
      label: `right index finger (x)`,
      value: `${rightLoc.x.toFixed(2)}`,
    });
    addDebugValue({
      label: `right index finger (y)`,
      value: `${rightLoc.y.toFixed(2)}`,
    });
  }
}

function movePuppet({ loc, elt }) {
  if (loc) {
    elt.classList.remove("transparent");
    moveToPositionInVideo({ loc, elt });
  } else {
    elt.classList.add("transparent");
  }
}

function doThingsWithLandmarks({ time, handLandmarkResults }) {
  if (handLandmarkResults) {
    DEBUG_indexFingerLocations(handLandmarkResults);
    const leftLoc = getFingertip({
      finger: "Index",
      hand: "Left",
      handLandmarkResults,
    });
    const rightLoc = getFingertip({
      finger: "Index",
      hand: "Right",
      handLandmarkResults,
    });
    movePuppet({ loc: leftLoc, elt: leftFingerPuppet });
    movePuppet({ loc: rightLoc, elt: rightFingerPuppet });
  }
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestHandLandmarks: true,
  doThingsWithLandmarks,
  runOnce: () => {
    clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  },
});
