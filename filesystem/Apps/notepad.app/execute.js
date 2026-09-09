var curFile = null;
var isModified = false;

var editor = document.getElementById('np-editor');
var statusPath = document.getElementById('np-status-path');
var statusMod = document.getElementById('np-status-mod');

var btnNew = document.getElementById('np-btn-new');
var btnOpen = document.getElementById('np-btn-open');
var btnSave = document.getElementById('np-btn-save');
var btnSaveAs = document.getElementById('np-btn-saveas');

function setModified(val) {
  isModified = val;
  statusMod.textContent = val ? '● Modified' : 'Saved';
  statusMod.style.color = val ? '#e0a948' : '#72ad61';
}

function setFilePath(p) {
  curFile = p;
  statusPath.textContent = p ? p : '[Untitled]';
}

editor.addEventListener('input', function() {
  setModified(true);
});

async function saveToFile(path) {
  try {
    await Kernel.fs.write(path, editor.value);
    setFilePath(path);
    setModified(false);
    if (path.startsWith('/home/guest/Desktop')) {
      Kernel.desktop.render();
    }
  } catch (err) {
    alert('Save error: ' + err.message);
  }
}

function triggerSaveDialog() {
  Kernel.wm.open('win-explorer');
  var defaultName = curFile ? curFile.split('/').pop() : 'document.txt';
  var initialDir = curFile ? curFile : '/home/guest/Desktop';

  if (window.Explorer && typeof window.Explorer.openPicker === 'function') {
    window.Explorer.openPicker('save', initialDir, defaultName, function(chosenPath) {
      saveToFile(chosenPath);
    });
  }
}

btnNew.addEventListener('click', function() {
  if (isModified && !confirm('Discard unsaved changes?')) return;
  editor.value = '';
  setFilePath(null);
  setModified(false);
});

btnOpen.addEventListener('click', function() {
  Kernel.wm.open('win-explorer');
  var initialDir = curFile ? curFile : '/home/guest/Desktop';

  if (window.Explorer && typeof window.Explorer.openPicker === 'function') {
    window.Explorer.openPicker('open', initialDir, '', async function(chosenPath) {
      await window.Notepad.loadFile(chosenPath);
    });
  }
});

btnSave.addEventListener('click', function() {
  if (curFile) {
    saveToFile(curFile);
  } else {
    triggerSaveDialog();
  }
});

btnSaveAs.addEventListener('click', function() {
  triggerSaveDialog();
});

window.Notepad = {
  async loadFile(p) {
    try {
      var content = await Kernel.fs.read(p);
      editor.value = content;
      setFilePath(p);
      setModified(false);
    } catch (err) {
      alert('Failed to open: ' + err.message);
    }
  }
};