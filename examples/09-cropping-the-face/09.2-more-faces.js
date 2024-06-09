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
import colors, { randomColor } from "../../colors.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");
const NUMBER_OF_FACES = 18;
const SPEED_IN_PIXELS_PER_SECOND = 200;

// available in utilities.js
function jitter(range = 0.1) {
  return 1 + (Math.random() * range - range / 2);
}

function createBouncingFaceCanvas() {
  const canvas = document.createElement("canvas");
  const smallerWindowSize = Math.min(window.innerWidth, window.innerHeight);
  const size = smallerWindowSize * 0.25 * jitter(0.2);
  const speed = SPEED_IN_PIXELS_PER_SECOND * jitter(0.8);
  const position = {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
  };
  position.x = Math.min(position.x, window.innerWidth - size);
  position.y = Math.min(position.y, window.innerHeight - size);
  const direction = {
    x: Math.random() > 0.5 ? 1 : -1,
    y: Math.random() > 0.5 ? 1 : -1,
  };
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  canvas.style.borderRadius = "24px";
  canvas.style.border = `8px solid ${randomColor()}`;
  // filters?

  return { canvas, speed, size, position, direction };
}

// bind ctrl-d to enable debug mode
enableDebugShortcut();

function bounceFaceCanvas({
  canvas,
  speed,
  direction,
  size,
  position,
  timeElapsedInSeconds,
}) {
  const distance = speed * timeElapsedInSeconds;
  position.x = position.x + distance * direction.x;
  position.y = position.y + distance * direction.y;

  if (position.x + size >= window.innerWidth) {
    position.x = window.innerWidth - size;
    direction.x = -1;
  } else if (position.x <= 0) {
    position.x = 0;
    direction.x = 1;
  }
  if (position.y + size >= window.innerHeight) {
    position.y = window.innerHeight - size;
    direction.y = -1;
  } else if (position.y <= 0) {
    position.y = 0;
    direction.y = 1;
  }

  // the scaleX(-1) is because the video is mirrored
  canvas.style.transform = `translate(${position.x}px, ${position.y}px) scaleX(-1)`;
}

const faceCanvases = [];
function initializeFaceCanvases() {
  for (let i = 0; i < NUMBER_OF_FACES; i++) {
    const canvasData = createBouncingFaceCanvas();
    faceCanvases.push(canvasData);
    document.body.appendChild(canvasData.canvas);
  }
}

function addFaceToCanvas({ faceLandmarkResults, video, canvas }) {
  const boundingBox = getFaceBoundingBox({
    faceLandmarkResults,
  });
  const ctx = canvas.getContext("2d");
  cropToBoundingBox({ ctx, video, boundingBox });
  canvas.getContext("2d").drawImage(canvas, 0, 0);
}

let initialized = false;
let lastTime = null;
function doThingsWithLandmarks({ faceLandmarkResults }) {
  clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  if (faceLandmarkResults && faceLandmarkResults.faceLandmarks.length > 0) {
    if (!initialized) {
      initializeFaceCanvases();
      initialized = true;
    }
    const now = performance.now();
    const timeElapsed = lastTime === null ? 0 : now - lastTime;
    const timeElapsedInSeconds = timeElapsed / 1000;
    lastTime = now;
    faceCanvases.forEach(({ canvas, speed, size, position, direction }, i) => {
      addFaceToCanvas({
        faceLandmarkResults,
        video: webcamVideo,
        canvas,
      });
      bounceFaceCanvas({
        canvas,
        speed,
        size,
        position,
        direction,
        timeElapsedInSeconds,
      });
      addDebugValue({
        label: `${i}. size`,
        value: size,
      });
      addDebugValue({
        label: `${i} position`,
        value: `${position.x.toFixed(0)}, ${position.y.toFixed(0)}`,
      });
    });
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
