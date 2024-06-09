import {
  clearCanvasAndAlignSizeWithVideo,
  runForeverOnceWebcamIsEnabled,
} from "../../boilerplate.js";
import {
  enableDebugShortcut,
  addDebugValue,
  clearDebugValues,
  getFingertip,
  isTouching,
  moveToPositionInVideo,
} from "../../utilities.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");
const kick = document.querySelector("#kick");
const clap = document.querySelector("#clap");
const hihat = document.querySelector("#hihat");
const airhorn = document.querySelector("#airhorn");
const kickSound = document.querySelector("#kickAudio");
const clapSound = document.querySelector("#clapAudio");
const hihatSound = document.querySelector("#hihatAudio");
const airhornSound = document.querySelector("#airhornAudio");

// It'd be nice to make this relative to the size of the video
const FINGER_RADIUS = 25;

// bind ctrl-d to enable debug mode
enableDebugShortcut();

function initializeButtons(video) {
  moveToPositionInVideo({
    elt: kick,
    loc: { x: 0.1, y: 0.4 },
    video,
  });
  moveToPositionInVideo({
    elt: clap,
    loc: { x: 0.4, y: 0.4 },
    video,
  });
  moveToPositionInVideo({
    elt: hihat,
    loc: { x: 0.7, y: 0.4 },
    video,
  });
  moveToPositionInVideo({
    elt: airhorn,
    loc: { x: 0.8, y: 0.1 },
    video,
  });
  kick.classList.remove("transparent");
  clap.classList.remove("transparent");
  hihat.classList.remove("transparent");
  airhorn.classList.remove("transparent");
  // it's loud
  airhornSound.volume = 0.25;
}

const buttonIsTouched = {
  kick: false,
  snare: false,
  hihat: false,
  airhorn: false,
};

function maybePlaySound({ button, sound, leftLoc, rightLoc, video }) {
  const isTouchingLeft = isTouching({
    elt: button,
    loc: leftLoc,
    radius: FINGER_RADIUS,
    video,
  });
  const isTouchingRight = isTouching({
    elt: button,
    loc: rightLoc,
    radius: FINGER_RADIUS,
    video,
  });
  const touched = isTouchingLeft || isTouchingRight;
  if (touched && !buttonIsTouched[button.id]) {
    sound.currentTime = 0;
    sound.play();
    buttonIsTouched[button.id] = true;
    button.classList.add("btn-touched");
  } else if (!touched) {
    buttonIsTouched[button.id] = false;
    button.classList.remove("btn-touched");
  }
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
    [
      [kick, kickSound],
      [clap, clapSound],
      [hihat, hihatSound],
      [airhorn, airhornSound],
    ].forEach(([button, sound]) =>
      maybePlaySound({
        button,
        sound,
        leftLoc,
        rightLoc,
        video: webcamVideo,
      })
    );
  }
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestHandLandmarks: true,
  doThingsWithLandmarks,
  runOnce: () => {
    clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
    initializeButtons(webcamVideo);
  },
});
