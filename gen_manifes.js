const fs = require('fs');
const path = require('path');

const readContent = process.argv.includes('--read-content') || process.argv.includes('--content') || process.argv.includes('-c');
const rootDir = path.join(__dirname, 'filesystem');
const outputFile = path.join(rootDir, 'manifest.json');

const textExtensions = new Set([
    '.js', '.html', '.css', '.json', '.txt', '.md', '.svg', '.xml', '.git', '.sh'
]);

const manifest = {
    directories: [
        "/",
        "/bin",
        "/etc",
        "/sys",
        "/home",
        "/home/lohrrrr",
        "/home/guest"
    ],
    files: {
        "/etc/hostname": "masterpos-terminal-01",
        "/etc/os-release": "NAME=\"MasterPOS Gold\"\nVERSION=\"2.40.8000\"\nKERNEL=\"UNIX-Like\"\nARCH=\"Indie-Static-x86_64\"",
        "/etc/motd": "MasterPOS Modular Core v2.40\nPrivilege: RESTRICTED (guest)\nNotice: system and lohrrrr paths are mounted READ-ONLY.",
        "/sys/kernel": "MasterPOS UNIX-Like Core v2.40",
        "/sys/version": "2.40.8000.gold",
        "/home/lohrrrr/OpenWIKI.git": "Repo: OpenWIKI\nURL: https://github.com/lohrrrr/OpenWIKI",
        "/home/lohrrrr/GybrlScript.git": "Repo: GybrlScript\nURL: https://github.com/lohrrrr/GybrlScript",
        "/home/lohrrrr/TyProxy.git": "Repo: TyProxy\nURL: https://github.com/lohrrrr/TyProxy",
        "/home/lohrrrr/bio.txt": "TBA",
        "/home/lohrrrr/notes.txt": "Sometimes I just wanna be myself.."
    }
};

function crawl(currentDir, vPath) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.name === 'manifest.json' || entry.name.startsWith('.')) continue;

        const fullPath = path.join(currentDir, entry.name);
        const virtualPath = vPath + '/' + entry.name;

        if (entry.isDirectory()) {
            if (!manifest.directories.includes(virtualPath)) {
                manifest.directories.push(virtualPath);
            }
            crawl(fullPath, virtualPath);
        } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (readContent && textExtensions.has(ext)) {
                try {
                    manifest.files[virtualPath] = fs.readFileSync(fullPath, 'utf-8');
                } catch (e) {
                    manifest.files[virtualPath] = "FILE_EXISTS";
                }
            } else {
                manifest.files[virtualPath] = "FILE_EXISTS";
            }
        }
    }
}

crawl(rootDir, '/filesystem');

fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2), 'utf-8');
console.log('Manifest updated: ' + outputFile + (readContent ? ' [inline file contents]' : ' [structure only]'));
