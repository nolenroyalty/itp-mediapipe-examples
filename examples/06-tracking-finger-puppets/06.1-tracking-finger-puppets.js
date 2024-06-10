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
} from "../../utilities.js";

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

// Take a position in the video feed (0 to 1) and return the actual coordinates
// on the screen of that position. (0.5, 0.5) would be in the center of the video.
// available in utilities.js
function getCoordinatesRelativeToVideo({ x, y, video }) {
  const { x: videoX, y: videoY, width, height } = video.getBoundingClientRect();
  return { x: videoX + x * width, y: videoY + y * height };
}

function moveToPositionInVideo({ elt, loc, video }) {
  const { x, y } = getCoordinatesRelativeToVideo({ x: loc.x, y: loc.y, video });
  elt.style.setProperty("position", "absolute");
  // We use left/top here instead of translate so that we can also center
  // the content using translate
  elt.style.setProperty("left", `${x}px`);
  elt.style.setProperty("top", `${y}px`);
}

function movePuppet({ loc, elt }) {
  if (loc) {
    elt.classList.remove("transparent");
    moveToPositionInVideo({ loc, elt, video: webcamVideo });
  } else {
    elt.classList.add("transparent");
  }
}

function doThingsWithLandmarks({ handLandmarkResults }) {
  if (handLandmarkResults) {
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
    DEBUG_indexFingerLocations(handLandmarkResults);
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
