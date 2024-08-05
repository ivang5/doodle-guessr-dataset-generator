import fs from "fs";
import ndjson from "ndjson";
import { createCanvas, loadImage } from "canvas";

function convertDrawingToSVG(drawingArray) {
  let svgPath =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">';

  drawingArray.forEach((stroke) => {
    const [xCoords, yCoords] = stroke;
    if (xCoords.length > 0 && yCoords.length > 0) {
      svgPath += `<path d="M${xCoords[0]} ${yCoords[0]}`;

      for (let i = 1; i < xCoords.length; i++) {
        svgPath += ` L${xCoords[i]} ${yCoords[i]}`;
      }

      svgPath += '" fill="none" stroke="black"/>';
    }
  });

  svgPath += "</svg>";

  return svgPath;
}

function svgToBase64(svg) {
  const base64 = Buffer.from(svg).toString("base64");
  const base64SVG = `data:image/svg+xml;base64,${base64}`;
  return base64SVG;
}

function getPixelArr(canvas, pixels) {
  const pixelArray = [];

  for (let y = 0; y < canvas.height; y++) {
    const row = [];
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      const alpha = pixels[index + 3];

      row.push(alpha === 0 ? 1 : 0);
    }
    pixelArray.push(row);
  }

  return pixelArray;
}

function applyPadding(pixelArray, padding) {
  const { topPadding, bottomPadding, leftPadding, rightPadding } = padding;
  const paddingTop = Array(topPadding).fill(Array(64).fill(1));
  const paddingBottom = Array(bottomPadding).fill(Array(64).fill(1));
  const paddingLeft = Array(leftPadding).fill(1);
  const paddingRight = Array(rightPadding).fill(1);
  const newPixelArray = [];

  // Add pixels on top and bottom
  pixelArray = [...paddingTop, ...pixelArray, ...paddingBottom];

  pixelArray.forEach((row) => {
    // Add pixels on left and right
    newPixelArray.push([...paddingLeft, ...row, ...paddingRight]);
  });

  return newPixelArray;
}

function getRandomNum(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function getRandomPadding(min, max) {
  const padding = getRandomNum(min, max);
  const preferTop = Math.random() < 0.5;
  const topBottomDiff = getRandomNum(0, Math.round(padding * 0.1));
  const leftRightDiff = getRandomNum(0, Math.round(padding * 0.3));
  let topPadding, bottomPadding, leftPadding, rightPadding;

  if (preferTop) {
    topPadding = Math.round(padding / 2) + topBottomDiff;
    bottomPadding = padding - topPadding;
  } else {
    bottomPadding = Math.round(padding / 2) + topBottomDiff;
    topPadding = padding - bottomPadding;
  }

  leftPadding = Math.round(padding / 2) + leftRightDiff;
  rightPadding = padding - leftPadding;

  return {
    topPadding: topPadding,
    bottomPadding: bottomPadding,
    leftPadding: leftPadding,
    rightPadding: rightPadding,
  };
}

async function base64ToPixelArr(base64) {
  const x = 64;
  const y = 64;
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext("2d");
  const img = await loadImage(base64);

  ctx.drawImage(img, 0, 0, x, y);

  const imageData = ctx.getImageData(0, 0, x, y);
  const pixels = imageData.data;

  let pixelArray = getPixelArr(canvas, pixels);

  // Add padding
  const padding = getRandomPadding(30, 85);
  pixelArray = applyPadding(pixelArray, padding);

  const pixelArrayFlatten = pixelArray.flat();
  const dims = 64 + padding.leftPadding + padding.rightPadding;
  const paddedCanvas = createCanvas(dims, dims);
  const paddedCtx = paddedCanvas.getContext("2d");

  const paddedImageData = paddedCtx.createImageData(dims, dims);

  for (let y = 0; y < dims; y++) {
    for (let x = 0; x < dims; x++) {
      const index = y * dims + x;
      const color = pixelArrayFlatten[index] === 1 ? 255 : 0;
      const baseIndex = index * 4;
      paddedImageData.data[baseIndex] = color;
      paddedImageData.data[baseIndex + 1] = color;
      paddedImageData.data[baseIndex + 2] = color;
      paddedImageData.data[baseIndex + 3] = 255;
    }
  }

  paddedCtx.putImageData(paddedImageData, 0, 0);

  function rgbaToBinary(r, g, b, a) {
    const threshold = 127;
    const brightness = (r + g + b) / 3;
    return brightness > threshold ? 1 : 0;
  }

  // Rescale canvas
  const rescaledCanvas = createCanvas(64, 64);
  const rescaledCtx = rescaledCanvas.getContext("2d");

  rescaledCtx.drawImage(
    paddedCanvas,
    0,
    0,
    paddedCanvas.width,
    paddedCanvas.height,
    0,
    0,
    rescaledCanvas.width,
    rescaledCanvas.height
  );

  const rescaledImageData = rescaledCtx.getImageData(
    0,
    0,
    paddedCanvas.width,
    paddedCanvas.height
  );
  const rescaledPixels = rescaledImageData.data;

  const rescaledPixelArray = new Array(64)
    .fill(0)
    .map(() => new Array(64).fill(0));
  for (let y = 0; y < rescaledCanvas.height; y++) {
    for (let x = 0; x < rescaledCanvas.width; x++) {
      const index = (y * rescaledCanvas.width + x) * 4;
      const r = rescaledPixels[index];
      const g = rescaledPixels[index + 1];
      const b = rescaledPixels[index + 2];

      rescaledPixelArray[y][x] = rgbaToBinary(r, g, b);
    }
  }

  return rescaledPixelArray;
}

export function parseSimplifiedDrawings(fileName, callback) {
  var drawings = [];
  var fileStream = fs.createReadStream(fileName);
  fileStream
    .pipe(ndjson.parse())
    .on("data", function (obj) {
      drawings.push(obj);
    })
    .on("error", callback)
    .on("end", function () {
      callback(null, drawings);
    });
}

export function chunk(arr, size) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export async function getDrawingList(drawings, id) {
  const drawingList = [];
  await drawings.slice(0, 50000).forEach(function (d) {
    const svg = convertDrawingToSVG(d.drawing);
    const base64SVG = svgToBase64(svg);
    base64ToPixelArr(base64SVG).then((pixelArray) => {
      const drawingObj = {
        id: id,
        word: d.word,
        pixels: pixelArray,
      };
      drawingList.push(drawingObj);
    });
  });

  return drawingList;
}
