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
import colors from "../../colors.js";

// VALUES YOU CAN EASILY CHANGE
const LIFETIME = 5000;
// END VALUES YOU CAN EASILY CHANGE

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");

// bind ctrl-d to enable debug mode
enableDebugShortcut();

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
  return (smaller * 5) / 100;
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

function doThingsWithLandmarks({ handLandmarkResults }) {
  if (handLandmarkResults) {
    const currentTime = performance.now();
    ["Left", "Right"].forEach((hand) => {
      ["Thumb", "Index", "Middle", "Ring", "Pinky"].forEach((finger) => {
        const loc = getFingertip({ finger, hand, handLandmarkResults });
        if (loc) {
          addPoint({
            x: loc.x,
            y: loc.y,
            currentTime,
            color: colors.teal,
            kind: "dot",
          });
        }
      });
    });

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
