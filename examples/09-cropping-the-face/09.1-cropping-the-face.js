import {
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
  drawFaceLandmarks,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  getHandTracePath,
  maskOutPath,
  outlinePath,
  addDebugValue,
  clearDebugValues,
} from "../../utilities.js";
import colors from "../../colors.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");
const captureFaceButton = document.querySelector("#captureFaceButton");

// bind ctrl-d to enable debug mode
enableDebugShortcut();

// Get the "bounding box" of the face - the smallest rectangle that contains all of the face landmarks
// Also available in utilities.js
function getFaceBoundingBox({ faceLandmarkResults }) {
  const faceLandmarks = faceLandmarkResults.faceLandmarks[0];
  const xs = faceLandmarks.map((landmark) => landmark.x);
  const ys = faceLandmarks.map((landmark) => landmark.y);
  const unFlippedXMin = Math.min(...xs);
  const unFlippedXMax = Math.max(...xs);
  // our video is mirrored so we need to flip the x values
  const xMin = 1 - unFlippedXMax;
  const xMax = 1 - unFlippedXMin;
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  return { xMin, xMax, yMin, yMax };
}

// Take our bounding box and copy *just* the portion of the video in it
// to another canavas.
// also available in utilities.js
function cropToBoundingBox({ ctx, video, boundingBox }) {
  const { xMin, xMax, yMin, yMax } = boundingBox;
  const width = xMax - xMin;
  const height = yMax - yMin;
  ctx.drawImage(
    video,
    xMin * video.videoWidth,
    yMin * video.videoHeight,
    width * video.videoWidth,
    height * video.videoHeight,
    0,
    0,
    ctx.canvas.width,
    ctx.canvas.height
  );
}

function createCanvasForBoundingBox({ video, boundingBox }) {
  const canvas = document.createElement("canvas");
  canvas.width = (boundingBox.xMax - boundingBox.xMin) * video.videoWidth;
  canvas.height = (boundingBox.yMax - boundingBox.yMin) * video.videoHeight;
  return canvas;
}

let imageElt;
let lastRetrievedFaceLandmarkResults = null;
function addFaceToImageElement() {
  if (lastRetrievedFaceLandmarkResults === null) {
    return;
  }
  const faceLandmarkResults = lastRetrievedFaceLandmarkResults;
  const boundingBox = getFaceBoundingBox({ faceLandmarkResults });
  const canvas = createCanvasForBoundingBox({
    video: webcamVideo,
    boundingBox,
  });
  const ctx = canvas.getContext("2d");
  cropToBoundingBox({ ctx, video: webcamVideo, boundingBox });
  const imgData = canvas.toDataURL("image/png");
  if (!imageElt) {
    imageElt = document.createElement("img");
    imageElt.style.position = "absolute";
    imageElt.style.top = "20%";
    imageElt.style.left = "20%";
    imageElt.style.height = "50%";
    imageElt.style.width = "auto";
    imageElt.style.borderRadius = "10px";
    imageElt.style.border = `2px solid ${colors.teal}`;
    imageElt.style.transform = "scaleX(-1)";
    imageElt.src = imgData;
    document.body.appendChild(imageElt);
  } else {
    imageElt.src = imgData;
  }
}

captureFaceButton.addEventListener("click", addFaceToImageElement);

function doThingsWithLandmarks({ faceLandmarkResults }) {
  clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  if (faceLandmarkResults && faceLandmarkResults.faceLandmarks.length > 0) {
    lastRetrievedFaceLandmarkResults = faceLandmarkResults;
    // uncomment me!
    // addFaceToImageElement();
  } else {
    addDebugValue({
      label: "hand count",
      value: "0",
    });
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
