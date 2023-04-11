const { parentPort, workerData } = require("worker_threads");
const sharp = require("sharp")

const filePath = workerData
const image = sharp(filePath);

image.resize(100, 100).toBuffer((err, buffer) => {
    if (err || !parentPort) {
      throw err;
    }
    parentPort.postMessage(buffer);
  });