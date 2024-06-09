import { projectOntoVideoSpace } from "./videoUtilities.js";

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

export function moveToPositionInVideo({ loc, elt }) {
  const inVideoSpace = projectOntoVideoSpace(loc);
  if (!inVideoSpace) {
    return;
  }
  elt.style.setProperty("position", "absolute");
  elt.style.setProperty("transform", "translate(-50%, -50%)");
  elt.style.setProperty("left", `${inVideoSpace.x}px`);
  elt.style.setProperty("top", `${inVideoSpace.y}px`);
}
