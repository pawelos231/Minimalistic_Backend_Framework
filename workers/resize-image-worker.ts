const { parentPort, workerData } = require("worker_threads");
const sharp = require("sharp")

const {filePath, width, height} = workerData
const image = sharp(filePath);

image.resize(width, height).toBuffer((err, buffer) => {
    if (err || !parentPort) {
      throw err;
    }
    parentPort.postMessage(buffer);
  });