import {
  FaceLandmarker,
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";

import { setVideoRect, setAspectRatio } from "./videoUtilities.js";

export async function createFaceLandmarker({
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

export async function createHandLandmarker({
  minHandPresenceConfidence = 0.6,
  minDetectionConfidence = 0.6,
  minTrackingConfidence = 0.6,
  numHands = 2,
} = {}) {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands,
    minHandPresenceConfidence,
    minDetectionConfidence,
    minTrackingConfidence,
  });
  return handLandmarker;
}

export function enableCam({ webcamVideo, enableWebcamButton, runOnStart }) {
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
      const settings = track.getSettings();
      const aspectRatio = settings.aspectRatio;
      setAspectRatio(aspectRatio);

      enableWebcamButton.disabled = true;
      enableWebcamButton.textContent = "Webcam enabled";
      enableWebcamButton.classList.add("webcam-btn-success");
      webcamVideo.classList.remove("transparent");
      console.log("enabled webcam");
      //trigger the runOnStart function on loading data
      webcamVideo.onloadeddata = () => runOnStart();
    })
    .catch((err) => {
      console.error(err);
      enableWebcamButton.textContent = `Couldn't enable webcam: ${err}`;
      throw new Error(err);
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

// Similar to invertFaceLandmarks, we need to invert the hand landmarks because
// we're inverting the video feed
// Additionally, Mediapipe sometimes offers multiple guesses for where a hand is;
// we only want the best one.
// NOTE: this code will prevent your code from working with multiple pairs of hands!!
function selectBestLandmarksForEachHand(results) {
  const bestLandmarksByLabel = {};
  results.handednesses.forEach((handednessOuter, index) => {
    handednessOuter.forEach((handednessInner) => {
      const label = handednessInner.categoryName;

      if (
        !bestLandmarksByLabel[label] ||
        handednessInner.score > bestLandmarksByLabel[label].score
      ) {
        bestLandmarksByLabel[label] = {
          score: handednessInner.score,
          landmarks: results.landmarks[index],
        };
      }
    });
  });

  return Object.keys(bestLandmarksByLabel).map((label) => {
    const landmarks = bestLandmarksByLabel[label].landmarks.map((landmark) => {
      return { x: 1 - landmark.x, y: landmark.y, z: landmark.z };
    });
    label = label === "Right" ? "Left" : "Right";
    return { label, landmarks };
  });
}

async function animationFrameLoop({
  requestFaceLandmarks,
  requestHandLandmarks,
  runEveryFrame,
  webcamVideo,
  runBeforeProcessingVideoFrame,
  handLandmarkerArguments = {},
}) {
  const faceLandmarker = await createFaceLandmarker();
  const handLandmarker = await createHandLandmarker(handLandmarkerArguments);
  let lastVideoTime = -1;
  const loop = () => {
    const startTimeMs = performance.now();
    if (lastVideoTime !== webcamVideo.currentTime) {
      let faceLandmarkResults;
      if (runBeforeProcessingVideoFrame) {
        runBeforeProcessingVideoFrame();
      }
      if (requestFaceLandmarks) {
        faceLandmarkResults = faceLandmarker.detectForVideo(
          webcamVideo,
          startTimeMs
        );
        faceLandmarkResults = invertFaceLandmarks({
          faceLandmarkResults: faceLandmarkResults,
        });
      }
      let handLandmarkResults;
      if (requestHandLandmarks) {
        handLandmarkResults = handLandmarker.detectForVideo(
          webcamVideo,
          startTimeMs
        );
        handLandmarkResults =
          selectBestLandmarksForEachHand(handLandmarkResults);
      }
      runEveryFrame({ faceLandmarkResults, handLandmarkResults });
      lastVideoTime = webcamVideo.currentTime;
    }
    requestAnimationFrame(loop);
  };
  loop();
}

function alignCanvasWithVideo({ webcamVideo, canvas }) {
  const align = () => {
    const videoRect = webcamVideo.getBoundingClientRect();
    setVideoRect(videoRect);
    canvas.style.width = `${videoRect.width}px`;
    canvas.style.height = `${videoRect.height}px`;
  };
  align();
  window.onresize = () => {
    align();
  };
}

export function runForeverOnceWebcamIsEnabled({
  webcamVideo,
  drawingCanvas,
  requestFaceLandmarks,
  requestHandLandmarks,
  doThingsWithLandmarks: runEveryFrame,
  enableWebcamButton,
  runBeforeProcessingVideoFrame,
  runOnce = null,
} = {}) {
  if (!enableWebcamButton) {
    enableWebcamButton = document.querySelector("#enableWebcamButton");
  }
  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;
  if (hasGetUserMedia()) {
    const runOnStart = () => {
      if (runOnce) {
        runOnce();
      }
      if (!drawingCanvas) {
        drawingCanvas = document.querySelector("#drawingCanvas");
      }
      alignCanvasWithVideo({ webcamVideo, canvas: drawingCanvas });
      animationFrameLoop({
        requestFaceLandmarks,
        requestHandLandmarks,
        runEveryFrame,
        runBeforeProcessingVideoFrame,
        webcamVideo,
      });
    };

    enableWebcamButton.onclick = () =>
      enableCam({ webcamVideo, enableWebcamButton, runOnStart });
  } else {
    alert("Couldn't find your webcam. You need a webcam to use this site.");
  }
}

export function clearCanvasAndAlignSizeWithVideo({ webcamVideo, canvas }) {
  canvas.width = webcamVideo.videoWidth;
  canvas.height = webcamVideo.videoHeight;
}

export function drawHandLandmarks({ results, canvas }) {
  const ctx = canvas.getContext("2d");
  results.forEach(({ landmarks }) => {
    drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 5,
    });
    drawLandmarks(ctx, landmarks, { color: "#FF0000", lineWidth: 1 });
  });
}

export function drawFaceLandmarks({ results, canvas = null }) {
  if (
    !results ||
    !results.faceLandmarks ||
    results.faceLandmarks.length === 0
  ) {
    return;
  }
  if (!canvas) {
    canvas = document.querySelector("#drawingCanvas");
  }
  const ctx = canvas.getContext("2d");
  const drawingUtils = new DrawingUtils(ctx);
  if (results.faceLandmarks) {
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#30FF30" }
      );
    }
  }
}
