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
