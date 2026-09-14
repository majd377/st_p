
(function(){
  const cfg = window.FIREBASE_CONFIG;
  if (cfg && window.firebase) {
    try { if (!firebase.apps.length) firebase.initializeApp(cfg); } catch(e) { console.warn('Firebase init', e); }
  }
  window.db = (window.firebase && firebase.database) ? firebase.database() : null;
})();


        (function(){
            try {
                if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    var link = document.createElement('link');
                    link.rel = 'manifest';
                    link.href = 'manifest.json';
                    document.head.appendChild(link);
                } else {
                    console.info('Manifest injection skipped for protocol', location.protocol);
                }
            } catch (e) {
                console.warn('Error injecting manifest:', e);
            }
        })();
    


        // --- PWA: register service worker and handle beforeinstallprompt ---
        if('serviceWorker' in navigator) {
            // Service workers require a secure context (https) or localhost.
            // Don't attempt registration when page is opened via file:// (origin 'null').
            if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW register failed', e));
                });
            } else {
                console.info('ServiceWorker registration skipped: insecure origin', location.protocol, location.hostname);
            }
        }

        let deferredPrompt = null;
        const pwaBanner = document.getElementById('pwa-install-banner');
        const btnInstall = document.getElementById('btnInstallPWA');
        const btnDismiss = document.getElementById('btnDismissPWA');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e; // save for later
            if(pwaBanner) pwaBanner.style.display = 'flex';
        });

        if(btnInstall) btnInstall.addEventListener('click', async () => {
            if(!deferredPrompt) return;
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if(choice && choice.outcome === 'accepted') {
                if(pwaBanner) pwaBanner.style.display = 'none';
                deferredPrompt = null;
            }
        });

        if(btnDismiss) btnDismiss.addEventListener('click', () => {
            if(pwaBanner) pwaBanner.style.display = 'none';
        });

        window.addEventListener('appinstalled', () => {
            // Installed
            if(pwaBanner) pwaBanner.style.display = 'none';
            deferredPrompt = null;
        });
        // --- DATA INITIALIZATION ---
        const defaultData = {
            sections: 1,
            sectionNames: ['الشعبة 1'],
            subjects: [],
            progress: {}, 
            assignments: {},
            exams: {},
            recordings: {},
            recordingsLinks: {},
            recordingsChannelLink: "",
            support: [],
            summaries: [],
            liveLinks: {},
            news: [],
            weeklyScheduleEnabled: true,
            weeklySchedule: {
                Saturday: {}, Sunday: {}, Monday: {}, Tuesday: {}, Wednesday: {}, Thursday: {}, Friday: {}
            },
            importantLinks: [],
            team: [],
            books: [],
            packages: []
            ,
            // per-section teachers and group links (will be normalized)
            teachers: {
                // example: '1': [{ id:1, name:'أ. خالد', role:'رياضيات', phone:'079...'}]
            },
            groupLinks: {
                // example: '1': [{ id:1, title:'مجموعة شعبة 1', url:'#' }]
            }
        };

        // Initialize dummy data
        for (let i = 1; i <= defaultData.sections; i++) {
            if(!defaultData.progress[i]) defaultData.progress[i] = {};
            if(!defaultData.assignments[i]) defaultData.assignments[i] = [];
            if(!defaultData.exams[i]) defaultData.exams[i] = [];
            if(!defaultData.liveLinks[i]) defaultData.liveLinks[i] = {};
                if(!defaultData.recordings[i]) defaultData.recordings[i] = [];
                if(!defaultData.recordingsLinks[i]) defaultData.recordingsLinks[i] = {};
            
                // Do not pre-populate per-subject progress here. Sections start empty and admin should add subjects to sections.
                // Keep recordings arrays/objects initialized but without per-subject defaults.
        }

        // Normalize appData to ensure required structures exist
        function normalizeAppData(data) {
            if(!data) return defaultData;
            // basic fallbacks
            if(!data.sections) data.sections = defaultData.sections;
            if(!Array.isArray(data.subjects)) data.subjects = Array.isArray(defaultData.subjects) ? defaultData.subjects.slice() : [];
            if(!data.progress) data.progress = {};
            if(!Array.isArray(data.sectionNames)) data.sectionNames = Array.from({length:data.sections || 0}, (_, i) => `شعبة ${i+1}`);
            while(data.sectionNames.length < (data.sections || 0)) data.sectionNames.push(`شعبة ${data.sectionNames.length+1}`);
            if(data.sectionNames.length > (data.sections || 0)) data.sectionNames = data.sectionNames.slice(0, data.sections || 0);
            if(!data.assignments) data.assignments = {};
            if(!data.liveLinks) data.liveLinks = {};
            if(!data.recordings) data.recordings = {};
            if(!data.recordingsLinks) data.recordingsLinks = {};
            if(!data.recordingsChannelLink) data.recordingsChannelLink = '';
            if(!data.support) data.support = defaultData.support.slice();
            if(!data.summaries) data.summaries = defaultData.summaries.slice();
            if(!data.liveLinks) data.liveLinks = {};
            if(!data.news) data.news = defaultData.news.slice();
            if(!data.importantLinks) data.importantLinks = defaultData.importantLinks.slice();
            if(!data.team) data.team = defaultData.team.slice();
            if(!data.books) data.books = defaultData.books.slice();
            if(!data.packages) data.packages = defaultData.packages.slice();
            if(!data.exams) data.exams = {};
            if(!data.teachers) data.teachers = {};
            if(!data.groupLinks) data.groupLinks = {};
            if(typeof data.weeklyScheduleEnabled !== 'boolean') data.weeklyScheduleEnabled = true;
            if(!data.weeklySchedule) data.weeklySchedule = { Saturday:{}, Sunday:{}, Monday:{}, Tuesday:{}, Wednesday:{}, Thursday:{}, Friday:{} };
            for(const d of ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday']) if(!data.weeklySchedule[d]) data.weeklySchedule[d] = {};

            // ensure team is an array and team members have bio
            if(!Array.isArray(data.team)) data.team = Array.isArray(defaultData.team) ? defaultData.team.slice() : [];
            data.team.forEach(m => { if(!m.bio) m.bio = ''; });

            // ensure per-section structures
            for (let i = 1; i <= data.sections; i++) {
                if(!data.progress[i]) data.progress[i] = {};
                if(!data.assignments[i]) data.assignments[i] = [];
                if(!data.exams[i]) data.exams[i] = [];
                if(!data.liveLinks[i]) data.liveLinks[i] = {};
                if(!data.recordings[i]) data.recordings[i] = [];
                if(!data.recordingsLinks[i]) data.recordingsLinks[i] = {};
                if(!data.teachers[i]) data.teachers[i] = [];
                if(!data.groupLinks[i]) data.groupLinks[i] = [];
                if(!Array.isArray(data.subjects)) data.subjects = [];
                // do NOT auto-create per-subject progress entries here; leave section progress empty until admin adds subjects
                // ensure recordingsLinks is an object but do not populate per-subject keys
            }

            // Restore array-based maps coming from Firebase into the object shape used by the renderer.
            for (let i = 1; i <= (data.sections || 0); i++) {
                for (const key of ['progress','liveLinks','recordingsLinks']) {
                    if (Array.isArray(data[key]?.[i])) {
                        const obj = {};
                        data[key][i].forEach(entry => {
                            if (!entry || typeof entry !== 'object') return;
                            const subject = String(entry.subject || '').trim();
                            if (!subject) return;
                            obj[subject] = entry.value !== undefined ? entry.value : (entry.link !== undefined ? entry : entry);
                        });
                        data[key][i] = obj;
                    }
                }
            }

            return data;
        }

            // Prepare a Firebase-safe copy of appData: convert per-section objects keyed by subject names
            // into arrays so long subject names won't become DB key paths.
            function prepareAppDataForFirebase(src) {
                try {
                    const data = JSON.parse(JSON.stringify(src || {}));
                    const sections = data.sections || 0;
                    for (let i = 1; i <= sections; i++) {
                        for (const key of ['progress','liveLinks','recordingsLinks']) {
                            const value = data[key]?.[i];
                            if (value && typeof value === 'object' && !Array.isArray(value)) {
                                data[key][i] = Object.keys(value).map(subject => ({ subject, value: value[subject] }));
                            }
                        }
                    }
                    return data;
                } catch (e) {
                    console.warn('prepareAppDataForFirebase failed, falling back to original', e);
                    return src;
                }
            }

        let appData = normalizeAppData(JSON.parse(localStorage.getItem('collegeAppData')) || defaultData);

        let firebaseLoadStarted = false;
        function canWriteData(){ return window.APP_ROLE !== 'admin' || window.IS_ADMIN === true; }
        function saveData(){
            try { localStorage.setItem('collegeAppData', JSON.stringify(appData)); } catch(e) { console.warn('localStorage save failed', e); }
            if(!canWriteData()){ console.warn('Blocked client write: admin session is not authorized.'); return Promise.reject(new Error('UNAUTHORIZED')); }
            if(!db) return Promise.resolve();
            return db.ref('appData').set(prepareAppDataForFirebase(appData)).catch(err => {
                console.error('Firebase save failed:', err);
                throw err;
            });
        }
        window.saveData = saveData;

        function loadDataFromFirebase(){
            if(firebaseLoadStarted || !db) return;
            firebaseLoadStarted = true;
            db.ref('appData').once('value').then(snap => {
                if(!snap.exists()) return;
                appData = normalizeAppData(snap.val());
                try { localStorage.setItem('collegeAppData', JSON.stringify(appData)); } catch(e) {}
                try { render(); } catch(e) { console.warn('render after Firebase load failed', e); }
            }).catch(err => console.warn('Firebase appData load failed:', err));
        }
        loadDataFromFirebase();

        // --- إعدادات المظهر (Font & Color Scheme) ---
        // تخزين الإعدادات محليًا فقط (localStorage)
        const DEFAULT_SETTINGS = {
            font: 'default',
            colorScheme: 'ocean',
            fontScale: 80,
            lineHeight: 17,
            highContrast: false,
            reducedMotion: false,
            compactMode: false
        };

        function saveUserSettings(value){ try { localStorage.setItem('userSettings', JSON.stringify(value || DEFAULT_SETTINGS)); } catch(e) { console.warn('userSettings save failed', e); } }

        // تحميل الإعدادات من localStorage
        function loadUserSettings() {
            try {
                const stored = localStorage.getItem('userSettings');
                return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
            } catch (e) {
                return DEFAULT_SETTINGS;
            }
        }

        // الحصول على الإعدادات الحالية (قبل استدعاء applyStoredSettings)
        let userSettings = loadUserSettings();
if(userSettings && userSettings.colorScheme==='luxury') userSettings.colorScheme='ocean';


        // تطبيق الخط
        function setFont(fontName) {
            const map = {default:'"Segoe UI", Tahoma, Arial, sans-serif',aldhabi:"'ALDHABI', sans-serif",alatypoo:"'AlaTypoo', sans-serif",dwnoutsh:"'DWNOUTSH', sans-serif",kfxftout:"'KFXFTOUT', sans-serif",ptbldbrk:"'PTBLDBRK', sans-serif"};
            if(!map[fontName]) return;
            document.documentElement.style.setProperty('--font-family', map[fontName]);
            userSettings.font=fontName; saveUserSettings(userSettings); updateFontButtons();
        }
        function setColorScheme(schemeName){
            const C={ocean:{p:'#1e5472',s:'#5f8092',a:'#d8a64d',b:'#f4f8fb',t:'#243540',m:'#6f7e87'},sage:{p:'#35695e',s:'#6c8f83',a:'#c5a25d',b:'#f4f8f5',t:'#2d3c38',m:'#6f807a'},sand:{p:'#765c35',s:'#9b7b4f',a:'#c89945',b:'#faf7ef',t:'#41382d',m:'#7f7566'},rose:{p:'#815768',s:'#a77a8c',a:'#d6aa9a',b:'#fbf6f8',t:'#483a40',m:'#817279'}};
            const c=C[schemeName]||C.ocean, r=document.documentElement;
            r.style.setProperty('--primary-color',c.p);r.style.setProperty('--secondary-color',c.s);r.style.setProperty('--accent-color',c.a);r.style.setProperty('--bg-color',c.b);r.style.setProperty('--text-color',c.t);r.style.setProperty('--text-light',c.m);r.style.setProperty('--card-bg','#fff');
            userSettings.colorScheme=schemeName; saveUserSettings(userSettings); updateColorSchemeButtons();
        }
        function updateFontButtons(){const cur=userSettings.font||'default';document.querySelectorAll('.font-choice-btn').forEach(b=>b.classList.toggle('selected',b.id===`font-${cur}-btn`));}
        function updateColorSchemeButtons(){const cur=userSettings.colorScheme||'ocean';document.querySelectorAll('.theme-option').forEach(b=>b.classList.toggle('selected',b.id===`scheme-${cur}-btn`));}
        function setFontScale(v){const n=Math.max(80,Math.min(120,Number(v)||80));document.documentElement.style.setProperty('--font-scale',n/100);document.documentElement.style.setProperty('--base-font-size', (16*n/100)+'px');userSettings.fontScale=n;saveUserSettings(userSettings);const e=document.getElementById('font-size-value');if(e)e.textContent=n+'%';}
        function setLineHeight(v){const n=Math.max(15,Math.min(22,Number(v)||17));document.documentElement.style.setProperty('--line-height-scale',n/10);userSettings.lineHeight=n;saveUserSettings(userSettings);const e=document.getElementById('line-height-value');if(e)e.textContent=(n/10).toFixed(1)+'×';}
        function toggleHighContrast(){userSettings.highContrast=!userSettings.highContrast;document.body.classList.toggle('high-contrast',userSettings.highContrast);saveUserSettings(userSettings);updateAppearanceStates();}
        function toggleReducedMotion(){userSettings.reducedMotion=!userSettings.reducedMotion;document.body.classList.toggle('reduced-motion',userSettings.reducedMotion);saveUserSettings(userSettings);updateAppearanceStates();}
        function toggleCompactMode(){userSettings.compactMode=!userSettings.compactMode;document.body.classList.toggle('compact-mode',userSettings.compactMode);saveUserSettings(userSettings);updateAppearanceStates();}
        function updateAppearanceStates(){[['contrast-state',userSettings.highContrast],['motion-state',userSettings.reducedMotion],['compact-state',userSettings.compactMode]].forEach(x=>{const e=document.getElementById(x[0]);if(e)e.textContent=x[1]?'●':'○';});}
        function resetAppearanceSettings(){userSettings={...DEFAULT_SETTINGS};saveUserSettings(userSettings);setFont('default');setColorScheme('ocean');setFontScale(80);setLineHeight(17);document.body.classList.remove('high-contrast','reduced-motion','compact-mode');updateAppearanceStates();render();}
        function applyStoredSettings(){
            const fm={default:'"Segoe UI", Tahoma, Arial, sans-serif',aldhabi:"'ALDHABI', sans-serif",alatypoo:"'AlaTypoo', sans-serif",dwnoutsh:"'DWNOUTSH', sans-serif",kfxftout:"'KFXFTOUT', sans-serif",ptbldbrk:"'PTBLDBRK', sans-serif"};
            document.documentElement.style.setProperty('--font-family',fm[userSettings.font]||fm.default);setColorScheme(userSettings.colorScheme||'ocean');setFontScale(userSettings.fontScale||80);setLineHeight(userSettings.lineHeight||17);document.body.classList.toggle('high-contrast',!!userSettings.highContrast);document.body.classList.toggle('reduced-motion',!!userSettings.reducedMotion);document.body.classList.toggle('compact-mode',!!userSettings.compactMode);updateAppearanceStates();
        }
        applyStoredSettings();

        function escapeHtml(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
        function getSectionLabel(i){return (appData.sectionNames&&appData.sectionNames[i-1])||`شعبة ${i}`;}
        function renderSectionManagement(){
            const box=document.getElementById('section-management');if(!box||!window.IS_OWNER){if(box)box.innerHTML='';return;}box.innerHTML='';
            for(let i=1;i<=appData.sections;i++){const row=document.createElement('div');row.className='management-row';row.innerHTML='<input class="editable-input" value="'+escapeHtml(getSectionLabel(i))+'" placeholder="اسم الشعبة"><button class="btn-delete btn-sm" '+(appData.sections<=1?'disabled':'')+'>حذف</button>';const inp=row.querySelector('input');inp.onchange=()=>renameSection(i,inp.value);row.querySelector('button').onclick=()=>deleteSection(i);box.appendChild(row);}
        }
        function renameSection(i,n){if(!window.IS_OWNER)return;n=(n||'').trim();if(!n)return;appData.sectionNames[i-1]=n;saveData();render();}
        function addNewSection(){if(!window.IS_OWNER)return;appData.sections+=1;appData.sectionNames=appData.sectionNames||[];appData.sectionNames.push(`شعبة ${appData.sections}`);['progress','assignments','exams','liveLinks','recordings','recordingsLinks','teachers','groupLinks'].forEach(k=>{appData[k]=appData[k]||{};appData[k][appData.sections]=k==='assignments'||k==='exams'||k==='recordings'?[]:{};});saveData();render();}
        function deleteSection(i){if(!window.IS_OWNER)return;if(appData.sections<=1)return;if(!confirm('حذف '+getSectionLabel(i)+'؟ سيتم حذف بياناتها أيضاً.'))return;['progress','assignments','exams','liveLinks','recordings','recordingsLinks','teachers','groupLinks'].forEach(k=>{if(appData[k])delete appData[k][i];});appData.sections--;appData.sectionNames.splice(i-1,1);if(selectedSection>appData.sections)selectedSection=appData.sections;saveData();render();}
        function renderKnownAccounts(){
            const box=document.getElementById('known-accounts-list');if(!box||!window.IS_OWNER||!db)return;
            Promise.all([db.ref('loginDirectory').once('value'),db.ref('adminUsers').once('value')]).then(([a,b])=>{const known=[];a.forEach(c=>known.push({uid:c.key,...(c.val()||{})}));const admins=b.val()||{};if(!known.length){box.innerHTML='<div class="notice">سيظهر الحساب هنا بعد أول محاولة دخول من /admin/.</div>';return;}box.innerHTML='';known.sort((x,y)=>String(x.email||'').localeCompare(String(y.email||''))).forEach(u=>{const row=document.createElement('div');row.className='management-row account-row';const is=!!admins[u.uid],isSelf=(window.AUTH_USER&&u.uid===window.AUTH_USER.uid);row.innerHTML='<div><strong>'+escapeHtml(u.displayName||'حساب Google')+'</strong><small>'+escapeHtml(u.email||'')+'</small></div><button class="btn-sm '+(isSelf?'btn-link':(is?'btn-delete':'btn-add'))+'" '+(isSelf?'disabled':'')+'>'+ (isSelf?'المالك':(is?'سحب الصلاحية':'منح الصلاحية')) +'</button>';if(!isSelf)row.querySelector('button').onclick=()=>is?revokeAdmin(u.uid):grantAdmin(u.uid);box.appendChild(row);});}).catch(()=>box.innerHTML='<div class="notice">تعذر تحميل الحسابات حالياً.</div>');
        }
        function grantAdmin(uid){if(!window.IS_OWNER||!db)return;db.ref('loginDirectory/'+uid).once('value').then(s=>{if(!s.exists())return;const v=s.val();return db.ref('adminUsers/'+uid).set({email:v.email||'',displayName:v.displayName||'',addedAt:firebase.database.ServerValue.TIMESTAMP});}).then(renderKnownAccounts);}
        function revokeAdmin(uid){if(!window.IS_OWNER||!db)return;if(!confirm('سحب صلاحية هذا الحساب؟'))return;db.ref('adminUsers/'+uid).remove().then(renderKnownAccounts);}
        function grantAdminByEmail(){if(!window.IS_OWNER||!db)return;const input=document.getElementById('admin-email-search'),email=((input&&input.value)||'').trim().toLowerCase();if(!email)return;db.ref('loginDirectory').once('value').then(s=>{let found=null;s.forEach(c=>{const v=c.val()||{};if(String(v.email||'').toLowerCase()===email)found={uid:c.key,...v};});if(!found){alert('الحساب يجب أن يحاول الدخول إلى /admin/ مرة واحدة أولاً.');return;}return db.ref('adminUsers/'+found.uid).set({email:found.email||email,displayName:found.displayName||'',addedAt:firebase.database.ServerValue.TIMESTAMP});}).then(()=>{if(input)input.value='';renderKnownAccounts();});}

        // --- NAVIGATION / STATE ---

        // Core UI state must always exist before the first render (public and admin).
        let currentView = 'home';
        let selectedSection = 1;
        let isEditMode = false;
        let sectionHistory = [];

        function showSection(sectionId) {
            if(window.APP_ROLE === 'admin' && !window.IS_ADMIN) return;
            if (currentView !== sectionId) {
                sectionHistory.push(currentView);
            }
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick').includes(sectionId));
            if(activeNav) activeNav.classList.add('active');

            document.querySelectorAll('.content-area').forEach(el => el.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
            
            currentView = sectionId;
            const titles = {
                'home': 'الرئيسية',
                'progress': 'الرزم والمنهج',
                'assignments': 'الواجبات',
                'exams': 'الاختبارات',
                'support': 'أرقام الدعم',
                'summaries': 'الملفات والتلخيصات',
                'live-links': 'روابط الحصص',
                'recordings': 'تسجيلات الحصص',
                'news': 'آخر الأخبار',
                'books-packages': 'الكتب والرزم',
                'teachers': 'أسماء الأساتذة',
                'group-links': 'روابط المجموعات',
                'important-links': 'روابط مهمة',
                'settings': 'الإعدادات',
                'about-team': 'فريق التطوير'
            };
            document.getElementById('page-heading').innerText = titles[sectionId];
            render();
        }

        function goBack() {
            if (sectionHistory.length > 0) {
                const prev = sectionHistory.pop();
                showSection(prev);
            } else {
                showSection('home');
            }
        }

        // --- دالة تعيين الشعبة المختارة ---
        function setSection(sectionNum) {
            selectedSection = sectionNum;
            renderSectionSelectors();
            render();
        }

        // دعم زر الرجوع في الجوال (مثلث الرجوع)
        window.addEventListener('popstate', function() {
            goBack();
        });

        // --- RENDER FUNCTIONS ---

        function render() {
            // Admin page flips this flag after Google authorization; public page stays read-only.
            isEditMode = (window.APP_ROLE === 'admin' && window.IS_ADMIN === true);
            renderDate();
            renderSectionSelectors();
            if(currentView === 'progress') renderProgress();
            if(currentView === 'recordings') renderRecordings();
            if(currentView === 'assignments') renderAssignments();
            if(currentView === 'exams') renderExams();
            if(currentView === 'support') renderSupport();
            if(currentView === 'summaries') renderSummaries();
            if(currentView === 'live-links') renderLiveLinks();
            if(currentView === 'weekly-schedule') renderWeeklySchedule();
            if(currentView === 'teachers') renderTeachers();
            if(currentView === 'group-links') renderGroupLinks();
            if(currentView === 'news') renderNews();
            if(currentView === 'books-packages') renderBooksPackages();
            if(currentView === 'important-links') renderImportantLinks();
            if(currentView === 'settings') renderSettings();
            if(currentView === 'about-team') renderTeam();
            hideEmptyPublicActions();
        }
        function hideEmptyPublicActions(){if(window.IS_ADMIN)return;document.querySelectorAll('.content-area a').forEach(a=>{const h=(a.getAttribute('href')||'').trim();if(!h||h==='#'||h.toLowerCase()==='javascript:void(0)')a.style.display='none';});document.querySelectorAll('.content-area .optional-action[data-empty="true"]').forEach(e=>e.style.display='none');}


        function renderDate() {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const date = new Date().toLocaleDateString('ar-EG', options);
            document.getElementById('current-date').innerText = date;
        }

        function renderSectionSelectors() {
            const ids = ['progress-sec-selector', 'record-sec-selector', 'assign-sec-selector', 'exams-sec-selector', 'live-sec-selector'];
            // add selectors for teachers and group-links as well
            ids.push('teachers-sec-selector', 'group-sec-selector');
            ids.forEach(id => {
                const container = document.getElementById(id);
                if(!container) return;
                container.innerHTML = '';
                for(let i=1; i<=appData.sections; i++) {
                    const btn = document.createElement('button');
                    btn.className = `sec-btn ${selectedSection === i ? 'active' : ''}`;
                    btn.innerText = getSectionLabel(i);
                    btn.onclick = () => setSection(i);
                    container.appendChild(btn);
                }
            });
        }

        // --- SPECIFIC SECTION LOGIC ---

        function renderProgress() {
            const container = document.getElementById('progress-list');
            container.innerHTML = '';
            const sectionData = appData.progress[selectedSection] || {};
            // Show only subjects that are present for this section (allow per-section removal)
            const subjectsInSection = Object.keys(sectionData);
            if(subjectsInSection.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light); text-align:center;">لا توجد مواد مسجلة لهذه الشعبة حالياً.</p>';
            }

            subjectsInSection.forEach(sub => {
                const data = sectionData[sub] || { current: 0, total: 10, lessonName: '' };
                const percent = Math.min(100, Math.round((data.current / data.total) * 100));

                const card = document.createElement('div');
                card.className = 'data-card';
                card.innerHTML = `
                    <div class="data-header">
                        <h3>${sub}</h3>
                        <div class="lesson-name editable-value">${data.lessonName && data.lessonName.trim() ? data.lessonName : ''}</div>
                        <div class="progress-text editable-value">درس ${data.current} من ${data.total}</div>
                    </div>
                    <div class="editable-field" style="margin-bottom: 12px;">
                        <label>اسم الدرس الحالي (اختياري):</label>
                        <input type="text" class="editable-input" value="${data.lessonName || ''}" onchange="updateProgress('${sub}', 'lessonName', this.value)">
                        <label>الدرس الحالي (رقم):</label>
                        <input type="number" class="editable-input" value="${data.current}" onchange="updateProgress('${sub}', 'current', this.value)">
                        <label>إجمالي الدروس:</label>
                        <input type="number" class="editable-input" value="${data.total}" onchange="updateProgress('${sub}', 'total', this.value)">
                        <div style="margin-top:8px; display:flex; gap:8px;">
                            <button class="btn-sm btn-delete" onclick="removeSubjectFromSection('${sub}')">حذف المادة من الشعبة</button>
                        </div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${percent}%"></div>
                    </div>
                    <!-- Attachments for this subject -->
                    <div style="margin-top:12px;">
                        <strong style="color:var(--text-light);">ملحقات المادة:</strong>
                        <div id="progress-attachments-${escapeId(sub)}" style="margin-top:8px;"></div>
                        ${isEditMode ? `
                        <div style="margin-top:10px; padding:10px; background:var(--card-bg); border-radius:6px;">
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <button class="btn-sm" onclick="selectProgressAttachmentType('${escapeJs(sub)}','image')">📷 صورة</button>
                                <button class="btn-sm" onclick="selectProgressAttachmentType('${escapeJs(sub)}','link')">🔗 رابط</button>
                                <button class="btn-sm" onclick="selectProgressAttachmentType('${escapeJs(sub)}','file')">📎 ملف</button>
                            </div>
                            <div id="progress-attach-image-section-${escapeId(sub)}" style="display:none; margin-top:8px;">
                                <input type="file" id="progress-attachment-image-input-${escapeId(sub)}" accept="image/*">
                                <div id="progress-attachment-image-preview-${escapeId(sub)}"></div>
                            </div>
                            <div id="progress-attach-link-section-${escapeId(sub)}" style="display:none; margin-top:8px;">
                                <input type="text" id="progress-attachment-link-input-${escapeId(sub)}" class="editable-input" placeholder="https://...">
                            </div>
                            <div id="progress-attach-file-section-${escapeId(sub)}" style="display:none; margin-top:8px;">
                                <input type="file" id="progress-attachment-file-input-${escapeId(sub)}">
                                <div id="progress-attachment-file-preview-${escapeId(sub)}"></div>
                            </div>
                            <div style="margin-top:8px;">
                                <button class="btn-sm btn-add" onclick="addCurrentProgressAttachmentToSubject('${escapeJs(sub)}')">➕ أضف الملحق</button>
                            </div>
                        </div>` : ''}
                    </div>
                `;
                container.appendChild(card);
                // render existing attachments after card is in DOM
                try { renderProgressAttachments(sub); } catch(e){ console.warn('renderProgressAttachments error', e); }
            });

            // Add control to attach existing global subjects to this section
            const addBox = document.createElement('div');
            addBox.className = 'add-new-container';
            // available subjects are those in the normalized subjects list not present in this section
            const available = getSubjectsList().filter(s => !subjectsInSection.includes(s));
            let optionsHtml = '';
            available.forEach(a => { optionsHtml += `<option value="${a}">${a}</option>`; });
            addBox.innerHTML = `
                <h4>إضافة مادة موجودة للشعبة الحالية</h4>
                ${available.length === 0 ? '<p style="color:var(--text-light);">لا توجد مواد متاحة للإضافة.</p>' : `<select id="add-existing-subject-select" class="editable-input" style="margin-bottom:8px;">${optionsHtml}</select><button class="btn-sm btn-add" onclick="addExistingSubjectToSection()">أضف المادة للشعبة</button>`}
            `;
            container.appendChild(addBox);
        }

        function updateProgress(subject, field, value) {
            if(!appData.progress[selectedSection]) appData.progress[selectedSection] = {};
            if(!appData.progress[selectedSection][subject]) appData.progress[selectedSection][subject] = { current: 0, total: 10, lessonName: '' };
            if(field === 'lessonName') {
                appData.progress[selectedSection][subject][field] = value;
            } else {
                appData.progress[selectedSection][subject][field] = parseInt(value) || 0;
            }
            saveData();
            render();
        }

        function removeSubjectFromSection(subject) {
            if(!confirm('هل تريد حذف هذه المادة من الشعبة الحالية؟ (سيتم إزالة التقدم والروابط لهذه الشعبة فقط)')) return;
            if(appData.progress && appData.progress[selectedSection]) delete appData.progress[selectedSection][subject];
            if(appData.liveLinks && appData.liveLinks[selectedSection]) delete appData.liveLinks[selectedSection][subject];
            saveData();
            render();
        }

        function addExistingSubjectToSection() {
            const sel = document.getElementById('add-existing-subject-select');
            if(!sel) return;
            const name = sel.value;
            if(!name) return;
            if(!appData.progress[selectedSection]) appData.progress[selectedSection] = {};
            if(appData.progress[selectedSection][name]) { alert('المادة موجودة بالفعل في هذه الشعبة'); return; }
            appData.progress[selectedSection][name] = { current: 1, total: 20, lessonName: '' };
            if(!appData.liveLinks[selectedSection]) appData.liveLinks[selectedSection] = {};
            appData.liveLinks[selectedSection][name] = { link: '', from: '', to: '' };
            saveData();
            render();
        }

        function renderAssignments() {
            const container = document.getElementById('assignments-list');
            container.innerHTML = '';
            let tasks = appData.assignments[selectedSection] || [];

            // filter controls
            const modeEl = document.getElementById('assign-filter-mode');
            const dateEl = document.getElementById('assign-filter-date');
            const subjEl = document.getElementById('assign-filter-subject');
            const mode = modeEl ? modeEl.value : 'all';
                // populate subject filters from normalized subjects list
            if(subjEl) {
                const prev = subjEl.value || 'all';
                let opts = '<option value="all">كل المواد</option>';
                getSubjectsList().forEach(s => { opts += `<option value="${s}">${s}</option>`; });
                subjEl.innerHTML = opts;
                subjEl.value = prev;
            }
            // populate the subject chooser in the add-assignment form
            const newSubEl = document.getElementById('new-assignment-subject');
            if(newSubEl) {
                let opts2 = '<option value="">--- اختر مادة ---</option>';
                getSubjectsList().forEach(s => { opts2 += `<option value="${s}">${s}</option>`; });
                newSubEl.innerHTML = opts2;
            }
            if(mode === 'date') {
                if(dateEl) {
                    dateEl.style.display = '';
                    const selDate = dateEl.value; // format YYYY-MM-DD
                    if(selDate) {
                        tasks = tasks.filter(t => {
                            if(!t.date) return false;
                            const d = new Date(t.date);
                            const y = d.getFullYear();
                            const m = String(d.getMonth()+1).padStart(2,'0');
                            const day = String(d.getDate()).padStart(2,'0');
                            return `${y}-${m}-${day}` === selDate;
                        });
                    }
                }
            } else {
                if(dateEl) dateEl.style.display = 'none';
            }

            // apply subject filter if selected
            const selectedSubject = subjEl ? subjEl.value : 'all';
            if(selectedSubject && selectedSubject !== 'all') {
                tasks = tasks.filter(t => t.subject === selectedSubject);
            }

            // (folder UI removed)

            if(tasks.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light); text-align:center;">لا يوجد واجبات مسجلة لهذه الشعبة حالياً.</p>';
                return;
            }


            tasks.forEach((task, index) => {
                const div = document.createElement('div');
                div.className = `task-item ${task.done ? 'completed' : ''}`;
                const dateLabel = task.date ? new Date(task.date).toLocaleDateString('ar-EG') : '';
                const subjectHtml = task.subject ? `<div class="task-subject">${task.subject}</div>` : '';
                
                // Attachment(s) HTML (support multiple)
                let attachmentHtml = '';
                if(Array.isArray(task.attachments) && task.attachments.length > 0) {
                    task.attachments.forEach((att, ai) => {
                        if(att.type === 'image') {
                            attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📷 صورة:</strong>
                                    <img src="${att.data}" style="max-width:100%; max-height:200px; border-radius:6px; margin-top:6px; cursor:pointer;" onclick="viewImage('${att.data}')">
                                </div>
                            `;
                        } else if(att.type === 'link') {
                            attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">🔗 رابط:</strong>
                                    <a href="${att.url}" target="_blank" style="display:inline-block; margin-right:8px; color:#0066cc; text-decoration:none;">فتح الرابط</a>
                                </div>
                            `;
                        } else if(att.type === 'file') {
                            attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📎 ملف:</strong>
                                    <button class="btn-sm" style="background:#FF6B6B; color:white; margin-right:8px;" onclick="downloadAttachment('assignment', ${index}, ${ai})">⬇️ تحميل</button>
                                    <span style="color:#999; font-size:0.85rem;">${att.name || att.url || 'ملف'}</span>
                                </div>
                            `;
                        }
                    });
                }
                
                div.innerHTML = `
                    <div style="flex:1">
                        ${subjectHtml}
                        <div class="task-desc"><span class="editable-value">${task.text}</span></div>
                                    ${attachmentHtml}
                        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:6px;"><small style="color:var(--text-light);">${dateLabel}</small></div>
                        <input type="text" class="editable-field editable-input" value="${task.text}" onchange="updateTaskText(${index}, this.value)">
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteTask(${index})">حذف</button>
                `;
                container.appendChild(div);
            });
        }

        // --- RECORDINGS LOGIC ---
        function renderRecordings() {
            const container = document.getElementById('recordings-list');
            container.innerHTML = '';
            let recs = appData.recordings[selectedSection] || [];

            // render channel link box (global default)
            const channelBox = document.getElementById('recordings-channel-box');
            if(channelBox) {
                const ch = appData.recordingsChannelLink || '';
                channelBox.innerHTML = `
                    <div style="padding:10px; background:#fff; border-radius:8px; border:1px solid #eef2ff;">
                        <strong>رابط قناة التسجيلات:</strong>
                        ${ch ? `<a href="${ch}" target="_blank" style="margin-inline-start:8px; display:inline-block;">فتح القناة</a>` : '<span style="color:var(--text-light); margin-inline-start:8px;">لم يتم تعيين رابط القناة بعد</span>'}
                        ${isEditMode ? `<div style="margin-top:8px;"><input type="text" id="global-recordings-channel" class="editable-input" placeholder="رابط قناة التسجيلات" value="${ch}" onchange="updateRecordingsChannelLink(this.value)"></div>` : ''}
                    </div>
                `;
            }

            // filter controls
            const modeEl = document.getElementById('record-filter-mode');
            const dateEl = document.getElementById('record-filter-date');
            const subjEl = document.getElementById('record-filter-subject');
            const mode = modeEl ? modeEl.value : 'all';

            // populate subject filters
            if(subjEl) {
                const prev = subjEl.value || 'all';
                let opts = '<option value="all">كل المواد</option>';
                getSubjectsList().forEach(s => { opts += `<option value="${s}">${s}</option>`; });
                subjEl.innerHTML = opts;
                subjEl.value = prev;
            }

            // populate subject chooser in add form
            const newSubEl = document.getElementById('new-record-subject');
            if(newSubEl) {
                let opts2 = '<option value="">--- اختر مادة ---</option>';
                getSubjectsList().forEach(s => { opts2 += `<option value="${s}">${s}</option>`; });
                newSubEl.innerHTML = opts2;
            }

            if(mode === 'date') {
                if(dateEl) {
                    dateEl.style.display = '';
                    const selDate = dateEl.value;
                    if(selDate) {
                        recs = recs.filter(r => {
                            if(!r.date) return false;
                            const d = new Date(r.date);
                            const y = d.getFullYear();
                            const m = String(d.getMonth()+1).padStart(2,'0');
                            const day = String(d.getDate()).padStart(2,'0');
                            return `${y}-${m}-${day}` === selDate;
                        });
                    }
                }
            } else { if(dateEl) dateEl.style.display = 'none'; }

            // apply subject filter
            const selectedSubject = subjEl ? subjEl.value : 'all';
            if(selectedSubject && selectedSubject !== 'all') {
                recs = recs.filter(r => r.subject === selectedSubject);
            }

            if(recs.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light); text-align:center;">جميع التسجيلات مرفوعة على قناة 🌸غزة العاشر أ ٢٥ ﴿ تسجيلات الحصص ﴾🌸</p>';
            } else {
                recs.forEach((r) => {
                    const origIndex = (appData.recordings[selectedSection] || []).findIndex(rr => rr.id === r.id);
                    const row = document.createElement('div');
                    row.className = 'data-card';
                    const dateLabel = r.date ? new Date(r.date).toLocaleDateString('ar-EG') : '';
                    row.innerHTML = `
                        <div class="data-header">
                            <h3>${r.subject || 'عام'}</h3>
                            <div class="lesson-name">${r.title}</div>
                            <div class="progress-text">${dateLabel}</div>
                        </div>
                        <div style="margin-top:8px;"><a href="${r.link}" target="_blank">فتح التسجيل على يوتيوب</a></div>
                        <div style="margin-top:8px; display:flex; gap:8px;">
                            <button class="btn-sm btn-delete" onclick="deleteRecording(${origIndex})">حذف</button>
                        </div>
                    `;
                    container.appendChild(row);
                });
            }

            // show per-subject recordings link if selected; fallback to global channel link when subject link missing
            if(selectedSubject && selectedSubject !== 'all') {
                const subjLinks = (appData.recordingsLinks && appData.recordingsLinks[selectedSection]) || {};
                const subjectLink = subjLinks[selectedSubject] || '';
                const link = subjectLink || (appData.recordingsChannelLink || '');
                const box = document.createElement('div');
                box.className = 'add-new-container';
                box.style.marginTop = '12px';
                box.innerHTML = `
                    <h4>رابط كل التسجيلات للمادة ${selectedSubject}</h4>
                    ${subjectLink ? `<a href="${subjectLink}" target="_blank">فتح رابط كل التسجيلات (رابط المادة)</a>` : (link ? `<a href="${link}" target="_blank">فتح رابط قناة التسجيلات (افتراضي)</a>` : '<p style="color:var(--text-light);">لا يوجد رابط شامل لهذه المادة أو للقناة.</p>')}
                    ${isEditMode ? `<label style="margin-top:8px; color:var(--text-light);">تعريف/تعديل رابط المادة (سيُستخدم بدل القناة):</label><input type="text" id="edit-recordings-link" class="editable-input" value="${subjectLink || ''}" onchange="updateRecordingsLink('${selectedSubject}', this.value)">` : ''}
                `;
                container.appendChild(box);
            }
        }

        function addRecording() {
            const title = document.getElementById('new-record-title').value.trim();
            const link = document.getElementById('new-record-link').value.trim();
            const subj = document.getElementById('new-record-subject').value || '';
            const dateInput = document.getElementById('new-record-date') ? document.getElementById('new-record-date').value : '';
            if(!title || !link) { alert('الرجاء إدخال اسم التسجيل ورابط يوتيوب'); return; }
            if(!appData.recordings[selectedSection]) appData.recordings[selectedSection] = [];
            const dateVal = dateInput ? new Date(dateInput).getTime() : Date.now();
            appData.recordings[selectedSection].push({ id: Date.now(), title: title, link: link, subject: subj, date: dateVal });
            saveData();
            document.getElementById('new-record-title').value = '';
            document.getElementById('new-record-link').value = '';
            if(document.getElementById('new-record-date')) document.getElementById('new-record-date').value = '';
            if(document.getElementById('new-record-subject')) document.getElementById('new-record-subject').value = '';
            renderRecordings();
        }

        function deleteRecording(index) {
            if(!confirm('هل تريد حذف هذا التسجيل؟')) return;
            if(!appData.recordings[selectedSection]) return;
            appData.recordings[selectedSection].splice(index,1);
            saveData();
            renderRecordings();
        }

        function updateRecordingsLink(subject, value) {
            if(!appData.recordingsLinks[selectedSection]) appData.recordingsLinks[selectedSection] = {};
            appData.recordingsLinks[selectedSection][subject] = value;
            saveData();
            renderRecordings();
        }

        function updateRecordingsChannelLink(value) {
            appData.recordingsChannelLink = value || '';
            saveData();
            renderRecordings();
        }

        // --- ATTACHMENT FUNCTIONS ---
        let currentAttachment = null;
        let newAssignmentAttachments = [];
        let newNewsAttachments = [];
        let newLinkAttachments = [];
        let currentLinkAttachment = null;
        let currentNewsAttachment = null;

        function selectAttachmentType(type) {
            console.log('selectAttachmentType called with type:', type);
            try {
                // Hide all sections first
                const imgSec = document.getElementById('attachment-image-section');
                const linkSec = document.getElementById('attachment-link-section');
                const fileSec = document.getElementById('attachment-file-section');
                
                if(imgSec) imgSec.style.display = 'none';
                if(linkSec) linkSec.style.display = 'none';
                if(fileSec) fileSec.style.display = 'none';
                
                // Show selected section
                if(type === 'image') {
                    if(imgSec) {
                        imgSec.style.display = 'block';
                        console.log('Image section shown');
                    }
                    const imgInput = document.getElementById('attachment-image-input');
                    if(imgInput) {
                        imgInput.onchange = handleImageAttachment;
                    }
                } else if(type === 'link') {
                    if(linkSec) {
                        linkSec.style.display = 'block';
                        console.log('Link section shown');
                    }
                } else if(type === 'file') {
                    if(fileSec) {
                        fileSec.style.display = 'block';
                        console.log('File section shown');
                    }
                    const fileInput = document.getElementById('attachment-file-input');
                    if(fileInput) {
                        fileInput.onchange = handleFileAttachment;
                    }
                }
            } catch(e) {
                console.error('selectAttachmentType error:', e);
            }
        }

        function handleImageAttachment(e) {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                currentAttachment = {
                    type: 'image',
                    name: file.name,
                    data: event.target.result
                };
                const preview = document.getElementById('attachment-image-preview');
                if(preview) {
                    preview.innerHTML = `<img src="${event.target.result}" style="max-width:100%; border-radius:8px;">`;
                }
                console.log('Image attachment set');
            };
            reader.readAsDataURL(file);
        }

        function handleFileAttachment(e) {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                // Convert to base64 for storage
                const binaryString = event.target.result;
                let base64 = '';
                const bytes = new Uint8Array(binaryString);
                for(let i = 0; i < bytes.byteLength; i++) {
                    base64 += String.fromCharCode(bytes[i]);
                }
                base64 = btoa(base64);
                
                currentAttachment = {
                    type: 'file',
                    name: file.name,
                    size: file.size,
                    mimeType: file.type,
                    data: base64
                };
                const preview = document.getElementById('attachment-file-preview');
                if(preview) {
                    preview.innerHTML = `<strong>✓ تم اختيار الملف:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
                }
                console.log('File attachment set');
            };
            reader.readAsArrayBuffer(file);
        }

        // Add the currently prepared attachment into the new-assignment attachments list
        function addCurrentAttachmentToNewAssignment() {
            if(!currentAttachment) {
                // maybe there's a link in the link input
                const linkInput = document.getElementById('attachment-link-input');
                if(linkInput && linkInput.value) {
                    newAssignmentAttachments.push({ type: 'link', url: linkInput.value });
                    linkInput.value = '';
                } else {
                    alert('لا يوجد ملحق جاهز للإضافة');
                    return;
                }
            } else {
                newAssignmentAttachments.push(currentAttachment);
                currentAttachment = null;
            }
            clearAttachment();
            renderNewAssignmentAttachmentsList();
        }

        function renderNewAssignmentAttachmentsList() {
            const list = document.getElementById('new-assignment-attachments-list');
            if(!list) return;
            if(newAssignmentAttachments.length === 0) { list.innerHTML = '<small style="color:var(--text-light);">لا توجد ملحقات مضافة</small>'; return; }
            list.innerHTML = '';
            newAssignmentAttachments.forEach((att, idx) => {
                let html = '';
                if(att.type === 'image') html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><img src="${att.data}" style="max-width:120px; display:block; margin-bottom:6px;"><button class="btn-sm btn-delete" onclick="removeNewAssignmentAttachment(${idx})">إزالة</button></div>`;
                else if(att.type === 'file') html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><strong>${att.name}</strong> <button class="btn-sm" style="background:#FF6B6B; color:#fff; margin-right:8px;" onclick="downloadNewAssignmentFile(${idx})">⬇️ تحميل</button><button class="btn-sm btn-delete" onclick="removeNewAssignmentAttachment(${idx})">إزالة</button></div>`;
                else if(att.type === 'link') html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><a href="${att.url}" target="_blank">${att.url}</a> <button class="btn-sm btn-delete" onclick="removeNewAssignmentAttachment(${idx})">إزالة</button></div>`;
                const wr = document.createElement('div'); wr.innerHTML = html; list.appendChild(wr);
            });
        }

        function removeNewAssignmentAttachment(i) { newAssignmentAttachments.splice(i,1); renderNewAssignmentAttachmentsList(); }

        function downloadNewAssignmentFile(i) {
            const att = newAssignmentAttachments[i]; if(!att || att.type !== 'file') return; const binaryString = atob(att.data.split(',')[1] || att.data); const bytes = new Uint8Array(binaryString.length); for(let k=0;k<binaryString.length;k++) bytes[k]=binaryString.charCodeAt(k); const blob = new Blob([bytes]); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=att.name || 'file'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        }

        function clearAttachment() {
            currentAttachment = null;
            document.getElementById('attachment-image-section').style.display = 'none';
            document.getElementById('attachment-link-section').style.display = 'none';
            document.getElementById('attachment-file-section').style.display = 'none';
            const imgInput = document.getElementById('attachment-image-input');
            const fileInput = document.getElementById('attachment-file-input');
            const linkInput = document.getElementById('attachment-link-input');
            if(imgInput) imgInput.value = '';
            if(fileInput) fileInput.value = '';
            if(linkInput) linkInput.value = '';
            document.getElementById('attachment-image-preview').innerHTML = '';
            document.getElementById('attachment-file-preview').innerHTML = '';
            console.log('Attachment cleared');
        }

        // --- NEWS: support multiple attachments ---
        // keep currentNewsAttachment (existing) and add array for new news
        newNewsAttachments = [];

        function addCurrentNewsAttachmentToNew() {
            if(!currentNewsAttachment) {
                const linkInput = document.getElementById('news-attachment-link-input');
                if(linkInput && linkInput.value) {
                    newNewsAttachments.push({ type: 'link', url: linkInput.value });
                    linkInput.value = '';
                } else { alert('لا يوجد ملحق جاهز للإضافة'); return; }
            } else {
                newNewsAttachments.push(currentNewsAttachment);
                currentNewsAttachment = null;
            }
            clearNewsAttachment();
            renderNewNewsAttachmentsList();
        }

        function renderNewNewsAttachmentsList() {
            const list = document.getElementById('new-news-attachments-list'); if(!list) return;
            if(newNewsAttachments.length === 0) { list.innerHTML = '<small style="color:var(--text-light);">لا توجد ملحقات مضافة</small>'; return; }
            list.innerHTML = '';
            newNewsAttachments.forEach((att, idx) => {
                let html = '';
                if(att.type === 'image') html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><img src="${att.data}" style="max-width:120px; display:block; margin-bottom:6px;"><button class="btn-sm btn-delete" onclick="removeNewNewsAttachment(${idx})">إزالة</button></div>`;
                else if(att.type === 'file') html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><strong>${att.name}</strong> <button class="btn-sm" style="background:#FF6B6B; color:#fff; margin-right:8px;" onclick="downloadNewNewsFile(${idx})">⬇️ تحميل</button><button class="btn-sm btn-delete" onclick="removeNewNewsAttachment(${idx})">إزالة</button></div>`;
                else if(att.type === 'link') html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><a href="${att.url}" target="_blank">${att.url}</a> <button class="btn-sm btn-delete" onclick="removeNewNewsAttachment(${idx})">إزالة</button></div>`;
                const wr = document.createElement('div'); wr.innerHTML = html; list.appendChild(wr);
            });
        }

        function removeNewNewsAttachment(i) { newNewsAttachments.splice(i,1); renderNewNewsAttachmentsList(); }

        function downloadNewNewsFile(i) { const att = newNewsAttachments[i]; if(!att || att.type !== 'file') return; const binaryString = atob(att.data.split(',')[1] || att.data); const bytes = new Uint8Array(binaryString.length); for(let k=0;k<binaryString.length;k++) bytes[k]=binaryString.charCodeAt(k); const blob = new Blob([bytes]); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=att.name || 'file'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

        // --- IMPORTANT LINKS: attachment handlers (link form) ---
        function selectLinkAttachmentType(type) {
            try {
                const imgSec = document.getElementById('link-attachment-image-section');
                const linkSec = document.getElementById('link-attachment-link-section');
                const fileSec = document.getElementById('link-attachment-file-section');
                if(imgSec) imgSec.style.display='none'; if(linkSec) linkSec.style.display='none'; if(fileSec) fileSec.style.display='none';
                if(type === 'image') { if(imgSec) imgSec.style.display='block'; const imgInput = document.getElementById('link-attachment-image-input'); if(imgInput) imgInput.onchange = handleLinkImageAttachment; }
                else if(type === 'link') { if(linkSec) linkSec.style.display='block'; }
                else if(type === 'file') { if(fileSec) fileSec.style.display='block'; const fileInput = document.getElementById('link-attachment-file-input'); if(fileInput) fileInput.onchange = handleLinkFileAttachment; }
            } catch(e) { console.error('selectLinkAttachmentType error', e); }
        }

        function handleLinkImageAttachment(e) {
            const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = function(ev){ currentLinkAttachment = { type:'image', name:file.name, data: ev.target.result }; const preview = document.getElementById('link-attachment-image-preview'); if(preview) preview.innerHTML = `<img src="${ev.target.result}" style="max-width:100%; border-radius:8px;">`; }; reader.readAsDataURL(file);
        }

        function handleLinkFileAttachment(e) { const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = function(ev){ const binaryString = ev.target.result; let base64=''; const bytes = new Uint8Array(binaryString); for(let i=0;i<bytes.byteLength;i++) base64 += String.fromCharCode(bytes[i]); base64 = btoa(base64); currentLinkAttachment = { type:'file', name:file.name, size:file.size, mimeType:file.type, data: base64 }; const preview = document.getElementById('link-attachment-file-preview'); if(preview) preview.innerHTML = `<strong>✓ تم اختيار الملف:</strong> ${file.name} (${(file.size/1024).toFixed(2)} KB)`; }; reader.readAsArrayBuffer(file); }

        function clearLinkAttachment() { currentLinkAttachment = null; const imgSec=document.getElementById('link-attachment-image-section'); const linkSec=document.getElementById('link-attachment-link-section'); const fileSec=document.getElementById('link-attachment-file-section'); if(imgSec) imgSec.style.display='none'; if(linkSec) linkSec.style.display='none'; if(fileSec) fileSec.style.display='none'; const ii=document.getElementById('link-attachment-image-input'); const fi=document.getElementById('link-attachment-file-input'); const li=document.getElementById('link-attachment-link-input'); if(ii) ii.value=''; if(fi) fi.value=''; if(li) li.value=''; const ip=document.getElementById('link-attachment-image-preview'); const fp=document.getElementById('link-attachment-file-preview'); if(ip) ip.innerHTML=''; if(fp) fp.innerHTML=''; }

        function addCurrentLinkAttachmentToNew() {
            if(!currentLinkAttachment) {
                const linkInput = document.getElementById('link-attachment-link-input');
                if(linkInput && linkInput.value) { newLinkAttachments.push({ type:'link', url: linkInput.value }); linkInput.value=''; }
                else { alert('لا يوجد ملحق جاهز للإضافة'); return; }
            } else { newLinkAttachments.push(currentLinkAttachment); currentLinkAttachment = null; }
            clearLinkAttachment(); renderNewLinkAttachmentsList();
        }

        function renderNewLinkAttachmentsList() { const list = document.getElementById('new-link-attachments-list'); if(!list) return; if(newLinkAttachments.length===0){ list.innerHTML = '<small style="color:var(--text-light);">لا توجد ملحقات مضافة</small>'; return; } list.innerHTML=''; newLinkAttachments.forEach((att, idx)=>{ let html=''; if(att.type==='image') html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><img src="${att.data}" style="max-width:120px; display:block; margin-bottom:6px;"><button class="btn-sm btn-delete" onclick="removeNewLinkAttachment(${idx})">إزالة</button></div>`; else if(att.type==='file') html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><strong>${att.name}</strong> <button class="btn-sm" style="background:#FF6B6B; color:#fff; margin-right:8px;" onclick="downloadNewLinkFile(${idx})">⬇️ تحميل</button><button class="btn-sm btn-delete" onclick="removeNewLinkAttachment(${idx})">إزالة</button></div>`; else if(att.type==='link') html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><a href="${att.url}" target="_blank">${att.url}</a> <button class="btn-sm btn-delete" onclick="removeNewLinkAttachment(${idx})">إزالة</button></div>`; const wr=document.createElement('div'); wr.innerHTML=html; list.appendChild(wr); }); }

        function removeNewLinkAttachment(i){ newLinkAttachments.splice(i,1); renderNewLinkAttachmentsList(); }

        function downloadNewLinkFile(i){ const att=newLinkAttachments[i]; if(!att||att.type!=='file')return; const binaryString = atob(att.data.split(',')[1]||att.data); const bytes=new Uint8Array(binaryString.length); for(let k=0;k<binaryString.length;k++) bytes[k]=binaryString.charCodeAt(k); const blob=new Blob([bytes]); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=att.name||'file'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

        function addAssignment() {
            const text = document.getElementById('new-assignment-text').value;
            console.log('addAssignment called, section=', selectedSection, 'text=', text);
            if(text) {
                if(!appData.assignments[selectedSection]) appData.assignments[selectedSection] = [];
                const dateInput = document.getElementById('new-assignment-date') ? document.getElementById('new-assignment-date').value : '';
                const subjInput = document.getElementById('new-assignment-subject') ? document.getElementById('new-assignment-subject').value : '';
                const dateVal = dateInput ? new Date(dateInput).getTime() : Date.now();
                
                // Handle attachments (multiple)
                const attachments = (Array.isArray(newAssignmentAttachments) ? newAssignmentAttachments.slice() : []);
                // if there's still a pending single attachment, include it too
                if(currentAttachment) { attachments.push(currentAttachment); currentAttachment = null; }
                const linkInputPending = document.getElementById('attachment-link-input');
                if(linkInputPending && linkInputPending.value) { attachments.push({ type: 'link', url: linkInputPending.value }); linkInputPending.value = ''; }

                const folderId = document.getElementById('new-assignment-folder') ? document.getElementById('new-assignment-folder').value : '';
                const assignmentObj = {
                    id: Date.now(),
                    text: text,
                    done: false,
                    date: dateVal,
                    subject: subjInput || '',
                    attachments: attachments,
                    folderId: folderId || ''
                };
                
                appData.assignments[selectedSection].push(assignmentObj);
                document.getElementById('new-assignment-text').value = '';
                if(document.getElementById('new-assignment-date')) document.getElementById('new-assignment-date').value = '';
                if(document.getElementById('new-assignment-subject')) document.getElementById('new-assignment-subject').value = '';
                clearAttachment();
                newAssignmentAttachments = [];
                renderNewAssignmentAttachmentsList();
                saveData();
                render();
                // تحديث سريع لقائمة الواجبات الحالية
                try { renderAssignments(); } catch(e) { console.warn('renderAssignments error', e); }
            }
        }

        function toggleTask(index) {
            appData.assignments[selectedSection][index].done = !appData.assignments[selectedSection][index].done;
            saveData();
            render();
        }
        function updateTaskText(index, val) { appData.assignments[selectedSection][index].text = val; saveData(); render(); }
        function deleteTask(index) { if(confirm('هل أنت متأكد من حذف هذا الواجب؟')) { appData.assignments[selectedSection].splice(index, 1); saveData(); render(); } }

        function viewImage(imageSrc) {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999;';
            modal.innerHTML = `
                <div style="position:relative; max-width:90vw; max-height:90vh;">
                    <img src="${imageSrc}" style="max-width:100%; max-height:100%; border-radius:8px;">
                    <button onclick="this.parentElement.parentElement.remove()" style="position:absolute; top:10px; right:10px; background:#fff; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer; font-size:20px;">✕</button>
                </div>
            `;
            document.body.appendChild(modal);
            modal.onclick = function(e) {
                if(e.target === modal) modal.remove();
            };
        }

        function downloadFile(taskIndex, fileName) {
            const task = appData.assignments[selectedSection][taskIndex];
            if(!task || !task.attachment || task.attachment.type !== 'file') return;
            
            // Convert ArrayBuffer to Blob
            let data;
            if(task.attachment.data instanceof ArrayBuffer) {
                data = new Blob([task.attachment.data]);
            } else {
                // If it's a base64 string, convert it
                const binaryString = atob(task.attachment.data.split(',')[1] || task.attachment.data);
                const bytes = new Uint8Array(binaryString.length);
                for(let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                data = new Blob([bytes]);
            }
            
            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        // --- Progress attachments support (multiple attachments per subject) ---
        const currentProgressAttachment = {}; // keyed by subject

        function escapeId(s){ return String(s).replace(/[^a-z0-9]/gi, '_'); }
        function escapeJs(s){ return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

        function selectProgressAttachmentType(subject, type) {
            const id = escapeId(subject);
            const imgSec = document.getElementById(`progress-attach-image-section-${id}`);
            const linkSec = document.getElementById(`progress-attach-link-section-${id}`);
            const fileSec = document.getElementById(`progress-attach-file-section-${id}`);
            if(imgSec) imgSec.style.display='none';
            if(linkSec) linkSec.style.display='none';
            if(fileSec) fileSec.style.display='none';
            if(type === 'image') {
                if(imgSec) imgSec.style.display='block';
                const inp = document.getElementById(`progress-attachment-image-input-${id}`);
                if(inp) inp.onchange = function(e){ handleProgressImageAttachment(e, subject); };
            } else if(type === 'link') {
                if(linkSec) linkSec.style.display='block';
            } else if(type === 'file') {
                if(fileSec) fileSec.style.display='block';
                const inp = document.getElementById(`progress-attachment-file-input-${id}`);
                if(inp) inp.onchange = function(e){ handleProgressFileAttachment(e, subject); };
            }
        }

        function handleProgressImageAttachment(e, subject) {
            const file = e.target.files[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = function(ev){
                currentProgressAttachment[subject] = { type: 'image', name: file.name, data: ev.target.result };
                const pv = document.getElementById(`progress-attachment-image-preview-${escapeId(subject)}`);
                if(pv) pv.innerHTML = `<img src="${ev.target.result}" style="max-width:120px; border-radius:6px;">`;
            };
            reader.readAsDataURL(file);
        }

        function handleProgressFileAttachment(e, subject) {
            const file = e.target.files[0]; if(!file) return;
            const reader = new FileReader();
            reader.onload = function(ev){
                const binary = ev.target.result;
                let base64 = '';
                const bytes = new Uint8Array(binary);
                for(let i=0;i<bytes.byteLength;i++) base64 += String.fromCharCode(bytes[i]);
                base64 = btoa(base64);
                currentProgressAttachment[subject] = { type: 'file', name: file.name, size: file.size, mimeType: file.type, data: base64 };
                const pv = document.getElementById(`progress-attachment-file-preview-${escapeId(subject)}`);
                if(pv) pv.innerHTML = `<strong>✓ تم اختيار الملف:</strong> ${file.name} (${(file.size/1024).toFixed(2)} KB)`;
            };
            reader.readAsArrayBuffer(file);
        }

        function addCurrentProgressAttachmentToSubject(subject) {
            if(!appData.progress[selectedSection]) appData.progress[selectedSection] = {};
            if(!appData.progress[selectedSection][subject]) appData.progress[selectedSection][subject] = { current:0, total:10, lessonName:'' };
            const attachments = appData.progress[selectedSection][subject].attachments = appData.progress[selectedSection][subject].attachments || [];
            const id = escapeId(subject);
            const linkInput = document.getElementById(`progress-attachment-link-input-${id}`);
            if(!currentProgressAttachment[subject]) {
                if(linkInput && linkInput.value) {
                    attachments.push({ type: 'link', url: linkInput.value });
                    linkInput.value = '';
                } else {
                    alert('لا يوجد ملحق جاهز للإضافة'); return;
                }
            } else {
                attachments.push(currentProgressAttachment[subject]);
                delete currentProgressAttachment[subject];
            }
            // clear UI sections
            const imgSec = document.getElementById(`progress-attach-image-section-${id}`);
            const linkSec = document.getElementById(`progress-attach-link-section-${id}`);
            const fileSec = document.getElementById(`progress-attach-file-section-${id}`);
            if(imgSec) imgSec.style.display='none'; if(linkSec) linkSec.style.display='none'; if(fileSec) fileSec.style.display='none';
            const imgIn = document.getElementById(`progress-attachment-image-input-${id}`); if(imgIn) imgIn.value='';
            const fileIn = document.getElementById(`progress-attachment-file-input-${id}`); if(fileIn) fileIn.value='';
            saveData(); renderProgressAttachments(subject);
        }

        function renderProgressAttachments(subject) {
            const id = escapeId(subject);
            const container = document.getElementById(`progress-attachments-${id}`);
            if(!container) return;
            const data = (appData.progress[selectedSection] && appData.progress[selectedSection][subject]) || {};
            const list = data.attachments || [];
            if(list.length === 0) { container.innerHTML = '<small style="color:var(--text-light);">لا توجد ملحقات</small>'; return; }
            container.innerHTML = '';
            list.forEach((att, idx) => {
                let html = '';
                if(att.type === 'image') html = `<div style="display:inline-block; margin:6px; background:#fff; padding:6px; border-radius:6px;"><img src="${att.data}" style="max-width:100px; display:block; margin-bottom:6px;"><div style="text-align:center;"><button class="btn-sm btn-delete" onclick="removeProgressAttachment('${escapeJs(subject)}', ${idx})">إزالة</button></div></div>`;
                else if(att.type === 'file') html = `<div style="padding:8px; background:#fff; border-radius:6px; margin-bottom:6px;"><strong>${att.name}</strong> <button class="btn-sm" style="background:#FF6B6B; color:#fff; margin-right:8px;" onclick="downloadProgressFile('${escapeJs(subject)}', ${idx})">⬇️ تحميل</button>${isEditMode?`<button class="btn-sm btn-delete" onclick="removeProgressAttachment('${escapeJs(subject)}', ${idx})">إزالة</button>`:''}</div>`;
                else if(att.type === 'link') html = `<div style="padding:6px; background:#fff; border-radius:6px; margin-bottom:6px;"><a href="${att.url}" target="_blank">${att.url}</a> ${isEditMode?`<button class="btn-sm btn-delete" onclick="removeProgressAttachment('${escapeJs(subject)}', ${idx})">إزالة</button>`:''}</div>`;
                const wr = document.createElement('div'); wr.innerHTML = html; container.appendChild(wr);
            });
        }

        function removeProgressAttachment(subject, idx) {
            if(!confirm('هل تريد حذف هذا الملحق؟')) return;
            const data = (appData.progress[selectedSection] && appData.progress[selectedSection][subject]) || {};
            if(!data.attachments || !Array.isArray(data.attachments)) return;
            data.attachments.splice(idx,1);
            saveData(); renderProgressAttachments(subject);
        }

        function downloadProgressFile(subject, idx) {
            const data = (appData.progress[selectedSection] && appData.progress[selectedSection][subject]) || {};
            const att = data.attachments && data.attachments[idx]; if(!att || att.type !== 'file') return;
            const binaryString = atob(att.data.split(',')[1] || att.data);
            const bytes = new Uint8Array(binaryString.length);
            for(let k=0;k<binaryString.length;k++) bytes[k]=binaryString.charCodeAt(k);
            const blob = new Blob([bytes]); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=att.name||'file'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        }

        function renderSupport() {
            const container = document.getElementById('support-list');
            container.innerHTML = '';
            appData.support.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'data-card';
                div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value">${item.name}</h3>
                            <input class="editable-field editable-input" value="${item.name}" onchange="updateSupport(${index}, 'name', this.value)">
                            <p class="editable-value" style="color:gray; font-size:0.9rem">${item.role}</p>
                            <input class="editable-field editable-input" value="${item.role}" onchange="updateSupport(${index}, 'role', this.value)">
                        </div>
                        <div style="text-align:left;">
                            ${item.phone ? `<a href="https://wa.me/${item.phone}" class="btn-link editable-value">تواصل</a>` : ``}
                            <input class="editable-field editable-input" value="${item.phone}" onchange="updateSupport(${index}, 'phone', this.value)">
                        </div>
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteSupport(${index})">حذف جهة الاتصال</button>
                `;
                container.appendChild(div);
            });
        }

        function addSupport() {
            const name = document.getElementById('new-support-name').value;
            const role = document.getElementById('new-support-role').value;
            const phone = document.getElementById('new-support-num').value;
            if(name && phone) { 
                appData.support.push({ id: Date.now(), name, role, phone }); 
                document.getElementById('new-support-name').value=''; 
                document.getElementById('new-support-role').value=''; 
                document.getElementById('new-support-num').value=''; 
                saveData();
                render();
            }
        }
        function updateSupport(index, key, val) { appData.support[index][key] = val; saveData(); render(); }
        function deleteSupport(index) { if(confirm('حذف جهة الاتصال؟')) { appData.support.splice(index, 1); saveData(); render(); } }

        function renderSummaries() {
            const container = document.getElementById('summaries-list');
            container.innerHTML = '';
            appData.summaries.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'data-card';
                div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value">${item.title}</h3>
                            <input class="editable-field editable-input" value="${item.title}" onchange="updateSummary(${index}, 'title', this.value)">
                        </div>
                        ${item.link ? `<a href="${item.link}" target="_blank" class="btn-link editable-value">تحميل ⬇️</a>` : ``}
                    </div>
                    <div class="editable-field">
                        <input class="editable-input" value="${item.link}" placeholder="رابط الملف" onchange="updateSummary(${index}, 'link', this.value)">
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteSummary(${index})">حذف الملف</button>
                `;
                container.appendChild(div);
            });
        }
        function addSummary() {
            const title = document.getElementById('new-summ-title').value;
            const link = document.getElementById('new-summ-link').value;
            if(title && link) { 
                appData.summaries.push({ id: Date.now(), title, link }); 
                document.getElementById('new-summ-title').value=''; 
                document.getElementById('new-summ-link').value=''; 
                saveData();
                render();
            }
        }
        function updateSummary(index, key, val) { appData.summaries[index][key] = val; saveData(); render(); }
        function deleteSummary(index) { if(confirm('حذف الملف؟')) { appData.summaries.splice(index, 1); saveData(); render(); } }

        // Convert 24-hour 'HH:MM' string to 12-hour with Arabic markers (ص / م)
        function formatTime12(time24) {
            if(!time24) return '';
            // if already a timestamp
            if(typeof time24 === 'number') {
                const d = new Date(time24);
                let h = d.getHours();
                const m = String(d.getMinutes()).padStart(2,'0');
                const ampm = h >= 12 ? 'م' : 'ص';
                h = h % 12; if(h === 0) h = 12;
                return `${h}:${m} ${ampm}`;
            }
            const m = String(time24).match(/^(\d{1,2}):(\d{2})$/);
            if(!m) return time24;
            let hh = parseInt(m[1],10);
            const mm = m[2];
            const ampm = hh >= 12 ? 'م' : 'ص';
            hh = hh % 12; if(hh === 0) hh = 12;
            return `${hh}:${mm} ${ampm}`;
        }


        const WEEK_DAYS_AR=[['Saturday','السبت'],['Sunday','الأحد'],['Monday','الاثنين'],['Tuesday','الثلاثاء'],['Wednesday','الأربعاء'],['Thursday','الخميس'],['Friday','الجمعة']];
        function currentWeekDayKey(){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];}
        function ensureWeeklyModel(){appData.weeklySchedule=appData.weeklySchedule||{};WEEK_DAYS_AR.forEach(([d])=>{appData.weeklySchedule[d]=appData.weeklySchedule[d]||{};for(let i=1;i<=appData.sections;i++){const cur=appData.weeklySchedule[d][i];if(Array.isArray(cur))continue;const arr=[];if(cur&&typeof cur==='object')Object.entries(cur).forEach(([subject,e])=>arr.push({id:Date.now()+Math.random(),subject,teacher:'',from:e?.from||'',to:e?.to||'',link:e?.link||'',note:e?.note||''}));appData.weeklySchedule[d][i]=arr;}});}
        function getWeeklyEntries(day,sec){ensureWeeklyModel();return appData.weeklySchedule?.[day]?.[sec]||[];}
        function getEffectiveLiveLinks(){const today=currentWeekDayKey();const direct=(appData.liveLinks&&appData.liveLinks[selectedSection])||{};if(Object.keys(direct).length)return{links:direct,source:'today'};if(appData.weeklyScheduleEnabled){const links={};getWeeklyEntries(today,selectedSection).forEach(e=>{if(e&&e.subject)links[e.subject]={link:e.link||'',from:e.from||'',to:e.to||'',note:e.note||'',teacher:e.teacher||''};});if(Object.keys(links).length)return{links,source:'weekly'};}return{links:{},source:'none'};}
        function effectiveSourceLabel(s){return s==='weekly'?'تم تحميل حصص اليوم من الجدول الأسبوعي تلقائياً.':s==='today'?'هذه هي الحصص المباشرة التي أدخلها المدير لهذا اليوم.':'';}
        function renderWeeklySchedule(){
            const box=document.getElementById('weekly-schedule-list');if(!box)return;ensureWeeklyModel();const day=((document.getElementById('weekly-day-select')||{}).value)||currentWeekDayKey();const sec=Number(((document.getElementById('weekly-section-select')||{}).value)||selectedSection);const entries=getWeeklyEntries(day,sec);box.innerHTML='';
            const toolbar=document.createElement('div');toolbar.className='schedule-toolbar';toolbar.innerHTML='<div><label>اليوم</label><select id="weekly-day-select" class="editable-input">'+WEEK_DAYS_AR.map(x=>'<option value="'+x[0]+'" '+(day===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+'</select></div><div><label>الشعبة</label><select id="weekly-section-select" class="editable-input">'+Array.from({length:appData.sections},(_,i)=>'<option value="'+(i+1)+'" '+(sec===i+1?'selected':'')+'>'+escapeHtml(getSectionLabel(i+1))+'</option>').join('')+'</select></div><label class="admin-check"><input id="weekly-enabled-toggle" type="checkbox" '+(appData.weeklyScheduleEnabled?'checked':'')+'> استخدام الجدول تلقائياً</label>';
            box.appendChild(toolbar);toolbar.querySelector('#weekly-day-select').onchange=renderWeeklySchedule;toolbar.querySelector('#weekly-section-select').onchange=renderWeeklySchedule;toolbar.querySelector('#weekly-enabled-toggle').onchange=e=>toggleWeeklySchedule(e.target.checked);
            const note=document.createElement('div');note.className='notice';note.textContent='القائمة تتكرر أسبوعياً بحسب اليوم والشعبة، ويمكنك وضع أكثر من حصة في اليوم نفسه.';box.appendChild(note);
            const list=document.createElement('div');list.className='schedule-list';entries.forEach((e,i)=>{const row=document.createElement('div');row.className='schedule-row';row.innerHTML='<div class="schedule-index">'+(i+1)+'</div><div><div class="schedule-grid-fields"><input class="editable-input" value="'+escapeHtml(e.subject||'')+'" placeholder="المادة"><input class="editable-input" value="'+escapeHtml(e.teacher||'')+'" placeholder="المعلم (اختياري)"><input type="time" class="editable-input" value="'+(e.from||'')+'"><input type="time" class="editable-input" value="'+(e.to||'')+'"><input class="editable-input full" value="'+escapeHtml(e.link||'')+'" placeholder="رابط الحصة (اختياري)"><input class="editable-input full" value="'+escapeHtml(e.note||'')+'" placeholder="ملاحظة (اختياري)"></div><div class="schedule-actions"><button class="btn-sm btn-add">حفظ</button><button class="btn-sm btn-delete">حذف</button></div></div>';const inp=row.querySelectorAll('input');row.querySelector('.btn-add').onclick=()=>{e.subject=inp[0].value.trim();e.teacher=inp[1].value.trim();e.from=inp[2].value;e.to=inp[3].value;e.link=inp[4].value.trim();e.note=inp[5].value.trim();saveData();renderWeeklySchedule();};row.querySelector('.btn-delete').onclick=()=>{entries.splice(i,1);saveData();renderWeeklySchedule();};list.appendChild(row);});
            const add=document.createElement('div');add.className='schedule-add';add.innerHTML='<h4>إضافة حصة إلى '+escapeHtml(getSectionLabel(sec))+' — '+escapeHtml((WEEK_DAYS_AR.find(x=>x[0]===day)||['',day])[1])+'</h4><div class="schedule-grid-fields"><input id="ws-subject" class="editable-input" placeholder="المادة"><input id="ws-teacher" class="editable-input" placeholder="المعلم (اختياري)"><input id="ws-from" type="time" class="editable-input"><input id="ws-to" type="time" class="editable-input"><input id="ws-link" class="editable-input full" placeholder="رابط الحصة (اختياري)"><input id="ws-note" class="editable-input full" placeholder="ملاحظة (اختياري)"></div><button class="btn-add btn-sm" onclick="weeklyAddNew()">+ إضافة الحصة</button>';list.appendChild(add);box.appendChild(list);
        }
        function weeklyAddNew(){if(!window.IS_ADMIN)return;const item={id:Date.now(),subject:(document.getElementById('ws-subject').value||'').trim(),teacher:(document.getElementById('ws-teacher').value||'').trim(),from:document.getElementById('ws-from').value,to:document.getElementById('ws-to').value,link:(document.getElementById('ws-link').value||'').trim(),note:(document.getElementById('ws-note').value||'').trim()};if(!item.subject)return alert('اكتب اسم المادة أولاً.');const day=document.getElementById('weekly-day-select').value,sec=Number(document.getElementById('weekly-section-select').value);getWeeklyEntries(day,sec).push(item);saveData();renderWeeklySchedule();}
        function toggleWeeklySchedule(v){if(!window.IS_ADMIN)return;appData.weeklyScheduleEnabled=!!v;saveData();renderWeeklySchedule();}
        function renderLiveLinks() {
            const container = document.getElementById('live-list');
            container.innerHTML = '';
            const effective = getEffectiveLiveLinks();
            const banner = document.createElement('div');
            if(effectiveSourceLabel(effective.source)){ banner.className='notice'; banner.style.cssText='padding:10px 12px;margin-bottom:12px;'; banner.textContent=effectiveSourceLabel(effective.source); container.appendChild(banner); }
            const links = effective.links || {};
            // If there are existing entries for this section, list them (allow renaming)
            const keys = Object.keys(links);
            if(keys.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light); text-align:center;">لا توجد روابط مسجلة لهذه الشعبة حالياً. أضف مادة جديدة أدناه.</p>';
            }

            keys.forEach(sub => {
                const entry = links[sub] && typeof links[sub] === 'object' ? links[sub] : { link: '', from: '', to: '' };
                const div = document.createElement('div');
                div.className = 'data-card';
                div.innerHTML = `
                    <div class="data-header">
                        <h3 class="lesson-name">${sub}</h3>
                        ${entry.link ? `<a href="${entry.link}" target="_blank" class="btn-link editable-value">دخول الحصة 🎉</a>` : '<span class="editable-value" style="color:gray">لا يوجد رابط</span>'}
                        ${entry.note ? `<div class="editable-value" style="color:var(--text-light); margin-top:6px;">${entry.note}</div>` : ''}
                        <p class="editable-value session-info">موعد الحصة: ${entry.from ? formatTime12(entry.from) : '--'} إلى ${entry.to ? formatTime12(entry.to) : '--'}</p>
                    </div>
                    <div class="editable-field">
                        <label>اسم المادة:</label>
                        <input type="text" class="editable-input" value="${sub}" onchange="renameLiveSubject('${escapeForJs(sub)}', this.value)">
                        <label style="margin-top:8px;">رابط الحصة:</label>
                        <input type="text" class="editable-input" value="${entry.link}" placeholder="الصق الرابط هنا" onchange="updateLiveLink('${escapeForJs(sub)}', 'link', this.value)">
                        <label style="margin-top:8px;">ملاحظة عن الحصة (اختياري):</label>
                        <textarea class="editable-input" onchange="updateLiveLink('${escapeForJs(sub)}', 'note', this.value)" style="min-height:60px;">${entry.note || ''}</textarea>
                        <div style="display:flex; gap:10px; margin-top:8px;">
                            <div style="flex:1">
                                <label>من:</label>
                                <input type="time" class="editable-input" value="${entry.from}" onchange="updateLiveLink('${escapeForJs(sub)}', 'from', this.value)">
                            </div>
                            <div style="flex:1">
                                <label>إلى:</label>
                                <input type="time" class="editable-input" value="${entry.to}" onchange="updateLiveLink('${escapeForJs(sub)}', 'to', this.value)">
                            </div>
                        </div>
                        <div style="margin-top:8px; display:flex; gap:8px;">
                            <button class="btn-sm btn-delete" onclick="deleteLiveEntry('${escapeForJs(sub)}')">حذف هذه المادة من الشعبة</button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });

            // add-new-container for adding a new live entry in this section
            const addBox = document.createElement('div');
            addBox.className = 'add-new-container';
                addBox.innerHTML = `
                <h4>إضافة رابط حصّة جديد</h4>
                <input type="text" id="new-live-subject" class="editable-input" placeholder="اسم المادة (مثلاً: الرياضيات)" style="margin-bottom:8px;">
                <input type="text" id="new-live-link" class="editable-input" placeholder="رابط الحصة (https://...)" style="margin-bottom:8px;">
                <label style="margin-top:6px;">ملاحظة عن الحصة (اختياري):</label>
                <input type="text" id="new-live-note" class="editable-input" placeholder="اكتب ملاحظة قصيرة هنا" style="margin-bottom:8px;">
                <div style="display:flex; gap:8px; margin-bottom:8px;">
                    <input type="time" id="new-live-from" class="editable-input" style="flex:1">
                    <input type="time" id="new-live-to" class="editable-input" style="flex:1">
                </div>
                <button class="btn-sm btn-add" onclick="addLiveEntry()">إضافة</button>
            `;
            container.appendChild(addBox);
        }
        
        // helper to safely escape subject names used inside inline event handlers
        function escapeForJs(s) {
            return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\"/g, '\\"');
        }
        function updateLiveLink(subject, key, val) {
            if(!appData.liveLinks[selectedSection]) appData.liveLinks[selectedSection] = {};
            let cur = appData.liveLinks[selectedSection][subject];
            if(!cur || typeof cur !== 'object') cur = { link: '', from: '', to: '', note: '' };
            cur[key] = val;
            appData.liveLinks[selectedSection][subject] = cur;
            saveData();
            render();
        }

        function addLiveEntry() {
            const name = (document.getElementById('new-live-subject') || {}).value || '';
            const link = (document.getElementById('new-live-link') || {}).value || '';
            const note = (document.getElementById('new-live-note') || {}).value || '';
            const from = (document.getElementById('new-live-from') || {}).value || '';
            const to = (document.getElementById('new-live-to') || {}).value || '';
            const subject = name.trim();
            if(!subject) { alert('ادخل اسم المادة أولاً'); return; }
            if(!appData.liveLinks[selectedSection]) appData.liveLinks[selectedSection] = {};
            if(appData.liveLinks[selectedSection][subject]) {
                if(!confirm('هناك مادة بنفس الاسم في الشعبة الحالية. هل تريد استبدالها؟')) return;
            }
            appData.liveLinks[selectedSection][subject] = { link: link.trim(), from: from, to: to, note: note.trim() };
            saveData();
            render();
            // Clear inputs
            try { document.getElementById('new-live-subject').value = ''; document.getElementById('new-live-link').value = ''; document.getElementById('new-live-note').value = ''; document.getElementById('new-live-from').value = ''; document.getElementById('new-live-to').value = ''; } catch(e) {}
        }

        function renameLiveSubject(oldName, newName) {
            const newN = (newName || '').trim();
            if(!newN) { alert('اسم المادة لا يمكن أن يكون فارغاً'); render(); return; }
            if(!appData.liveLinks[selectedSection] || !appData.liveLinks[selectedSection][oldName]) { render(); return; }
            if(oldName === newN) return;
            if(appData.liveLinks[selectedSection][newN]) { alert('هناك مادة بنفس الاسم موجودة بالفعل في هذه الشعبة'); render(); return; }
            appData.liveLinks[selectedSection][newN] = appData.liveLinks[selectedSection][oldName];
            delete appData.liveLinks[selectedSection][oldName];
            saveData();
            render();
        }

        function deleteLiveEntry(subject) {
            if(!appData.liveLinks[selectedSection]) appData.liveLinks[selectedSection] = {};
            if(!confirm('هل تريد حذف هذه المادة من الشعبة الحالية؟')) return;
            delete appData.liveLinks[selectedSection][subject];
            saveData();
            render();
        }

        function deleteLiveLink(subject) {
            if(!appData.liveLinks[selectedSection]) appData.liveLinks[selectedSection] = {};
            if(confirm('هل تريد حذف رابط هذه المادة في الشعبة الحالية؟')) {
                // remove the property entirely so it no longer appears in the list
                try { delete appData.liveLinks[selectedSection][subject]; } catch(e) { appData.liveLinks[selectedSection][subject] = undefined; }
                saveData();
                render();
            }
        }

        function openManageSubjects(){
            if(!window.IS_OWNER) return;
            let modal=document.getElementById('subject-manager-modal');
            if(!modal){
                modal=document.createElement('div');
                modal.id='subject-manager-modal';
                modal.className='modal-overlay';
                modal.innerHTML='<div class="modal-box subject-manager"><div class="modal-head"><h3>إدارة المواد</h3><button class="modal-close" aria-label="إغلاق">×</button></div><div id="subject-manager-list" class="management-list"></div><div class="modal-form"><input id="new-subject-name" class="editable-input" placeholder="اسم المادة"><button class="btn-add btn-sm" id="subject-add-btn">إضافة مادة</button></div></div>';
                document.body.appendChild(modal);
                modal.querySelector('.modal-close').onclick=()=>modal.remove();
                modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
                modal.querySelector('#subject-add-btn').onclick=()=>{addSubject();renderSubjectManager();};
            }
            renderSubjectManager();
            modal.classList.add('open');
        }
        function renderSubjectManager(){
            const box=document.getElementById('subject-manager-list'); if(!box) return;
            if(!appData.subjects.length){ box.innerHTML='<div class="notice">لا توجد مواد بعد.</div>'; return; }
            box.innerHTML=appData.subjects.map((subject,i)=>'<div class="management-row"><span class="subject-name">'+escapeHtml(subject)+'</span><button class="btn-delete btn-sm" onclick="deleteSubject('+JSON.stringify(subject)+');renderSubjectManager();">حذف</button></div>').join('');
        }

        function deleteSubject(subject) {
            if(!confirm('هل أنت متأكد من حذف المادة نهائياً من جميع الشعب؟ هذه الخطوة ستحذف التقدم والروابط الخاصة بالمادة.')) return;
            const idx = appData.subjects.indexOf(subject);
            if(idx > -1) appData.subjects.splice(idx, 1);
            // remove from progress and liveLinks across sections
            for(let i=1;i<=appData.sections;i++){
                if(appData.progress && appData.progress[i]) delete appData.progress[i][subject];
                if(appData.liveLinks && appData.liveLinks[i]) delete appData.liveLinks[i][subject];
            }
            saveData();
            render();
        }

        function addSubject() {
            const name = document.getElementById('new-subject-name').value.trim();
            if(!name) return;
            if(appData.subjects.includes(name)) { alert('المادة موجودة مسبقاً'); return; }
            appData.subjects.push(name);
            // initialize progress and liveLinks for all sections
            for(let i=1;i<=appData.sections;i++){
                if(!appData.progress[i]) appData.progress[i] = {};
                appData.progress[i][name] = { current: 1, total: 20 };
                if(!appData.liveLinks[i]) appData.liveLinks[i] = {};
                appData.liveLinks[i][name] = { link: '', from: '', to: '' };
            }
            document.getElementById('new-subject-name').value = '';
            saveData();
            render();
        }

        // --- NEWS ATTACHMENT FUNCTIONS ---

        function selectNewsAttachmentType(type) {
            console.log('selectNewsAttachmentType called with type:', type);
            try {
                const imgSec = document.getElementById('news-attachment-image-section');
                const linkSec = document.getElementById('news-attachment-link-section');
                const fileSec = document.getElementById('news-attachment-file-section');
                
                if(imgSec) imgSec.style.display = 'none';
                if(linkSec) linkSec.style.display = 'none';
                if(fileSec) fileSec.style.display = 'none';
                
                if(type === 'image') {
                    if(imgSec) {
                        imgSec.style.display = 'block';
                        console.log('News image section shown');
                    }
                    const imgInput = document.getElementById('news-attachment-image-input');
                    if(imgInput) {
                        imgInput.onchange = handleNewsImageAttachment;
                    }
                } else if(type === 'link') {
                    if(linkSec) {
                        linkSec.style.display = 'block';
                        console.log('News link section shown');
                    }
                } else if(type === 'file') {
                    if(fileSec) {
                        fileSec.style.display = 'block';
                        console.log('News file section shown');
                    }
                    const fileInput = document.getElementById('news-attachment-file-input');
                    if(fileInput) {
                        fileInput.onchange = handleNewsFileAttachment;
                    }
                }
            } catch(e) {
                console.error('selectNewsAttachmentType error:', e);
            }
        }

        function handleNewsImageAttachment(e) {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                currentNewsAttachment = {
                    type: 'image',
                    name: file.name,
                    data: event.target.result
                };
                const preview = document.getElementById('news-attachment-image-preview');
                if(preview) {
                    preview.innerHTML = `<img src="${event.target.result}" style="max-width:100%; border-radius:8px;">`;
                }
                console.log('News image attachment set');
            };
            reader.readAsDataURL(file);
        }

        function handleNewsFileAttachment(e) {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                const binaryString = event.target.result;
                let base64 = '';
                const bytes = new Uint8Array(binaryString);
                for(let i = 0; i < bytes.byteLength; i++) {
                    base64 += String.fromCharCode(bytes[i]);
                }
                base64 = btoa(base64);
                
                currentNewsAttachment = {
                    type: 'file',
                    name: file.name,
                    size: file.size,
                    mimeType: file.type,
                    data: base64
                };
                const preview = document.getElementById('news-attachment-file-preview');
                if(preview) {
                    preview.innerHTML = `<strong>✓ تم اختيار الملف:</strong> ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
                }
                console.log('News file attachment set');
            };
            reader.readAsArrayBuffer(file);
        }

        function clearNewsAttachment() {
            currentNewsAttachment = null;
            document.getElementById('news-attachment-image-section').style.display = 'none';
            document.getElementById('news-attachment-link-section').style.display = 'none';
            document.getElementById('news-attachment-file-section').style.display = 'none';
            const imgInput = document.getElementById('news-attachment-image-input');
            const fileInput = document.getElementById('news-attachment-file-input');
            const linkInput = document.getElementById('news-attachment-link-input');
            if(imgInput) imgInput.value = '';
            if(fileInput) fileInput.value = '';
            if(linkInput) linkInput.value = '';
            document.getElementById('news-attachment-image-preview').innerHTML = '';
            document.getElementById('news-attachment-file-preview').innerHTML = '';
            console.log('News attachment cleared');
        }

        // Unified downloader for attachments: type = 'assignment' | 'news' | 'important'
        function downloadAttachment(type, itemIndex, attIndex) {
            let list = null;
            if(type === 'assignment') list = appData.assignments[selectedSection];
            else if(type === 'news') list = appData.news;
            else if(type === 'important') list = appData.importantLinks;
            if(!list) return;
            const item = list[itemIndex];
            if(!item || !Array.isArray(item.attachments)) return;
            const att = item.attachments[attIndex];
            if(!att || att.type !== 'file') return;

            let dataBlob = null;
            if(att.data instanceof ArrayBuffer) dataBlob = new Blob([att.data]);
            else {
                const binaryString = atob(att.data.split(',')[1] || att.data);
                const bytes = new Uint8Array(binaryString.length);
                for(let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                dataBlob = new Blob([bytes]);
            }
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url; a.download = att.name || 'file'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        }
        // --- NEWS FUNCTIONS ---
        function renderNews() {
            const container = document.getElementById('news-list');
            container.innerHTML = '';
            if(appData.news.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light); text-align:center;">لا توجد أخبار حالياً</p>';
                return;
            }
            appData.news.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'data-card';
                
                // Attachments HTML (support multiple)
                let attachmentsHtml = '';
                if(Array.isArray(item.attachments) && item.attachments.length > 0) {
                    item.attachments.forEach((att, ai) => {
                        if(att.type === 'image') {
                            attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📷 صورة:</strong>
                                    <img src="${att.data}" style="max-width:100%; max-height:200px; border-radius:6px; margin-top:6px; cursor:pointer;" onclick="viewImage('${att.data.replace(/'/g, "\\'")}')" >
                                </div>
                            `;
                        } else if(att.type === 'link') {
                            attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">🔗 رابط:</strong>
                                    <a href="${att.url}" target="_blank" style="display:inline-block; margin-right:8px; color:#0066cc; text-decoration:none;">فتح الرابط</a>
                                </div>
                            `;
                        } else if(att.type === 'file') {
                            attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📎 ملف:</strong>
                                    <button class="btn-sm" style="background:#FF6B6B; color:white; margin-right:8px;" onclick="downloadAttachment('news', ${index}, ${ai})">⬇️ تحميل</button>
                                    <span style="color:#999; font-size:0.85rem;">${att.name || 'ملف'}</span>
                                </div>
                            `;
                        }
                    });
                }
                
                div.innerHTML = `
                    <div class="data-header">
                        <h3 class="editable-value">${item.title}</h3>
                        <button class="btn-sm btn-delete" onclick="deleteNews(${index})">حذف</button>
                    </div>
                    <p class="editable-value" style="color:var(--text-light); margin-bottom:10px;">${item.content}</p>
                    ${attachmentsHtml}
                    <div class="editable-field">
                        <label>العنوان:</label>
                        <input class="editable-input" value="${item.title}" onchange="updateNews(${index}, 'title', this.value)" style="margin-bottom: 10px;">
                        <label>المحتوى:</label>
                        <textarea class="editable-textarea" onchange="updateNews(${index}, 'content', this.value)" style="min-height: 80px;">${item.content}</textarea>
                    </div>
                `;
                container.appendChild(div);
            });
        }
        function addNews() {
            const title = document.getElementById('new-news-title').value;
            const content = document.getElementById('new-news-content').value;
            if(title && content) {
                // Handle multiple attachments for news
                const attachments = (Array.isArray(newNewsAttachments) ? newNewsAttachments.slice() : []);
                if(currentNewsAttachment) { attachments.push(currentNewsAttachment); currentNewsAttachment = null; }
                const linkInputPending = document.getElementById('news-attachment-link-input');
                if(linkInputPending && linkInputPending.value) { attachments.push({ type: 'link', url: linkInputPending.value }); linkInputPending.value = ''; }

                const newsObj = {
                    id: Date.now(),
                    title: title,
                    content: content,
                    attachments: attachments
                };
                
                appData.news.push(newsObj);
                document.getElementById('new-news-title').value = '';
                document.getElementById('new-news-content').value = '';
                clearNewsAttachment();
                newNewsAttachments = [];
                renderNewNewsAttachmentsList();
                saveData();
                render();
                try { renderNews(); } catch(e) { console.warn('renderNews error', e); }
            }
        }
        function updateNews(index, key, val) { appData.news[index][key] = val; saveData(); render(); }
        function deleteNews(index) { if(confirm('حذف هذا الخبر؟')) { appData.news.splice(index, 1); saveData(); render(); } }

        // --- IMPORTANT LINKS FUNCTIONS ---
        function renderImportantLinks() {
            const container = document.getElementById('important-links-list');
            container.innerHTML = '';
            if(appData.importantLinks.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light); text-align:center;">لا توجد روابط مهمة حالياً</p>';
                return;
            }
            appData.importantLinks.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'data-card';
                
                // Attachments HTML (support multiple)
                let attachmentsHtml = '';
                if(Array.isArray(item.attachments) && item.attachments.length > 0) {
                    item.attachments.forEach((att, ai) => {
                        if(att.type === 'image') {
                            attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📷 صورة:</strong>
                                    <img src="${att.data}" style="max-width:100%; max-height:200px; border-radius:6px; margin-top:6px; cursor:pointer;" onclick="viewImage('${att.data.replace(/'/g, "\\'")}')" >
                                </div>
                            `;
                        } else if(att.type === 'link') {
                            attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">🔗 رابط:</strong>
                                    <a href="${att.url}" target="_blank" style="display:inline-block; margin-right:8px; color:#0066cc; text-decoration:none;">فتح الرابط</a>
                                </div>
                            `;
                        } else if(att.type === 'file') {
                            attachmentsHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📎 ملف:</strong>
                                    <button class="btn-sm" style="background:#FF6B6B; color:white; margin-right:8px;" onclick="downloadAttachment('important', ${index}, ${ai})">⬇️ تحميل</button>
                                    <span style="color:#999; font-size:0.85rem;">${att.name || 'ملف'}</span>
                                </div>
                            `;
                        }
                    });
                }
                
                div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value">${item.title}</h3>
                            <input class="editable-field editable-input" value="${item.title}" onchange="updateImportantLink(${index}, 'title', this.value)">
                        </div>
                        ${item.url ? `<a href="${item.url}" target="_blank" class="btn-link editable-value">فتح الرابط ↗️</a>` : ``}
                    </div>
                    <div class="editable-field">
                        <input class="editable-input" value="${item.url}" placeholder="الرابط" onchange="updateImportantLink(${index}, 'url', this.value)">
                    </div>
                    ${attachmentsHtml}
                    <button class="btn-sm btn-delete" onclick="deleteImportantLink(${index})">حذف</button>
                `;
                container.appendChild(div);
            });
        }
        function addImportantLink() {
            const title = document.getElementById('new-link-title').value;
            const url = document.getElementById('new-link-url').value;
            if(title && url) {
                const attachments = (Array.isArray(newLinkAttachments) ? newLinkAttachments.slice() : []);
                if(currentLinkAttachment) { attachments.push(currentLinkAttachment); currentLinkAttachment = null; }
                const linkInputPending = document.getElementById('link-attachment-link-input');
                if(linkInputPending && linkInputPending.value) { attachments.push({ type: 'link', url: linkInputPending.value }); linkInputPending.value = ''; }

                appData.importantLinks.push({ id: Date.now(), title, url, attachments: attachments });
                document.getElementById('new-link-title').value = '';
                document.getElementById('new-link-url').value = '';
                newLinkAttachments = [];
                renderNewLinkAttachmentsList();
                saveData();
                render();
            }
        }
        function updateImportantLink(index, key, val) { appData.importantLinks[index][key] = val; saveData(); render(); }
        function deleteImportantLink(index) { if(confirm('حذف هذا الرابط؟')) { appData.importantLinks.splice(index, 1); saveData(); render(); } }

        // --- TEACHERS FUNCTIONS ---
        function renderTeachers() {
            const container = document.getElementById('teachers-list');
            container.innerHTML = '';
            const list = appData.teachers[selectedSection] || [];
            if(!list || list.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light); text-align:center;">لا يوجد أساتذة مسجلين لهذه الشعبة حالياً</p>';
                return;
            }
            list.forEach((t, index) => {
                const div = document.createElement('div');
                div.className = 'data-card';
                div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value">${t.name}</h3>
                            <input class="editable-field editable-input" value="${t.name}" onchange="updateTeacher(${index}, 'name', this.value)">
                            <p class="editable-value" style="color:gray; font-size:0.9rem">${t.role || ''}</p>
                            <input class="editable-field editable-input" value="${t.role || ''}" onchange="updateTeacher(${index}, 'role', this.value)">
                            <p class="editable-value" style="color:gray; font-size:0.85rem; margin-top:5px;">${t.phone || ''}</p>
                            <input class="editable-field editable-input" value="${t.phone || ''}" onchange="updateTeacher(${index}, 'phone', this.value)">
                        </div>
                        <div style="text-align:left;">
                            ${t.phone ? `<a href="tel:${t.phone}" class="btn-link editable-value">اتصال</a>` : ''}
                        </div>
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteTeacher(${index})">حذف</button>
                `;
                container.appendChild(div);
            });
        }
        function addTeacher() {
            const name = document.getElementById('new-teacher-name').value.trim();
            const role = document.getElementById('new-teacher-role').value.trim();
            const phone = document.getElementById('new-teacher-phone').value.trim();
            if(!name) return;
            if(!appData.teachers[selectedSection]) appData.teachers[selectedSection] = [];
            appData.teachers[selectedSection].push({ id: Date.now(), name, role, phone });
            document.getElementById('new-teacher-name').value = '';
            document.getElementById('new-teacher-role').value = '';
            document.getElementById('new-teacher-phone').value = '';
            saveData();
            render();
            try { renderTeachers(); } catch(e) { console.warn('renderTeachers error', e); }
        }
        function updateTeacher(index, key, val) { appData.teachers[selectedSection][index][key] = val; saveData(); render(); }
        function deleteTeacher(index) { if(confirm('حذف هذا الأستاذ؟')) { appData.teachers[selectedSection].splice(index, 1); saveData(); render(); } }

        // --- GROUP LINKS (روابط المجموعات) ---
        function renderGroupLinks() {
            const container = document.getElementById('group-links-list');
            container.innerHTML = '';
            const list = appData.groupLinks[selectedSection] || [];
            if(!list || list.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light); text-align:center;">لا توجد روابط للمجموعات لهذه الشعبة حالياً</p>';
                return;
            }
            list.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'data-card';
                div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value">${item.title}</h3>
                            <input class="editable-field editable-input" value="${item.title}" onchange="updateGroupLink(${index}, 'title', this.value)">
                        </div>
                        ${item.url ? `<a href="${item.url}" target="_blank" class="btn-link editable-value">فتح الرابط ↗️</a>` : ``}
                    </div>
                    <div class="editable-field">
                        <input class="editable-input" value="${item.url}" placeholder="الرابط" onchange="updateGroupLink(${index}, 'url', this.value)">
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteGroupLink(${index})">حذف</button>
                `;
                container.appendChild(div);
            });
        }
        function addGroupLink() {
            const title = document.getElementById('new-group-title').value.trim();
            const url = document.getElementById('new-group-url').value.trim();
            if(!title || !url) return;
            if(!appData.groupLinks[selectedSection]) appData.groupLinks[selectedSection] = [];
            appData.groupLinks[selectedSection].push({ id: Date.now(), title, url });
            document.getElementById('new-group-title').value = '';
            document.getElementById('new-group-url').value = '';
            saveData();
            render();
            try { renderGroupLinks(); } catch(e) { console.warn('renderGroupLinks error', e); }
        }
        function updateGroupLink(index, key, val) { appData.groupLinks[selectedSection][index][key] = val; saveData(); render(); }
        function deleteGroupLink(index) { if(confirm('حذف هذا الرابط؟')) { appData.groupLinks[selectedSection].splice(index, 1); saveData(); render(); } }

        // --- SETTINGS FUNCTIONS ---
        function renderSettings(){updateFontButtons();updateColorSchemeButtons();setFontScale(userSettings.fontScale||80);setLineHeight(userSettings.lineHeight||17);updateAppearanceStates();renderSectionManagement();if(window.IS_OWNER)renderKnownAccounts();}

        // --- TEAM FUNCTIONS ---
        function renderTeam() {
            const container = document.getElementById('team-list');
            container.innerHTML = '';
            if(window.IS_ADMIN){
                const preview=document.createElement('div');preview.className='team-font-preview team-font-preview-centered';
                preview.innerHTML='<small>معاينة الخط الحالي</small><strong style="font-family:var(--font-family)">المنارة الطلابية — فريق التطوير</strong>';
                container.appendChild(preview);
            }
            if(appData.team.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light); text-align:center;">لا يوجد أعضاء في الفريق حالياً</p>';
                return;
            }
            appData.team.forEach((member, index) => {
                const div = document.createElement('div');
                div.className = 'data-card';
                div.innerHTML = `
                    <div class="data-header">
                        <div>
                            <h3 class="editable-value">${member.name}</h3>
                            <input class="editable-field editable-input" value="${member.name}" onchange="updateTeam(${index}, 'name', this.value)">
                            <p class="editable-value" style="color:gray; font-size:0.9rem">${member.role}</p>
                            <input class="editable-field editable-input" value="${member.role}" onchange="updateTeam(${index}, 'role', this.value)">
                            <p class="editable-value" style="color:gray; font-size:0.85rem; margin-top:5px;">${member.bio || 'لا توجد معلومات'}</p>
                            <textarea class="editable-field editable-textarea" onchange="updateTeam(${index}, 'bio', this.value)" style="min-height: 50px; margin-top: 5px;">${member.bio || ''}</textarea>
                        </div>
                        <div style="text-align:left;">
                            ${member.whatsapp ? `<a href="https://wa.me/${member.whatsapp}" target="_blank" class="btn-link editable-value">واتس</a>` : ``}
                            <input class="editable-field editable-input" value="${member.whatsapp}" placeholder="رقم الواتس" onchange="updateTeam(${index}, 'whatsapp', this.value)">
                        </div>
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteTeamMember(${index})">حذف</button>
                `;
                container.appendChild(div);
            });
        }

        // --- EXAMS LOGIC (نفس نظام الواجبات) ---
        let currentExamAttachment = null;
        let newExamAttachments = [];

        function selectExamAttachmentType(type) {
            document.getElementById('exam-attachment-image-section').style.display = type === 'image' ? 'block' : 'none';
            document.getElementById('exam-attachment-link-section').style.display = type === 'link' ? 'block' : 'none';
            document.getElementById('exam-attachment-file-section').style.display = type === 'file' ? 'block' : 'none';
        }

        function clearExamAttachment() {
            currentExamAttachment = null;
            document.getElementById('exam-attachment-image-input').value = '';
            document.getElementById('exam-attachment-link-input').value = '';
            document.getElementById('exam-attachment-file-input').value = '';
            document.getElementById('exam-attachment-image-preview').innerHTML = '';
            document.getElementById('exam-attachment-file-preview').innerHTML = '';
            ['exam-attachment-image-section', 'exam-attachment-link-section', 'exam-attachment-file-section'].forEach(id => {
                document.getElementById(id).style.display = 'none';
            });
        }

        function addCurrentExamAttachmentToNew() {
            const type = document.getElementById('exam-attachment-image-section').style.display !== 'none' ? 'image' :
                         document.getElementById('exam-attachment-link-section').style.display !== 'none' ? 'link' : 'file';
            
            if(type === 'image') {
                const file = document.getElementById('exam-attachment-image-input').files[0];
                if(file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        newExamAttachments.push({ type: 'image', data: e.target.result, name: file.name });
                        clearExamAttachment();
                        renderNewExamAttachmentsList();
                    };
                    reader.readAsDataURL(file);
                }
            } else if(type === 'link') {
                const url = document.getElementById('exam-attachment-link-input').value;
                if(url) {
                    newExamAttachments.push({ type: 'link', url: url });
                    clearExamAttachment();
                    renderNewExamAttachmentsList();
                }
            } else if(type === 'file') {
                const file = document.getElementById('exam-attachment-file-input').files[0];
                if(file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        newExamAttachments.push({ type: 'file', data: e.target.result, name: file.name, url: file.name });
                        clearExamAttachment();
                        renderNewExamAttachmentsList();
                    };
                    reader.readAsArrayBuffer(file);
                }
            }
        }

        function renderNewExamAttachmentsList() {
            const container = document.getElementById('new-exam-attachments-list');
            container.innerHTML = '';
            newExamAttachments.forEach((att, idx) => {
                const div = document.createElement('div');
                div.style.cssText = 'padding:8px; background:#e8f4f8; border-radius:6px; margin-top:6px; display:flex; justify-content:space-between; align-items:center;';
                const typeLabel = att.type === 'image' ? '📷 صورة' : att.type === 'link' ? '🔗 رابط' : '📎 ملف';
                div.innerHTML = `<span>${typeLabel}</span><button type="button" class="btn-sm" style="background:#EF4444; color:white;" onclick="removeExamAttachment(${idx})">إزالة</button>`;
                container.appendChild(div);
            });
        }

        function removeExamAttachment(idx) {
            newExamAttachments.splice(idx, 1);
            renderNewExamAttachmentsList();
        }

        function renderExams() {
            const container = document.getElementById('exams-list');
            container.innerHTML = '';
            let exams = appData.exams[selectedSection] || [];

            // populate the subject chooser in the add-exam form
            const newSubEl = document.getElementById('new-exam-subject');
            if(newSubEl) {
                let opts = '<option value="">--- اختر مادة ---</option>';
                getSubjectsList().forEach(s => { opts += `<option value="${s}">${s}</option>`; });
                newSubEl.innerHTML = opts;
            }

            if(exams.length === 0) {
                container.innerHTML = '<p style="color:var(--text-light); text-align:center;">لا توجد اختبارات مسجلة لهذه الشعبة حالياً.</p>';
                return;
            }

            exams.forEach((exam, index) => {
                const div = document.createElement('div');
                div.className = 'task-item';
                const dateLabel = exam.date ? new Date(exam.date).toLocaleDateString('ar-EG') : '';
                const subjectHtml = exam.subject ? `<div class="task-subject">${exam.subject}</div>` : '';
                
                // Attachments HTML (support multiple)
                let attachmentHtml = '';
                if(Array.isArray(exam.attachments) && exam.attachments.length > 0) {
                    exam.attachments.forEach((att, ai) => {
                        if(att.type === 'image') {
                            attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📷 صورة:</strong>
                                    <img src="${att.data}" style="max-width:100%; max-height:200px; border-radius:6px; margin-top:6px; cursor:pointer;" onclick="viewImage('${att.data}')">
                                </div>
                            `;
                        } else if(att.type === 'link') {
                            attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">🔗 رابط:</strong>
                                    <a href="${att.url}" target="_blank" style="display:inline-block; margin-right:8px; color:#0066cc; text-decoration:none;">فتح الرابط</a>
                                </div>
                            `;
                        } else if(att.type === 'file') {
                            attachmentHtml += `
                                <div style="margin-top:8px; padding:8px; background:#f5f5f5; border-radius:6px;">
                                    <strong style="color:#666; font-size:0.9rem;">📎 ملف:</strong>
                                    <button class="btn-sm" style="background:#FF6B6B; color:white; margin-right:8px;" onclick="downloadAttachment('exam', ${index}, ${ai})">⬇️ تحميل</button>
                                    <span style="color:#999; font-size:0.85rem;">${att.name || att.url || 'ملف'}</span>
                                </div>
                            `;
                        }
                    });
                }
                
                div.innerHTML = `
                    <div style="flex:1">
                        ${subjectHtml}
                        <div class="task-desc"><span class="editable-value">${exam.title}</span></div>
                        ${attachmentHtml}
                        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:6px;"><small style="color:var(--text-light);">${dateLabel}</small></div>
                        <input type="text" class="editable-field editable-input" value="${exam.title}" onchange="updateExamTitle(${index}, this.value)">
                    </div>
                    <button class="btn-sm btn-delete" onclick="deleteExam(${index})">حذف</button>
                `;
                container.appendChild(div);
            });
        }

        function addExam() {
            const title = document.getElementById('new-exam-title').value;
            if(title) {
                if(!appData.exams[selectedSection]) appData.exams[selectedSection] = [];
                const dateInput = document.getElementById('new-exam-date') ? document.getElementById('new-exam-date').value : '';
                const subjInput = document.getElementById('new-exam-subject') ? document.getElementById('new-exam-subject').value : '';
                const dateVal = dateInput ? new Date(dateInput).getTime() : Date.now();
                
                // Handle attachments (multiple)
                const attachments = (Array.isArray(newExamAttachments) ? newExamAttachments.slice() : []);
                
                const examObj = {
                    id: Date.now(),
                    title: title,
                    date: dateVal,
                    subject: subjInput || '',
                    attachments: attachments
                };
                
                appData.exams[selectedSection].push(examObj);
                document.getElementById('new-exam-title').value = '';
                if(document.getElementById('new-exam-date')) document.getElementById('new-exam-date').value = '';
                if(document.getElementById('new-exam-subject')) document.getElementById('new-exam-subject').value = '';
                clearExamAttachment();
                newExamAttachments = [];
                renderNewExamAttachmentsList();
                saveData();
                renderExams();
            }
        }

        function updateExamTitle(index, newTitle) {
            if(appData.exams[selectedSection] && appData.exams[selectedSection][index]) {
                appData.exams[selectedSection][index].title = newTitle;
                saveData();
                renderExams();
            }
        }

        function deleteExam(index) {
            if(confirm('هل تريد حذف هذا الاختبار؟')) {
                appData.exams[selectedSection].splice(index, 1);
                saveData();
                renderExams();
            }
        }
        function addTeamMember() {
            const name = document.getElementById('new-team-name').value;
            const role = document.getElementById('new-team-role').value;
            const bio = document.getElementById('new-team-bio').value;
            const whatsapp = document.getElementById('new-team-whatsapp').value;
            console.log('addTeamMember called, name=', name, 'role=', role, 'whatsapp=', whatsapp);
            if(name && whatsapp) {
                appData.team.push({ id: Date.now(), name, role, bio, whatsapp });
                document.getElementById('new-team-name').value = '';
                document.getElementById('new-team-role').value = '';
                document.getElementById('new-team-bio').value = '';
                document.getElementById('new-team-whatsapp').value = '';
                saveData();
                render();
                // تحديث سريع لقائمة أعضاء الفريق
                try { renderTeam(); } catch(e) { console.warn('renderTeam error', e); }
            }
        }
        function updateTeam(index, key, val) { appData.team[index][key] = val; saveData(); render(); }
        function deleteTeamMember(index) { if(confirm('حذف عضو الفريق؟')) { appData.team.splice(index, 1); saveData(); render(); } }

        // --- الكتب والرزم ---
        let booksPackagesType = 'books'; // 'books' or 'packages'

        function switchBooksPackagesType(type) {
            booksPackagesType = type;
            document.getElementById('booksTab').classList.toggle('active', type === 'books');
            document.getElementById('packagesTab').classList.toggle('active', type === 'packages');
            document.getElementById('add-books-packages-title').innerText = type === 'books' ? 'إضافة كتاب جديد' : 'إضافة رزمة جديدة';
            document.getElementById('new-books-packages-title').placeholder = type === 'books' ? 'اسم الكتاب' : 'اسم الرزمة';
            renderBooksPackages();
        }

        function renderBooksPackages() {
            const container = document.getElementById('books-packages-list');
            container.innerHTML = '';
            const list = booksPackagesType === 'books' ? appData.books : appData.packages;
            if (!list || list.length === 0) {
                container.innerHTML = `<p style="color:var(--text-light); text-align:center;">لا يوجد ${booksPackagesType === 'books' ? 'كتب' : 'رزم'} حالياً.</p>`;
                return;
            }
            list.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'data-card';
                div.innerHTML = `
                    <div class="data-header">
                        <h3 class="editable-value">${item.title}</h3>
                        ${item.link ? `<a href="${item.link}" target="_blank" class="btn-link editable-value">تحميل ⬇️</a>` : ``}
                        <button class="btn-sm btn-delete" onclick="deleteBooksPackage(${index})">حذف</button>
                    </div>
                    <div class="editable-field">
                        <input class="editable-input" value="${item.title}" placeholder="الاسم" onchange="updateBooksPackage(${index}, 'title', this.value)">
                        <input class="editable-input" value="${item.link}" placeholder="رابط التحميل" onchange="updateBooksPackage(${index}, 'link', this.value)">
                    </div>
                `;
                container.appendChild(div);
            });
        }

        function addBooksPackage() {
            const title = document.getElementById('new-books-packages-title').value;
            const link = document.getElementById('new-books-packages-link').value;
            console.log('addBooksPackage called, type=', booksPackagesType, 'title=', title, 'link=', link);
            if(title && link) {
                let arr = booksPackagesType === 'books' ? appData.books : appData.packages;
                if(!arr) {
                    if(booksPackagesType === 'books') appData.books = [];
                    else appData.packages = [];
                    arr = booksPackagesType === 'books' ? appData.books : appData.packages;
                }
                arr.push({ id: Date.now(), title, link });
                document.getElementById('new-books-packages-title').value = '';
                document.getElementById('new-books-packages-link').value = '';
                saveData();
                render();
                try { renderBooksPackages(); } catch(e) { console.warn('renderBooksPackages error', e); }
            }
        }

        function updateBooksPackage(index, key, val) {
            const arr = booksPackagesType === 'books' ? appData.books : appData.packages;
            arr[index][key] = val;
            saveData();
            render();
            renderBooksPackages();
        }

        function deleteBooksPackage(index) {
            if (confirm('هل أنت متأكد من الحذف؟')) {
                const arr = booksPackagesType === 'books' ? appData.books : appData.packages;
                arr.splice(index, 1);
                saveData();
                render();
                renderBooksPackages();
            }
        }

        // عند تحميل الصفحة، إذا دخلت قسم الكتب والرزم، فعّل تبويب الكتب افتراضياً
        document.addEventListener('DOMContentLoaded', function() {
            switchBooksPackagesType('books');
            render();
            // Start splash animation sequence
            startSplashSequence();
        });

        // Splash animation sequence
        function startSplashSequence() {
            try {
                const overlay = document.getElementById('splash-overlay');
                const logo = document.getElementById('splash-logo');
                const text = document.getElementById('splash-text');
                const circle = document.getElementById('splash-circle');
                if(!overlay || !logo || !text || !circle) return;

                // Prevent scrolling while splash is active
                document.documentElement.style.overflow = 'hidden';
                document.body.style.overflow = 'hidden';

                // small delay then scale-up logo
                setTimeout(() => {
                    logo.classList.add('scale-up');
                }, 80);

                // show welcome text shortly after
                setTimeout(() => {
                    text.classList.add('show');
                }, 650);

                // After a pause, morph into expanding circle
                setTimeout(() => {
                    // position the circle at the logo center
                    const rect = logo.getBoundingClientRect();
                    const cx = rect.left + rect.width/2;
                    const cy = rect.top + rect.height/2;
                    circle.style.left = cx + 'px';
                    circle.style.top = cy + 'px';
                    // hide the logo image (fade)
                    logo.classList.add('fade-out');
                    text.classList.remove('show');
                    // start expand
                    requestAnimationFrame(() => {
                        circle.classList.add('expand');
                    });
                }, 1800);

                // Remove overlay and restore scrolling after expansion
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    document.documentElement.style.overflow = '';
                    document.body.style.overflow = '';
                    // cleanup: remove overlay from DOM after transition
                    setTimeout(() => {
                        if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    }, 500);
                }, 2600);
            } catch (e) {
                console.warn('splash error', e);
                const overlay = document.getElementById('splash-overlay'); if(overlay) overlay.remove();
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
            }
        }

        // --- دالة تشخيصية شاملة ---
        window.diagnose = function() {
            console.clear();
            console.log('%c🔍 تقرير التشخيص الشامل', 'font-size:18px; font-weight:bold; color:blue;');
            console.log('%c=' + '='.repeat(60), 'color:blue;');
            
            // 1. Firebase Status
            console.log('%c📡 حالة Firebase', 'font-size:14px; font-weight:bold; color:green;');
            try {
                const testRef = firebase.database().ref('appData');
                console.log('✅ Firebase Database متصل');
            } catch(e) {
                console.error('❌ خطأ في Firebase:', e.message);
            }
            
            // 2. Local Storage Status
            console.log('%c💾 Local Storage', 'font-size:14px; font-weight:bold; color:green;');
            const localData = localStorage.getItem('collegeAppData');
            if(localData) {
                try {
                    const parsed = JSON.parse(localData);
                    console.log('✅ البيانات موجودة في localStorage');
                    console.log('📊 عدد الشعب:', parsed.sections || 'غير محدد');
                    console.log('📚 عدد المواد:', parsed.subjects ? parsed.subjects.length : 0);
                    console.log('📝 عدد الواجبات:', Object.keys(parsed.assignments || {}).reduce((sum, k) => sum + (parsed.assignments[k] ? parsed.assignments[k].length : 0), 0));
                } catch(e) {
                    console.error('❌ خطأ في قراءة localStorage:', e.message);
                }
            } else {
                console.warn('⚠️ لا توجد بيانات في localStorage');
            }
            
            // 3. Current App Data
            console.log('%c📦 بيانات التطبيق الحالية', 'font-size:14px; font-weight:bold; color:green;');
            console.log('الشعبة المختارة:', selectedSection);
            console.log('الصفحة الحالية:', currentView);
            console.log('وضع التعديل:', isEditMode ? '✅ مفعّل' : '❌ معطّل');
            
            // 4. App Data Structure
            console.log('%c🏗️ هيكل البيانات', 'font-size:14px; font-weight:bold; color:green;');
            console.log('تقدم الشعبة ' + selectedSection + ':', appData.progress[selectedSection] || 'فارغ');
            console.log('واجبات الشعبة ' + selectedSection + ':', appData.assignments[selectedSection] || 'فارغ');
            console.log('روابط الحصص للشعبة ' + selectedSection + ':', appData.liveLinks[selectedSection] || 'فارغ');
            
            // 5. Network Status
            console.log('%c🌐 حالة الاتصال', 'font-size:14px; font-weight:bold; color:green;');
            console.log('الاتصال بالإنترنت:', navigator.onLine ? '✅ متصل' : '❌ منقطع');
            
            // 6. Browser Info
            console.log('%c🖥️ معلومات المتصفح', 'font-size:14px; font-weight:bold; color:green;');
            console.log('المتصفح:', navigator.userAgent);
            
            console.log('%c=' + '='.repeat(60), 'color:blue;');
            console.log('%c💡 نصائح:', 'font-size:12px; font-weight:bold;');
            console.log('- استخدم appData للوصول إلى البيانات الحالية');
            console.log('- استخدم saveData() لحفظ التغييرات');
            console.log('- استخدم render() لتحديث الصفحة');
            console.log('- اكتب diagnose() لتشغيل هذا التقرير مرة أخرى');
        };

        // تشغيل التشخيص التلقائي عند التحميل
        console.log('%c⏳ جاري تحميل التطبيق...', 'color:gray; font-size:12px;');
        setTimeout(() => {
            console.log('%c✅ تم التحميل بنجاح! اكتب diagnose() في الكونسول للمزيد من المعلومات', 'color:green; font-weight:bold;');
        }, 500);

        // Ensure functions are reachable from inline onclick handlers (debugging helpers)
        window.addAssignment = addAssignment;
        window.addBooksPackage = addBooksPackage;
        window.addTeamMember = addTeamMember;
        window.addSupport = addSupport;
        window.addSummary = addSummary;
        window.addNews = addNews;
        window.addImportantLink = addImportantLink;
        window.addTeacher = addTeacher;
        window.addGroupLink = addGroupLink;
        window.selectAttachmentType = selectAttachmentType;
        window.clearAttachment = clearAttachment;
        window.viewImage = viewImage;
        window.downloadFile = downloadFile;
        window.handleImageAttachment = handleImageAttachment;
        window.handleFileAttachment = handleFileAttachment;
        window.selectNewsAttachmentType = selectNewsAttachmentType;
        window.clearNewsAttachment = clearNewsAttachment;
        window.downloadNewsFile = function(itemIndex, attIndex){ return downloadAttachment('news', itemIndex, attIndex); };
        window.handleNewsImageAttachment = handleNewsImageAttachment;
        window.handleNewsFileAttachment = handleNewsFileAttachment;

        

        render();
    


        (function(){
            const promptEl = document.getElementById('install-prompt');
            const installBtn = document.getElementById('install-btn');
            const hideBtn = document.getElementById('hide-btn');
            let deferredPrompt = null;

            // Check if app is already installed (don't show prompt)
            function isAppInstalled(){
                try{ return localStorage.getItem('appInstalled') === 'true'; }catch(e){return false}
            }

            // Show the prompt (called when beforeinstallprompt fires)
            function showPrompt(){
                if(isAppInstalled()) return; // Don't show if already installed
                if(!deferredPrompt) return; // Only show if install is available
                promptEl.classList.remove('hidden');
            }

            // Hide the prompt for this session only
            function hidePrompt(){
                promptEl.classList.add('hidden');
            }

            // Listen for beforeinstallprompt (fires when browser can install app)
            window.addEventListener('beforeinstallprompt', (e)=>{
                e.preventDefault();
                deferredPrompt = e;
                // Show the prompt immediately (every visit, unless app installed)
                showPrompt();
            });

            // Install button: trigger browser install dialog
            installBtn.addEventListener('click', async ()=>{
                if(!deferredPrompt) return;
                try{
                    deferredPrompt.prompt();
                    const choice = await deferredPrompt.userChoice;
                    hidePrompt();
                    deferredPrompt = null;
                }catch(err){
                    console.warn('install prompt error', err);
                }
            });

            // Hide button: dismiss for this session
            hideBtn.addEventListener('click', ()=>{
                hidePrompt();
            });

            // When app is successfully installed, never show prompt again
            window.addEventListener('appinstalled', ()=>{
                try{ localStorage.setItem('appInstalled', 'true'); }catch(e){}
                hidePrompt();
                deferredPrompt = null;
            });

            // Show prompt if beforeinstallprompt already fired before listener was set
            document.addEventListener('DOMContentLoaded', ()=>{
                if(isAppInstalled()) return;
                if(deferredPrompt) showPrompt();
            });
        
  Object.assign(window,{setFont,setColorScheme,setFontScale,setLineHeight,toggleHighContrast,toggleReducedMotion,toggleCompactMode,resetAppearanceSettings,showSection,goBack,setSection,openManageSubjects,addGlobalSubject,updateGlobalSubject,deleteGlobalSubject,addNewSection,renameSection,deleteSection,grantAdminByEmail,grantAdmin,revokeAdmin,renderKnownAccounts,toggleWeeklySchedule,weeklyAddNew,render});
})();
    
