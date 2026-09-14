(function(){
  const OWNER_EMAIL = 'mjdshbyr449@gmail.com';
  let authBooted = false;

  function lower(v){ return String(v || '').trim().toLowerCase(); }
  function isOwner(user){ return !!user && user.email && lower(user.email) === OWNER_EMAIL && user.emailVerified === true; }
  function setLocked(){ document.body.classList.add('admin-locked'); document.body.classList.remove('admin-authorized','edit-mode','owner-mode'); window.IS_ADMIN=false; window.IS_OWNER=false; }
  function setAuthorized(user, owner){
    window.AUTH_USER=user;
    window.IS_ADMIN=true;
    window.IS_OWNER=!!owner;
    document.body.classList.remove('admin-locked');
    document.body.classList.add('admin-authorized','edit-mode');
    document.body.classList.toggle('owner-mode', !!owner);
    document.querySelectorAll('.owner-only-nav').forEach(el=>el.style.display=owner?'flex':'none');
    document.querySelectorAll('.owner-only-panel').forEach(el=>el.style.display=owner?'block':'none');
  }
  async function writeDirectory(user){
    const ref=firebase.database().ref('loginDirectory/'+user.uid);
    try{
      const snap=await ref.once('value');
      if(!snap.exists()){
        await ref.set({uid:user.uid,email:user.email||'',displayName:user.displayName||'',timestamp:firebase.database.ServerValue.TIMESTAMP});
      }
    }catch(e){ console.warn('loginDirectory write failed',e); }
  }
  async function recordFirstAllowedLogin(user){
    try{
      const ref=firebase.database().ref('accessLogs/'+user.uid);
      const snap=await ref.once('value');
      if(!snap.exists()){
        await ref.set({uid:user.uid,email:user.email||'',displayName:user.displayName||'',timestamp:firebase.database.ServerValue.TIMESTAMP,allowed:true});
      }
    }catch(e){ console.warn('access log write failed',e); }
  }
  async function authorize(user){
    if(!user || user.emailVerified !== true) return {allowed:false, owner:false};
    if(isOwner(user)) return {allowed:true, owner:true};
    try{
      const snap=await firebase.database().ref('adminUsers/'+user.uid).once('value');
      return {allowed:snap.exists(), owner:false};
    }catch(e){
      console.warn('admin permission check failed',e);
      return {allowed:false, owner:false};
    }
  }
  function deny(msg){
    setLocked();
    const gate=document.getElementById('admin-gate');
    const text=document.getElementById('admin-gate-msg');
    if(gate) gate.style.display='grid';
    if(text) text.textContent=msg || 'عذراً، لن يتم تسجيل دخولك إلى لوحة الإدارة.';
    const btn=document.getElementById('google-admin-btn'); if(btn) btn.disabled=false;
  }
  function renderAdmin(){
    const gate=document.getElementById('admin-gate');
    if(gate) gate.remove();
    setAuthorized(window.AUTH_USER, !!window.IS_OWNER);
    if(window.render) window.render();
    if(window.showSection) window.showSection('home');
  }
  async function processUser(user, afterPopup){
    if(!user){ setLocked(); return; }
    window.AUTH_USER=user;
    if(!afterPopup) document.getElementById('admin-gate-msg').textContent='جاري التحقق من صلاحية الحساب...';
    await writeDirectory(user);
    const result=await authorize(user);
    if(!result.allowed){
      try{ await firebase.auth().signOut(); }catch(e){}
      deny('عذراً، لن يتم تسجيل دخولك إلى لوحة الإدارة.');
      return;
    }
    await recordFirstAllowedLogin(user);
    setAuthorized(user,result.owner);
    renderAdmin();
  }
  function boot(){
    if(authBooted) return; authBooted=true;
    setLocked();
    const btn=document.getElementById('google-admin-btn');
    const msg=document.getElementById('admin-gate-msg');
    if(!window.firebase || !firebase.auth || !firebase.database){
      deny('تعذر الاتصال بخدمة الدخول. تأكد من إعداد Firebase.');
      return;
    }
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    window.adminSignOut=async()=>{ try{await firebase.auth().signOut();}finally{location.reload();} };
    window.adminSignIn=async()=>{
      if(btn) btn.disabled=true;
      if(msg) msg.textContent='جاري تسجيل الدخول والتحقق من الصلاحية...';
      try{
        const result=await firebase.auth().signInWithPopup(provider);
        await processUser(result.user,true);
      }catch(e){
        console.error(e);
        const text=e && e.code==='auth/unauthorized-domain'
          ? 'هذا النطاق غير مضاف إلى Authorized domains في Firebase.'
          : e && e.code==='auth/popup-blocked'
          ? 'المتصفح منع نافذة تسجيل Google. اسمح بالنوافذ المنبثقة للموقع ثم أعد المحاولة.'
          : 'تعذر تسجيل الدخول. تأكد من تفعيل Google وإعداد Firebase.';
        deny(text);
      }
    };
    firebase.auth().onAuthStateChanged(async user=>{
      if(!user){ setLocked(); return; }
      await processUser(user,false);
    });
  }
  window.renderAccessLogs=function(){
    const box=document.getElementById('access-logs-list');
    if(!box || !window.IS_OWNER || !window.db) return;
    firebase.database().ref('accessLogs').once('value').then(s=>{
      const arr=[]; s.forEach(c=>arr.push(c.val()||{})); arr.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
      box.innerHTML=arr.length?arr.map(x=>`<div class="management-row account-row"><div><strong>${String(x.displayName||'حساب Google').replace(/[&<>\"]/g,'')}</strong><small>${String(x.email||'').replace(/[&<>\"]/g,'')}</small><small>${x.timestamp?new Date(x.timestamp).toLocaleString('ar-PS'):''}</small></div><span class="admin-badge">دخول مسجّل</span></div>`).join(''):'<div class="notice">لا توجد حسابات دخلت لوحة الإدارة بعد.</div>';
    }).catch(()=>box.innerHTML='<div class="notice">تعذر تحميل السجل.</div>');
  };
  window.addEventListener('load',boot);
})();
