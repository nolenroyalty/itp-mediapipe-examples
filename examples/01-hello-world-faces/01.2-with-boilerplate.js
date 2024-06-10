import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";
import { drawFaceLandmarks } from "../../boilerplate.js";
import { enableDebugShortcut, addDebugValue } from "../../utilities.js";

const webcamVideo = document.querySelector("#webcamVideo");
const drawingCanvas = document.querySelector("#drawingCanvas");
const enableWebcamButton = document.querySelector("#enableWebcamButton");

// bind ctrl-d to enable debug mode
// the debug panel is a helpful way to show values that you're interested in. lots of
// mediapipe work involves observing values like "how open is my mouth right now" and
// it's way easier to see those values on your website than via a console log or something.
enableDebugShortcut();

// add all of the 'blendshapes" (think of them as facial expressions) to the debug panel
// There are too many face landmarks (hundreds!) to display them in the debug menu, but
// you can find them all in this picture: https://storage.googleapis.com/mediapipe-assets/documentation/mediapipe_face_landmark_fullsize.png
function DEBUG_blendshapeValues(blendShapes) {
  if (!blendShapes.length) {
    return;
  }

  blendShapes[0].categories.forEach((shape) => {
    // This is a handy function for putting something into the debug panel.
    // The latest value for every label is shown in the debug panel. If you
    // pass `showValueBar: true`, you'll see a little bar that fills up as the
    // value goes from 0 to 1
    addDebugValue({
      label: shape.displayName || shape.categoryName,
      value: shape.score,
      showValueBar: true,
    });
  });
}

// I consider all of the below code "boilerplate" - it's code that's basically the same
// in every file. There's a lot going on here; we'll talk about it during the workshop.
// In future examples all of this code will be hidden.
//
// This code might be intimidating, but it's not important to understand it all right now!
// Part of the point of the talk is that this code is basically always the same, and the
// fun is elsewhere :)

// Wire up the 'enable webcam' button so that we hook up the video on our page to it.
// We do some other stuff here too, like making sure that the canvas (which we're going
// to draw on) is the same size as the video.
// This can be a good place to do things like load models or other setup that
// takes a bit, so that our page loads more quickly.
// Finally, if you're making a mobile website you might want to load all your sounds here:
// many mobile browsers only let you load sounds in response to a user action.
const hasGetUserMedia = !!(
  navigator.mediaDevices && navigator.mediaDevices.getUserMedia
);

function wireUpWebcam({ runOnStart }) {
  if (!hasGetUserMedia) {
    alert("can't find your webcam; you need a webcam to use this site");
  } else {
    enableWebcamButton.onclick = () => {
      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
          webcamVideo.srcObject = stream;
          const track = stream.getVideoTracks()[0];

          enableWebcamButton.disabled = true;
          enableWebcamButton.textContent = "Webcam enabled";
          enableWebcamButton.classList.add("webcam-btn-success");
          webcamVideo.classList.remove("transparent");
          console.log("enabled webcam");
          const loadedData = () => {
            runOnStart();
            webcamVideo.removeEventListener("loadeddata", loadedData);
          };
          webcamVideo.addEventListener("loadeddata", loadedData);
        })
        .catch((err) => {
          console.error(err);
          enableWebcamButton.textContent = `Couldn't enable webcam: ${err}`;
          throw new Error(err);
        });
    };
  }
}

async function createFaceLandmarker({
  numFaces = 1,
  minFaceDetectionConfidence = 0.5,
  minTrackingConfidence = 0.4,
} = {}) {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );

  return FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU",
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: numFaces,
    minFaceDetectionConfidence,
    minTrackingConfidence,
  });
}

// We flip the webcam video horizontally so that it's like a mirror - the user
// should move to the left in the video when they move to the left in real life.
// This makes things like hand tracking more intuitive.
// Since we do this flipping in the CSS, we need to invert the face landmarks
function invertFaceLandmarks({ faceLandmarkResults }) {
  if (!faceLandmarkResults) {
    return;
  }

  const copiedAndInverted = {};
  copiedAndInverted.faceLandmarks = faceLandmarkResults.faceLandmarks.map(
    (landmarks) =>
      landmarks.map((landmark) => {
        return { x: 1 - landmark.x, y: landmark.y, z: landmark.z };
      })
  );
  copiedAndInverted.faceBlendshapes = faceLandmarkResults.faceBlendshapes.map(
    (blendShapes) => ({ ...blendShapes })
  );
  return copiedAndInverted;
}

// This is the main loop that runs every frame (basically, every time the browser
// wants to update something on the screen - this happens many times a second as,
// for example your webcam updates).
//
// The basic thing we're doing is: every frame, ask what's going on with the face
// on the webcam (if there is one). Then we tell the function we wrote what's going
// on with that face, and it does stuff with it.
//
// requestAnimationFrame is a way of telling the browser "hey, right before you
// update the screen, run this function". This is a good place to do mediapipe stuff
// since mediapipe is all about processing video frames and responding to them.
//
// requestAnimationFrame is very neat and does things like synchronizes how often
// a function runs with how frequently your display is updating!
//
// But also; this code probably looks a little weird especially if you aren't used
// to "async" functions or passing functions as arguments to other functions.
// It's going away after this example! Don't worry!!
async function animationFrameLoop({ doThingsWithLandmarks }) {
  const faceLandmarker = await createFaceLandmarker();
  let lastVideoTime = -1;
  const loop = () => {
    const startTimeMs = performance.now();
    if (lastVideoTime !== webcamVideo.currentTime) {
      let faceLandmarkResults = faceLandmarker.detectForVideo(
        webcamVideo,
        startTimeMs
      );
      faceLandmarkResults = invertFaceLandmarks({
        faceLandmarkResults: faceLandmarkResults,
      });
      doThingsWithLandmarks({ faceLandmarkResults });
      lastVideoTime = webcamVideo.currentTime;
    }
    requestAnimationFrame(loop);
  };
  loop();
}

function runForeverOnceWebcamIsEnabled({
  requestFaceLandmarks,
  doThingsWithLandmarks,
}) {
  wireUpWebcam({
    runOnStart: () => {
      animationFrameLoop({
        requestFaceLandmarks,
        doThingsWithLandmarks,
      });
    },
  });
}

// To make our code work, we need to overlay a canvas on top of the video
// so that we can draw on something. This function makes sure that the canvas
// is the same size as the video. It also *clears* the canvas. This is important
// because we're drawing stuff to the canvas whenever your face changes; we don't
// want stuff from old versions of your face to stick around.
export function clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas }) {
  canvas.width = webcamVideo.videoWidth;
  canvas.height = webcamVideo.videoHeight;
}

// In the other examples this is the code we'll actually write!
function doThingsWithLandmarks({ faceLandmarkResults }) {
  clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas: drawingCanvas });
  if (faceLandmarkResults && faceLandmarkResults.faceLandmarks) {
    // drawFaceLandmarks just calls some google-provided functions to draw
    // the face landmarks on the screen. It's a weirdly large amount of code
    // but not important to understand
    drawFaceLandmarks({ results: faceLandmarkResults, canvas: drawingCanvas });
    DEBUG_blendshapeValues(faceLandmarkResults.faceBlendshapes);
  }
}

runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestFaceLandmarks: true,
  doThingsWithLandmarks,
});
