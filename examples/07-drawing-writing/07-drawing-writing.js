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
const LIFETIME = 3000;

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

let toDraw = { dots: [], linePoints: [] };
function addPoint({ x, y, currentTime, color, kind }) {
  if (kind === "dot") {
    toDraw.dots.push({ x, y, removeAt: currentTime + LIFETIME, color });
  } else if (kind === "line") {
    toDraw.linePoints.push({ x, y, removeAt: currentTime + LIFETIME, color });
  }
}

function purgeOldPoints(currentTime) {
  toDraw.linePoints = toDraw.linePoints.filter(
    (point) => point.removeAt > currentTime
  );
  toDraw.dots = toDraw.dots.filter((dot) => dot.removeAt > currentTime);
}

function determineDotSize(canvas) {
  const smaller = Math.min(canvas.width, canvas.height);
  return (smaller * 3) / 100;
}

function drawDots({ canvas }) {
  const ctx = canvas.getContext("2d");

  const dotSize = determineDotSize(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  toDraw.dots.forEach(({ x, y, color }) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(
      x * ctx.canvas.width,
      y * ctx.canvas.height,
      dotSize,
      0,
      2 * Math.PI
    );
    ctx.fill();
  });
}

function connectLinePoints({ canvas }) {
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 5;
  for (let i = 0; i < toDraw.linePoints.length - 1; i++) {
    ctx.beginPath();
    const { x: x1, y: y1, color: color1 } = toDraw.linePoints[i];
    const { x: x2, y: y2 } = toDraw.linePoints[i + 1];
    ctx.strokeStyle = color1;
    ctx.moveTo(x1 * canvas.width, y1 * canvas.height);
    ctx.quadraticCurveTo(
      x1 * canvas.width,
      y1 * canvas.height,
      x2 * canvas.width,
      y2 * canvas.height
    );
    ctx.stroke();
  }
}

function doThingsWithLandmarks({ time, handLandmarkResults }) {
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

    if (leftLoc) {
      addPoint({
        x: leftLoc.x,
        y: leftLoc.y,
        currentTime: time,
        color: "#69f7be",
        kind: "dot",
      });
    }
    if (rightLoc) {
      addPoint({
        x: rightLoc.x,
        y: rightLoc.y,
        currentTime: time,
        color: "#ffff00",
        kind: "line",
      });
    }
    const currentTime = performance.now();
    purgeOldPoints(currentTime);
    drawDots({ canvas: drawingCanvas });
    connectLinePoints({ canvas: drawingCanvas });
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
