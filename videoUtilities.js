let VIDEO_BOUNDING_RECT = null;
let ASPECT_RATIO = null;
let xOffset = 0;
let yOffset = 0;
let actualWidth = null;
let actualHeight = null;

export function setAspectRatio(aspectRatio) {
  ASPECT_RATIO = aspectRatio;
}

export function setVideoRect(boundingRect) {
  VIDEO_BOUNDING_RECT = boundingRect;
  const { width, height } = boundingRect;
  const anticipatedHeight = width / ASPECT_RATIO;
  const anticipatedWidth = height * ASPECT_RATIO;

  if (anticipatedHeight < height) {
    // We should never actually hit this case since we're stretching the video
    // as far as it goes (width-wise) and then determining its height from that.
    // But it's good to document.

    // If we did hit this case we would *not* set yOffset because we don't center
    // the video vertically, only horizontally.

    // yOffset = (height - anticipatedHeight) / 2;
    actualHeight = anticipatedHeight;
    actualWidth = width;
    console.log(`1: width: ${width} height: ${height}`);
    console.log(
      `1: anticipatedWidth: ${anticipatedWidth}, anticipatedHeight: ${anticipatedHeight}`
    );
    console.log(
      `1: actualHeight: ${actualHeight}, actualWidth: ${actualWidth}`
    );
    console.log("");
  } else if (anticipatedWidth < width) {
    xOffset = (width - anticipatedWidth) / 2;
    actualWidth = anticipatedWidth;
    actualHeight = height;
    console.log(`2: width: ${width} height: ${height}`);
    console.log(
      `2: anticipatedWidth: ${anticipatedWidth}, anticipatedHeight: ${anticipatedHeight}`
    );
    console.log(
      `2: actualHeight: ${actualHeight}, actualWidth: ${actualWidth}`
    );
    console.log("");
  }
}

export function projectOntoVideoSpace({ x, y }) {
  if (!actualWidth || !actualHeight) {
    console.error("ACTUAL HEIGHT OR WIDTH NOT SET");
    return null;
  }
  const { left, top } = VIDEO_BOUNDING_RECT;
  return {
    x: x * actualWidth + xOffset + left,
    y: y * actualHeight + yOffset + top,
  };
}
