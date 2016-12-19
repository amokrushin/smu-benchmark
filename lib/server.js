const chalk = require('chalk');
const { TestServer } = require('stream-multipart-upload');
const path = require('path');
const log = require('single-line-log').stdout;

module.exports = (options, stdout) => {
    const uploadsDir = path.isAbsolute(options.uploadsDir)
        ? options.uploadsDir
        : path.resolve(process.cwd(), options.uploadsDir);
    const tmpDir = path.isAbsolute(options.tmpDir)
        ? options.tmpDir
        : path.resolve(process.cwd(), options.tmpDir);
    const server = new TestServer({
        uploadsDir,
        tmpDir,
        omitPlugins: [
            'storageTempLocal',
            'storageLocal',
            'fastTransform',
            'slowTransform',
        ],
    });

    server.listen(options.port, (err, port) => {
        stdout.write('\n');
        stdout.write(`Listening ${chalk.cyan(`http://localhost:${port}\n`)}`);
        stdout.write(`Uploads dir: ${chalk.cyan(uploadsDir)}\n`);
        stdout.write(`Temp dir: ${chalk.cyan(tmpDir)}\n`);
        stdout.write('Press Ctrl+C to exit\n');
        stdout.write('\n');
    });

    const timerId = setInterval(() => {
        if (options.debug) {
            return clearInterval(timerId);
        }
        log([
            `requests:\t${chalk.yellow(server.stats.requests.finished)}/${chalk.green(server.stats.requests.total)}`,
            `files:\t\t${chalk.yellow(server.stats.files.finished)}/${chalk.green(server.stats.files.total)}`,
            `size:\t\t${chalk.green((server.stats.size / 1024 / 1024).toFixed(2))} Mb`,
        ].join('\n').concat('\n '));
    }, 200);

    const gcTimerId = setInterval(() => {
        if (global.gc) {
            global.gc();
        } else {
            clearInterval(gcTimerId);
        }
    }, 2000);

    process.on('exit', () => {
        clearInterval(timerId);
        clearInterval(gcTimerId);
        stdout.write('\n');
    });
};
