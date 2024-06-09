import {
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  addDebugValue,
  extractFacialBlendshape,
} from "../../utilities.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");
const balloon = document.querySelector("#balloon");

const z = "mouthSmileLeft";

// bind ctrl-d to enable debug mode
enableDebugShortcut();

function DEBUG_smileValue({ label, value }) {
  addDebugValue({
    label,
    value,
    showValueBar: value !== null,
  });
}

function floatBalloonNaively({ smileScore }) {
  const windowHeight = window.innerHeight;
  const balloonHeightPercent = 0.4;
  const maxRaise = windowHeight * (1 - balloonHeightPercent);
  const raiseBaloonBy = maxRaise * smileScore;
  balloon.style.transform = `translateY(-${raiseBaloonBy}px)`;
}

let prevSmileScore = 0;
function floatBalloonSmoothly({ smileScore }) {
  const smoothingFactor = 0.075;
  const newSmileScore =
    prevSmileScore * (1 - smoothingFactor) + smileScore * smoothingFactor;
  floatBalloonNaively({ smileScore: newSmileScore });
  prevSmileScore = newSmileScore;
}

function doThingsWithLandmarks({ faceLandmarkResults }) {
  if (faceLandmarkResults && faceLandmarkResults.faceLandmarks) {
    const leftSmileScore = extractFacialBlendshape({
      faceLandmarkResults,
      label: "mouthSmileLeft",
    });
    const rightSmileScore = extractFacialBlendshape({
      faceLandmarkResults,
      label: "mouthSmileRight",
    });
    const averageSmileScore = (leftSmileScore + rightSmileScore) / 2;
    floatBalloonNaively({ smileScore: averageSmileScore });
    DEBUG_smileValue({ label: "Left smile", value: leftSmileScore });
    DEBUG_smileValue({ label: "Right smile", value: rightSmileScore });
    DEBUG_smileValue({ label: "Avg smile", value: averageSmileScore });
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
