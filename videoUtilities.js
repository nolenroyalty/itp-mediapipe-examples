let VIDEO_BOUNDING_RECT = null;

export function setVideoRect(boundingRect) {
  VIDEO_BOUNDING_RECT = boundingRect;
}

export function projectOntoVideoSpace({ x, y }) {
  if (!VIDEO_BOUNDING_RECT) {
    throw new Error("VIDEO_BOUNDING_RECT is not set");
  }
  const { width, height, left, top } = VIDEO_BOUNDING_RECT;
  return {
    x: x * width + left,
    y: y * height + top,
  };
}
