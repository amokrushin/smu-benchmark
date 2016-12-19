const fs = require('fs-extra');
const path = require('path');

function chunk(arr, n) {
    return arr.length ? [arr.slice(0, n)].concat(chunk(arr.slice(n), n)) : [];
}

function testSamplesDir(dir, cb) {
    fs.access(dir, fs.constants.R_OK, cb);
}

function collectSamples(dir, cb) {
    const samples = [];
    fs.walk(dir)
        .on('data', (item) => {
            if (!item.stats.isDirectory()) samples.push(item.path);
        })
        .once('end', () => {
            cb(null, samples);
        })
        .once('error', (err) => {
            cb(err);
        });
}

function outputFileStream(outputFilePath) {
    fs.ensureDirSync(path.dirname(outputFilePath));
    return fs.createWriteStream(outputFilePath);
}

module.exports = {
    chunk,
    testSamplesDir,
    collectSamples,
    outputFileStream,
};
