export let DEBUG = false;
const debugContainer = document.querySelector(".debug-container");
let DEBUG_VALUES = {};

export function log() {
  console.log("hello world");
}

export function enableDebugShortcut() {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "d") {
      DEBUG = !DEBUG;

      if (DEBUG) {
        debugContainer.classList.remove("transparent");
      } else {
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
}
