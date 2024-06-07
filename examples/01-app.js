import {
  drawFaceLandmarks,
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../boilerplate.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");

function doThingsWithLandmarks({ time, faceLandmarkResults }) {
  clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  if (faceLandmarkResults && faceLandmarkResults.faceLandmarks) {
    drawFaceLandmarks({ results: faceLandmarkResults, canvas: drawingCanvas });
  }
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestFaceLandmarks: true,
  doThingsWithLandmarks,
});
