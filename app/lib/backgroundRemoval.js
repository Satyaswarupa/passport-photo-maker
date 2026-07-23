/**
 * Background removal runs entirely in the browser via an ONNX segmentation
 * model — the photo is never uploaded anywhere. The library and its model
 * weights are pulled in on first use so they stay out of the initial bundle.
 */
export async function removePhotoBackground(blob, onProgress) {
  const { removeBackground } = await import("@imgly/background-removal");

  return removeBackground(blob, {
    model: "isnet_fp16",
    output: { format: "image/png", quality: 1 },
    progress: (key, current, total) => {
      if (!onProgress || !total) return;
      const stage = key.startsWith("fetch") ? "Downloading AI model" : "Removing background";
      onProgress({ stage, ratio: current / total });
    },
  });
}
