export default async function(args, term) {
    term.print(
        'UNIX-Like Shell Utilities:\n' +
        '  ls [dir]        List directory contents\n' +
        '  cd [dir]        Change working directory\n' +
        '  pwd             Print current working directory\n' +
        '  cat <file>      Read file contents\n' +
        '  echo [txt]      Output text (supports > file redirection)\n' +
        '  touch <file>    Create file (in /home/guest)\n' +
        '  mkdir <dir>     Create directory (in /home/guest)\n' +
        '  rm <file>       Remove file or directory (in /home/guest)\n' +
        '  whoami          Print current user name\n' +
        '  date            Show system timestamp\n' +
        '  uname -a        System architecture and kernel version\n' +
        '  clear           Wipe terminal screen'
    );
}
