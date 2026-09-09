export default async function(args, term, fs) {
    if (!args[0]) {
        term.print('cat: missing operand', true);
        return;
    }
    var path = fs.resolve(term.pwd, args[0]);
    try {
        var data = await fs.read(path);
        term.print(data);
    } catch (e) {
        term.print('cat: ' + args[0] + ': No such file or directory', true);
    }
}
