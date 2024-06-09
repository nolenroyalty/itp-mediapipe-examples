export let DEBUG = false;
const debugContainer = document.querySelector(".debug-container");
let DEBUG_VALUES = {};

export function extractFacialBlendshape({ faceLandmarkResults, label }) {
  if (
    !faceLandmarkResults ||
    !faceLandmarkResults.faceBlendshapes ||
    faceLandmarkResults.faceBlendshapes.length === 0
  ) {
    return null;
  }

  return faceLandmarkResults.faceBlendshapes[0].categories.find(
    (shape) => shape.displayName === label || shape.categoryName === label
  )?.score;
}

export function enableDebugShortcut() {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "d") {
      DEBUG = !DEBUG;

      if (DEBUG) {
        console.log("Debug mode enabled");
        debugContainer.classList.remove("transparent");
      } else {
        console.log("Debug mode disabled");
        debugContainer.classList.add("transparent");
      }
    }
    if (e.ctrlKey && e.key === "/") {
      clearDebugValues();
    }
  });
}

export function clearDebugValues() {
  DEBUG_VALUES = {};
  debugContainer.innerHTML = "";
}

export function addDebugValue({
  label,
  value,
  precision = 4,
  showValueBar = false,
  valueScale = 1,
}) {
  if (!DEBUG) {
    return;
  }

  if (typeof value === "number") {
    value = value.toFixed(precision);
  }

  if (!DEBUG_VALUES[label]) {
    const labelEl = document.createElement("span");
    labelEl.classList.add("debug-label");
    labelEl.textContent = label;
    labelEl.dataset.label = label;

    const valueEl = document.createElement("span");
    valueEl.classList.add("debug-value");
    valueEl.dataset.valueForLabel = label;

    const valueTextEl = document.createElement("span");
    valueTextEl.classList.add("debug-value-text");
    valueTextEl.textContent = value;

    let valueBarEl;
    if (showValueBar) {
      valueBarEl = document.createElement("span");
      valueBarEl.classList.add("debug-value-bar");
      valueBarEl.style.setProperty("--score", value / valueScale);
    }

    valueBarEl && valueEl.appendChild(valueBarEl);
    valueEl.appendChild(valueTextEl);
    debugContainer.appendChild(labelEl);
    debugContainer.appendChild(valueEl);

    DEBUG_VALUES[label] = { labelEl, valueEl, valueTextEl, valueBarEl };
  } else {
    const { valueTextEl, valueBarEl } = DEBUG_VALUES[label];
    valueTextEl.textContent = value;
    valueBarEl && valueBarEl.style.setProperty("--score", value / valueScale);
  }
}

export function removeDebugValue(key) {
  delete DEBUG_VALUES[key];
  const labelEl = document.querySelector(`[data-label="${key}"]`);
  const valueEl = document.querySelector(`[data-value-for-label="${key}"]`);
  labelEl && labelEl.remove();
  valueEl && valueEl.remove();
}

const TIPS = {
  thumb: 4,
  index: 8,
  middle: 12,
  ring: 16,
  pinky: 20,
};

// All of the landmarks can be found in this image:
// https://ai.google.dev/static/edge/mediapipe/images/solutions/hand-landmarks.png
export function getFingertip({ finger, hand, handLandmarkResults }) {
  if (!handLandmarkResults || handLandmarkResults.length === 0) {
    return null;
  }

  const tipIdx = TIPS[finger.toLowerCase()];
  if (!tipIdx) {
    throw new Error(`Unknown finger: ${finger}`);
  }
  if (hand === "left") {
    hand = "Left";
  }
  if (hand === "right") {
    hand = "Right";
  }

  const forHand = handLandmarkResults.find(({ label }) => label === hand);
  if (!forHand) {
    return null;
  }
  return forHand.landmarks[tipIdx];
}

// Take a position in the video feed (0 to 1) and return the actual coordinates
// on the screen of that position. (0.5, 0.5) would be in the center of the video.
// available in utilities.js
export function getCoordinatesRelativeToVideo({ x, y, video }) {
  const { x: videoX, y: videoY, width, height } = video.getBoundingClientRect();
  return { x: videoX + x * width, y: videoY + y * height };
}

export function moveToPositionInVideo({ elt, loc, video }) {
  const { x, y } = getCoordinatesRelativeToVideo({ x: loc.x, y: loc.y, video });
  elt.style.setProperty("position", "absolute");
  // We use left/top here instead of translate so that we can also center
  // the content using translate
  elt.style.setProperty("left", `${x}px`);
  elt.style.setProperty("top", `${y}px`);
}

function quadraticCurveThroughPoints({ path, points, width, height }) {
  path.moveTo(points[0].x * width, points[0].y * height);

  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];
    const midX = ((prevPoint.x + currentPoint.x) / 2) * width;
    const midY = ((prevPoint.y + currentPoint.y) / 2) * height;
    path.quadraticCurveTo(
      prevPoint.x * width,
      prevPoint.y * height,
      midX,
      midY
    );
  }
  path.quadraticCurveTo(
    points[points.length - 1].x * width,
    points[points.length - 1].y * height,
    points[0].x * width,
    points[0].y * height
  );
  path.closePath();
  return path;
}

export function getHandTracePath({ ctx, handLandmarkResults }) {
  const path = new Path2D();
  handLandmarkResults.forEach(({ landmarks, label }) => {
    if (landmarks.length === 0) {
      return;
    }
    quadraticCurveThroughPoints({
      path,
      points: landmarks,
      width: ctx.canvas.width,
      height: ctx.canvas.height,
    });
  });
  return path;
}

function getFaceTracePath({ ctx, indices, faceLandmarkResults }) {
  const path = new Path2D();
  const faceLandmarks = faceLandmarkResults.faceLandmarks[0];
  const points = indices.map((idx) => faceLandmarks[idx]);
  quadraticCurveThroughPoints({
    path,
    points,
    width: ctx.canvas.width,
    height: ctx.canvas.height,
  });
  return path;
}

const MOUTH_OUTER_LANDMARKS = [
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84,
  181, 91, 146,
];

export function getMouthTracePath({ ctx, faceLandmarkResults }) {
  return getFaceTracePath({
    ctx,
    indices: MOUTH_OUTER_LANDMARKS,
    faceLandmarkResults,
  });
}

// Inverted from the reference https://storage.googleapis.com/mediapipe-assets/documentation/mediapipe_face_landmark_fullsize.png
const RIGHT_EYE_OUTER_LANDMARKS = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
];

export function getRightEyeTracePath({ ctx, faceLandmarkResults }) {
  return getFaceTracePath({
    ctx,
    indices: RIGHT_EYE_OUTER_LANDMARKS,
    faceLandmarkResults,
  });
}

const LEFT_EYE_OUTER_LANDMARKS = [
  362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381,
];

export function getLeftEyeTracePath({ ctx, faceLandmarkResults }) {
  return getFaceTracePath({
    ctx,
    indices: LEFT_EYE_OUTER_LANDMARKS,
    faceLandmarkResults,
  });
}

// i missed a landmark lol
const OUTER_FACE_LANDMARKS = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 401, 361, 435, 288, 397, 365,
  379, 378, 400, 377, 152, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162,
  21, 54, 103, 67, 109,
];

export function getOuterFaceTracePath({ ctx, faceLandmarkResults }) {
  return getFaceTracePath({
    ctx,
    indices: OUTER_FACE_LANDMARKS,
    faceLandmarkResults,
  });
}

export function getFaceBoundingBox({ faceLandmarkResults }) {
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

export function cropToBoundingBox({ ctx, video, boundingBox }) {
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

export function maskOutPath({ ctx, path, lineWidth }) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = lineWidth;
  // setting this to any color insures that we clear the canvas under the fill
  // properly. I don't understand why
  ctx.fillStyle = "blue";
  ctx.stroke(path);
  ctx.fill(path);
  ctx.restore();
}

export function outlinePath({ ctx, outlineColor, path, lineWidth }) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.miterLimit = 2;
  ctx.strokeStyle = outlineColor;
  ctx.fillStyle = "transparent";
  ctx.lineWidth = lineWidth;
  ctx.globalCompositeOperation = "source-over";
  ctx.stroke(path);
  ctx.restore();
}

function jitter(range = 0.1) {
  return 1 + (Math.random() * range - range / 2);
}
