const path = require('path');
const fs = require('fs');
const url = require('url');
const { request, Agent } = require('http');
const async = require('async');
const { chunk, testSamplesDir, collectSamples, outputFileStream } = require('./util');
const FormData = require('form-data');

const log = require('single-line-log').stdout;
const chalk = require('chalk');

const keepAliveAgent = new Agent({ keepAlive: true });

const stats = {
    requests: {
        total: 0,
        finished: 0,
        unfinished: 0,
        expected: 0,
    },
    files: {
        total: 0,
        finished: 0,
        unfinished: 0,
        expected: 0,
    },
    size: 0,
    timeStart: 0,
    timeEnd: 0,
    ended: false,
};

let logStats = false;
let isEnded = false;

const timerId = setInterval(() => {
    if (!logStats) return;
    if (!isEnded) {
        stats.timeEnd = Date.now();
    }
    const totalSizeMb = stats.size / 1024 / 1024;
    const totalSizeMbit = totalSizeMb * 8;
    const totalTimeS = (stats.timeEnd - stats.timeStart) / 1000;
    log([
        `requests:\t${[
            chalk.yellow(stats.requests.finished),
            chalk.green(stats.requests.total),
            chalk.cyan(stats.requests.expected),
        ].join('/')}`,
        `files:\t\t${[
            chalk.yellow(stats.files.finished),
            chalk.green(stats.files.total),
            chalk.cyan(stats.files.expected),
        ].join('/')}`,
        `size:\t\t${chalk.green(totalSizeMb.toFixed(2))} Mb`,
        `speed:\t\t${chalk.green((totalSizeMbit / totalTimeS).toFixed(2))} Mbit/s`
            .concat(`, ${chalk.green((stats.files.total / totalTimeS).toFixed(2))} fps`),
    ].join('\n').concat('\n'));
}, 200);

function uploadSeries({ target, files, outputFilePath }, callback) {
    stats.requests.total++;
    stats.requests.unfinished++;
    const form = new FormData();
    const rq = request(Object.assign(
        {},
        url.parse(target),
        {
            method: 'post',
            headers: form.getHeaders(),
            agent: keepAliveAgent,
        }
    ), (res) => {
        if (res.statusCode !== 200) {
            throw new Error(`HTTP ${res.statusCode} ${res.statusMessage}\n`);
        }
        res.on('data', (data) => {
            const str = data.toString();
            if (str[0] !== '[' && str[0] !== ',') return;
            const match = str.match(/"size":(\d+)/);
            if (match) {
                stats.size += Number(match[1]);
                stats.files.unfinished--;
                stats.files.finished++;
            }
        });
        res.on('end', () => {
            stats.requests.unfinished--;
            stats.requests.finished++;
            callback();
        });
        res.on('error', (err) => {
            callback(err);
        });
        if (outputFilePath) {
            res.pipe(outputFileStream(outputFilePath));
        }
    });
    files.forEach((filePath) => {
        form.append('file', fs.createReadStream(filePath));
        stats.files.total++;
        stats.files.unfinished++;
    });
    form.pipe(rq);
}

function run(samples, { host, port, concurrency, filesPerRequest, limit, output }, cb) {
    const target = `http://${host}:${port}`;
    const offset = 0;
    const slice = samples.slice(offset, offset + Math.min(limit, samples.length));
    const chunks = chunk(slice, filesPerRequest);

    let outputFilePath = '';
    if (output) {
        outputFilePath = path.isAbsolute(output)
            ? output
            : path.resolve(process.cwd(), output);
    }

    stats.files.expected = slice.length;
    stats.requests.expected = chunks.length;

    logStats = true;

    async.eachLimit(chunks, concurrency, (files, c) => {
        uploadSeries({ target, files, outputFilePath }, c);
    }, cb);
}

module.exports = (options, stdout) => {
    const dir = path.isAbsolute(options.dir) ? options.dir : path.resolve(process.cwd(), options.dir);

    stdout.write('\n');

    stats.timeStart = Date.now();

    async.autoInject({
        test: cb => testSamplesDir(dir, cb),
        samples: cb => collectSamples(dir, cb),
        run: ['samples', (samples, cb) => run(samples, options, cb)],
    }, (err) => {
        if (err && err.code === 'ENOENT') {
            stdout.write('Sample images not found. Download samples with:\n');
            stdout.write('$ npm run download-exiftool-sample-images\n');
        } else if (err) {
            throw err;
        }
        isEnded = true;
        stats.timeEnd = Date.now();

        setTimeout(() => clearInterval(timerId), 300);
        keepAliveAgent.destroy();
    });

    process.once('exit', () => {
        stdout.write('\n');
    });
};

