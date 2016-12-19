### Download sample images
```
$ npm run download-exiftool-sample-images
```

### Server
```
$ node bin/cmd.js s --help
  -p, --port               port
  -d, --uploads-dir        uploads dir
  -t, --tmp-dir            temporary files dir

Example:

$ node bin/cmd.js s -p1123

Listening http://localhost:1123
Press Ctrl+C to exit

requests:       110/110
files:          1100/1100
size:           21.79 Mb

```

### Client
```
$ node bin/cmd.js c --help
  -p, --port               port
  -h, --host               host
  -c, --concurrency        concurrency
  -f, --files-per-request  files per request body
  -l, --limit              limit total number of files
  -d, --dir                samples directory
  -o, --output             pipe output to file [path]

Example:

$ node bin/cmd.js c -p1123

requests:       110/110/110
files:          1100/1100/1100
size:           21.79 Mb
speed:          15.22 Mbit/s, 96.04 fps

```
