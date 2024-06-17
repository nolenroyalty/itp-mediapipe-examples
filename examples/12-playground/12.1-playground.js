import {
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
  drawFaceLandmarks,
  drawHandLandmarks,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  getFingertip,
  getKnuckleBeforeFingerTip,
  addDebugValue,
  getHandTracePath,
  maskOutPath,
  outlinePath,
  getFaceTracePath,
  getFaceBoundingBox,
  cropToBoundingBox,
  getRightEyeTracePath,
  getLeftEyeTracePath,
  isTouching,
  moveToPositionInVideo,
  quadraticCurveThroughPoints,
} from "../../utilities.js";
import colors from "../../colors.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");
const backgroundCanvas = document.querySelector("#backgroundCanvas");
const backgroundCtx = backgroundCanvas.getContext("2d");
const LEFT = [
  226, 247, 30, 29, 27, 28, 56, 190, 244, 233, 232, 231, 230, 229, 228, 31,
]; // + maybe 226
const LEFTCENTER = 468;
const RIGHT = [
  261, 448, 449, 450, 451, 452, 453, 464, 413, 441, 442, 443, 444, 445, 342,
  446,
]; // + maybe 261
const RIGHTCENTER = 473;

function getBoundingBox(landmarks) {
  console.log("landmarks", landmarks);
  const xs = landmarks.map((landmark) => landmark.x);
  console.log("xs", xs);
  const ys = landmarks.map((landmark) => landmark.y);
  const unFlippedXMin = Math.min(...xs);
  const unFlippedXMax = Math.max(...xs);
  // our video is mirrored so we need to flip the x values
  const xMin = 1 - unFlippedXMax;
  const xMax = 1 - unFlippedXMin;
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  return { xMin, xMax, yMin, yMax };
}

export function saveOff({ ctx, path, lineWidth }) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  ctx.globalCompositeOperation = "destination-in";
  ctx.lineWidth = lineWidth;
  // setting this to any color insures that we clear the canvas under the fill
  // properly. I don't understand why
  ctx.fillStyle = "blue";
  // ctx.stroke(path);
  ctx.fill(path);
  ctx.restore();
}

function getEyeImage({
  ctx,
  faceLandmarkResults,
  indices,
  xStart,
  yStart,
  center,
}) {
  const landmarks = faceLandmarkResults.faceLandmarks;
  if (!landmarks) {
    return;
  }
  const ourIndices = indices.map((index) => {
    return landmarks[0][index];
  });
  const { xMin, xMax, yMin, yMax } = getBoundingBox(ourIndices);
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = webcamVideo.videoWidth;
  tempCanvas.height = webcamVideo.videoHeight;
  const tempCtx = tempCanvas.getContext("2d");
  // flip the video horizontally before drawing it
  tempCtx.drawImage(webcamVideo, 0, 0, tempCanvas.width, tempCanvas.height);

  // trace the path in indices
  const path = new Path2D();
  const asdf = ourIndices.map((point) => {
    return { x: 1 - point.x, y: point.y };
  });
  quadraticCurveThroughPoints({
    path,
    points: asdf,
    width: tempCanvas.width,
    height: tempCanvas.height,
  });

  // draw the path and delete all content not inside it
  const imgWidth = (xMax - xMin) * tempCanvas.width;
  const imgHeight = (yMax - yMin) * tempCanvas.height;
  saveOff({ ctx: tempCtx, path, lineWidth: 10 });

  // draw a circle around CENTER
  const centerPoint = landmarks[0][center];
  const centerPath = new Path2D();
  // set line and fill style to dark black
  tempCtx.strokeStyle = "transparent";
  tempCtx.fillStyle = "#00000011";
  centerPath.arc(
    (1 - centerPoint.x) * tempCanvas.width,
    centerPoint.y * tempCanvas.height,
    6,
    0,
    2 * Math.PI
  );
  // tempCtx.stroke(centerPath);
  tempCtx.fill(centerPath);

  tempCtx.fillStyle = "#ffffff11";
  centerPath.ellipse(
    (1 - centerPoint.x) * tempCanvas.width,
    centerPoint.y * tempCanvas.height,
    24,
    12,
    0,
    0,
    2 * Math.PI
  );
  // tempCtx.stroke(centerPath);
  tempCtx.fill(centerPath);

  ctx.save();
  // draw the image on tempcanvas but flip it horizontally
  ctx.scale(-1, 1);
  ctx.translate(-tempCanvas.width, 0);
  // ctx.drawImage(
  //   tempCanvas,
  //   -tempCanvas.width,
  //   0,
  //   tempCanvas.width,
  //   tempCanvas.height
  // );
  ctx.drawImage(
    tempCanvas,
    xMin * tempCanvas.width,
    yMin * tempCanvas.height,
    imgWidth,
    imgHeight,
    xStart * ctx.canvas.width,
    yStart * ctx.canvas.height,
    imgWidth * 4,
    imgHeight * 4
  );

  ctx.restore();

  // draw the image on tempCanvas to the main canvas, but make it 5 times bigger
  // ctx.drawImage(
  //   tempCanvas,
  //   xMin * tempCanvas.width,
  //   yMin * tempCanvas.height,
  //   imgWidth,
  //   imgHeight,
  //   xMin * ctx.canvas.width,
  //   yMin * ctx.canvas.height,
  //   imgWidth,
  //   imgHeight
  // );
  // ctx.drawImage(tempCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
}

enableDebugShortcut();

function doThingsWithLandmarks({ faceLandmarkResults }) {
  if (
    !faceLandmarkResults ||
    !faceLandmarkResults.faceLandmarks ||
    faceLandmarkResults.faceLandmarks.length === 0
  ) {
    console.log("no face landmarks");
    const ctx = drawingCanvas.getContext("2d");
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    backgroundCtx.clearRect(
      0,
      0,
      backgroundCanvas.width,
      backgroundCanvas.height
    );
    return;
  }

  const ctx = drawingCanvas.getContext("2d");
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  // ctx.fillStyle = colors.teal;
  // ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  backgroundCtx.fillStyle = "black";
  backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
  getEyeImage({
    ctx,
    faceLandmarkResults,
    indices: RIGHT,
    xStart: 0.6,
    yStart: 0.3,
    center: RIGHTCENTER,
  });
  getEyeImage({
    ctx,
    faceLandmarkResults,
    indices: LEFT,
    xStart: 0.2,
    yStart: 0.3,
    center: LEFTCENTER,
  });

  // const rightEyeTracePath = getRightEyeTracePath({
  //   ctx,
  //   faceLandmarkResults,
  // });
  // maskOutPath({
  //   ctx,
  //   lineWidth: 10,
  //   path: rightEyeTracePath,
  // });

  // const leftEyeTracePath = getLeftEyeTracePath({
  //   ctx,
  //   faceLandmarkResults,
  // });
  // maskOutPath({
  //   ctx,
  //   lineWidth: 10,
  //   path: leftEyeTracePath,
  // });
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestFaceLandmarks: true,
  requestHandLandmarks: false,
  doThingsWithLandmarks,
  runOnce: () => {
    drawingCanvas.style.filter = `brightness(1.5) contrast(1.2)`;
    clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
    clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: backgroundCanvas });
    document.querySelector("body").style.backgroundColor = "black";
  },
  runBeforeProcessingVideoFrame: () => {},
});
