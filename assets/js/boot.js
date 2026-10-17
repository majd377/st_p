(function() {
  var BUILD = "20261017-9";
  try {
    document.addEventListener("securitypolicyviolation", function(e) {
      try {
        console.warn("[CSP] blocked:", e.blockedURI, "| directive:", e.violatedDirective);
      } catch (x) {
      }
    });
  } catch (e) {
  }
  try {
    var prev = localStorage.getItem("appBuild");
    if (prev === BUILD) return;
    localStorage.setItem("appBuild", BUILD);
    var jobs = [];
    if (window.caches && caches.keys) jobs.push(caches.keys().then(function(ks) {
      return Promise.all(ks.filter(function(k) {
        return !/-v9$/.test(k);
      }).map(function(k) {
        return caches.delete(k);
      }));
    }));
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) jobs.push(navigator.serviceWorker.getRegistrations().then(function(rs) {
      return Promise.all(rs.map(function(r) {
        var u = r.active && r.active.scriptURL || r.waiting && r.waiting.scriptURL || "";
        return u.indexOf(BUILD) < 0 ? r.unregister() : null;
      }));
    }));
    if (!jobs.length) return;
    Promise.all(jobs).then(function() {
      if (prev && !sessionStorage.getItem("b8")) {
        sessionStorage.setItem("b8", "1");
        location.reload();
      }
    }).catch(function() {
    });
  } catch (e) {
  }
})();
