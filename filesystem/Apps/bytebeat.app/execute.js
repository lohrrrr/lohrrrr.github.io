var audioCtx = null;
var scriptNode = null;
var gainNode = null;
var analyserNode = null;
var isPlaying = false;
var curT = 0;
var sampleRate = 8000;

var playBtn = document.getElementById('btn-play');
var stopBtn = document.getElementById('btn-stop');
var scopeCanvas = document.getElementById('scope');
var scopeCtx = scopeCanvas.getContext('2d');

function initAudio() {
    if (!audioCtx) {
        var AudioClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function start() {
    initAudio();
    if (isPlaying) return;

    scriptNode = audioCtx.createScriptProcessor(2048, 1, 1);
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.4;

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;

    var step = sampleRate / audioCtx.sampleRate;

    scriptNode.onaudioprocess = function(e) {
        var out = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < out.length; i++) {
            var it = Math.floor(curT);
            var val = (((it * (it >> 30 | it >> 13) / 2)) >> (it * (it >> 50 | it >> 10) & 7 ^ it >> 7 | it >> 82)) | (it >> 4 | it >> 4) >> (it & (it / 6 | 0));
            out[i] = ((val & 255) - 128) / 128;
            curT += step;
        }
    };

    scriptNode.connect(gainNode);
    gainNode.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    isPlaying = true;
    playBtn.textContent = 'RUNNING...';
    playBtn.style.color = '#a9e38d';
}

function stop() {
    if (scriptNode) {
        scriptNode.disconnect();
        scriptNode = null;
    }
    if (gainNode) {
        gainNode.disconnect();
        gainNode = null;
    }
    isPlaying = false;
    playBtn.textContent = 'EXECUTE [PLAY]';
    playBtn.style.color = '#fff9e6';
}

playBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);

function render() {
    requestAnimationFrame(render);
    scopeCtx.fillStyle = '#060906';
    scopeCtx.fillRect(0, 0, scopeCanvas.width, scopeCanvas.height);

    scopeCtx.lineWidth = 1.5;
    scopeCtx.strokeStyle = '#dfc272';
    scopeCtx.beginPath();

    if (isPlaying && analyserNode) {
        var len = analyserNode.frequencyBinCount;
        var data = new Uint8Array(len);
        analyserNode.getByteTimeDomainData(data);
        var slice = scopeCanvas.width / len;
        var x = 0;
        for (var i = 0; i < len; i++) {
            var v = data[i] / 128.0;
            var y = (v * scopeCanvas.height) / 2;
            if (i === 0) scopeCtx.moveTo(x, y);
            else scopeCtx.lineTo(x, y);
            x += slice;
        }
    } else {
        scopeCtx.moveTo(0, scopeCanvas.height / 2);
        scopeCtx.lineTo(scopeCanvas.width, scopeCanvas.height / 2);
    }
    scopeCtx.stroke();
}
render();
