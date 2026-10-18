/* Old page URLs forward to the section page that replaced them, keeping saved scenarios.
   A forwarding page declares its target on <html>:
     data-redirect="network.html"          the page that replaced it
     data-redirect-hash="layout"           where to land, unless the old link named its own anchor
     data-redirect-rename="stage:row"      query parameters renamed to avoid clashes on the merged page
   Shared by the browser and scripts/redirect.test.mjs. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.ComputeDeskRedirect = api; api.run(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // "stage:row, over:bomover" -> { stage: 'row', over: 'bomover' }
  function parseRename(text) {
    var map = {};
    (text || '').split(',').forEach(function (pair) {
      if (!pair.trim()) return;
      var parts = pair.split(':');
      if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) throw new Error('Bad rename "' + pair.trim() + '"; expected old:new');
      map[parts[0].trim()] = parts[1].trim();
    });
    return map;
  }

  // The new URL for an old one: same parameters (renamed where needed), same anchor if it had one.
  function forward(href, config) {
    var from = new URL(href);
    var to = new URL(config.to, from);
    var rename = config.rename || {};
    from.searchParams.forEach(function (value, key) {
      to.searchParams.append(Object.prototype.hasOwnProperty.call(rename, key) ? rename[key] : key, value);
    });
    to.hash = from.hash || (config.hash ? '#' + config.hash : '');
    return to.href;
  }

  function run() {
    var data = document.documentElement.dataset;
    if (!data.redirect) return;
    location.replace(forward(location.href, { to: data.redirect, hash: data.redirectHash, rename: parseRename(data.redirectRename) }));
  }

  return { parseRename: parseRename, forward: forward, run: run };
});
