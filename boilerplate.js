import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";

export async function createFaceLandmarker({
  numFaces = 1,
  minFaceDetectionConfidence = 0.5,
  minTrackingConfidence = 0.4,
} = {}) {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );

  async function getLandmarker() {
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
  return getLandmarker();
}

export function enableCam({ webcamVideo, enableWebcamButton, runOnStart }) {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      webcamVideo.srcObject = stream;
      enableWebcamButton.disabled = true;
      enableWebcamButton.textContent = "Webcam enabled";
      enableWebcamButton.classList.add("webcam-btn-success");
      webcamVideo.classList.remove("transparent");
      console.log("enabled webcam");
      runOnStart();
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

async function animationFrameLoop({
  requestFaceLandmarks,
  requestHandLandmarks,
  runEveryFrame,
  webcamVideo,
}) {
  const faceLandmarker = await createFaceLandmarker();
  let lastVideoTime = -1;
  const loop = (time) => {
    const startTimeMs = performance.now();
    if (lastVideoTime !== webcamVideo.currentTime) {
      let faceLandmarkResults;
      if (requestFaceLandmarks) {
        faceLandmarkResults = faceLandmarker.detectForVideo(
          webcamVideo,
          startTimeMs
        );
        faceLandmarkResults = invertFaceLandmarks({
          faceLandmarkResults: faceLandmarkResults,
        });
      }
      runEveryFrame({ time, faceLandmarkResults });
      lastVideoTime = webcamVideo.currentTime;
    }
    requestAnimationFrame(loop);
  };
  loop();
}

export function runForeverOnceWebcamIsEnabled({
  webcamVideo,
  requestFaceLandmarks,
  requestHandLandmarks,
  doThingsWithLandmarks: runEveryFrame,
  enableWebcamButton,
} = {}) {
  if (!enableWebcamButton) {
    enableWebcamButton = document.querySelector("#enableWebcamButton");
  }
  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;
  if (hasGetUserMedia()) {
    const runOnStart = () => {
      animationFrameLoop({
        requestFaceLandmarks,
        requestHandLandmarks,
        runEveryFrame,
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

export function drawFaceLandmarks({ results, canvas = null }) {
  if (!results || !results.faceLandmarks) {
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
