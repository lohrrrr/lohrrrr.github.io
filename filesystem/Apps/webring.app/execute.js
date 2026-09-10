function loadScriptSequential(src) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

loadScriptSequential('https://fabstarotcorner.neocities.org/webring/onionring-variables.js')
  .then(function() {
    return loadScriptSequential('https://fabstarotcorner.neocities.org/webring/onionring-widget.js');
  })
  .catch(function(err) {
    console.error(err);
  });