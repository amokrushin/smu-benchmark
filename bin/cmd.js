#!/usr/bin/env node

const server = require('../lib/server');
const client = require('../lib/client');
const cliCursor = require('cli-cursor');
// eslint-disable-next-line no-unused-expressions
require('yargs')
    .usage('$0 <cmd> [args]')
    .command(['server', 's'], 'server', {
        p: {
            alias: 'port',
            describe: 'port',
            type: 'number',
            default: 0,
        },
        d: {
            alias: 'uploads-dir',
            describe: 'uploads dir',
            type: 'string',
            default: './uploads',
        },
        t: {
            alias: 'tmp-dir',
            describe: 'temporary files dir',
            type: 'string',
            default: './temp',
        },
        debug: {
            describe: 'debug mode',
            boolean: true,
        },
    }, argv => server(argv, process.stdout))
    .command(['client', 'c'], 'client', {
        p: {
            alias: 'port',
            describe: 'port',
            type: 'number',
            demand: true,
        },
        h: {
            alias: 'host',
            describe: 'target URL',
            type: 'string',
            default: 'localhost',
        },
        c: {
            alias: 'concurrency',
            default: 10,
            describe: 'concurrency',
            type: 'number',
        },
        f: {
            alias: 'files-per-request',
            default: 10,
            describe: 'files per request body',
            type: 'number',
        },
        l: {
            alias: 'limit',
            default: Infinity,
            describe: 'limit total number of files',
            type: 'number',
        },
        k: {
            alias: 'keepalive',
            default: Infinity,
            describe: 'number of requests',
            type: 'number',
        },
        d: {
            alias: 'dir',
            default: `${process.cwd()}/sample-images`,
            describe: 'samples directory',
            type: 'string',
        },
        o: {
            alias: 'output',
            describe: 'pipe output to file [path]',
            type: 'string',
        },
    }, argv => client(argv, process.stdout))
    .help()
    .argv;

cliCursor.hide();
