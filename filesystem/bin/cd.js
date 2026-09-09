export default async function(args, term, fs) {
    var target = args[0] ? fs.resolve(term.pwd, args[0]) : '/home/guest';
    try {
        var items = await fs.list(target);
        term.pwd = target;
    } catch (e) {
        term.print('cd: ' + args[0] + ': No such file or directory', true);
    }
}
