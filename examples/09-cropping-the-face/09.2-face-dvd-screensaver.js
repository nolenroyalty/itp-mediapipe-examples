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
  getFaceBoundingBox,
  cropToBoundingBox,
} from "../../utilities.js";
import colors from "../../colors.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");
const bouncingFaceCanvas = document.querySelector("#bouncingFaceCanvas");
const SPEED_IN_PIXELS_PER_SECOND = 200;
const direction = { x: 1, y: 1 };
const position = { x: 0, y: 0 };
let faceCanvasSize = null;

// bind ctrl-d to enable debug mode
enableDebugShortcut();

function initializeFaceCanvas(canvas) {
  const smallerWindowSize = Math.min(window.innerWidth, window.innerHeight);
  const size = smallerWindowSize * 0.2;
  canvas.style.position = "absolute";
  faceCanvasSize = size;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  canvas.style.borderRadius = "24px";
  canvas.style.border = `8px solid ${colors.pink}`;
  // Consider adding filters!
  // canvas.style.filter = "grayscale(1)";
  canvas.classList.remove("transparent");
}

let lastTime = null;
function bounceFaceCanvas({ canvas, now }) {
  const timeElapsed = lastTime === null ? 0 : now - lastTime;
  const timeElapsedInSeconds = timeElapsed / 1000;
  lastTime = now;

  const distance = SPEED_IN_PIXELS_PER_SECOND * timeElapsedInSeconds;
  position.x = position.x + distance * direction.x;
  position.y = position.y + distance * direction.y;

  if (position.x + faceCanvasSize >= window.innerWidth) {
    position.x = window.innerWidth - faceCanvasSize;
    direction.x = -1;
  } else if (position.x <= 0) {
    position.x = 0;
    direction.x = 1;
  }
  if (position.y + faceCanvasSize >= window.innerHeight) {
    position.y = window.innerHeight - faceCanvasSize;
    direction.y = -1;
  } else if (position.y <= 0) {
    position.y = 0;
    direction.y = 1;
  }

  // the scaleX(-1) is because the video is mirrored
  canvas.style.transform = `translate(${position.x}px, ${position.y}px) scaleX(-1)`;
}

let initialized = false;
function addFaceToCanvas({ faceLandmarkResults, video, canvas }) {
  if (!initialized) {
    initializeFaceCanvas(canvas);
    initialized = true;
  }
  const boundingBox = getFaceBoundingBox({
    faceLandmarkResults,
  });
  const ctx = canvas.getContext("2d");
  cropToBoundingBox({ ctx, video, boundingBox });
  canvas.getContext("2d").drawImage(canvas, 0, 0);
}

function doThingsWithLandmarks({ faceLandmarkResults }) {
  clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  if (faceLandmarkResults && faceLandmarkResults.faceLandmarks.length > 0) {
    const now = performance.now();
    addFaceToCanvas({
      faceLandmarkResults,
      video: webcamVideo,
      canvas: bouncingFaceCanvas,
    });
    bounceFaceCanvas({ canvas: bouncingFaceCanvas, now });
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
