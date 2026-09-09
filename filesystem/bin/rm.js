export default async function(args, term, fs) {
    if (!args[0]) {
        term.print('rm: missing operand', true);
        return;
    }
    var path = fs.resolve(term.pwd, args[0]);
    try {
        await fs.remove(path);
    } catch (e) {
        term.print('rm: ' + e.message, true);
    }
}
