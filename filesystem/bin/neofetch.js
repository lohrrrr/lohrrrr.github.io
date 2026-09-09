export default async function(args, term) {
    var uptimeSec = Math.floor(performance.now() / 1000);
    var hrs = Math.floor(uptimeSec / 3600);
    var mins = Math.floor((uptimeSec % 3600) / 60);
    var secs = uptimeSec % 60;
    var uptimeStr = hrs + 'h ' + mins + 'm ' + secs + 's';

    var resStr = window.innerWidth + 'x' + window.innerHeight;

    var art = [
        "       /\\         guest@masterpos",
        "      /  \\        ---------------",
        "     / /\\ \\       OS: MasterPOS Unix-Like [x86_64]",
        "    / /  \\ \\      Host: WebBrowser",
        "   /_/ /\\ \\_\\     Kernel: UNIX-Like 2.40.8000.gold",
        "  / / /  \\ \\ \\    Uptime: " + uptimeStr,
        " /_/_/ /\\ \\_\\_\\   Shell: websh 2.40",
        " \\_\\_\\ \\/ /_/_/   Resolution: " + resStr,
        "  \\ \\ \\  / / /    DE: MasterPOS Compositor",
        "   \\_\\ \\/ /_/     Terminal: terminal.app",
        "     \\ \\/ /       CPU: JS JIT / WebAssembly Virtual Engine",
        "      \\  /        Memory: 64MB / 512MB",
        "       \\/         Palette: \u2588\u2588 \u2588\u2588 \u2588\u2588 \u2588\u2588 \u2588\u2588 \u2588\u2588 \u2588\u2588 \u2588\u2588"
    ];

    term.print(art.join('\n'));
}
