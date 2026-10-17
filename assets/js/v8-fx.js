(function() {
  "use strict";
  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  var RM = function() {
    return document.body.classList.contains("reduced-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  };
  function hero() {
    var home = document.getElementById("home");
    if (!home || document.getElementById("v7-hero")) return;
    var h = document.createElement("div");
    h.className = "v7-hero";
    h.id = "v7-hero";
    h.innerHTML = "<h2>المنارة الطلابية</h2><p>كل ما تحتاجه لدراستك، بمكان واحد</p>";
    home.insertBefore(h, home.firstChild);
  }
  function reveal() {
    document.querySelectorAll("#home .feature-card").forEach(function(c, i) {
      c.style.setProperty("--i", i);
      c.classList.add("v7-in");
    });
  }
  function progress() {
    var b = document.createElement("div");
    b.id = "v7-progress";
    document.body.appendChild(b);
    function u() {
      var h = document.documentElement, m = h.scrollHeight - h.clientHeight;
      b.style.transform = "scaleX(" + (m > 0 ? Math.min(1, h.scrollTop / m) : 0) + ")";
    }
    addEventListener("scroll", u, { passive: true });
    u();
  }
  function spot() {
    if (!matchMedia("(hover:hover)").matches || !window.PointerEvent) return;
    var d = document.createElement("div");
    d.id = "v8-spot";
    document.body.appendChild(d);
    addEventListener("pointermove", function(e) {
      d.style.opacity = 1;
      d.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
    }, { passive: true });
    document.addEventListener("mouseleave", function() {
      d.style.opacity = 0;
    });
  }
  function bg() {
    var small = innerWidth < 700, s = document.createElement("script");
    s.src = THREE_URL;
    s.async = true;
    s.onload = function() {
      try {
        scene3d(small);
      } catch (e) {
        try {
          console.warn("3D bg off:", e);
        } catch (x) {
        }
      }
    };
    document.head.appendChild(s);
  }
  function scene3d(small) {
    var T = window.THREE, cv = document.createElement("canvas");
    cv.id = "v9-bg";
    document.body.insertBefore(cv, document.body.firstChild);
    var r = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: !small });
    r.setPixelRatio(Math.min(small ? 1.5 : 2, devicePixelRatio || 1));
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(50, 1, 0.1, 80);
    cam.position.z = 11;
    sc.fog = new T.Fog(16183784, 12, 30);
    sc.add(new T.AmbientLight(16777215, 0.75));
    var d1 = new T.DirectionalLight(16773324, 0.9);
    d1.position.set(5, 8, 6);
    sc.add(d1);
    var d2 = new T.DirectionalLight(6982911, 0.35);
    d2.position.set(-6, -3, 4);
    sc.add(d2);
    var G = new T.Group();
    sc.add(G);
    var geos = [new T.IcosahedronGeometry(1, 0), new T.OctahedronGeometry(1, 0), new T.TetrahedronGeometry(1.1, 0), new T.TorusGeometry(0.8, 0.22, 10, 24), new T.DodecahedronGeometry(0.9, 0)];
    var cols = [13935162, 15784864, 2307679, 4878261, 12945948], N = small ? 14 : 26, items = [], i;
    for (i = 0; i < N; i++) {
      var g = geos[i % geos.length], c = cols[(i * 3 + 1) % cols.length];
      var m = new T.Mesh(g, new T.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.35, flatShading: true, transparent: true, opacity: 0.62 }));
      var e = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: 13935162, transparent: true, opacity: 0.55 }));
      m.add(e);
      var sc1 = 0.35 + Math.random() * 0.9;
      m.scale.setScalar(sc1);
      m.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, -2 - Math.random() * 14);
      m.userData = { rx: (Math.random() - 0.5) * 0.012, ry: (Math.random() - 0.5) * 0.012, ph: Math.random() * 6.28, sp: 0.2 + Math.random() * 0.4, y0: m.position.y };
      G.add(m);
      items.push(m);
    }
    function size() {
      var w = innerWidth, h = innerHeight;
      r.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    size();
    addEventListener("resize", size);
    var mx = 0, my = 0, sy = 0, cx = 0, cy = 0;
    addEventListener("pointermove", function(e2) {
      mx = e2.clientX / innerWidth - 0.5;
      my = e2.clientY / innerHeight - 0.5;
    }, { passive: true });
    addEventListener("scroll", function() {
      sy = window.pageYOffset || 0;
    }, { passive: true });
    var dark = function() {
      return document.documentElement.getAttribute("data-theme") === "dark";
    };
    var t0 = performance.now(), alive = true, last = dark();
    function frame(now) {
      if (!alive) return;
      requestAnimationFrame(frame);
      if (document.hidden) return;
      try {
        var t = (now - t0) / 1e3, rm = RM();
        if (dark() !== last) {
          last = dark();
          sc.fog.color.setHex(last ? 1315344 : 16183784);
        }
        cx += ((rm ? 0 : mx * 2.2) - cx) * 0.04;
        cy += ((rm ? 0 : -my * 1.4) - cy) * 0.04;
        cam.position.x = cx;
        cam.position.y = cy - sy * 16e-4;
        cam.lookAt(0, -sy * 16e-4, 0);
        if (!rm) for (var k = 0; k < items.length; k++) {
          var o = items[k], u = o.userData;
          o.rotation.x += u.rx;
          o.rotation.y += u.ry;
          o.position.y = u.y0 + Math.sin(t * u.sp + u.ph) * 0.6;
        }
        r.render(sc, cam);
      } catch (e2) {
        alive = false;
        cv.style.display = "none";
      }
    }
    requestAnimationFrame(frame);
    var old = document.getElementById("v7-dust");
    if (old) old.style.display = "none";
  }
  function dust() {
    var cv = document.createElement("canvas");
    cv.id = "v7-dust";
    document.body.insertBefore(cv, document.body.firstChild);
    var x = cv.getContext("2d"), W, H, P = [], dpr = Math.min(2, devicePixelRatio || 1);
    function rs() {
      W = cv.width = innerWidth * dpr;
      H = cv.height = innerHeight * dpr;
    }
    rs();
    addEventListener("resize", rs);
    var n = innerWidth < 640 ? 20 : 36;
    for (var i = 0; i < n; i++) P.push({ x: Math.random(), y: Math.random(), z: Math.random() * 0.9 + 0.1, p: Math.random() * 6 });
    (function f() {
      requestAnimationFrame(f);
      if (document.hidden || RM() || cv.style.display === "none") return;
      x.clearRect(0, 0, W, H);
      x.fillStyle = "#b97f1d";
      for (var i2 = 0; i2 < P.length; i2++) {
        var p = P[i2];
        p.y -= p.z * 4e-4;
        p.p += 0.01;
        if (p.y < -0.02) {
          p.y = 1.02;
          p.x = Math.random();
        }
        x.globalAlpha = 0.15 + 0.35 * p.z;
        x.beginPath();
        x.arc((p.x + Math.sin(p.p) * 0.01) * W, p.y * H, (1 + p.z * 2) * dpr, 0, 6.283);
        x.fill();
      }
    })();
  }
  function init() {
    hero();
    reveal();
    progress();
    spot();
    dust();
    bg();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
