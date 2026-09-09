var container = document.getElementById('app-term-container');
if (container && container.parentElement) {
    container.parentElement.style.backgroundColor = '#020402';
    container.parentElement.style.padding = '0';
}

var input = document.getElementById('app-term-input');
var output = document.getElementById('app-term-output');
var prompt = document.getElementById('app-term-prompt');
var curDir = '/home/guest';

function scrollToBottom() {
    requestAnimationFrame(function() {
        container.scrollTop = container.scrollHeight;
        var winScroll = container.closest('.window-content');
        if (winScroll) {
            winScroll.scrollTop = winScroll.scrollHeight;
        }
        input.scrollIntoView({ block: 'nearest' });
    });
}

function getPromptPath(p) {
    if (p === '/home/guest') return '~';
    if (p.startsWith('/home/guest/')) return '~' + p.substring(11);
    return p;
}

function updatePrompt() {
    prompt.textContent = 'guest@masterpos:' + getPromptPath(curDir) + '$';
}

var termContext = {
    get pwd() {
        return curDir;
    },
    set pwd(val) {
        curDir = val;
        updatePrompt();
    },
    print(text, isErr) {
        var d = document.createElement('div');
        d.className = isErr ? 'term-err' : 'term-result';
        d.textContent = text;
        output.appendChild(d);
        scrollToBottom();
    },
    clear() {
        output.innerHTML = '';
        scrollToBottom();
    }
};

input.addEventListener('keydown', async function(e) {
    if (e.key === 'Enter') {
        var raw = input.value;
        input.value = '';
        var trimmed = raw.trim();
        if (!trimmed) return;

        var entry = document.createElement('div');
        entry.className = 'term-entry';
        entry.innerHTML = '<span style="color:#79ad68;font-weight:bold;">guest@masterpos:' + getPromptPath(curDir) + '$</span> <span class="term-cmd-echo">' + raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
        output.appendChild(entry);
        scrollToBottom();

        var parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].startsWith('"') && parts[i].endsWith('"')) {
                parts[i] = parts[i].slice(1, -1);
            }
        }

        var cmd = parts[0];
        var args = parts.slice(1);

        await Kernel.shell.run(cmd, args, termContext);
        scrollToBottom();
    }
});

container.addEventListener('click', function() {
    input.focus();
});

updatePrompt();
