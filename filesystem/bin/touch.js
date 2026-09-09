export default async function(args, term, fs) {
    if (!args[0]) {
        term.print('touch: missing operand', true);
        return;
    }
    var path = fs.resolve(term.pwd, args[0]);
    try {
        await fs.write(path, '');
    } catch (e) {
        term.print('touch: ' + e.message, true);
    }
}
