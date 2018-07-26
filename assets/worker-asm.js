//importScripts('ffmpeg-worker-mp4.js');
function importDep() {
  try {
     importScripts('ffmpeg-all-codecs.js');
  } catch (e) {
    importDep();
  }
}

importDep();

var now = Date.now;

function print(text) {
  postMessage({
    'type': 'stdout',
    'data': text
  });
}

function dataURLToUintArray(dataURL) {
  const BASE64_MARKER = ';base64,';
  if (dataURL.indexOf(BASE64_MARKER) === -1) {
    const parts_aux = dataURL.split(',');
    const contentType_aux = parts_aux[0].split(':')[1];
    const raw_aux = parts_aux[1];

    return new Blob([raw_aux], {type: contentType_aux});
  }

  const parts = dataURL.split(BASE64_MARKER);
  const contentType = parts[0].split(':')[1];
  const raw = self.atob(parts[1]);
  const rawLength = raw.length;

  const uInt8Array = new Uint8Array(rawLength);
  let i;
  for (i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return uInt8Array;
}

onmessage = function (event) {

  var message = event.data;

  // message.files.blobs.forEach(file => file.data = dataURLToUintArray(file.data));
  var data = event.data.files.map((file, i) => ({
    data: file,
    name: 'img_' + (i < 10 ? '00' : i < 100 ? '0' : '') + i + '.jpg'
  }));

  console.log(data);

  if (message.type === "command") {

    var Module = {
      print: print,
      printErr: print,
      files: data || [],
      arguments: message.arguments || [],
      TOTAL_MEMORY: 67108864
      // Can play around with this option - must be a power of 2
      // TOTAL_MEMORY: 268435456
    };

    postMessage({
      'type': 'start',
      'data': Module.arguments.join(" ")
    });

    postMessage({
      'type': 'stdout',
      'data': 'Received command: ' +
      Module.arguments.join(" ") +
      ((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")
    });

    var time = now();
    var result = ffmpeg_run(Module);

    var totalTime = now() - time;
    postMessage({
      'type': 'stdout',
      'data': 'Finished processing (took ' + totalTime + 'ms)'
    });

    postMessage({
      'type': 'done',
      'data': result,
      'time': totalTime
    });
  }
}
;

postMessage({
  'type': 'ready'
});
