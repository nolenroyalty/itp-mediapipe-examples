const webcamVideo = document.querySelector("#webcamVideo");
const enableWebcamButton = document.querySelector("#enableWebcamButton");
import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";
console.log(FaceLandmarker);

async function createFaceLandmarker({
  numFaces,
}) {
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
      minFaceDetectionConfidence: 0.5,
      minTrackingConfidence: 0.4,
    });
  }
  return getLandmarker();
}

function enableCam() {
  console.log("hi");
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      webcamVideo.srcObject = stream;
      console.log("enabled");
    })
    .catch((err) => {
      console.error(err);
      throw new Error(err);
    });
}

function wireUpWebcamButton() {
  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;
  if (hasGetUserMedia()) {
    enableWebcamButton.addEventListener("click", enableCam);
  } else {
    alert("Couldn't find your webcam. You need a webcam to use this site.");
  }
}

async function main() {
  wireUpWebcamButton();
  console.log("hi");
  console.log(FaceLandmarker);

  const landmarker = await createFaceLandmarker({
    numFaces: 1,
    FaceLandmarker,
    FilesetResolver,
  });
  console.log(`landmarker: ${landmarker}`);
}

main();