var currentPath = '/home/guest/Desktop';
var pathHistory = [];

var root = document.getElementById('exp-root') || document.querySelector('.explorer-wrapper');
var grid = document.getElementById('exp-grid');
var addressInput = document.getElementById('exp-address');
var btnBack = document.getElementById('exp-btn-back');
var btnUp = document.getElementById('exp-btn-up');
var btnRefresh = document.getElementById('exp-btn-refresh');
var btnGo = document.getElementById('exp-btn-go');
var statusCount = document.getElementById('exp-status-count');
var statusPerm = document.getElementById('exp-status-perm');

var viewer = document.getElementById('exp-viewer');
var viewerTitle = document.getElementById('exp-viewer-title');
var viewerBody = document.getElementById('exp-viewer-body');
var viewerClose = document.getElementById('exp-viewer-close');

var pickerBar = document.getElementById('exp-picker-bar');
if (!pickerBar && root) {
  pickerBar = document.createElement('div');
  pickerBar.id = 'exp-picker-bar';
  pickerBar.className = 'exp-picker-bar';
  pickerBar.style.display = 'none';
  pickerBar.innerHTML =
    '<div class="exp-picker-row">' +
      '<span class="exp-picker-label">File name:</span>' +
      '<input type="text" id="exp-picker-name" class="exp-picker-input" spellcheck="false" autocomplete="off">' +
      '<button class="exp-btn" id="exp-picker-action-btn">Save</button>' +
      '<button class="exp-btn" id="exp-picker-cancel-btn">Cancel</button>' +
    '</div>';
  var statusBar = root.querySelector('.exp-statusbar');
  if (statusBar) {
    root.insertBefore(pickerBar, statusBar);
  } else {
    root.appendChild(pickerBar);
  }
}

var pickerName = document.getElementById('exp-picker-name');
var pickerActionBtn = document.getElementById('exp-picker-action-btn');
var pickerCancelBtn = document.getElementById('exp-picker-cancel-btn');

window.Explorer = {
  mode: 'browse',
  callback: null,

  openPicker(mode, startPath, defaultFileName, onComplete) {
    this.mode = mode;
    this.callback = onComplete;

    if (pickerBar) {
      pickerBar.style.display = 'block';
    }
    if (pickerActionBtn) {
      pickerActionBtn.textContent = mode === 'save' ? 'Save' : 'Open';
    }
    if (pickerName) {
      pickerName.value = defaultFileName || '';
    }

    var targetDir = startPath || '/home/guest/Desktop';
    if (!targetDir.endsWith('/') && targetDir.includes('.')) {
      var parts = targetDir.split('/');
      if (pickerName) {
        pickerName.value = parts.pop();
      }
      targetDir = parts.join('/') || '/';
    }

    navigateTo(targetDir, true);
  },

  closePicker() {
    this.mode = 'browse';
    this.callback = null;
    if (pickerBar) {
      pickerBar.style.display = 'none';
    }
  }
};

function getParentPath(p) {
  if (p === '/' || !p) return '/';
  var parts = p.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

function getItemIcon(name, isDir) {
  if (isDir) {
    if (name.endsWith('.app')) return '📦';
    return '📁';
  }
  if (name.endsWith('.js')) return '📜';
  if (name.endsWith('.html')) return '🌐';
  if (name.endsWith('.css')) return '🎨';
  if (name.endsWith('.json')) return '📋';
  if (name.endsWith('.txt') || name.endsWith('.git') || name.endsWith('.md')) return '📄';
  return '📎';
}

async function navigateTo(target, pushHistory) {
  var resolved = Kernel.fs.resolve(target);
  try {
    var items = await Kernel.fs.list(resolved);

    if (pushHistory && currentPath !== resolved) {
      pathHistory.push(currentPath);
    }
    currentPath = resolved;
    if (addressInput) {
      addressInput.value = currentPath;
    }

    renderItems(items);

    var isRo = Kernel.fs.isReadOnly(currentPath);
    if (statusPerm) {
      statusPerm.textContent = isRo ? 'Permissions: Read-Only' : 'Permissions: Read/Write';
      statusPerm.style.color = isRo ? '#bd9b5e' : '#72ad61';
    }

  } catch (err) {
    console.error(err);
    alert('Failed to open directory: ' + target);
  }
}

function renderItems(items) {
  if (!grid) return;
  grid.innerHTML = '';
  if (statusCount) {
    statusCount.textContent = items.length + ' object(s)';
  }

  items.sort(function(a, b) {
    var aDir = a.endsWith('/');
    var bDir = b.endsWith('/');
    if (aDir && !bDir) return -1;
    if (!aDir && bDir) return 1;
    return a.localeCompare(b);
  });

  items.forEach(function(item) {
    var isDir = item.endsWith('/');
    var cleanName = isDir ? item.slice(0, -1) : item;

    var el = document.createElement('div');
    el.className = 'exp-item';
    el.innerHTML =
      '<div class="exp-item-icon">' + getItemIcon(cleanName, isDir) + '</div>' +
      '<div class="exp-item-name">' + cleanName + '</div>';

    el.addEventListener('click', function(e) {
      e.stopPropagation();
      document.querySelectorAll('.exp-item').forEach(function(i) {
        i.classList.remove('selected');
      });
      el.classList.add('selected');

      if (window.Explorer.mode !== 'browse' && !isDir && pickerName) {
        pickerName.value = cleanName;
      }
    });

    el.addEventListener('dblclick', async function(e) {
      e.stopPropagation();
      var targetPath = currentPath === '/' ? '/' + cleanName : currentPath + '/' + cleanName;

      if (isDir) {
        if (cleanName.endsWith('.app')) {
          var appId = cleanName.replace('.app', '');
          Kernel.wm.open('win-' + appId);
        } else {
          navigateTo(targetPath, true);
        }
      } else {
        if (window.Explorer.mode === 'open') {
          if (typeof window.Explorer.callback === 'function') {
            window.Explorer.callback(targetPath);
          }
          window.Explorer.closePicker();
          return;
        }

        if (window.Explorer.mode === 'save') {
          if (pickerName) {
            pickerName.value = cleanName;
          }
          return;
        }

        if (cleanName.endsWith('.txt') || cleanName.endsWith('.md') || cleanName.endsWith('.js') || cleanName.endsWith('.json')) {
          Kernel.openFileInNotepad(targetPath);
        } else {
          try {
            var content = await Kernel.fs.read(targetPath);
            viewerTitle.textContent = cleanName;
            viewerBody.textContent = content;
            viewer.style.display = 'flex';
          } catch (readErr) {
            alert('Unable to open file: ' + cleanName);
          }
        }
      }
    });

    grid.appendChild(el);
  });
}

if (pickerActionBtn) {
  pickerActionBtn.addEventListener('click', function() {
    var fname = pickerName ? pickerName.value.trim() : '';
    if (!fname) return;

    var fullPath = currentPath === '/' ? '/' + fname : currentPath + '/' + fname;
    if (typeof window.Explorer.callback === 'function') {
      window.Explorer.callback(fullPath);
    }
    window.Explorer.closePicker();
  });
}

if (pickerCancelBtn) {
  pickerCancelBtn.addEventListener('click', function() {
    window.Explorer.closePicker();
  });
}

if (btnBack) {
  btnBack.addEventListener('click', function() {
    if (pathHistory.length > 0) {
      var prev = pathHistory.pop();
      navigateTo(prev, false);
    }
  });
}

if (btnUp) {
  btnUp.addEventListener('click', function() {
    var parent = getParentPath(currentPath);
    navigateTo(parent, true);
  });
}

if (btnRefresh) {
  btnRefresh.addEventListener('click', function() {
    navigateTo(currentPath, false);
  });
}

if (btnGo) {
  btnGo.addEventListener('click', function() {
    navigateTo(addressInput.value, true);
  });
}

if (addressInput) {
  addressInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      navigateTo(addressInput.value, true);
    }
  });
}

document.querySelectorAll('.exp-side-link').forEach(function(link) {
  link.addEventListener('click', function() {
    var p = link.getAttribute('data-target');
    navigateTo(p, true);
  });
});

if (grid) {
  grid.addEventListener('click', function() {
    document.querySelectorAll('.exp-item').forEach(function(i) {
      i.classList.remove('selected');
    });
  });
}

if (viewerClose) {
  viewerClose.addEventListener('click', function() {
    viewer.style.display = 'none';
  });
}

navigateTo(currentPath, false);