import { parseSimplifiedDrawings, getDrawingList, chunk } from "./utils.js";
import fs from "fs";

const files = fs.readdirSync("data");
if (!fs.existsSync("new-data")) {
  fs.mkdirSync("new-data");
}

//* Generate JSON file for every NDJSON file
// Going one file at a time because of memory problems
files.slice(0, 1).forEach((file) => {
  parseSimplifiedDrawings(`data/${file}`, function (err, drawings) {
    if (err) return console.error(err);

    const fileId = files.indexOf(file);

    getDrawingList(drawings, fileId).then((drawingList) => {
      const drawingJSON = JSON.stringify(drawingList);
      fs.writeFile(
        `new-data/${file.substring(0, file.length - 7)}.json`,
        drawingJSON,
        (err) => {
          if (err) return console.error(err);
        }
      );
    });
  });
});

//* Generate only one JSON file containing everything
// const everything = [];
// let iteration = 1;
// const fileChunks = chunk(files, 5);

// fileChunks.forEach((fileChunk) => {
//   const promises = fileChunk.map((file) => {
//     return new Promise((resolve, reject) => {
//       parseSimplifiedDrawings(`data/${file}`, function (err, drawings) {
//         if (err) {
//           console.error(err);
//           return reject(err);
//         }

//         const fileId = fileChunk.indexOf(file);

//         getDrawingList(drawings, fileId)
//           .then((drawingList) => {
//             everything.push(...drawingList);
//             resolve(); // Resolve the promise when the drawing list is added
//           })
//           .catch(reject);
//       });
//     });
//   });

//   Promise.all(promises)
//     .then(() => {
//       const drawingJSON = JSON.stringify(everything);
//       fs.writeFile(`new-data/dataset-${iteration}.json`, drawingJSON, (err) => {
//         if (err) return console.error(err);
//         console.log("File written successfully");
//       });
//       iteration++;
//     })
//     .catch((err) => {
//       console.error("Error processing files", err);
//     });
// });
