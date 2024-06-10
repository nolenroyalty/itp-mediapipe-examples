import {
  drawFaceLandmarks,
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import { enableDebugShortcut, addDebugValue } from "../../utilities.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");

// bind ctrl-d to enable debug mode
enableDebugShortcut();

// add all of the 'blendshapes" (think of them as facial expressions) to the debug panel
// There are too many face landmarks (hundreds!) to display them in the debug menu, but
// you can find them all in this picture: https://storage.googleapis.com/mediapipe-assets/documentation/mediapipe_face_landmark_fullsize.png
function DEBUG_blendshapeValues(blendShapes) {
  if (!blendShapes.length) {
    return;
  }

  blendShapes[0].categories.forEach((shape) => {
    addDebugValue({
      label: shape.displayName || shape.categoryName,
      value: shape.score,
      showValueBar: true,
    });
  });
}

function doThingsWithLandmarks({ faceLandmarkResults }) {
  clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  if (faceLandmarkResults && faceLandmarkResults.faceLandmarks) {
    drawFaceLandmarks({ results: faceLandmarkResults, canvas: drawingCanvas });
    DEBUG_blendshapeValues(faceLandmarkResults.faceBlendshapes);
  }
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestFaceLandmarks: true,
  doThingsWithLandmarks,
});
