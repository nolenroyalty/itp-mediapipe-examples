import {
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  addDebugValue,
  clearDebugValues,
  getFingertip,
} from "../../utilities.js";

// VALUES YOU CAN EASILY CHANGE
// It'd be nice to make this relative to the size of the video
const FINGER_RADIUS = 25;
// END VALUES YOU CAN EASILY CHANGE

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");
const touchableButton = document.querySelector("#touchableButton");
const touchingText = document.querySelector("#touchingText");

// bind ctrl-d to enable debug mode
enableDebugShortcut();

// The functions on touch detection might be confusing; it's ok to just use them
// without thinking too much about how they work right now if you want!

// Take a position in the video feed (0 to 1) and return the actual coordinates
// on the screen of that position. (0.5, 0.5) would be in the center of the video.
// available in utilities.js
function getCoordinatesRelativeToVideo({ x, y, video }) {
  const { x: videoX, y: videoY, width, height } = video.getBoundingClientRect();
  return { x: videoX + x * width, y: videoY + y * height };
}

function moveToPositionInVideo({ elt, loc, video }) {
  const { x, y } = getCoordinatesRelativeToVideo({ x: loc.x, y: loc.y, video });
  elt.style.setProperty("position", "absolute");
  // We use left/top here instead of translate so that we can also center
  // the content using translate
  elt.style.setProperty("left", `${x}px`);
  elt.style.setProperty("top", `${y}px`);
}

function initializeTouchableButton(video) {
  moveToPositionInVideo({
    elt: touchableButton,
    loc: { x: 0.15, y: 0.5 },
    video,
  });
  touchableButton.classList.remove("transparent");
}

function closestPointOnRectangle({ x, y, rect }) {
  // to find the closest point on a rectangle to a point, compare its left and right
  // sides to the x value of the point. if the point is to the left of the rectangle,
  // the closest point is the left side. if the point is to the right of the rectangle,
  // the closest point is the right side. otherwise, the closest point is the x coordinate
  // of the point (because it's between the left and right sides).
  //
  //  do the same for the top and bottom sides.
  const { left, top, right, bottom } = rect;
  const closestX = Math.max(left, Math.min(x, right));
  const closestY = Math.max(top, Math.min(y, bottom));
  return { x: closestX, y: closestY };
}

function isTouching({ elt, loc, radius, video }) {
  if (!loc) {
    return false;
  }
  const rect = elt.getBoundingClientRect();
  const locInVideoSpace = getCoordinatesRelativeToVideo({
    x: loc.x,
    y: loc.y,
    video,
  });
  const closestPoint = closestPointOnRectangle({
    x: locInVideoSpace.x,
    y: locInVideoSpace.y,
    rect,
  });
  const distance = Math.sqrt(
    (locInVideoSpace.x - closestPoint.x) ** 2 +
      (locInVideoSpace.y - closestPoint.y) ** 2
  );
  return distance < radius;
}

function doThingsWithLandmarks({ handLandmarkResults }) {
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
    const leftIsTouching = isTouching({
      elt: touchableButton,
      loc: leftLoc,
      radius: FINGER_RADIUS,
      video: webcamVideo,
    });
    const rightIsTouching = isTouching({
      elt: touchableButton,
      loc: rightLoc,
      radius: FINGER_RADIUS,
      video: webcamVideo,
    });
    let textContent = "Not touching";
    if (leftIsTouching && rightIsTouching) {
      textContent = "Touching with both fingers!";
    } else if (leftIsTouching) {
      textContent = "Touching with left finger!";
    } else if (rightIsTouching) {
      textContent = "Touching with right finger!";
    }
    if (leftIsTouching || rightIsTouching) {
      touchableButton.classList.add("btn-touched");
    } else {
      touchableButton.classList.remove("btn-touched");
    }
    touchingText.textContent = textContent;
  }
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestHandLandmarks: true,
  doThingsWithLandmarks,
  runOnce: () => {
    clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
    initializeTouchableButton(webcamVideo);
  },
});
