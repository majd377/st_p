/* =====================================================================
   لوحة الإدارة — طبقة الحماية والدخول
   ---------------------------------------------------------------------
   مبدأ العمل:
   1) واجهة الإدارة لا توجد في الـ DOM إطلاقاً قبل التحقق. هي محفوظة داخل
      <template> ولا تُحقن إلا بعد أن يُثبت التحقق أن الحساب مصرّح له.
      إخفاء العناصر بالـ CSS ليس حماية — حذفها من الصفحة هو الحماية.
   2) كل عملية كتابة تتطلب window.ADMIN_VERIFIED === true، وقواعد Firebase
      ترفض أي كتابة من حساب غير مصرّح له كطبقة ثانية على الخادم.
   3) الصلاحية تُراقَب باستمرار: إذا سحبها المالك، تُقفل اللوحة فوراً.
   4) كل محاولة دخول (ناجحة أو مرفوضة) تُسجَّل في loginEvents مع الجهاز والوقت.
   ===================================================================== */
(function () {
  'use strict';

  var OWNER_EMAIL = 'mjdshbyr449@gmail.com';

  // مدة الخمول قبل القفل التلقائي (20 دقيقة)
  var IDLE_LIMIT_MS = 20 * 60 * 1000;
  // الحد الأقصى لعمر الجلسة (8 ساعات) مهما كان النشاط
  var SESSION_LIMIT_MS = 8 * 60 * 60 * 1000;
  // إعادة التحقق من التوكن كل دقيقتين
  var RECHECK_MS = 2 * 60 * 1000;

  var booted = false;
  var authAttempt = 0;
  var shellInjected = false;
  var sessionStartedAt = 0;
  var lastActivityAt = 0;
  var idleTimer = null;
  var recheckTimer = null;
  var permissionRef = null;
  var activityBound = false;

  window.IS_ADMIN = false;
  window.IS_OWNER = false;
  window.ADMIN_VERIFIED = false;
  window.AUTH_USER = null;

  /* ---------------------------------------------------------------
     أدوات مساعدة
     --------------------------------------------------------------- */
  function lower(v) { return String(v || '').trim().toLowerCase(); }

  function escapeHtml(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/`/g, '&#96;');
  }

  function gateMsg(text, isError) {
    var el = document.getElementById('admin-gate-msg');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('gate-error', !!isError);
  }

  function gateBtn(disabled) {
    var btn = document.getElementById('google-admin-btn');
    if (btn) btn.disabled = !!disabled;
  }

  /* ---------------------------------------------------------------
     معلومات الجهاز — تُستخدم في إشعارات الدخول
     --------------------------------------------------------------- */
  function detectDevice() {
    var ua = String(navigator.userAgent || '');
    var browser = 'متصفح غير معروف';
    var os = 'نظام غير معروف';
    var type = 'كمبيوتر';

    if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
    else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/CriOS/i.test(ua)) browser = 'Chrome (iOS)';
    else if (/Chrome\//i.test(ua)) browser = 'Chrome';
    else if (/Safari\//i.test(ua)) browser = 'Safari';

    if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
    else if (/Windows NT/i.test(ua)) os = 'Windows';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPod/i.test(ua)) os = 'iPhone (iOS)';
    else if (/iPad/i.test(ua)) os = 'iPad (iPadOS)';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/CrOS/i.test(ua)) os = 'ChromeOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    if (/iPad|Tablet/i.test(ua)) type = 'جهاز لوحي';
    else if (/Mobi|Android|iPhone|iPod/i.test(ua)) type = 'هاتف';

    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}

    var screenSize = '';
    try { screenSize = (window.screen.width || 0) + '\u00d7' + (window.screen.height || 0); } catch (e) {}

    return {
      browser: browser,
      os: os,
      device: type,
      platform: String(navigator.platform || '').slice(0, 60),
      language: String(navigator.language || '').slice(0, 20),
      timezone: String(tz).slice(0, 60),
      screen: screenSize.slice(0, 20),
      ua: ua.slice(0, 400)
    };
  }

  /* ---------------------------------------------------------------
     تسجيل محاولة الدخول (ناجحة أو مرفوضة)
     --------------------------------------------------------------- */
  function recordLoginEvent(user, allowed, role) {
    try {
      var info = detectDevice();
      var ref = firebase.database().ref('loginEvents/' + user.uid).push();
      return ref.set({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        allowed: !!allowed,
        role: String(role || (allowed ? 'admin' : 'denied')),
        ts: firebase.database.ServerValue.TIMESTAMP,
        browser: info.browser,
        os: info.os,
        device: info.device,
        platform: info.platform,
        language: info.language,
        timezone: info.timezone,
        screen: info.screen,
        ua: info.ua
      }).catch(function (e) { console.warn('login event write failed', e); });
    } catch (e) {
      console.warn('login event error', e);
      return Promise.resolve();
    }
  }

  // دليل الحسابات: يُكتب مرة واحدة ليتمكن المالك من منح الصلاحية لاحقاً
  function writeDirectory(user) {
    var ref = firebase.database().ref('loginDirectory/' + user.uid);
    return ref.once('value').then(function (snap) {
      if (snap.exists()) return null;
      return ref.set({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
    }).catch(function (e) { console.warn('loginDirectory write failed', e); });
  }

  /* ---------------------------------------------------------------
     القفل / الفتح
     --------------------------------------------------------------- */
  function clearTimers() {
    if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }
    if (recheckTimer) { clearInterval(recheckTimer); recheckTimer = null; }
    if (permissionRef) { try { permissionRef.off(); } catch (e) {} permissionRef = null; }
  }

  function removeShell() {
    var root = document.getElementById('admin-root');
    if (root) root.innerHTML = '';
    shellInjected = false;
  }

  function setLocked(message, isError) {
    window.IS_ADMIN = false;
    window.IS_OWNER = false;
    window.ADMIN_VERIFIED = false;
    if (typeof window.disableEditMode === 'function') window.disableEditMode();
    clearTimers();
    removeShell();
    document.body.classList.add('admin-locked');
    document.body.classList.remove('admin-authorized', 'edit-mode', 'owner-mode');
    var gate = document.getElementById('admin-gate');
    if (gate) gate.style.display = 'grid';
    gateBtn(false);
    gateMsg(message || '', isError);
  }

  function injectShell() {
    if (shellInjected) return true;
    var tpl = document.getElementById('admin-shell');
    var root = document.getElementById('admin-root');
    if (!tpl || !root || !tpl.content) {
      console.error('admin shell template missing');
      return false;
    }
    root.appendChild(tpl.content.cloneNode(true));
    shellInjected = true;
    return true;
  }

  function unlock(user, isOwner) {
    window.AUTH_USER = user;
    window.IS_ADMIN = true;
    window.IS_OWNER = !!isOwner;
    window.ADMIN_VERIFIED = true;
    if (typeof window.enableEditMode === 'function') window.enableEditMode();

    if (!injectShell()) {
      window.ADMIN_VERIFIED = false;
      setLocked('تعذر تحميل واجهة الإدارة. حدّث الصفحة.', true);
      return;
    }

    var gate = document.getElementById('admin-gate');
    if (gate) gate.style.display = 'none';

    document.body.classList.remove('admin-locked');
    document.body.classList.add('admin-authorized', 'edit-mode');
    document.body.classList.toggle('owner-mode', !!isOwner);

    document.querySelectorAll('.owner-only-nav').forEach(function (el) { el.style.display = isOwner ? 'flex' : 'none'; });
    document.querySelectorAll('.owner-only-panel').forEach(function (el) { el.style.display = isOwner ? 'block' : 'none'; });
    document.querySelectorAll('.owner-only-control').forEach(function (el) { el.style.display = isOwner ? '' : 'none'; });

    var who = document.getElementById('admin-current-user');
    if (who) who.textContent = (user.displayName || user.email || '') + (isOwner ? ' — المالك' : ' — مشرف');

    sessionStartedAt = Date.now();
    lastActivityAt = Date.now();
    startWatchdogs(user);

    try { if (window.switchBooksPackagesType) window.switchBooksPackagesType('books'); } catch (e) {}
    try { if (window.render) window.render(); } catch (e) { console.warn('render failed', e); }
    try { if (window.showSection) window.showSection('home'); } catch (e) {}
    try { if (window.renderAccessLogsBadge) window.renderAccessLogsBadge(); } catch (e) {}
  }

  /* ---------------------------------------------------------------
     مراقبة الجلسة: خمول، عمر أقصى، وسحب الصلاحية لحظياً
     --------------------------------------------------------------- */
  function startWatchdogs(user) {
    if (!activityBound) {
      activityBound = true;
      ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(function (evt) {
        window.addEventListener(evt, function () { lastActivityAt = Date.now(); }, { passive: true });
      });
    }

    idleTimer = setInterval(function () {
      var now = Date.now();
      if (now - lastActivityAt > IDLE_LIMIT_MS) {
        forceSignOut('تم إنهاء الجلسة تلقائياً بسبب عدم النشاط. سجّل الدخول مرة أخرى.');
      } else if (now - sessionStartedAt > SESSION_LIMIT_MS) {
        forceSignOut('انتهت مدة الجلسة. سجّل الدخول مرة أخرى.');
      }
    }, 30 * 1000);

    // مراقبة لحظية لسحب الصلاحية (لغير المالك)
    if (lower(user.email) !== OWNER_EMAIL) {
      try {
        permissionRef = firebase.database().ref('adminUsers/' + user.uid);
        permissionRef.on('value', function (snap) {
          if (!snap.exists()) forceSignOut('تم سحب صلاحية هذا الحساب من لوحة الإدارة.');
        }, function () { /* خطأ قراءة: إعادة التحقق الدورية ستتكفل */ });
      } catch (e) { console.warn('permission watch failed', e); }
    }

    recheckTimer = setInterval(function () {
      var current = firebase.auth().currentUser;
      if (!current || current.uid !== user.uid) {
        forceSignOut('انتهت الجلسة. سجّل الدخول مرة أخرى.');
        return;
      }
      current.getIdToken(true).catch(function () {
        forceSignOut('تعذّر تجديد جلسة الدخول. سجّل الدخول مرة أخرى.');
      });
    }, RECHECK_MS);
  }

  function forceSignOut(message) {
    authAttempt++;
    clearTimers();
    firebase.auth().signOut().catch(function () {}).then(function () {
      setLocked(message || 'تم تسجيل الخروج.', true);
    });
  }

  window.notifyUnauthorized = function () {
    forceSignOut('لم يعد هذا الحساب مصرّحاً له بالتعديل. تم إنهاء الجلسة.');
  };

  /* ---------------------------------------------------------------
     التحقق من الصلاحية
     --------------------------------------------------------------- */
  function isOwnerUser(user) {
    return !!user && !!user.email && lower(user.email) === OWNER_EMAIL && user.emailVerified === true;
  }

  function authorize(user) {
    if (!user) return Promise.resolve({ allowed: false, owner: false, reason: 'no-user' });
    if (user.emailVerified !== true) return Promise.resolve({ allowed: false, owner: false, reason: 'email-not-verified' });
    if (user.isAnonymous) return Promise.resolve({ allowed: false, owner: false, reason: 'anonymous' });

    var providers = (user.providerData || []).map(function (p) { return p && p.providerId; });
    if (providers.indexOf('google.com') === -1) {
      return Promise.resolve({ allowed: false, owner: false, reason: 'provider' });
    }

    // توكن حديث — لا نعتمد على توكن قديم مخزّن
    return user.getIdToken(true).then(function () {
      if (isOwnerUser(user)) return { allowed: true, owner: true, reason: 'owner' };
      return firebase.database().ref('adminUsers/' + user.uid).once('value').then(function (snap) {
        return { allowed: snap.exists(), owner: false, reason: snap.exists() ? 'admin' : 'not-listed' };
      });
    }).catch(function (e) {
      console.warn('authorization check failed', e);
      return { allowed: false, owner: false, reason: 'error' };
    });
  }

  // التأكد أن الجلسة لم تتغير أثناء العمليات غير المتزامنة
  function stillCurrent(attempt, user) {
    var cur = firebase.auth().currentUser;
    return attempt === authAttempt && !!cur && cur.uid === user.uid;
  }

  function processUser(user) {
    var attempt = ++authAttempt;
    if (!user) { setLocked(''); return Promise.resolve(); }

    window.AUTH_USER = user;
    gateBtn(true);
    gateMsg('جاري التحقق من صلاحية الحساب...');

    return writeDirectory(user).then(function () {
      if (!stillCurrent(attempt, user)) { setLocked(''); return null; }
      return authorize(user);
    }).then(function (result) {
      if (!result) return;
      if (!stillCurrent(attempt, user)) { setLocked(''); return; }

      // نسجّل المحاولة أولاً (ناجحة أو مرفوضة) قبل أي تسجيل خروج
      return recordLoginEvent(user, result.allowed, result.owner ? 'owner' : (result.allowed ? 'admin' : 'denied'))
        .then(function () {
          if (!result.allowed) {
            var msg = result.reason === 'email-not-verified'
              ? 'يجب توثيق البريد الإلكتروني لحساب Google قبل الدخول.'
              : 'عذراً، لن يتم تسجيل دخولك إلى لوحة الإدارة.';
            authAttempt++;
            return firebase.auth().signOut().catch(function () {}).then(function () {
              setLocked(msg, true);
            });
          }
          if (!stillCurrent(attempt, user)) { setLocked(''); return; }
          unlock(user, result.owner);
        });
    }).catch(function (e) {
      console.error('processUser failed', e);
      forceSignOut('حدث خطأ أثناء التحقق. حاول مرة أخرى.');
    });
  }

  /* ---------------------------------------------------------------
     الإقلاع
     --------------------------------------------------------------- */
  function boot() {
    if (booted) return;
    booted = true;

    setLocked('');

    if (!window.firebase || !firebase.auth || !firebase.database) {
      setLocked('تعذر الاتصال بخدمة الدخول. تأكد من إعداد Firebase.', true);
      return;
    }

    // الجلسة تنتهي بإغلاق التبويب — لا تبقى لوحة إدارة مفتوحة على جهاز مشترك
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
      .catch(function (e) { console.warn('persistence', e); });

    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    window.adminSignOut = function () {
      authAttempt++;
      clearTimers();
      firebase.auth().signOut().catch(function () {}).then(function () { location.reload(); });
    };

    window.adminSignIn = function () {
      gateBtn(true);
      gateMsg('جاري فتح نافذة Google...');
      firebase.auth().signInWithPopup(provider).then(function (result) {
        return processUser(result.user);
      }).catch(function (e) {
        console.error(e);
        authAttempt++;
        firebase.auth().signOut().catch(function () {});
        var text;
        if (e && e.code === 'auth/unauthorized-domain') text = 'هذا النطاق غير مضاف إلى Authorized domains في Firebase.';
        else if (e && e.code === 'auth/popup-blocked') text = 'المتصفح منع نافذة تسجيل Google. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.';
        else if (e && e.code === 'auth/popup-closed-by-user') text = 'تم إغلاق نافذة تسجيل الدخول قبل اختيار الحساب.';
        else if (e && e.code === 'auth/cancelled-popup-request') text = '';
        else text = 'تعذر تسجيل الدخول. تأكد من تفعيل Google وإعداد Firebase.';
        setLocked(text, !!text);
      });
    };

    firebase.auth().onAuthStateChanged(function (user) {
      if (!user) { authAttempt++; setLocked(''); return; }
      processUser(user);
    });
  }

  /* =================================================================
     إشعارات الدخول — مرتّبة حسب اليوم ثم الوقت
     ================================================================= */
  var LOGIN_SEEN_KEY = 'adminLoginEventsSeenAt';
  var loginEventsCache = [];
  var loginFilterUid = 'all';

  function seenAt() {
    try { return Number(localStorage.getItem(LOGIN_SEEN_KEY) || 0); } catch (e) { return 0; }
  }
  function markSeen() {
    try { localStorage.setItem(LOGIN_SEEN_KEY, String(Date.now())); } catch (e) {}
  }

  function dayKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function dayLabel(ts) {
    var d = new Date(ts);
    var today = new Date();
    var yest = new Date(); yest.setDate(today.getDate() - 1);
    if (dayKey(d.getTime()) === dayKey(today.getTime())) return 'اليوم';
    if (dayKey(d.getTime()) === dayKey(yest.getTime())) return 'أمس';
    try {
      return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dayKey(d.getTime());
    }
  }

  function timeLabel(ts) {
    try {
      return new Date(ts).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function fetchLoginEvents() {
    if (!window.firebase || !firebase.database) return Promise.resolve([]);
    var db = firebase.database();
    var user = window.AUTH_USER;
    if (!user) return Promise.resolve([]);

    // المالك يقرأ كل السجلات، المشرف يقرأ سجله فقط
    var eventsPromise = window.IS_OWNER
      ? db.ref('loginEvents').once('value')
      : db.ref('loginEvents/' + user.uid).once('value');

    return eventsPromise.then(function (snap) {
      var out = [];
      if (window.IS_OWNER) {
        snap.forEach(function (userNode) {
          userNode.forEach(function (ev) {
            var v = ev.val() || {};
            v._id = userNode.key + '/' + ev.key;
            v.uid = v.uid || userNode.key;
            out.push(v);
          });
        });
      } else {
        snap.forEach(function (ev) {
          var v = ev.val() || {};
          v._id = user.uid + '/' + ev.key;
          v.uid = v.uid || user.uid;
          out.push(v);
        });
      }
      return out;
    }).then(function (events) {
      // دمج السجل القديم (accessLogs) إن وُجد، للمالك فقط
      if (!window.IS_OWNER) return events;
      return db.ref('accessLogs').once('value').then(function (s) {
        s.forEach(function (c) {
          var v = c.val() || {};
          events.push({
            _id: 'legacy/' + c.key,
            _legacy: true,
            uid: v.uid || c.key,
            email: v.email || '',
            displayName: v.displayName || '',
            allowed: v.allowed !== false,
            role: 'admin',
            ts: v.timestamp || 0,
            device: 'غير مسجّل',
            browser: 'غير مسجّل',
            os: 'غير مسجّل'
          });
        });
        return events;
      }).catch(function () { return events; });
    }).catch(function (e) {
      console.warn('loginEvents read failed', e);
      return null;
    });
  }

  function eventRowHtml(ev) {
    var allowed = ev.allowed !== false;
    var isNew = Number(ev.ts || 0) > seenAt();
    var badge = allowed
      ? (ev.role === 'owner' ? '<span class="login-badge owner">المالك</span>' : '<span class="login-badge ok">دخول مسموح</span>')
      : '<span class="login-badge deny">محاولة مرفوضة</span>';

    var device = [ev.device, ev.os, ev.browser].filter(Boolean).join(' • ');
    var extra = [];
    if (ev.screen) extra.push('الشاشة: ' + ev.screen);
    if (ev.timezone) extra.push('المنطقة الزمنية: ' + ev.timezone);
    if (ev.language) extra.push('اللغة: ' + ev.language);

    return '' +
      '<div class="login-event' + (allowed ? '' : ' denied') + (isNew ? ' is-new' : '') + '">' +
        '<div class="login-event-time">' + escapeHtml(timeLabel(ev.ts)) + '</div>' +
        '<div class="login-event-body">' +
          '<div class="login-event-head">' +
            '<strong>' + escapeHtml(ev.displayName || 'حساب Google') + '</strong>' + badge +
            (isNew ? '<span class="login-badge new">جديد</span>' : '') +
          '</div>' +
          '<div class="login-event-mail">' + escapeHtml(ev.email || '') + '</div>' +
          '<div class="login-event-device">' + escapeHtml(device || 'جهاز غير معروف') + '</div>' +
          (extra.length ? '<div class="login-event-extra">' + escapeHtml(extra.join(' — ')) + '</div>' : '') +
          (ev.ua ? '<details class="login-event-ua"><summary>تفاصيل تقنية</summary><code>' + escapeHtml(ev.ua) + '</code></details>' : '') +
        '</div>' +
      '</div>';
  }

  function buildLoginEventsHtml(events) {
    if (!events.length) return '<div class="notice">لا توجد محاولات دخول مسجّلة بعد.</div>';

    events = events.slice().sort(function (a, b) { return Number(b.ts || 0) - Number(a.ts || 0); });

    var groups = [];
    var byDay = {};
    events.forEach(function (ev) {
      var k = dayKey(Number(ev.ts || 0));
      if (!byDay[k]) { byDay[k] = { key: k, ts: Number(ev.ts || 0), items: [] }; groups.push(byDay[k]); }
      byDay[k].items.push(ev);
    });

    return groups.map(function (g) {
      var allowedCount = g.items.filter(function (x) { return x.allowed !== false; }).length;
      var deniedCount = g.items.length - allowedCount;
      return '' +
        '<section class="login-day">' +
          '<header class="login-day-head">' +
            '<h4>' + escapeHtml(dayLabel(g.ts)) + '</h4>' +
            '<span class="login-day-count">' +
              allowedCount + ' دخول' + (deniedCount ? ' • ' + deniedCount + ' محاولة مرفوضة' : '') +
            '</span>' +
          '</header>' +
          '<div class="login-day-body">' + g.items.map(eventRowHtml).join('') + '</div>' +
        '</section>';
    }).join('');
  }

  function applyFilterAndRender() {
    var box = document.getElementById('access-logs-list');
    if (!box) return;
    var list = loginFilterUid === 'all'
      ? loginEventsCache
      : loginEventsCache.filter(function (e) { return e.uid === loginFilterUid; });
    box.innerHTML = buildLoginEventsHtml(list);
  }

  function renderAccountFilter() {
    var sel = document.getElementById('login-filter-account');
    if (!sel) return;
    var seen = {};
    var opts = ['<option value="all">كل الحسابات</option>'];
    loginEventsCache.forEach(function (e) {
      if (!e.uid || seen[e.uid]) return;
      seen[e.uid] = true;
      opts.push('<option value="' + escapeHtml(e.uid) + '">' + escapeHtml(e.email || e.displayName || e.uid) + '</option>');
    });
    sel.innerHTML = opts.join('');
    sel.value = loginFilterUid;
    sel.onchange = function () { loginFilterUid = this.value || 'all'; applyFilterAndRender(); };
  }

  window.renderAccessLogs = function () {
    var box = document.getElementById('access-logs-list');
    if (!box || !window.ADMIN_VERIFIED) return;
    box.innerHTML = '<div class="notice">جاري تحميل السجل...</div>';

    fetchLoginEvents().then(function (events) {
      if (events === null) {
        box.innerHTML = '<div class="notice">تعذر تحميل السجل. تأكد من تحديث قواعد Firebase (database.rules.json).</div>';
        return;
      }
      loginEventsCache = events;
      renderAccountFilter();
      applyFilterAndRender();
      setTimeout(function () {
        markSeen();
        if (window.renderAccessLogsBadge) window.renderAccessLogsBadge();
      }, 1500);
    });
  };

  // شارة العدّاد على عنصر القائمة الجانبية
  window.renderAccessLogsBadge = function () {
    if (!window.ADMIN_VERIFIED) return;
    fetchLoginEvents().then(function (events) {
      if (!events) return;
      var since = seenAt();
      var count = events.filter(function (e) { return Number(e.ts || 0) > since; }).length;
      var nav = document.querySelector('.owner-only-nav');
      if (!nav) return;
      var old = nav.querySelector('.nav-badge');
      if (old) old.remove();
      if (count > 0) {
        var b = document.createElement('span');
        b.className = 'nav-badge';
        b.textContent = count > 99 ? '99+' : String(count);
        nav.appendChild(b);
      }
    });
  };

  // حذف السجل كاملاً (المالك فقط)
  window.clearLoginEvents = function () {
    if (!window.IS_OWNER) return;
    if (!confirm('حذف كل سجل محاولات الدخول؟ لا يمكن التراجع.')) return;
    firebase.database().ref('loginEvents').remove()
      .then(function () { return firebase.database().ref('accessLogs').remove().catch(function () {}); })
      .then(function () {
        loginEventsCache = [];
        applyFilterAndRender();
        if (window.renderAccessLogsBadge) window.renderAccessLogsBadge();
      })
      .catch(function () { alert('تعذر حذف السجل.'); });
  };

  window.refreshLoginEvents = function () { window.renderAccessLogs(); };

  window.addEventListener('load', boot);
})();
