import {
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  drawFaceLandmarks,
  getFingertip,
  getKnuckleBeforeFingerTip,
  addDebugValue,
  getHandTracePath,
  maskOutPath,
  outlinePath,
  getFaceBoundingBox,
  cropToBoundingBox,
  isTouching,
  moveToPositionInVideo,
} from "../../utilities.js";
import colors from "../../colors.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");

enableDebugShortcut();

function doThingsWithLandmarks({ faceLandmarkResults, handLandmarkResults }) {
  // do something!
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestFaceLandmarks: true,
  requestHandLandmarks: true,
  doThingsWithLandmarks,
  runOnce: () => {
    clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
    initializeFaceCanvases();
  },
  runBeforeProcessingVideoFrame: () => {},
});
