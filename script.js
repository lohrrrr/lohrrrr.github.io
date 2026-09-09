window.Kernel = {
    maxZ: 100,
    apps: {},
    windows: {},
    runningProcesses: {},

    fs: {
        manifest: null,

        async init() {
            try {
                var res = await fetch('./filesystem/manifest.json');
                if (res.ok) {
                    this.manifest = await res.json();
                } else {
                    this.manifest = this.fallbackManifest();
                }
            } catch (e) {
                this.manifest = this.fallbackManifest();
            }
        },

        fallbackManifest() {
            return {
                directories: [
                    "/", "/bin", "/etc", "/sys", "/home", "/home/lohrrrr", "/home/guest", "/filesystem/Apps"
                ],
                files: {
                    "/etc/hostname": "masterpos-terminal-01",
                    "/etc/os-release": "NAME=\"MasterPOS Gold\"\nVERSION=\"2.40.8000\"\nKERNEL=\"GITHUB_CICD_BUILD-LATEST\"\nARCH=\"Indie-Static-x86_64\"",
                    "/etc/motd": "MasterPOS Modular Core v2.40\nPrivilege: RESTRICTED (guest)\nNotice: system paths are mounted READ-ONLY.",
                    "/sys/kernel": "Hybrid UNIX Micro-Engine v2.40",
                    "/sys/version": "2.40.8000.gold"
                }
            };
        },

        isReadOnly(path) {
            var norm = this.resolve(path);
            return !norm.startsWith('/home/guest');
        },

        resolve(baseOrPath, relPath) {
            var target = relPath !== undefined ? relPath : baseOrPath;
            var base = relPath !== undefined ? baseOrPath : '/home/guest';
            if (!target || target === '~') return '/home/guest';

            var parts;
            if (target.startsWith('/')) {
                parts = target.split('/');
            } else {
                parts = (base === '/' ? '' : base).split('/').concat(target.split('/'));
            }

            var resolved = [];
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                if (!p || p === '.') continue;
                if (p === '..') {
                    if (resolved.length > 0) resolved.pop();
                } else {
                    resolved.push(p);
                }
            }
            return '/' + resolved.join('/');
        },

        getGuestStorage() {
            var raw = localStorage.getItem('masterpos_guest_vfs');
            if (!raw) {
                var initial = {
                    dirs: [],
                    files: {
                        "welcome.txt": "Welcome guest!\nYou have full read/write access here in /home/guest.\nAll changes persist in browser localStorage."
                    }
                };
                localStorage.setItem('masterpos_guest_vfs', JSON.stringify(initial));
                return initial;
            }
            try {
                return JSON.parse(raw);
            } catch (e) {
                return { dirs: [], files: {} };
            }
        },

        saveGuestStorage(fsData) {
            localStorage.setItem('masterpos_guest_vfs', JSON.stringify(fsData));
        },

        async read(path) {
            var norm = this.resolve(path);

            if (norm.startsWith('/home/guest/')) {
                var rel = norm.substring('/home/guest/'.length);
                var gfs = this.getGuestStorage();
                if (gfs.files[rel] !== undefined) {
                    return gfs.files[rel];
                }
                throw new Error('No such file: ' + norm);
            }

            if (this.manifest && this.manifest.files && this.manifest.files[norm] !== undefined) {
                if (this.manifest.files[norm] !== "FILE_EXISTS") {
                    return this.manifest.files[norm];
                }
            }

            var fetchPath = norm.startsWith('/filesystem/') ? '.' + norm : './filesystem' + norm;
            try {
                var res = await fetch(fetchPath);
                if (res.ok) {
                    return await res.text();
                }
            } catch (e) {}

            throw new Error('No such file or directory: ' + norm);
        },

        async write(path, content) {
            var norm = this.resolve(path);
            if (this.isReadOnly(norm)) {
                throw new Error('Permission denied: ' + norm + ' is read-only');
            }

            var rel = norm.substring('/home/guest/'.length);
            var gfs = this.getGuestStorage();
            gfs.files[rel] = content;
            this.saveGuestStorage(gfs);
        },

        async remove(path) {
            var norm = this.resolve(path);
            if (this.isReadOnly(norm)) {
                throw new Error('Permission denied: cannot remove ' + norm + ' (read-only file system)');
            }

            var rel = norm.substring('/home/guest/'.length);
            var gfs = this.getGuestStorage();
            if (gfs.files[rel] !== undefined) {
                delete gfs.files[rel];
                this.saveGuestStorage(gfs);
                return;
            }

            var dirIndex = gfs.dirs.indexOf(rel);
            if (dirIndex !== -1) {
                gfs.dirs.splice(dirIndex, 1);
                this.saveGuestStorage(gfs);
                return;
            }

            throw new Error('No such file or directory: ' + norm);
        },

        async mkdir(path) {
            var norm = this.resolve(path);
            if (this.isReadOnly(norm)) {
                throw new Error('Permission denied: cannot create directory in ' + norm);
            }

            var rel = norm.substring('/home/guest/'.length).replace(/\/$/, '');
            var gfs = this.getGuestStorage();
            if (gfs.dirs.indexOf(rel) === -1) {
                gfs.dirs.push(rel);
                this.saveGuestStorage(gfs);
            }
        },

        async list(path) {
            var norm = this.resolve(path);
            var results = [];

            if (this.manifest) {
                var prefix = norm === '/' ? '/' : norm + '/';
                var dirs = this.manifest.directories || [];
                for (var i = 0; i < dirs.length; i++) {
                    var d = dirs[i];
                    if (d !== norm && d.startsWith(prefix)) {
                        var sub = d.substring(prefix.length).split('/')[0];
                        if (sub && results.indexOf(sub + '/') === -1) {
                            results.push(sub + '/');
                        }
                    }
                }

                var files = Object.keys(this.manifest.files || {});
                for (var f = 0; f < files.length; f++) {
                    var fl = files[f];
                    if (fl.startsWith(prefix)) {
                        var subf = fl.substring(prefix.length);
                        if (subf.indexOf('/') === -1 && results.indexOf(subf) === -1) {
                            results.push(subf);
                        }
                    }
                }
            }

            if (norm === '/home/guest' || norm.startsWith('/home/guest/')) {
                var subDir = norm === '/home/guest' ? '' : norm.substring('/home/guest/'.length).replace(/\/$/, '');
                var gfs = this.getGuestStorage();

                gfs.dirs.forEach(function(d) {
                    if (!subDir) {
                        var top = d.split('/')[0];
                        if (results.indexOf(top + '/') === -1) results.push(top + '/');
                    } else if (d.startsWith(subDir + '/')) {
                        var rest = d.substring(subDir.length + 1).split('/')[0];
                        if (results.indexOf(rest + '/') === -1) results.push(rest + '/');
                    }
                });

                Object.keys(gfs.files).forEach(function(fl) {
                    if (!subDir) {
                        if (fl.indexOf('/') === -1 && results.indexOf(fl) === -1) results.push(fl);
                    } else if (fl.startsWith(subDir + '/')) {
                        var restf = fl.substring(subDir.length + 1);
                        if (restf.indexOf('/') === -1 && results.indexOf(restf) === -1) results.push(restf);
                    }
                });
            }

            return results;
        }
    },

    wm: {
        createWindow(meta, contentHtml) {
            var win = document.createElement('div');
            win.className = 'window';
            win.id = 'win-' + meta.id;
            win.style.width = meta.width || '480px';
            win.style.height = meta.height || 'auto';
            win.style.top = meta.top || '40px';
            win.style.left = meta.left || '40px';
            win.style.display = meta.defaultOpen === 'true' ? 'flex' : 'none';

            if (meta.resizable === 'true') {
                win.classList.add('resizable');
            }

            win.innerHTML =
            '<div class="window-header">' +
            '<div class="window-title">' +
            '<span class="win-icon">' + (meta.icon || '⚡') + '</span> ' + meta.title +
            '</div>' +
            '<div class="window-controls">' +
            '<button class="win-btn win-min" data-target="' + win.id + '">_</button>' +
            '<button class="win-btn win-max" data-target="' + win.id + '">□</button>' +
            '<button class="win-btn win-close" data-target="' + win.id + '">✕</button>' +
            '</div>' +
            '</div>' +
            '<div class="window-content" id="content-' + meta.id + '">' +
            contentHtml +
            '</div>';

            document.getElementById('window-space').appendChild(win);
            this.attachEvents(win);
            this.createTaskButton(meta, win);

            if (meta.defaultOpen === 'true') {
                this.bringToFront(win);
            }

            return win;
        },

        attachEvents(win) {
            var self = this;
            win.addEventListener('mousedown', function() {
                self.bringToFront(win);
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
                self.bringToFront(win);

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

            win.querySelector('.win-close').addEventListener('click', function(e) {
                e.stopPropagation();
                win.style.display = 'none';
                var tBtn = document.querySelector('.task-btn[data-target="' + win.id + '"]');
                if (tBtn) {
                    tBtn.style.display = 'none';
                    tBtn.classList.remove('active');
                }
            });

            win.querySelector('.win-min').addEventListener('click', function(e) {
                e.stopPropagation();
                win.style.display = 'none';
                var tBtn = document.querySelector('.task-btn[data-target="' + win.id + '"]');
                if (tBtn) tBtn.classList.remove('active');
            });

                win.querySelector('.win-max').addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (win.getAttribute('data-maximized') === 'true') {
                        win.style.width = win.getAttribute('data-prev-w');
                        win.style.height = win.getAttribute('data-prev-h');
                        win.style.left = win.getAttribute('data-prev-x');
                        win.style.top = win.getAttribute('data-prev-y');
                        win.removeAttribute('data-maximized');
                    } else {
                        win.setAttribute('data-prev-w', win.style.width);
                        win.setAttribute('data-prev-h', win.style.height || 'auto');
                        win.setAttribute('data-prev-x', win.style.left);
                        win.setAttribute('data-prev-y', win.style.top);
                        win.style.left = '0px';
                        win.style.top = '0px';
                        win.style.width = '100vw';
                        win.style.height = 'calc(100vh - 30px)';
                        win.setAttribute('data-maximized', 'true');
                    }
                });
        },

        createTaskButton(meta, win) {
            var self = this;
            var btn = document.createElement('button');
            btn.className = 'task-btn' + (meta.defaultOpen === 'true' ? ' active' : '');
            btn.setAttribute('data-target', win.id);
            btn.style.display = meta.defaultOpen === 'true' ? 'flex' : 'none';
            btn.innerHTML = '<span class="win-icon">' + (meta.icon || '⚡') + '</span> ' + meta.title.split(' ')[0];

            btn.addEventListener('click', function() {
                if (win.style.display === 'none') {
                    win.style.display = 'flex';
                    self.bringToFront(win);
                } else if (win.classList.contains('active-win')) {
                    win.style.display = 'none';
                    btn.classList.remove('active');
                } else {
                    self.bringToFront(win);
                }
            });

            document.getElementById('task-buttons').appendChild(btn);
        },

        bringToFront(win) {
            Kernel.maxZ++;
            win.style.zIndex = Kernel.maxZ;
            document.querySelectorAll('.window').forEach(function(w) {
                w.classList.remove('active-win');
            });
            win.classList.add('active-win');

            document.querySelectorAll('.task-btn').forEach(function(b) {
                if (b.getAttribute('data-target') === win.id) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
        },

        open(winId) {
            var win = document.getElementById(winId);
            if (!win) return;
            win.style.display = 'flex';
            var tBtn = document.querySelector('.task-btn[data-target="' + winId + '"]');
            if (tBtn) {
                tBtn.style.display = 'flex';
            }
            this.bringToFront(win);
        }
    },

    loader: {
        async loadApp(appFolder) {
            var basePath = './filesystem/Apps/' + appFolder;
            var appId = appFolder.replace('.app', '');

            try {
                var metaRes = await fetch(basePath + '/icon_taskbar.html');
                var metaHtml = await metaRes.text();
                var tempMeta = document.createElement('div');
                tempMeta.innerHTML = metaHtml;
                var metaEl = tempMeta.firstElementChild || tempMeta;

                var meta = {
                    id: appId,
                    folder: appFolder,
                    title: metaEl.getAttribute('data-title') || appId,
                    icon: metaEl.getAttribute('data-icon') || '⚡',
                    width: metaEl.getAttribute('data-width') || '480px',
                    height: metaEl.getAttribute('data-height') || 'auto',
                    top: metaEl.getAttribute('data-top') || '40px',
                    left: metaEl.getAttribute('data-left') || '40px',
                    defaultOpen: metaEl.getAttribute('data-default-open') || 'false',
                        desc: metaEl.getAttribute('data-desc') || ''
                };

                var contentRes = await fetch(basePath + '/index.html');
                var contentHtml = await contentRes.text();

                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = basePath + '/custom.css';
                document.head.appendChild(link);

                var win = Kernel.wm.createWindow(meta, contentHtml);

                this.createDesktopIcon(meta, win.id);
                this.createStartItem(meta, win.id);

                try {
                    var execScript = document.createElement('script');
                    execScript.type = 'module';
                    execScript.src = basePath + '/execute.js';
                    document.body.appendChild(execScript);
                } catch (e) {}

            } catch (err) {}
        },

        createDesktopIcon(meta, winId) {
            var icon = document.createElement('div');
            icon.className = 'desktop-icon';
            icon.setAttribute('data-target', winId);
            icon.innerHTML =
            '<div class="icon-pic">' + meta.icon + '</div>' +
            '<div class="icon-label">' + meta.title.split(' ')[0] + '</div>';

            icon.addEventListener('click', function(e) {
                e.stopPropagation();
                document.querySelectorAll('.desktop-icon').forEach(function(i) {
                    i.classList.remove('selected');
                });
                icon.classList.add('selected');
                Kernel.wm.open(winId);
            });

            document.getElementById('icon-grid').appendChild(icon);
        },

        createStartItem(meta, winId) {
            var item = document.createElement('div');
            item.className = 'start-item';
            item.innerHTML =
            '<span class="start-item-icon">' + meta.icon + '</span>' +
            '<div class="start-item-details">' +
            '<span class="start-item-title">' + meta.title + '</span>' +
            '<span class="start-item-desc">' + (meta.desc || meta.folder) + '</span>' +
            '</div>';

            item.addEventListener('click', function() {
                Kernel.wm.open(winId);
                document.getElementById('start-menu').style.display = 'none';
                document.getElementById('start-btn').classList.remove('active');
            });

            document.getElementById('start-app-list').appendChild(item);
        }
    },

    shell: {
        async run(cmdName, args, term) {
            var binUrl = './filesystem/bin/' + cmdName + '.js';
            try {
                var mod = await import(binUrl);
                if (mod && mod.default) {
                    await mod.default(args, term, Kernel.fs, Kernel);
                    return;
                }
            } catch (e) {}
            term.print(cmdName + ': command not found. Type \'help\' for available commands.', true);
        }
    },

    async boot() {
        await this.fs.init();

        var appList = [
            'posmaster.app',
            'projects.app',
            'bytebeat.app',
            'blinkies.app',
            'terminal.app',
            'explorer.app'
        ];

        for (var i = 0; i < appList.length; i++) {
            await this.loader.loadApp(appList[i]);
        }

        this.initClock();
        this.initStartMenu();
    },

    initClock() {
        var clockEl = document.getElementById('clock');
        function tick() {
            var d = new Date();
            var hh = String(d.getHours()).padStart(2, '0');
            var mm = String(d.getMinutes()).padStart(2, '0');
            var ss = String(d.getSeconds()).padStart(2, '0');
            clockEl.textContent = hh + ':' + mm + ':' + ss;
        }
        setInterval(tick, 1000);
        tick();
    },

    initStartMenu() {
        var startBtn = document.getElementById('start-btn');
        var startMenu = document.getElementById('start-menu');

        startBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var open = startMenu.style.display === 'flex';
            startMenu.style.display = open ? 'none' : 'flex';
            startBtn.classList.toggle('active', !open);
        });

        document.addEventListener('click', function(e) {
            document.querySelectorAll('.desktop-icon').forEach(function(i) {
                i.classList.remove('selected');
            });
            if (startMenu.style.display === 'flex') {
                if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
                    startMenu.style.display = 'none';
                    startBtn.classList.remove('active');
                }
            }
        });

        document.getElementById('start-term-btn').addEventListener('click', function() {
            Kernel.wm.open('win-terminal');
            startMenu.style.display = 'none';
            startBtn.classList.remove('active');
        });

        document.getElementById('start-shutdown-btn').addEventListener('click', function() {
            if (confirm('Завершить работу терминала MASTERPOS?')) {
                document.body.innerHTML = '<div style="background:#000;color:#dfc272;height:100vh;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:18px;text-align:center;padding:20px;">ТЕПЕРЬ ПИТАНИЕ КОМПЬЮТЕРА МОЖНО ВЫКЛЮЧИТЬ.<br><br><span style="font-size:12px;color:#857b59;"></span></div>';
            }
        });
    }
};

window.addEventListener('DOMContentLoaded', function() {
    Kernel.boot();
});
