(function() {
  "use strict";
  var RM = function() {
    return document.body.classList.contains("reduced-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  };
  var ITEMS = [["📝", "الواجبات", "assignments"], ["🎥", "التسجيلات", "recordings"], ["📋", "الاختبارات", "exams"], ["📊", "التقدم بالمنهج", "progress"], ["🌟", "الكتب والرزم", "books-packages"], ["📚", "التلخيصات", "summaries"]];
  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  function hero() {
    var home = document.getElementById("home");
    if (!home || document.getElementById("v7-hero")) return;
    var h = document.createElement("div");
    h.className = "v7-hero";
    h.id = "v7-hero";
    h.innerHTML = '<h2>المنارة الطلابية</h2><p>اسحب لتدوير المنارة، واضغط على أي كتاب لتدخل القسم</p><div class="v8-scene"><canvas></canvas><div class="v8-label">اسحب • اضغط على كتاب</div></div>';
    home.insertBefore(h, home.firstChild);
    var box = h.querySelector(".v8-scene");
    function go() {
      try {
        build(box, home);
      } catch (e) {
        box.style.display = "none";
        try {
          console.warn("3D off:", e);
        } catch (x) {
        }
      }
    }
    if (window.THREE) go();
    else {
      var s = document.createElement("script");
      s.src = THREE_URL;
      s.async = true;
      s.onload = go;
      s.onerror = function() {
        box.style.display = "none";
      };
      document.head.appendChild(s);
    }
  }
  function icon(emoji, c) {
    var k = document.createElement("canvas");
    k.width = 128;
    k.height = 160;
    var x = k.getContext("2d");
    var g = x.createLinearGradient(0, 0, 128, 160);
    g.addColorStop(0, c);
    g.addColorStop(1, "#1d2b4a");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 160);
    x.fillStyle = "rgba(255,255,255,.16)";
    x.fillRect(0, 0, 12, 160);
    x.strokeStyle = "rgba(255,255,255,.5)";
    x.lineWidth = 4;
    x.strokeRect(8, 8, 112, 144);
    x.font = "60px serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#fff";
    x.fillText(emoji, 68, 80);
    return k;
  }
  function build(box, home) {
    var T = window.THREE, cv = box.querySelector("canvas"), lab = box.querySelector(".v8-label");
    var r = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(36, 1, 0.1, 100), G = new T.Group();
    sc.add(G);
    var GOLD = 13935162, CREAM = 16183264, NAVY = 2307679;
    function M(c, o) {
      var p = { color: c, roughness: 0.5, metalness: 0.12 };
      for (var k in o) p[k] = o[k];
      return new T.MeshStandardMaterial(p);
    }
    function add(geo, mat, y2) {
      var m = new T.Mesh(geo, mat);
      m.position.y = y2;
      G.add(m);
      return m;
    }
    add(new T.CylinderGeometry(2.7, 3.5, 0.9, 9), M(6121081, { roughness: 0.95, flatShading: true }), -0.45);
    var y = 0, i;
    for (i = 0; i < 4; i++) {
      var hh = 1.25;
      add(new T.CylinderGeometry(1.15 - (i + 1) * 0.14, 1.15 - i * 0.14, hh, 36), M(i % 2 ? GOLD : CREAM), y + hh / 2);
      y += hh;
    }
    add(new T.CylinderGeometry(0.9, 0.9, 0.12, 36), M(NAVY), y + 0.06);
    add(new T.CylinderGeometry(0.5, 0.5, 0.95, 28), M(16771496, { emissive: 16763213, emissiveIntensity: 0.95, transparent: true, opacity: 0.9 }), y + 0.6);
    add(new T.ConeGeometry(0.7, 0.75, 28), M(NAVY), y + 1.45);
    add(new T.SphereGeometry(0.12, 16, 16), M(GOLD, { metalness: 0.6 }), y + 1.92);
    var LY = y + 0.6, beams = new T.Group();
    beams.position.y = LY;
    G.add(beams);
    var bg = new T.ConeGeometry(1.2, 8, 28, 1, true);
    bg.translate(0, -4, 0);
    bg.rotateZ(Math.PI / 2);
    var bm = new T.MeshBasicMaterial({ color: 16769162, transparent: true, opacity: 0.2, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    var b1 = new T.Mesh(bg, bm), b2 = new T.Mesh(bg, bm);
    b2.rotation.y = Math.PI;
    beams.add(b1);
    beams.add(b2);
    var pl = new T.PointLight(16763213, 1.5, 16);
    pl.position.y = LY;
    G.add(pl);
    sc.add(new T.AmbientLight(16777215, 0.8));
    var dl = new T.DirectionalLight(16774102, 0.95);
    dl.position.set(4, 7, 5);
    sc.add(dl);
    var waves = [];
    for (i = 0; i < 2; i++) {
      var w = new T.Mesh(new T.RingGeometry(3.6, 3.72, 64), new T.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.4, side: T.DoubleSide, depthWrite: false }));
      w.rotation.x = -Math.PI / 2;
      w.position.y = -0.88;
      w.userData.p = i * 0.5;
      G.add(w);
      waves.push(w);
    }
    var N = 110, pos = new Float32Array(N * 3);
    for (i = 0; i < N; i++) {
      var a = Math.random() * 6.283, rr = 3 + Math.random() * 6;
      pos[i * 3] = Math.cos(a) * rr;
      pos[i * 3 + 1] = -0.5 + Math.random() * 8;
      pos[i * 3 + 2] = Math.sin(a) * rr;
    }
    var pg = new T.BufferGeometry();
    pg.setAttribute("position", new T.BufferAttribute(pos, 3));
    var pts = new T.Points(pg, new T.PointsMaterial({ color: GOLD, size: 0.07, transparent: true, opacity: 0.85, depthWrite: false }));
    G.add(pts);
    var COL = ["#c58a1c", "#2a6fb0", "#2f8f6b", "#c0563b", "#6a4fb3", "#1f8a9e"], books = [];
    ITEMS.forEach(function(it, k) {
      var tex = new T.CanvasTexture(icon(it[0], COL[k])), side = M(15853520, { roughness: 0.7 });
      var bk = new T.Mesh(new T.BoxGeometry(0.95, 1.2, 0.24), [side, side, side, side, new T.MeshStandardMaterial({ map: tex, roughness: 0.4 }), side]);
      bk.userData = { go: it[2], name: it[1], a: k * Math.PI / 3, h: 1 + k % 3 * 1.5 };
      G.add(bk);
      books.push(bk);
    });
    var W = 1, H = 1;
    function size() {
      W = box.clientWidth || 300;
      H = box.clientHeight || 260;
      r.setSize(W, H, false);
      cam.aspect = W / H;
      var d = W < 460 ? 17.5 : W < 760 ? 15 : 12.5;
      cam.position.set(0, 3.3, d);
      cam.lookAt(0, 2.7, 0);
      cam.updateProjectionMatrix();
    }
    size();
    addEventListener("resize", size);
    var drag = false, moved = 0, lx = 0, vel = 0, ptr = new T.Vector2(), ray = new T.Raycaster(), hov = null, tiltT = 0;
    function pick(e) {
      var q = cv.getBoundingClientRect();
      ptr.set((e.clientX - q.left) / q.width * 2 - 1, -((e.clientY - q.top) / q.height) * 2 + 1);
      ray.setFromCamera(ptr, cam);
      var hit = ray.intersectObjects(books, false);
      return hit.length ? hit[0].object : null;
    }
    cv.addEventListener("pointerdown", function(e) {
      drag = true;
      moved = 0;
      lx = e.clientX;
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener("pointermove", function(e) {
      if (drag) {
        var dx = e.clientX - lx;
        lx = e.clientX;
        moved += Math.abs(dx);
        vel = dx * 8e-3;
        G.rotation.y += vel;
        return;
      }
      hov = pick(e);
      cv.style.cursor = hov ? "pointer" : "grab";
      lab.textContent = hov ? hov.userData.name : "اسحب • اضغط على كتاب";
      lab.className = "v8-label" + (hov ? " on" : "");
      var q = cv.getBoundingClientRect();
      tiltT = ((e.clientY - q.top) / q.height - 0.5) * 0.18;
    });
    cv.addEventListener("pointerup", function(e) {
      var was = drag;
      drag = false;
      if (was && moved < 6) {
        var o = pick(e);
        if (o && window.showSection) showSection(o.userData.go);
      }
    });
    cv.addEventListener("pointercancel", function() {
      drag = false;
    });
    var vis = true;
    if (window.IntersectionObserver) new IntersectionObserver(function(en) {
      vis = en[0].isIntersecting;
    }).observe(box);
    var t0 = performance.now(), alive = true;
    function frame(now) {
      if (!alive) return;
      requestAnimationFrame(frame);
      if (!vis || document.hidden || !home.classList.contains("active")) return;
      try {
        var t = (now - t0) / 1e3, rm = RM();
        if (!drag) {
          if (Math.abs(vel) > 6e-4) {
            G.rotation.y += vel;
            vel *= 0.94;
          } else if (!rm) G.rotation.y += 35e-4;
        }
        G.rotation.x += (tiltT - G.rotation.x) * 0.06;
        if (!rm) beams.rotation.y = t * 1.1;
        pl.intensity = 1.4 + Math.sin(t * 3) * 0.2;
        books.forEach(function(b, k) {
          var ang = b.userData.a + (rm ? 0 : t * 0.35);
          b.position.set(Math.cos(ang) * 4.7, b.userData.h + Math.sin(t * 1.2 + k) * 0.15, Math.sin(ang) * 4.7);
          b.rotation.y = Math.PI / 2 - ang;
          var s = b === hov ? 1.18 : 1;
          b.scale.x += (s - b.scale.x) * 0.15;
          b.scale.y = b.scale.z = b.scale.x;
        });
        waves.forEach(function(w2) {
          var p = (t * 0.25 + w2.userData.p) % 1;
          w2.scale.setScalar(0.6 + p * 0.9);
          w2.material.opacity = 0.4 * (1 - p);
        });
        pts.rotation.y = t * 0.03;
        r.render(sc, cam);
      } catch (e) {
        alive = false;
        box.style.display = "none";
      }
    }
    requestAnimationFrame(frame);
  }
  function tilt() {
    if (!matchMedia("(hover:hover)").matches) return;
    document.addEventListener("pointermove", function(e) {
      var c = e.target.closest && e.target.closest(".feature-card");
      if (!c || RM()) return;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.classList.add("tilt");
      c.style.setProperty("--ry", ((x - 0.5) * -14).toFixed(1) + "deg");
      c.style.setProperty("--rx", ((y - 0.5) * 12).toFixed(1) + "deg");
      c.style.setProperty("--mx", x * 100 + "%");
      c.style.setProperty("--my", y * 100 + "%");
    }, { passive: true });
    document.addEventListener("pointerout", function(e) {
      var c = e.target.closest && e.target.closest(".feature-card");
      if (c && !c.contains(e.relatedTarget)) {
        c.style.removeProperty("--rx");
        c.style.removeProperty("--ry");
      }
    });
  }
  function reveal() {
    document.querySelectorAll("#home .feature-card").forEach(function(c, i) {
      c.style.setProperty("--i", i);
      c.classList.add("v7-in");
    });
  }
  function dust() {
    var cv = document.createElement("canvas");
    cv.id = "v7-dust";
    document.body.insertBefore(cv, document.body.firstChild);
    var x = cv.getContext("2d"), W, H, P = [], dpr = Math.min(2, devicePixelRatio || 1), mx = 0, my = 0;
    function rs() {
      W = cv.width = innerWidth * dpr;
      H = cv.height = innerHeight * dpr;
    }
    rs();
    addEventListener("resize", rs);
    var N = innerWidth < 640 ? 22 : 42;
    for (var i = 0; i < N; i++) P.push({ x: Math.random(), y: Math.random(), z: Math.random() * 0.9 + 0.1, s: Math.random() * 4e-4 + 8e-5, p: Math.random() * 6 });
    addEventListener("pointermove", function(e) {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
    }, { passive: true });
    function col() {
      return getComputedStyle(document.documentElement).getPropertyValue("--v-gold").trim() || "#b97f1d";
    }
    var c = col();
    setInterval(function() {
      c = col();
    }, 4e3);
    (function f() {
      requestAnimationFrame(f);
      if (document.hidden || RM()) return;
      x.clearRect(0, 0, W, H);
      x.fillStyle = c;
      for (var i2 = 0; i2 < P.length; i2++) {
        var p = P[i2];
        p.y -= p.s * p.z * 16;
        p.p += 0.01;
        if (p.y < -0.02) {
          p.y = 1.02;
          p.x = Math.random();
        }
        var px = (p.x + Math.sin(p.p) * 0.01 - mx * 0.03 * p.z) * W, py = (p.y - my * 0.03 * p.z) * H;
        x.globalAlpha = 0.18 + 0.4 * p.z;
        x.beginPath();
        x.arc(px, py, (1 + p.z * 2.2) * dpr, 0, 6.283);
        x.fill();
      }
    })();
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
    if (!matchMedia("(hover:hover)").matches) return;
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
  function init() {
    if (window.PointerEvent) {
      hero();
      tilt();
      spot();
    }
    reveal();
    dust();
    progress();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
