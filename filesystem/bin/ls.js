export default async function(args, term, fs) {
    var target = args[0] ? fs.resolve(term.pwd, args[0]) : term.pwd;
    try {
        var items = await fs.list(target);
        if (items.length === 0) {
            term.print('(empty)');
        } else {
            term.print(items.join('   '));
        }
    } catch (e) {
        term.print('ls: cannot access \'' + args[0] + '\': No such file or directory', true);
    }
}
