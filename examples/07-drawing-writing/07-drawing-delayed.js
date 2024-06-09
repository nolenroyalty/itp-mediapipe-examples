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
const LIFETIME = 5000;

// bind ctrl-d to enable debug mode
enableDebugShortcut();

let toDraw = { dots: [], linePoints: [] };
function addPoint({ x, y, delay, currentTime, color, kind }) {
  const val = {
    x,
    y,
    startAt: currentTime + delay,
    removeAt: currentTime + delay + LIFETIME,
    color,
  };
  if (kind === "dot") {
    toDraw.dots.push(val);
  } else if (kind === "line") {
    toDraw.linePoints.push(val);
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

function drawDots({ currentTime, canvas }) {
  const ctx = canvas.getContext("2d");

  const dotSize = determineDotSize(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  toDraw.dots.forEach(({ x, y, color, startAt }) => {
    if (currentTime >= startAt) {
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
    }
  });
}

function connectLinePoints({ currentTime, canvas }) {
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 3;
  for (let i = 0; i < toDraw.linePoints.length - 1; i++) {
    const { x: x1, y: y1, startAt, color: color1 } = toDraw.linePoints[i];
    const { x: x2, y: y2 } = toDraw.linePoints[i + 1];
    if (currentTime >= startAt) {
      ctx.beginPath();
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
}

function getDelay(finger) {
  switch (finger) {
    case "Thumb":
      return 0;
    case "Index":
      return 200;
    case "Middle":
      return 400;
    case "Ring":
      return 600;
    case "Pinky":
      return 800;
    default:
      return 0;
  }
}

function getColor(finger) {
  switch (finger) {
    case "Thumb":
      return "#69f7be";
    case "Index":
      return "#69c8f7";
    case "Middle":
      return "#8a69f7";
    case "Ring":
      return "#f769d6";
    case "Pinky":
      return "#e9f769";
    default:
      return "#69f7be";
  }
}

function doThingsWithLandmarks({ handLandmarkResults }) {
  if (handLandmarkResults) {
    const currentTime = performance.now();
    ["Left", "Right"].forEach((hand) => {
      ["Thumb", "Index", "Middle", "Ring", "Pinky"].forEach((finger) => {
        const delay = getDelay(finger);
        const color = getColor(finger);
        const loc = getFingertip({ finger, hand, handLandmarkResults });
        if (loc) {
          addPoint({
            x: loc.x,
            y: loc.y,
            currentTime,
            delay,
            color,
            kind: "dot",
          });
        }
      });
    });

    purgeOldPoints(currentTime);
    drawDots({ canvas: drawingCanvas, currentTime });
    connectLinePoints({ canvas: drawingCanvas, currentTime });
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
