export default async function(args, term, fs) {
    if (!args[0]) {
        term.print('mkdir: missing operand', true);
        return;
    }
    var path = fs.resolve(term.pwd, args[0]);
    try {
        await fs.mkdir(path);
    } catch (e) {
        term.print('mkdir: ' + e.message, true);
    }
}
