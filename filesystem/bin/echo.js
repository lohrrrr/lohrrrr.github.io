export default async function(args, term, fs) {
    var raw = args.join(' ');
    var redirectIdx = raw.indexOf('>');

    if (redirectIdx !== -1) {
        var content = raw.substring(0, redirectIdx).trim();
        var dest = raw.substring(redirectIdx + 1).trim();
        var path = fs.resolve(term.pwd, dest);
        try {
            await fs.write(path, content);
        } catch (e) {
            term.print('bash: ' + e.message, true);
        }
    } else {
        term.print(raw);
    }
}
