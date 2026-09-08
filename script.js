var audioCtx = null;
var scriptNode = null;
var gainNode = null;
var analyserNode = null;
var isPlaying = false;
var t = 0;
var sampleRate = 8000;
var maxZ = 100;

var playBtn = document.getElementById('btn-play');
var stopBtn = document.getElementById('btn-stop');
var scopeCanvas = document.getElementById('scope');
var scopeCtx = scopeCanvas.getContext('2d');
var clockEl = document.getElementById('clock');

function initAudio() {
    if (!audioCtx) {
        var AudioClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function startBytebeat() {
    initAudio();
    if (isPlaying) return;

    var bufferSize = 2048;
    scriptNode = audioCtx.createScriptProcessor(bufferSize, 1, 1);
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.4;

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;

    var step = sampleRate / audioCtx.sampleRate;

    scriptNode.onaudioprocess = function(e) {
        var out = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < out.length; i++) {
            var it = Math.floor(t);
            var val = (((it * (it >> 30 | it >> 13) / 2)) >> (it * (it >> 50 | it >> 10) & 7 ^ it >> 7 | it >> 82)) | (it >> 4 | it >> 4) >> (it & (it / 6 | 0));
            out[i] = ((val & 255) - 128) / 128;
            t += step;
        }
    };

    scriptNode.connect(gainNode);
    gainNode.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    isPlaying = true;
    playBtn.textContent = 'RUNNING...';
    playBtn.style.color = '#a9e38d';
}

function stopBytebeat() {
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

playBtn.addEventListener('click', function() {
    startBytebeat();
});

stopBtn.addEventListener('click', function() {
    stopBytebeat();
});

function renderScope() {
    requestAnimationFrame(renderScope);
    scopeCtx.fillStyle = '#060906';
    scopeCtx.fillRect(0, 0, scopeCanvas.width, scopeCanvas.height);

    scopeCtx.lineWidth = 1;
    scopeCtx.strokeStyle = '#22301c';
    scopeCtx.beginPath();
    scopeCtx.moveTo(0, scopeCanvas.height / 2);
    scopeCtx.lineTo(scopeCanvas.width, scopeCanvas.height / 2);
    scopeCtx.stroke();

    scopeCtx.lineWidth = 1.5;
    scopeCtx.strokeStyle = '#dfc272';
    scopeCtx.beginPath();

    if (isPlaying && analyserNode) {
        var bufferLength = analyserNode.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(dataArray);

        var sliceWidth = scopeCanvas.width / bufferLength;
        var x = 0;
        for (var i = 0; i < bufferLength; i++) {
            var v = dataArray[i] / 128.0;
            var y = (v * scopeCanvas.height) / 2;
            if (i === 0) {
                scopeCtx.moveTo(x, y);
            } else {
                scopeCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
    } else {
        scopeCtx.moveTo(0, scopeCanvas.height / 2);
        scopeCtx.lineTo(scopeCanvas.width, scopeCanvas.height / 2);
    }
    scopeCtx.stroke();
}
renderScope();

function updateClock() {
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    var ss = String(d.getSeconds()).padStart(2, '0');
    clockEl.textContent = hh + ':' + mm + ':' + ss;
}
setInterval(updateClock, 1000);
updateClock();

var windows = document.querySelectorAll('.window');
var taskButtons = document.querySelectorAll('.task-btn');

function bringToFront(win) {
    maxZ++;
    win.style.zIndex = maxZ;
    windows.forEach(function(w) {
        w.classList.remove('active-win');
    });
    win.classList.add('active-win');

    taskButtons.forEach(function(btn) {
        if (btn.getAttribute('data-target') === win.id) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

windows.forEach(function(win) {
    win.addEventListener('mousedown', function() {
        bringToFront(win);
    });

    var header = win.querySelector('.window-header');
    var isDragging = false;
    var startX, startY, initX, initY;

    header.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('win-btn')) return;
        if (window.innerWidth <= 980) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initX = win.offsetLeft;
        initY = win.offsetTop;
        bringToFront(win);

        function onMouseMove(moveEv) {
            if (!isDragging) return;
            var dx = moveEv.clientX - startX;
            var dy = moveEv.clientY - startY;
            win.style.left = Math.max(0, initX + dx) + 'px';
            win.style.top = Math.max(0, initY + dy) + 'px';
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
});

document.querySelectorAll('.win-close').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var targetId = btn.getAttribute('data-target');
        var targetWin = document.getElementById(targetId);
        if (targetWin) targetWin.style.display = 'none';

        var taskBtn = document.querySelector('.task-btn[data-target="' + targetId + '"]');
        if (taskBtn) taskBtn.classList.remove('active');
    });
});

document.querySelectorAll('.win-min').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var targetId = btn.getAttribute('data-target');
        var targetWin = document.getElementById(targetId);
        if (targetWin) targetWin.style.display = 'none';

        var taskBtn = document.querySelector('.task-btn[data-target="' + targetId + '"]');
        if (taskBtn) taskBtn.classList.remove('active');
    });
});

document.querySelectorAll('.win-max').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var targetId = btn.getAttribute('data-target');
        var targetWin = document.getElementById(targetId);
        if (!targetWin) return;

        if (targetWin.getAttribute('data-maximized') === 'true') {
            targetWin.style.width = targetWin.getAttribute('data-prev-w');
            targetWin.style.height = targetWin.getAttribute('data-prev-h');
            targetWin.style.left = targetWin.getAttribute('data-prev-x');
            targetWin.style.top = targetWin.getAttribute('data-prev-y');
            targetWin.removeAttribute('data-maximized');
        } else {
            targetWin.setAttribute('data-prev-w', targetWin.style.width);
            targetWin.setAttribute('data-prev-h', targetWin.style.height || 'auto');
            targetWin.setAttribute('data-prev-x', targetWin.style.left);
            targetWin.setAttribute('data-prev-y', targetWin.style.top);
            targetWin.style.left = '0px';
            targetWin.style.top = '0px';
            targetWin.style.width = '100vw';
            targetWin.style.height = 'calc(100vh - 30px)';
            targetWin.setAttribute('data-maximized', 'true');
        }
    });
});

taskButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
        var targetId = btn.getAttribute('data-target');
        var targetWin = document.getElementById(targetId);
        if (!targetWin) return;

        if (targetWin.style.display === 'none') {
            targetWin.style.display = 'flex';
            bringToFront(targetWin);
        } else if (targetWin.classList.contains('active-win')) {
            targetWin.style.display = 'none';
            btn.classList.remove('active');
        } else {
            bringToFront(targetWin);
        }
    });
});

document.getElementById('start-btn').addEventListener('click', function() {
    windows.forEach(function(win) {
        win.style.display = 'flex';
    });
    taskButtons.forEach(function(btn) {
        btn.classList.add('active');
    });
    if (windows.length > 0) bringToFront(windows[0]);
});
