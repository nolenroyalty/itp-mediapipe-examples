import {
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  getFingertip,
  getKnuckleBeforeFingerTip,
  addDebugValue,
  getFaceBoundingBox,
  cropToBoundingBox,
  moveToPositionInVideo,
} from "../../utilities.js";
import colors from "../../colors.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");

function createFaceCanvas({ size }) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.borderRadius = "50%";
  canvas.style.border = `4px solid ${colors.teal}`;
  canvas.style.transform = "translate(-50%, -50%) scaleX(-1)";
  canvas.classList.add("transparent");
  return canvas;
}

const faceCanvases = {};
function initializeFaceCanvases() {
  ["Left", "Right"].forEach((side) => {
    const canvases = [];
    ["Pinky", "Ring", "Middle", "Index", "Thumb"].forEach((finger) => {
      const canvas = createFaceCanvas({ size: 100 });
      document.body.appendChild(canvas);
      canvases.push({ canvas, finger });
    });
    faceCanvases[side] = canvases;
  });
}

function rotateCanvasForFingerPosition({ canvas, loc, knuckleLoc }) {
  const ctx = canvas.getContext("2d");
  let angle = Math.atan2(loc.y - knuckleLoc.y, loc.x - knuckleLoc.x);
  angle += Math.PI / 2;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  // ctx.rotate(angle);
  canvas.style.transform = `translate(-50%, -50%) scaleX(-1) rotate(${angle}rad)`;

  ctx.translate(-canvas.width / 2, -canvas.height / 2);
}

function putFaceOnHands({ faceBoundingBox, handLandmarkResults }) {
  ["Left", "Right"].forEach((side) => {
    ["Pinky", "Ring", "Middle", "Index", "Thumb"].forEach((finger, i) => {
      const { canvas } = faceCanvases[side][i];
      const loc = getFingertip({ finger, hand: side, handLandmarkResults });
      const knuckleLoc = getKnuckleBeforeFingerTip({
        finger,
        hand: side,
        handLandmarkResults,
      });
      if (loc) {
        cropToBoundingBox({
          ctx: canvas.getContext("2d"),
          video: webcamVideo,
          boundingBox: faceBoundingBox,
        });
        if (knuckleLoc) {
          rotateCanvasForFingerPosition({ canvas, loc, knuckleLoc });
        } else {
          canvas.style.transform = "translate(-50%, -50%) scaleX(-1)";
        }
        moveToPositionInVideo({ elt: canvas, loc, video: webcamVideo });
        canvas.classList.remove("transparent");
      } else {
        canvas.classList.add("transparent");
      }
    });
  });
}

function hideFaceCanvases() {
  ["Left", "Right"].forEach((side) => {
    Object.values(faceCanvases[side]).forEach(({ canvas }) => {
      canvas.classList.add("transparent");
    });
  });
}

// bind ctrl-d to enable debug mode
enableDebugShortcut();

function doThingsWithLandmarks({ faceLandmarkResults, handLandmarkResults }) {
  const ctx = drawingCanvas.getContext("2d");
  const hasFaceLandmarks =
    faceLandmarkResults && faceLandmarkResults.faceLandmarks.length > 0;
  const hasHandLandmarks =
    handLandmarkResults && handLandmarkResults.length > 0;
  if (hasFaceLandmarks && hasHandLandmarks) {
    const faceBoundingBox = getFaceBoundingBox({ faceLandmarkResults });
    putFaceOnHands({ faceBoundingBox, handLandmarkResults });
  } else {
    hideFaceCanvases();
  }
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
});
