/* BeReal profile prototype — logic extracted from bereal_profile.html for caching and readability.
 * Many functions are intentionally global for HTML onclick="" handlers.
 * Revert split: see REFACTOR_REVERT.md */
var MY_SELFIES={"0":"selfies_assets/CleanShot%202026-04-15%20at%2013.25.39%402x.png","1":"selfies_assets/CleanShot%202026-04-15%20at%2013.26.14%402x.png","2":"selfies_assets/CleanShot%202026-04-15%20at%2013.26.46%402x.png","3":"selfies_assets/CleanShot%202026-04-15%20at%2013.27.18%402x.png","4":"selfies_assets/CleanShot%202026-04-15%20at%2013.27.34%402x.png"};
var FR_SELFIES={"0":"selfies_assets/CleanShot%202026-04-15%20at%2013.26.46%402x.png","1":"selfies_assets/CleanShot%202026-04-15%20at%2013.27.18%402x.png","2":"selfies_assets/CleanShot%202026-04-15%20at%2013.27.34%402x.png"};
var SELFIE_PATHS=["selfies_assets/CleanShot%202026-04-15%20at%2013.25.39%402x.png", "selfies_assets/CleanShot%202026-04-15%20at%2013.26.14%402x.png", "selfies_assets/CleanShot%202026-04-15%20at%2013.26.46%402x.png", "selfies_assets/CleanShot%202026-04-15%20at%2013.27.18%402x.png", "selfies_assets/CleanShot%202026-04-15%20at%2013.27.34%402x.png", "selfies_assets/CleanShot%202026-04-15%20at%2013.27.57%402x.png", "selfies_assets/CleanShot%202026-04-15%20at%2013.28.07%402x.png", "selfies_assets/CleanShot%202026-04-15%20at%2013.31.08%402x.png"];
function toggleTabBar(){
  var tbar=document.querySelector('.tbar');
  var btn=document.getElementById('tb-toggle-btn');
  var isFigma=tbar.classList.toggle('tb-figma');
  btn.textContent=isFigma?'← Original tab bar':'← Figma tab bar';
}
function shuffleArray(arr){
  for(var i=arr.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var t=arr[i];arr[i]=arr[j];arr[j]=t;
  }
  return arr;
}
function assignCycled(nodes,pool){
  if(!nodes||!nodes.length||!pool.length)return;
  var shuffled=shuffleArray(pool.slice());
  Array.prototype.forEach.call(nodes,function(node,idx){
    node.setAttribute('src',shuffled[idx%shuffled.length]);
  });
}
function uniqueSrcs(selector){
  var out=[];
  Array.prototype.forEach.call(document.querySelectorAll(selector),function(img){
    var src=img.getAttribute('src');
    if(src&&out.indexOf(src)===-1)out.push(src);
  });
  return out;
}
function shuffleProfileImages(){
  var picturePool=uniqueSrcs('img[src*="pictures_assets/"]');
  var selfiePool=uniqueSrcs('img[src*="selfies_assets/"]');
  if(picturePool.length){
    assignCycled(document.querySelectorAll('.sl img'),picturePool);
    assignCycled(document.querySelectorAll('.brt'),picturePool);
    assignCycled(document.querySelectorAll('.grd .gi > img'),picturePool);
  }
  if(selfiePool.length){
    assignCycled(document.querySelectorAll('.sfi img'),selfiePool);
    assignCycled(document.querySelectorAll('.br-sfin img'),selfiePool);
    assignCycled(document.querySelectorAll('.gisf img'),selfiePool);
    assignCycled(document.querySelectorAll('.av img'),selfiePool);
    assignCycled(document.querySelectorAll('.mf-av img'),selfiePool);

    var shuffledSelfies=shuffleArray(selfiePool.slice());
    MY_SELFIES={};FR_SELFIES={};
    for(var i=0;i<5;i++)MY_SELFIES[String(i)]=shuffledSelfies[i%shuffledSelfies.length];
    for(var j=0;j<3;j++)FR_SELFIES[String(j)]=shuffledSelfies[(j+2)%shuffledSelfies.length];
    SELFIE_PATHS=shuffledSelfies.slice();
  }
}
function showScreen(id){
  var screenId=id==='nonfriend-private'?'nonfriend':id;
  var hadOn=document.querySelector('.screen.on');
  var wasSwitch=!!(hadOn&&hadOn.id!=='s-'+screenId);
  var ph=document.querySelector('.ph');
  if(wasSwitch&&ph)ph.classList.add('instant-profile-switch');
  var brd=document.getElementById('br-detail');
  if(brd&&brd.classList.contains('open'))closeBeRealDetail();
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('on');});
  var activeScreen=document.querySelector('#s-'+screenId);
  if(!activeScreen){
    if(ph)ph.classList.remove('instant-profile-switch');
    return;
  }
  activeScreen.classList.add('on');
  activeScreen.scrollTop=0;
  document.querySelectorAll('.sw').forEach(function(b){b.classList.remove('on');});
  var b=document.querySelector('.sw[data-sc="'+id+'"]');
  if(b)b.classList.add('on');
  if(screenId==='nonfriend')setNonfriendPrivacy(id==='nonfriend-private');
  clearAllStoryTimers();
  startStoryAutoplay(screenId);
  if(wasSwitch&&ph){
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ph.classList.remove('instant-profile-switch');});
    });
  }
}
var CAR={mine:{cur:0,n:5,selfies:MY_SELFIES},friend:{cur:0,n:3,selfies:FR_SELFIES},nonfriend:{cur:0,n:0,selfies:{}},official:{cur:0,n:0,selfies:{}}};
var SWAP_STATE={mine:{},friend:{},nonfriend:{},official:{}};
var STORY_DURATION_MS=4800;
var STORY_TIMER={mine:null,friend:null,nonfriend:null,official:null};
function clearStoryTimer(id){
  if(STORY_TIMER[id]){clearTimeout(STORY_TIMER[id]);STORY_TIMER[id]=null;}
}
function clearAllStoryTimers(){
  Object.keys(STORY_TIMER).forEach(clearStoryTimer);
}
function startStoryAutoplay(id){
  clearStoryTimer(id);
  var sc=document.getElementById('s-'+id);
  if(!sc||!sc.classList.contains('on'))return;
  var c=CAR[id],pbw=document.getElementById('pb-'+id);
  if(!c||!pbw)return;
  var pbEls=pbw.querySelectorAll('.pb');
  if(!pbEls.length)return;

  pbEls.forEach(function(p,idx){
    var fill=p.querySelector('.pbf');
    if(!fill)return;
    fill.style.transition='none';
    fill.style.width=idx<c.cur?'100%':'0%';
  });

  var active=pbEls[c.cur]?pbEls[c.cur].querySelector('.pbf'):null;
  if(active){
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        active.style.transition='width '+STORY_DURATION_MS+'ms linear';
        active.style.width='100%';
      });
    });
  }

  STORY_TIMER[id]=setTimeout(function(){
    var cur=document.getElementById('s-'+id);
    if(cur&&cur.classList.contains('on'))nextSlide(id);
  },STORY_DURATION_MS+40);
}
function initCarousel(id){
  var c=CAR[id],pbw=document.getElementById('pb-'+id),sc=document.getElementById('s-'+id);
  if(!pbw||!sc)return;
  for(var i=0;i<c.n;i++){var d=document.createElement('div');d.className='pb';d.innerHTML='<div class=\"pbf\"></div>';pbw.appendChild(d);}
  c.mainSrcs=Array.prototype.map.call(sc.querySelectorAll('.sl img'),function(img){return img.getAttribute('src');});
  var sfi=document.getElementById('sfi-'+id);
  if(sfi&&!sfi.dataset.swapBound){
    sfi.dataset.swapBound='1';
    sfi.addEventListener('click',function(e){
      e.stopPropagation();
      SWAP_STATE[id][c.cur]=!SWAP_STATE[id][c.cur];
      updateCarousel(id,false,true);
    });
  }
  updateCarousel(id,false);
}
function updateCarousel(id,fade,preserveStoryProgress){
  var c=CAR[id],sc=document.getElementById('s-'+id);
  if(!sc)return;
  var slides=sc.querySelectorAll('.sl');
  var pbw=document.getElementById('pb-'+id);
  if(!pbw)return;
  var pbEls=pbw.querySelectorAll('.pb');
  var sfi=document.getElementById('sfi-'+id);
  if(fade)slides.forEach(function(s){s.classList.add('fade');});
  slides.forEach(function(s,i){s.classList.toggle('on',i===c.cur);});
  function applyPbState(){
    pbEls.forEach(function(p,i){
      p.classList.remove('dn','ac');
      if(i<c.cur)p.classList.add('dn');
      else if(i===c.cur)p.classList.add('ac');
    });
  }
  var sk=c.selfies[String(c.cur)]||c.selfies[c.cur];
  var selfieSrc=sk?sk:'';
  var mainSrc=(c.mainSrcs&&c.mainSrcs[c.cur])?c.mainSrcs[c.cur]:'';
  var swapped=!!(SWAP_STATE[id]&&SWAP_STATE[id][c.cur]);
  var curSlide=slides[c.cur]?slides[c.cur].querySelector('img'):null;
  if(curSlide){curSlide.src=(swapped&&selfieSrc)?selfieSrc:mainSrc;}
  if(sfi){
    var sfiSrc=(swapped&&mainSrc)?mainSrc:selfieSrc;
    if(sfiSrc)sfi.innerHTML='<img src=\"'+sfiSrc+'\" style=\"width:100%;height:100%;object-fit:cover;object-position:center top;display:block;\">';
  }
  if(fade){
    pbEls.forEach(function(p){
      var fill=p.querySelector('.pbf');
      if(!fill)return;
      fill.style.transition='opacity 500ms ease';
      fill.style.opacity='0';
    });
    setTimeout(function(){
      pbEls.forEach(function(p){
        var fill=p.querySelector('.pbf');
        if(!fill)return;
        fill.style.transition='none';
        fill.style.width='0%';
        fill.style.opacity='1';
        p.classList.remove('dn','ac');
      });
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          pbEls.forEach(function(p){
            var fill=p.querySelector('.pbf');
            if(!fill)return;
            fill.style.transition='';
            fill.style.width='';
            fill.style.opacity='';
          });
          applyPbState();
          if(!preserveStoryProgress)startStoryAutoplay(id);
        });
      });
    },500);
  }else{
    applyPbState();
    if(!preserveStoryProgress)startStoryAutoplay(id);
  }
  if(fade)setTimeout(function(){slides.forEach(function(s){s.classList.remove('fade');});},320);
}
function nextSlide(id){var c=CAR[id],wasLast=c.cur===c.n-1;c.cur=(c.cur+1)%c.n;updateCarousel(id,wasLast);}
function prevSlide(id){var c=CAR[id],wasFirst=c.cur===0;c.cur=(c.cur-1+c.n)%c.n;updateCarousel(id,wasFirst);}
var SPRING='transform 280ms cubic-bezier(0.22,0.61,0.36,1), opacity 240ms ease';
function prepareExtraCarousel(id){
  var sc=document.getElementById('s-'+id);
  if(!sc)return;
  var car=sc.querySelector('.car');
  if(!car)return;

  var pbw=car.querySelector('.pbw');
  if(!pbw){
    pbw=document.createElement('div');
    pbw.className='pbw';
    pbw.id='pb-'+id;
    var sb=car.querySelector('.sb');
    if(sb)sb.insertAdjacentElement('afterend',pbw);
    else car.insertAdjacentElement('afterbegin',pbw);
  }

  var sfi=car.querySelector('.sfi');
  if(!sfi){
    sfi=document.createElement('div');
    sfi.className='sfi';
    sfi.id='sfi-'+id;
    var scm=car.querySelector('.scm');
    if(scm)scm.insertAdjacentElement('beforebegin',sfi);
    else car.appendChild(sfi);
  }else if(!sfi.id){
    sfi.id='sfi-'+id;
  }

  // Add click zones so top media uses same navigation affordance.
  if(!car.querySelector('.tp')){
    var tp=document.createElement('div');
    tp.className='tp';
    tp.setAttribute('onclick',"prevSlide('"+id+"')");
    car.appendChild(tp);
  }
  if(!car.querySelector('.tn')){
    var tn=document.createElement('div');
    tn.className='tn';
    tn.setAttribute('onclick',"nextSlide('"+id+"')");
    car.appendChild(tn);
  }

  var slides=car.querySelectorAll('.sl');
  if(slides.length<3){
    var gridImgs=sc.querySelectorAll('.grd .gi > img');
    for(var i=slides.length;i<3&&i<gridImgs.length;i++){
      var d=document.createElement('div');
      d.className='sl'+(i===0?' on':'');
      d.innerHTML='<img src=\"'+(gridImgs[i].getAttribute('src')||'')+'\" style=\"width:100%;height:100%;object-fit:cover;object-position:center 28%;display:block;\">';
      var insertBefore=sfi||car.querySelector('.scm')||car.querySelector('.topb');
      if(insertBefore)insertBefore.insertAdjacentElement('beforebegin',d);
      else car.appendChild(d);
    }
    slides=car.querySelectorAll('.sl');
  }
  slides.forEach(function(sl,i){sl.classList.toggle('on',i===0);});

  var selfieCandidates=[];
  var currentSfiImg=sfi.querySelector('img');
  if(currentSfiImg&&currentSfiImg.getAttribute('src'))selfieCandidates.push(currentSfiImg.getAttribute('src'));
  var brSfi=sc.querySelectorAll('.br-sfin img');
  brSfi.forEach(function(img){var src=img.getAttribute('src');if(src)selfieCandidates.push(src);});
  var gridSf=sc.querySelectorAll('.grd .gisf img');
  gridSf.forEach(function(img){var src=img.getAttribute('src');if(src)selfieCandidates.push(src);});
  if(!selfieCandidates.length){
    var anyImg=sc.querySelector('.grd img,.sl img');
    if(anyImg&&anyImg.getAttribute('src'))selfieCandidates.push(anyImg.getAttribute('src'));
  }

  var map={};
  for(var j=0;j<slides.length;j++)map[j]=selfieCandidates[j%selfieCandidates.length];
  CAR[id]={cur:0,n:slides.length,selfies:map};
  SWAP_STATE[id]={};
}
function setGrid(sc,n,animated){
  var g=document.getElementById('grd-'+sc);
  if(!g)return;
  [3,2,1].forEach(function(x){var b=document.getElementById('sg'+x+'-'+sc);if(b)b.classList.toggle('on',x===n);});
  if(animated){
    // Blur out (opacity stays 1 — content always visible, no black flash).
    g.style.transition='filter 80ms ease-in, transform 80ms ease-in';
    g.style.filter='blur(6px)';
    g.style.opacity='1';
    g.style.transform='scale(0.982)';

    setTimeout(function(){
      g.className='grd g'+n;
      g.style.transition='none';
      g.style.filter='blur(6px)';
      g.style.opacity='1';
      g.style.transform='scale(1.01)';

      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          g.style.transition='filter 200ms cubic-bezier(0.2,0,0,1), transform 220ms cubic-bezier(0.2,0,0,1)';
          g.style.filter='blur(0px)';
          g.style.opacity='1';
          g.style.transform='scale(1)';
        });
      });
    },80);
  } else {
    g.className='grd g'+n;
    g.style.filter='';
    g.style.opacity='';
    g.style.transform='';
  }
}
function setHlViewGrid(n,animated){
  var g=document.getElementById('hl-view-grid');
  if(!g)return;
  [3,2,1].forEach(function(x){var b=document.getElementById('hl-vsg'+x);if(b)b.classList.toggle('on',x===n);});
  if(animated){
    g.style.transition='filter 80ms ease-in, transform 80ms ease-in';
    g.style.filter='blur(6px)';
    g.style.opacity='1';
    g.style.transform='scale(0.982)';
    setTimeout(function(){
      g.className='hl-view-grid g'+n;
      g.style.transition='none';
      g.style.filter='blur(6px)';
      g.style.opacity='1';
      g.style.transform='scale(1.01)';
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          g.style.transition='filter 200ms cubic-bezier(0.2,0,0,1), transform 220ms cubic-bezier(0.2,0,0,1)';
          g.style.filter='blur(0px)';
          g.style.opacity='1';
          g.style.transform='scale(1)';
        });
      });
    },80);
  }else{
    g.className='hl-view-grid g'+n;
    g.style.filter='';
    g.style.opacity='';
    g.style.transform='';
  }
}
var isPrivate=false;
function setNonfriendPrivacy(privateMode){
  isPrivate=!!privateMode;
  document.getElementById('nf-pub').style.display=isPrivate?'none':'block';
  document.getElementById('nf-prv').style.display=isPrivate?'block':'none';
  document.getElementById('nf-spacer').style.display=isPrivate?'none':'';
  document.getElementById('s-nonfriend').style.overflow=isPrivate?'hidden':'';
  var mf=document.getElementById('nf-mf-row');
  if(mf){
    mf.classList.toggle('mf-inline--private',isPrivate);
    mf.setAttribute('tabindex',isPrivate?'0':'-1');
    mf.setAttribute('aria-disabled',isPrivate?'false':'true');
  }
}
function openMutualFriendsSheet(){
  var mf=document.getElementById('nf-mf-row');
  if(!mf||!mf.classList.contains('mf-inline--private'))return;
  openSheet('mutual-nf');
}
function resetImgPh(img){
  if(!img)return;
  var w=img.closest('.img-ph');
  if(w)w.classList.remove('is-loaded');
}
function wireImgPh(img){
  if(!img)return;
  var w=img.closest('.img-ph');
  function done(){if(w)w.classList.add('is-loaded');}
  var srcAttr=img.getAttribute('src');
  if(srcAttr===null||srcAttr===''){done();return;}
  if(img.complete&&img.naturalWidth){
    requestAnimationFrame(function(){done();});
    return;
  }
  img.addEventListener('load',done,{once:true});
  img.addEventListener('error',done,{once:true});
}
function wireAllImgPh(root){
  if(!root||!root.querySelectorAll)return;
  root.querySelectorAll('.img-ph img').forEach(wireImgPh);
}
function renderSheetUsers(users){
  var root=document.getElementById('bsh-users');
  if(!users.length){root.innerHTML='<div class="bsh-empty">No results</div>';return;}
  root.innerHTML=users.map(function(u){return '<div class="bsh-user"><div class="bsh-uav img-ph"><img src="'+SELFIE_PATHS[(u.a||0)%SELFIE_PATHS.length]+'" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"></div><div class="bsh-uinfo"><div class="bsh-uname">'+u.n+'</div><div class="bsh-usub">'+u.s+'</div><div class="bsh-meta-ln">'+(u.m||'')+'</div></div><button class="bsh-ufol">Follow</button></div>';}).join('');
  wireAllImgPh(root);
}
var SHEET={
  'loc-krakow':{icon:'fa-location-dot',title:'Paris',q:'Paris',
    meta:[['15.2K','people in Paris on BeReal'],['34','from your contacts'],['Mon–Thu','most active days']],
    users:[
      {n:'Claire Dupont',s:'3 mutual friends',m:'Le Marais · student',a:0},
      {n:'Julien Martin',s:'2 mutual friends',m:'Montmartre · designer',a:1},
      {n:'Camille Petit',s:'1 mutual friend',m:'Latin Quarter · PhD',a:2},
      {n:'Hugo Leroy',s:'2 mutual friends',m:'Bastille · developer',a:0},
      {n:'Emma Moreau',s:'0 mutual friends',m:'Belleville · barista',a:1}
    ]},
  'work-design':{icon:'fa-briefcase',title:'Director of Product Design',q:'Director of Product Design',
    meta:[['2,1K','product designers on BeReal'],['34','in your network'],['EU','most active region']],
    users:[
      {n:'Lucie Bernard',s:'4 mutual friends',m:'Head of Design @ Qonto',a:1},
      {n:'Antoine Giraud',s:'2 mutual friends',m:'Product Design Lead @ BlaBlaCar',a:2},
      {n:'Nicolas Renard',s:'1 mutual friend',m:'Design Director @ Doctolib',a:0},
      {n:'Sarah Fournier',s:'3 mutual friends',m:'Principal Designer @ Back Market',a:2}
    ]},
  'uni-agh':{icon:'fa-graduation-cap',title:'Sorbonne University',q:'Sorbonne University',
    meta:[['31K','alumni on BeReal'],['47','from your grad year'],['Paris','main campus']],
    users:[
      {n:'Lea Martin',s:'6 mutual friends',m:'Digital Media · class of 2019',a:0},
      {n:'Pauline Morel',s:'4 mutual friends',m:'Economics · class of 2020',a:1},
      {n:'Theo Lambert',s:'2 mutual friends',m:'Computer Science · class of 2021',a:2},
      {n:'Ines Dubois',s:'3 mutual friends',m:'Management · class of 2018',a:0},
      {n:'Maxime Roux',s:'1 mutual friend',m:'Data Science · class of 2019',a:1}
    ]},
  'zodiac-cancer':{icon:'fa-moon',title:'Cancer',q:'Cancer',
    meta:[['Jun 21','– Jul 22'],['14%','of your friends are Cancer'],['Aquarius','least common match']],
    users:[
      {n:'Elise Colin',s:'3 mutual friends',m:'Born 12 Jul',a:1},
      {n:'Victor Chevalier',s:'2 mutual friends',m:'Born 4 Jul',a:0},
      {n:'Nora Petit',s:'1 mutual friend',m:'Born 28 Jun',a:2}
    ]},
  'zodiac-gemini':{icon:'fa-moon',title:'Gemini',q:'Gemini',
    meta:[['May 21','– Jun 20'],['9%','of your friends are Gemini'],['Cancer','most common match']],
    users:[
      {n:'Camille Bernard',s:'5 mutual friends',m:'Born 8 Jun',a:0},
      {n:'Alice Faure',s:'2 mutual friends',m:'Born 1 Jun',a:2},
      {n:'Louis Moreau',s:'1 mutual friend',m:'Born 25 May',a:1}
    ]},
  'zodiac-scorpio':{icon:'fa-moon',title:'Scorpio',q:'Scorpio',
    meta:[['Oct 23','– Nov 21'],['11%','of your friends are Scorpio'],['Taurus','most common match']],
    users:[
      {n:'Louis Moreau',s:'3 mutual friends',m:'Born 14 Nov',a:1},
      {n:'Sophie Leroux',s:'2 mutual friends',m:'Born 3 Nov',a:2},
      {n:'Gabriel Henry',s:'1 mutual friend',m:'Born 29 Oct',a:0}
    ]},
  'work-travel':{icon:'fa-briefcase',title:'Travel Creator',q:'Travel Creator',
    meta:[['41K','travel creators on BeReal'],['8','in your network'],['Lifestyle','top content category']],
    users:[
      {n:'Camille Arnaud',s:'4 mutual friends',m:'@camillegoes · France travel',a:2},
      {n:'Leo Martin',s:'2 mutual friends',m:'@leoonroute · solo trips',a:0},
      {n:'Maya Dubois',s:'1 mutual friend',m:'@mayaeats · food + trips',a:1}
    ]},
  'uni-mgimo':{icon:'fa-graduation-cap',title:'Sciences Po',q:'Sciences Po',
    meta:[['12.4K','alumni on BeReal'],['17','from your graduation year'],['Paris','main campus']],
    users:[
      {n:'Juliette Morel',s:'3 mutual friends',m:'International Affairs · class of 2017',a:2},
      {n:'Arthur Noel',s:'1 mutual friend',m:'Economics · class of 2019',a:0},
      {n:'Ines Laurent',s:'2 mutual friends',m:'Media Studies · class of 2018',a:1}
    ]},
  'work-photo':{icon:'fa-briefcase',title:'Photographer',q:'Photographer',
    meta:[['96K','photographers on BeReal'],['21','near Nice'],['Portrait','top specialization']],
    users:[
      {n:'Adrien Faure',s:'3 mutual friends',m:'Portrait & lifestyle',a:1},
      {n:'Lucie Bernard',s:'2 mutual friends',m:'Street & documentary',a:2},
      {n:'Noah Caron',s:'1 mutual friend',m:'Architecture & travel',a:0},
      {n:'Clara Dubois',s:'0 mutual friends',m:'Editorial & fashion',a:2}
    ]},
  'loc-rio':{icon:'fa-location-dot',title:'Nice, France',q:'Nice, France',
    meta:[['13K','people in Nice on BeReal'],['9','connected to your network'],['Weekend','most active']],
    users:[
      {n:'Chloe Simon',s:'2 mutual friends',m:'Old Town · designer',a:0},
      {n:'Thomas Garnier',s:'1 mutual friend',m:'Port district · musician',a:1},
      {n:'Manon Dupuis',s:'3 mutual friends',m:'Promenade area · architect',a:2}
    ]},
  'mutual-nf':{icon:'fa-users',title:'Mutual friends',q:'Mutual friends',
    meta:[['3','people you both know'],['Nice, France','shared city'],['You & Louis','not friends yet']],
    users:[
      {n:'Claire Dupont',s:'Your friend',m:'Old Town · designer',a:0},
      {n:'Camille Bernard',s:'Your friend',m:'Le Marais · student',a:1},
      {n:'Gabriel Henry',s:'Friends with Louis',m:'Promenade area · architect',a:2}
    ]},
  'loc-world':{icon:'fa-globe',title:'Worldwide',q:'Worldwide',
    meta:[['195','countries on BeReal'],['42M','monthly active users']],
    users:[
      {n:'BeReal Friends',s:'Official',m:'News & product updates',a:0},
      {n:'BeReal Blog',s:'Official',m:'Stories from around the world',a:1}
    ]},
  'link-site':{icon:'fa-globe',title:'bereal.com/stories',q:'bereal.com/stories',
    meta:[],
    users:[]}
};
var AVS=SELFIE_PATHS.slice(0,3);
function bumpOverlayDeferSeq(el){
  var n=(parseInt(el.dataset.overlayDeferSeq,10)||0)+1;
  el.dataset.overlayDeferSeq=String(n);
  return n;
}
function afterOverlayTransform(el,durationMs,seq,fn){
  var finished=false;
  function listener(e){
    if(e.target!==el||e.propertyName!=='transform')return;
    tryRun();
  }
  var timer;
  function cleanup(){
    el.removeEventListener('transitionend',listener);
    clearTimeout(timer);
  }
  function tryRun(){
    if(finished)return;
    if((parseInt(el.dataset.overlayDeferSeq,10)||0)!==seq){cleanup();finished=true;return;}
    finished=true;
    cleanup();
    if(!el.classList.contains('open'))return;
    fn();
  }
  timer=setTimeout(tryRun,durationMs+50);
  el.addEventListener('transitionend',listener);
}
function runAfterOverlayOpen(el,durationMs,seq,wasOpen,fn){
  if(wasOpen){
    requestAnimationFrame(function(){
      if((parseInt(el.dataset.overlayDeferSeq,10)||0)!==seq)return;
      if(!el.classList.contains('open'))return;
      fn();
    });
  }else{
    afterOverlayTransform(el,durationMs,seq,fn);
  }
}
function openSheet(id){
  var d=SHEET[id];if(!d)return;
  var sheet=document.getElementById('bsheet');
  var meta=d.meta||[];var metaHtml='';
  if(meta.length){
    metaHtml='<div class=\"bsh-meta\">';
    for(var mi=0;mi<meta.length;mi++){
      if(mi>0)metaHtml+='<div class=\"bsh-meta-sep\"></div>';
      metaHtml+='<div class=\"bsh-stat\"><span class=\"bsh-stat-n\">'+meta[mi][0]+'</span><span class=\"bsh-stat-lbl\"> '+meta[mi][1]+'</span></div>';
    }
    metaHtml+='</div>';
  }
  var users=d.users;
  var metaEl=document.getElementById('bsh-meta-el');
  document.getElementById('bsh-title').innerHTML='<i class=\"fas '+d.icon+'\"></i>'+d.title;
  document.getElementById('bsh-bd').classList.add('open');
  sheet.classList.add('open');
  if(metaEl)metaEl.innerHTML=metaHtml;
  if(id==='link-site'){
    document.getElementById('bsh-users').innerHTML='';
  }else{
    renderSheetUsers(users);
  }
  var exploreBtn=document.getElementById('bsh-explore');
  if(exploreBtn)exploreBtn.textContent=id==='link-site'?'Open in browser':'Explore all';
}
function closeSheet(){document.getElementById('bsh-bd').classList.remove('open');document.getElementById('bsheet').classList.remove('open');}
function setupPinch(id){
  var g=document.getElementById('grd-'+id);
  if(!g||g.dataset.pinchBound==='1')return;
  g.dataset.pinchBound='1';
  function colsFromClass(gg){
    if(gg.classList.contains('g1'))return 1;
    if(gg.classList.contains('g2'))return 2;
    return 3;
  }
  var pointers=new Map();
  var pinching=false,startDist=1,liveScale=1,colN=colsFromClass(g);
  function distFromMap(){
    if(pointers.size<2)return 0;
    var pts=[];pointers.forEach(function(p){pts.push(p);});
    return Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  }
  function setOriginFromPointers(){
    var rect=g.getBoundingClientRect(),sx=0,sy=0,c=0;
    pointers.forEach(function(p){sx+=p.x;sy+=p.y;c++;});
    if(!c)return;
    var mx=sx/c,my=sy/c;
    var ox=((mx-rect.left)/rect.width*100).toFixed(1),oy=((my-rect.top)/rect.height*100).toFixed(1);
    g.style.transformOrigin=ox+'% '+oy+'%';
  }
  function doSnap(n){if(n===colN)return;colN=n;setGrid(id,n);}
  function clearPinchVisual(){
    g.classList.remove('grd--pinching');
    g.style.transition=SPRING;
    g.style.transform='scale(1)';
    liveScale=1;
    pinching=false;
  }
  function onGlobalPointerEnd(e){
    if(!pointers.has(e.pointerId))return;
    pointers.delete(e.pointerId);
    if(!pinching)return;
    if(pointers.size>=2)return;
    var n=colN;
    if(liveScale>1.35&&colN>1)n=colN-1;
    else if(liveScale<0.72&&colN<3)n=colN+1;
    if(n!==colN)doSnap(n);
    clearPinchVisual();
    window.removeEventListener('pointerup',onGlobalPointerEnd,true);
    window.removeEventListener('pointercancel',onGlobalPointerEnd,true);
  }
  g.addEventListener('pointerdown',function(e){
    if(e.pointerType!=='touch')return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){
      e.preventDefault();
      pinching=true;
      colN=colsFromClass(g);
      startDist=distFromMap()||1;
      liveScale=1;
      setOriginFromPointers();
      g.style.transition='none';
      g.classList.add('grd--pinching');
      window.addEventListener('pointerup',onGlobalPointerEnd,true);
      window.addEventListener('pointercancel',onGlobalPointerEnd,true);
    }
  },{passive:false});
  g.addEventListener('pointermove',function(e){
    if(e.pointerType!=='touch'||!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(!pinching||pointers.size!==2)return;
    liveScale=Math.max(0.38,Math.min(3.2,distFromMap()/startDist));
    g.style.transform='scale('+liveScale+')';
    e.preventDefault();
  },{passive:false});
}
shuffleProfileImages();
CAR.mine.selfies=MY_SELFIES;
CAR.friend.selfies=FR_SELFIES;
initCarousel('mine');
initCarousel('friend');
prepareExtraCarousel('nonfriend');
prepareExtraCarousel('official');
initCarousel('nonfriend');
initCarousel('official');
setNonfriendPrivacy(false);
showScreen('mine');
['mine','friend','nonfriend','official'].forEach(setupPinch);
function initGridSelfieSwap(){
  document.querySelectorAll('.grd').forEach(function(grd){
    grd.addEventListener('click',function(e){
      var gisf=e.target.closest('.gisf');
      if(!gisf)return;
      e.stopPropagation();
      var gi=gisf.closest('.gi');
      if(!gi)return;
      var mainImg=gi.querySelector('img');
      var sfImg=gisf.querySelector('img');
      if(!mainImg||!sfImg)return;
      var mainSrc=mainImg.getAttribute('src');
      mainImg.setAttribute('src',sfImg.getAttribute('src'));
      sfImg.setAttribute('src',mainSrc);
    });
  });
}
initGridSelfieSwap();

function enrichGridItems(){
  document.querySelectorAll('.gi:not([data-enriched])').forEach(function(gi){
    gi.dataset.enriched='1';
    var gir=gi.querySelector('.gir');
    var rxNum=gir?parseInt(gir.textContent.trim())||0:0;
    var cmNum=Math.max(1,Math.floor(rxNum*0.5));
    // Append comment section to .gir (shown only in g2 via CSS)
    if(gir){
      var comm=document.createElement('span');
      comm.className='gir-comm';
      comm.innerHTML='<img src="biggest%20view%20actions/Comment.svg" width="15" height="15" alt="">'+cmNum;
      gir.appendChild(comm);
    }
    // Append avatar group (shown only in g1 via CSS)
    var avr=document.createElement('div');
    avr.className='gi-avr';
    avr.innerHTML='<div class="gi-av"><img src="selfies_assets/CleanShot%202026-04-15%20at%2013.25.39%402x.png" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"></div><div class="gi-av"><img src="selfies_assets/CleanShot%202026-04-15%20at%2013.27.34%402x.png" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"></div><span class="gi-avlbl">'+rxNum+' reactions</span>';
    gi.appendChild(avr);
    // Append action stack (shown only in g1 via CSS)
    var acts=document.createElement('div');
    acts.className='gi-acts';
    acts.innerHTML='<button type="button" class="gi-act" aria-label="Send"><img src="biggest%20view%20actions/send.svg" alt=""></button><button type="button" class="gi-act" aria-label="Comment"><img src="biggest%20view%20actions/Comment.svg" alt=""></button><button type="button" class="gi-act" aria-label="React"><img src="biggest%20view%20actions/Smile.svg" alt=""></button>';
    gi.appendChild(acts);
  });
}
enrichGridItems();

// ── BeReal detail ──
var CUSTOM_EMOJIS=['emojis/lol.png','emojis/cat.png','emojis/plane.png','emojis/movie.png','emojis/running-man.png','emojis/Photo%20Camera.png','emojis/weight.png','emojis/Finish.png','emojis/dog.png'];
var CTX_EMOJIS={
  mine:['emojis/lol.png','emojis/cat.png','emojis/dog.png'],
  friend:['emojis/plane.png','emojis/movie.png','emojis/running-man.png','emojis/Photo%20Camera.png','emojis/weight.png'],
  nonfriend:['emojis/Finish.png','emojis/lol.png','emojis/cat.png','emojis/plane.png','emojis/movie.png','emojis/dog.png'],
  official:['emojis/Photo%20Camera.png','emojis/plane.png','emojis/Finish.png','emojis/running-man.png','emojis/weight.png','emojis/lol.png']
};
var CTX_MAX_RMOJI={mine:2,friend:5,nonfriend:6,official:6};
var BR_CTX={
  mine:{username:'Lea',status:'On time',date:'Today at 3:25 PM',caption:null,location:'Paris, France',music:'Chris Brown - Feel Something',rmCount:5,commCount:0,comments:[]},
  friend:{username:'Camille',status:'On time',date:'Yesterday at 7:12 PM',caption:'Working late while dreaming of a long walk by the river.',location:'Lyon, France',music:'Doja Cat - Streets',rmCount:47,commCount:3,comments:[
    {user:'sonatchi',time:'5min ago',text:'Looks like fun!',av:0},
    {user:'leo_m',time:'12min ago',text:'Love this vibe ✨',av:1},
    {user:'camille_p',time:'23min ago',text:'Miss you so much!',av:2}
  ]},
  nonfriend:{username:'Louis',status:'2 min late',date:'Apr 13 at 12:31 PM',caption:'Exploring the city',location:'Nice, France',music:'Kendrick Lamar - Not Like Us',rmCount:312,commCount:2,comments:[
    {user:'pierre_t',time:'1h ago',text:'Incredible shot!',av:1},
    {user:'marie_d',time:'2h ago',text:'Nice! 🔥',av:3}
  ]},
  official:{username:'BeReal',status:'On time',date:'Apr 16 at 10:00 AM',caption:'Real moments, real people.',location:'Worldwide',music:null,rmCount:14800,commCount:4,comments:[
    {user:'ana_l',time:'3min ago',text:'Love BeReal!',av:0},
    {user:'max_r',time:'8min ago',text:'Every day 🙌',av:2},
    {user:'julia_k',time:'15min ago',text:'Such a vibe',av:4},
    {user:'tom_w',time:'22min ago',text:'My favorite app',av:1}
  ]}
};
function openBeRealDetail(mainSrc,sfSrc,ctx){
  closeCtxMenu();
  var d=BR_CTX[ctx]||BR_CTX.mine;
  var br=document.getElementById('br-detail');
  var wasOpen=br.classList.contains('open');
  var seq=bumpOverlayDeferSeq(br);
  var mainEl=document.getElementById('brd-main-img');
  var sfImg=document.getElementById('brd-sf-img');
  var sfEl=document.getElementById('brd-sf');
  var rmEl=document.getElementById('brd-realmojis');
  var clRoot=document.getElementById('brd-comments-list');
  var ch=document.getElementById('brd-comm-hd');
  resetImgPh(mainEl);
  resetImgPh(sfImg);
  if(mainEl)mainEl.removeAttribute('src');
  if(sfImg)sfImg.removeAttribute('src');
  if(sfEl)sfEl.style.display='none';
  if(rmEl)rmEl.innerHTML='';
  if(clRoot)clRoot.innerHTML='';
  if(ch)ch.style.display='none';
  document.getElementById('brd-uname').textContent=d.username;
  document.getElementById('brd-ustatus').textContent=d.status;
  var dateEl=document.getElementById('brd-udate');if(dateEl)dateEl.textContent=d.date||'';
  var capEl=document.getElementById('brd-caption-el');
  capEl.textContent=d.caption||'';capEl.style.display=d.caption?'':'none';
  var mp=document.getElementById('brd-music-pill');
  document.getElementById('brd-music-txt').textContent=d.music||'';mp.style.display=d.music?'':'none';
  document.getElementById('brd-loc-txt').textContent=d.location;
  var cnt=d.rmCount;document.getElementById('brd-rm-cnt').textContent=cnt>=1000?(cnt/1000).toFixed(1).replace('.0','')+' K':String(cnt);
  var emojis=CTX_EMOJIS[ctx]||CUSTOM_EMOJIS;
  var avs=SELFIE_PATHS.slice();var rmHtml='';
  var show=Math.min(CTX_MAX_RMOJI[ctx]||4,d.rmCount);
  for(var i=0;i<show;i++){
    rmHtml+='<div class="brd-rmoji"><div class="brd-rmoji-wrap"><div class="brd-rmoji-av img-ph"><img src="'+avs[i%avs.length]+'" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"></div><div class="brd-rmoji-emoji img-ph"><img src="'+emojis[i%emojis.length]+'" alt=""></div></div></div>';
  }
  var comments=d.comments||[];
  var commHtml='';
  for(var j=0;j<comments.length;j++){
    var c=comments[j];
    commHtml+='<div class="brd-comment"><div class="brd-comm-av img-ph"><img src="'+SELFIE_PATHS[(c.av||0)%SELFIE_PATHS.length]+'" alt=""></div><div class="brd-comm-body"><div class="brd-comm-hd"><span class="brd-comm-uname">'+c.user+'</span><span class="brd-comm-time">'+c.time+'</span></div><div class="brd-comm-text">'+c.text+'</div><div class="brd-comm-reply">Reply</div></div></div>';
  }
  br.scrollTop=0;
  br.classList.add('open');
  runAfterOverlayOpen(br,400,seq,wasOpen,function(){
    resetImgPh(mainEl);
    resetImgPh(sfImg);
    mainEl.src=mainSrc;
    sfImg.src=sfSrc||'';sfEl.style.display=sfSrc?'':'none';
    wireImgPh(mainEl);
    wireImgPh(sfImg);
    document.getElementById('brd-realmojis').innerHTML=rmHtml;
    wireAllImgPh(document.getElementById('brd-realmojis'));
    if(comments.length>0){
      ch.style.display='';document.getElementById('brd-comm-cnt').textContent=d.commCount;
      var cl=document.getElementById('brd-comments-list');if(cl)cl.innerHTML=commHtml;
      wireAllImgPh(cl);
    }else{
      ch.style.display='none';
      var cl=document.getElementById('brd-comments-list');if(cl)cl.innerHTML='';
    }
  });
}
function resetBeRealDetailMedia(){
  var m=document.getElementById('brd-main-img');
  var si=document.getElementById('brd-sf-img');
  var sf=document.getElementById('brd-sf');
  resetImgPh(m);
  resetImgPh(si);
  if(m)m.removeAttribute('src');
  if(si)si.removeAttribute('src');
  if(sf)sf.style.display='none';
  var rm=document.getElementById('brd-realmojis');
  if(rm)rm.innerHTML='';
  var cl=document.getElementById('brd-comments-list');
  if(cl)cl.innerHTML='';
  var hd=document.getElementById('brd-comm-hd');
  if(hd)hd.style.display='none';
}
function closeBeRealDetail(){
  closeCtxMenu();
  resetBeRealDetailMedia();
  document.getElementById('br-detail').classList.remove('open');
}
function closeCtxMenu(){
  var bd=document.getElementById('ctx-menu-bd');
  var p=document.getElementById('ctx-menu-panel');
  if(bd){bd.classList.remove('on');bd.setAttribute('aria-hidden','true');}
  if(p){p.classList.remove('on');p.setAttribute('aria-hidden','true');delete p.dataset.kind;}
}
function positionCtxMenu(anchorEl){
  var p=document.getElementById('ctx-menu-panel');
  if(!p||!anchorEl)return;
  var r=anchorEl.getBoundingClientRect();
  var mw=Math.min(260,Math.max(200,window.innerWidth-32));
  p.style.width=mw+'px';
  p.style.left='0px';
  p.style.top='0px';
  var ph=p.offsetHeight||1;
  var pw=p.offsetWidth||mw;
  var left=r.right-pw;
  if(left<12)left=12;
  if(left+pw>window.innerWidth-12)left=window.innerWidth-12-pw;
  var top=r.bottom+8;
  if(top+ph>window.innerHeight-12)top=Math.max(12,r.top-ph-8);
  p.style.left=left+'px';
  p.style.top=top+'px';
}
function ctxMenuSvgTrash(){
  return'<svg class="ctx-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
}
function ctxMenuSvgLink(){
  return'<svg class="ctx-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';
}
function ctxMenuSvgFlag(){
  return'<svg class="ctx-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/></svg>';
}
function openCtxMenu(anchorEl,kind){
  var bodyEl=document.getElementById('ctx-menu-body');
  var bd=document.getElementById('ctx-menu-bd');
  var p=document.getElementById('ctx-menu-panel');
  if(!bodyEl||!bd||!p)return;
  if(kind==='hl'){
    bodyEl.innerHTML='<button type="button" role="menuitem" onclick="ctxHlShare()"><span class="ctx-mi" aria-hidden="true"><i class="fas fa-arrow-up-from-bracket"></i></span><span class="ctx-mt">Share highlight</span></button><button type="button" role="menuitem" onclick="ctxHlEdit()"><span class="ctx-mi" aria-hidden="true"><i class="fas fa-pen"></i></span><span class="ctx-mt">Edit highlight</span></button><button type="button" role="menuitem" class="danger" onclick="ctxHlDelete()"><span class="ctx-mi" aria-hidden="true">'+ctxMenuSvgTrash()+'</span><span class="ctx-mt">Delete highlight</span></button>';
  }else{
    bodyEl.innerHTML='<button type="button" role="menuitem" onclick="ctxBrShare()"><span class="ctx-mi" aria-hidden="true"><i class="fas fa-arrow-up-from-bracket"></i></span><span class="ctx-mt">Share BeReal</span></button><button type="button" role="menuitem" onclick="ctxBrCopyLink()"><span class="ctx-mi" aria-hidden="true">'+ctxMenuSvgLink()+'</span><span class="ctx-mt">Copy link</span></button><button type="button" role="menuitem" onclick="ctxBrReport()"><span class="ctx-mi" aria-hidden="true">'+ctxMenuSvgFlag()+'</span><span class="ctx-mt">Report…</span></button>';
  }
  p.dataset.kind=kind;
  bd.classList.add('on');
  bd.setAttribute('aria-hidden','false');
  p.classList.add('on');
  p.setAttribute('aria-hidden','false');
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){positionCtxMenu(anchorEl);});
  });
}
function toggleCtxMenu(ev,kind){
  if(ev){ev.preventDefault();ev.stopPropagation();}
  var anchor=ev&&ev.currentTarget;
  var p=document.getElementById('ctx-menu-panel');
  if(p&&p.classList.contains('on')&&p.dataset.kind===kind){closeCtxMenu();return;}
  openCtxMenu(anchor,kind);
}
function ctxHlShare(){closeCtxMenu();}
function ctxHlEdit(){closeCtxMenu();}
function ctxHlDelete(){closeCtxMenu();}
function ctxBrShare(){closeCtxMenu();}
function ctxBrCopyLink(){closeCtxMenu();}
function ctxBrReport(){closeCtxMenu();}
function initCtxMenuDismiss(){
  if(window.__ctxMenuDismiss)return;
  window.__ctxMenuDismiss=1;
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeCtxMenu();});
  window.addEventListener('resize',function(){closeCtxMenu();});
}
function initBrDetailSelfieTap(){
  var sf=document.getElementById('brd-sf');
  if(!sf||sf.dataset.swapTapBound)return;
  sf.dataset.swapTapBound='1';
  sf.addEventListener('click',function(e){
    e.stopPropagation();
    var m=document.getElementById('brd-main-img');
    var si=document.getElementById('brd-sf-img');
    if(!m||!si)return;
    var a=m.getAttribute('src')||'';
    var b=si.getAttribute('src')||'';
    if(!b)return;
    resetImgPh(m);
    resetImgPh(si);
    m.setAttribute('src',b);
    si.setAttribute('src',a);
    wireImgPh(m);
    wireImgPh(si);
  });
}
initBrDetailSelfieTap();
// ── Highlight sheet ──
var ALL_PICS_HL=['pictures_assets/IMG_2815.jpeg','pictures_assets/IMG_3582.JPG','pictures_assets/IMG_3606.JPG','pictures_assets/IMG_6689.jpeg','pictures_assets/IMG_6714.jpeg','pictures_assets/IMG_6745.jpeg','pictures_assets/IMG_6751.jpeg','pictures_assets/IMG_0082.jpeg','pictures_assets/IMG_0313.jpeg','pictures_assets/IMG_0766.jpeg','pictures_assets/IMG_1080.jpeg','pictures_assets/IMG_1228.jpeg','pictures_assets/IMG_1666.jpeg','pictures_assets/IMG_2193.jpeg','pictures_assets/IMG_2726.jpeg'];
var ALL_SF_HL=['selfies_assets/CleanShot%202026-04-15%20at%2013.25.39%402x.png','selfies_assets/CleanShot%202026-04-15%20at%2013.26.14%402x.png','selfies_assets/CleanShot%202026-04-15%20at%2013.26.46%402x.png','selfies_assets/CleanShot%202026-04-15%20at%2013.27.18%402x.png','selfies_assets/CleanShot%202026-04-15%20at%2013.27.34%402x.png','selfies_assets/CleanShot%202026-04-15%20at%2013.27.57%402x.png','selfies_assets/CleanShot%202026-04-15%20at%2013.28.07%402x.png','selfies_assets/CleanShot%202026-04-15%20at%2013.31.08%402x.png'];
var HL_GIR_SVG='<svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true"><circle cx="5.5" cy="5.5" r="5" stroke="rgba(255,255,255,0.9)" stroke-width="1"/><circle cx="3.8" cy="4.8" r=".65" fill="rgba(255,255,255,0.9)"/><circle cx="7.2" cy="4.8" r=".65" fill="rgba(255,255,255,0.9)"/><path d="M3.2 7c.6.8 4 .8 4.6 0" stroke="rgba(255,255,255,0.9)" stroke-width=".9" stroke-linecap="round"/></svg>';
var HL_GI_AVR_INNER='<div class="gi-av"><img src="selfies_assets/CleanShot%202026-04-15%20at%2013.25.39%402x.png" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"></div><div class="gi-av"><img src="selfies_assets/CleanShot%202026-04-15%20at%2013.27.34%402x.png" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"></div><span class="gi-avlbl">__RX__ reactions</span>';
var HL_GI_ACTS_INNER='<button type="button" class="gi-act" aria-label="Send" onclick="event.stopPropagation()"><img src="biggest%20view%20actions/send.svg" alt=""></button><button type="button" class="gi-act" aria-label="Comment" onclick="event.stopPropagation()"><img src="biggest%20view%20actions/Comment.svg" alt=""></button><button type="button" class="gi-act" aria-label="React" onclick="event.stopPropagation()"><img src="biggest%20view%20actions/Smile.svg" alt=""></button>';
function buildHlPosts(n,start){
  var posts=[];
  for(var i=0;i<n;i++){
    var idx=(start+i)%ALL_PICS_HL.length;
    posts.push({main:ALL_PICS_HL[idx],sf:ALL_SF_HL[idx%ALL_SF_HL.length]});
  }
  return posts;
}
function hlData(n,start){
  var posts=buildHlPosts(n,start);
  return{cover:posts[0].main,count:n,posts:posts};
}
var HIGHLIGHTS={
  mine:{
    'Cycling':hlData(8,14),
    'Climbing':hlData(12,8),
    'Summer':hlData(23,9),
    'Paris':hlData(15,7),
    'Views':hlData(6,10)
  },
  friend:{
    'Paris':hlData(15,7),
    'Coast':hlData(9,9),
    'Views':hlData(6,10),
    'Food':hlData(11,1),
    'Trips':hlData(18,8)
  },
  nonfriend:{
    'Views':hlData(6,10),
    'Beach':hlData(7,9),
    'Climbing':hlData(12,5)
  },
  official:{
    'Best of':hlData(34,0),
    'Nature':hlData(22,3),
    'Cities':hlData(16,5),
    'Golden Hour':hlData(8,4),
    'People':hlData(19,7)
  }
};
function escJsStr(s){
  return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}
function getHighlightData(ctx,name){
  var bucket=HIGHLIGHTS[ctx];
  if(!bucket)return null;
  return bucket[name]||null;
}
function syncHlSheetTitleFromName(){
  var f=document.getElementById('hl-name-field');
  var ttl=document.getElementById('hl-sht-ttl');
  if(!f||!ttl)return;
  var t=f.value.trim();
  ttl.textContent=t||'New Highlight';
}
function updateHlCreateEnabled(){
  var btn=document.querySelector('.hl-create-btn');
  if(!btn)return;
  var slot=document.getElementById('hl-cover-slot');
  var coverReady=slot&&slot.dataset.coverReady==='1';
  var name=(document.getElementById('hl-name-field')&&document.getElementById('hl-name-field').value.trim())||'';
  var nSel=document.querySelectorAll('#hl-grid .hl-gi.selected').length;
  var ok=coverReady&&name.length>0&&nSel>=1;
  var prevOk=btn.dataset.hlOk==='1';
  btn.dataset.hlOk=ok?'1':'0';
  btn.removeAttribute('disabled');
  btn.setAttribute('aria-disabled',ok?'false':'true');
  btn.classList.toggle('is-locked',!ok);
  btn.style.pointerEvents=ok?'':'none';
  btn.tabIndex=ok?0:-1;
  if(btn.dataset.hlInit==='1'&&prevOk!==ok){
    btn.classList.remove('hl-create-pulse');
    void btn.offsetWidth;
    btn.classList.add('hl-create-pulse');
    var onEnd=function(ev){
      if(ev&&ev.animationName&&ev.animationName!=='hlCreateBounce')return;
      btn.classList.remove('hl-create-pulse');
      btn.removeEventListener('animationend',onEnd);
    };
    btn.addEventListener('animationend',onEnd);
  }
  btn.dataset.hlInit='1';
}
function openHlSheet(mode,name,ctx){
  var sht=document.getElementById('hl-sht');
  var tok=(parseInt(sht.dataset.hlApplyTok,10)||0)+1;
  sht.dataset.hlApplyTok=String(tok);
  var skt=document.getElementById('hl-skt');
  var creator=document.getElementById('hl-creator');
  var viewer=document.getElementById('hl-viewer');
  var icons=document.getElementById('hl-sht-icons');
  var spacer=document.getElementById('hl-sht-spacer');
  var ttl=document.getElementById('hl-sht-ttl');
  // Set nav title/icons synchronously (text-only, no layout)
  ttl.textContent=mode==='new'?'New Highlight':(name||'Highlight');
  if(icons)icons.style.display=mode==='new'?'none':'flex';
  if(spacer)spacer.style.display=mode==='new'?'':'none';
  // Hide content panes, show skeleton
  creator.style.display='none';
  viewer.style.display='none';
  if(skt)skt.style.display='flex';
  // Start animation — only the class change, compositor layer already promoted
  sht.classList.add('open');
  // Populate content after transition completes, then swap skeleton → content
  setTimeout(function(){
    if(parseInt(sht.dataset.hlApplyTok,10)!==tok)return;
    if(!sht.classList.contains('open'))return;
    var scrollEl=document.querySelector('.hl-creator-scroll');
    if(mode==='new'){
      var cbtn=document.querySelector('.hl-create-btn');
      if(cbtn){delete cbtn.dataset.hlInit;delete cbtn.dataset.hlOk;}
      document.getElementById('hl-name-field').value='';
      var cs=document.getElementById('hl-cover-slot');
      cs.innerHTML='<i class="fas fa-image"></i><span>Add highlight cover</span>';
      delete cs.dataset.coverReady;
      var g=document.getElementById('hl-grid');
      var html='';
      for(var i=0;i<ALL_PICS_HL.length;i++){
        var p=ALL_PICS_HL[i];var sf=ALL_SF_HL[i%ALL_SF_HL.length];
        html+='<div class="hl-gi" onclick="toggleHlSelect(this,\''+escJsStr(p)+'\')">';
        html+='<div class="img-ph hl-gi-main"><img src="'+p+'" alt=""></div><div class="hl-gi-sf"><div class="img-ph hl-gi-sf-in"><img src="'+sf+'" alt=""></div></div><div class="hl-gi-sel"></div></div>';
      }
      g.innerHTML=html;
      wireAllImgPh(g);
      if(scrollEl)scrollEl.scrollTop=0;
      syncHlSheetTitleFromName();
      updateHlCreateEnabled();
      creator.style.animation='sheetItemIn 300ms cubic-bezier(0.2,0,0,1) both';
      creator.style.display='flex';
    }else{
      var h=getHighlightData(ctx||'mine',name);
      if(!h)h=hlData(6,0);
      document.getElementById('hl-view-cnt').textContent=h.count+' BeReals';
      var capEl=document.getElementById('hl-view-caption');
      if(capEl)capEl.textContent=name||'Highlight';
      var coverImg=document.getElementById('hl-view-cover-img');
      var vg=document.getElementById('hl-view-grid');
      if(coverImg){resetImgPh(coverImg);coverImg.removeAttribute('src');}
      var vhtml='';var cctx=ctx||'mine';
      for(var j=0;j<h.posts.length;j++){
        var pair=h.posts[j];var vp=pair.main;var vsf=pair.sf;
        var rxNum=2+(j*7)%29;
        var cmNum=Math.max(1,Math.floor(rxNum*0.5));
        vhtml+='<div class="hl-vgi" onclick="openBeRealDetail(\''+escJsStr(vp)+'\',\''+escJsStr(vsf)+'\',\''+cctx+'\')"><div class="img-ph hl-vgi-main"><img src="'+vp+'" alt=""></div><div class="hl-vgi-sf" onclick="event.stopPropagation()"><div class="img-ph hl-vgi-sf-in"><img src="'+vsf+'" alt=""></div></div><div class="gir">'+HL_GIR_SVG+rxNum+'<span class="gir-comm"><img src="biggest%20view%20actions/Comment.svg" width="15" height="15" alt="">'+cmNum+'</span></div><div class="gi-avr">'+HL_GI_AVR_INNER.replace('__RX__',String(rxNum))+'</div><div class="gi-acts">'+HL_GI_ACTS_INNER+'</div></div>';
      }
      vg.innerHTML=vhtml;
      wireAllImgPh(vg);
      setHlViewGrid(3,false);
      if(coverImg){resetImgPh(coverImg);coverImg.src=h.cover||h.posts[0].main;wireImgPh(coverImg);}
      var vInner=document.querySelector('.hl-viewer-inner');
      if(vInner)vInner.scrollTop=0;
      viewer.style.animation='sheetItemIn 300ms cubic-bezier(0.2,0,0,1) both';
      viewer.style.display='flex';
    }
    if(skt)skt.style.display='none';
  },420);
}
function closeHlSheet(){
  closeCtxMenu();
  var sht=document.getElementById('hl-sht');
  sht.dataset.hlApplyTok=String((parseInt(sht.dataset.hlApplyTok,10)||0)+1);
  sht.classList.remove('open');
  var creator=document.getElementById('hl-creator');
  var viewer=document.getElementById('hl-viewer');
  if(creator)creator.style.animation='';
  if(viewer)viewer.style.animation='';
}
function resetHlCreator(){
  document.getElementById('hl-name-field').value='';
  var cs=document.getElementById('hl-cover-slot');
  cs.innerHTML='<i class="fas fa-image"></i><span>Add highlight cover</span>';
  delete cs.dataset.coverReady;
  document.querySelectorAll('#hl-grid .hl-gi.selected').forEach(function(el){el.classList.remove('selected');});
  syncHlSheetTitleFromName();
  updateHlCreateEnabled();
}
function pickRandomHlCover(){
  if(!ALL_PICS_HL.length)return;
  var slot=document.getElementById('hl-cover-slot');
  if(!slot)return;
  var pic=ALL_PICS_HL[Math.floor(Math.random()*ALL_PICS_HL.length)];
  slot.innerHTML='<div class="img-ph hl-cover-slot-img"><img src="'+pic+'" alt=""></div>';
  slot.dataset.coverReady='1';
  wireImgPh(slot.querySelector('img'));
  syncHlSheetTitleFromName();
  updateHlCreateEnabled();
}
function initHlCoverSlotTap(){
  var slot=document.getElementById('hl-cover-slot');
  if(!slot||slot.dataset.coverTapBound)return;
  slot.dataset.coverTapBound='1';
  slot.addEventListener('click',function(){pickRandomHlCover();});
}
function initHlNameFieldSync(){
  var f=document.getElementById('hl-name-field');
  if(!f||f.dataset.syncBound)return;
  f.dataset.syncBound='1';
  f.addEventListener('input',function(){
    syncHlSheetTitleFromName();
    updateHlCreateEnabled();
  });
}
function createHighlight(){
  var cbtn=document.querySelector('.hl-create-btn');
  if(cbtn&&cbtn.classList.contains('is-locked'))return;
  var nameField=document.getElementById('hl-name-field');
  var name=nameField?nameField.value.trim():'';
  var cs=document.getElementById('hl-cover-slot');
  var coverImg=cs&&cs.querySelector('img');
  var mainSrc=coverImg?coverImg.getAttribute('src'):'';
  var sels=document.querySelectorAll('#hl-grid .hl-gi.selected');
  if(cs.dataset.coverReady!=='1'||!mainSrc){alert('Tap Add highlight cover first.');return;}
  if(!name){alert('Enter a highlight name.');return;}
  if(sels.length<1){alert('Select at least one BeReal for this highlight.');return;}
  if(HIGHLIGHTS.mine[name]){alert('You already have a highlight with that name.');return;}
  var posts=[];
  for(var i=0;i<sels.length;i++){
    var gi=sels[i];
    var mi=gi.querySelector('.hl-gi-main img');
    var sfi=gi.querySelector('.hl-gi-sf-in img');
    if(mi)posts.push({main:mi.getAttribute('src'),sf:sfi?sfi.getAttribute('src'):ALL_SF_HL[0]});
  }
  if(!posts.length){alert('Select at least one BeReal for this highlight.');return;}
  HIGHLIGHTS.mine[name]={cover:mainSrc,count:posts.length,posts:posts};
  var row=document.querySelector('#s-mine .hl-row');
  if(row){
    var newItem=document.createElement('div');
    newItem.className='hl-item';
    var circle=document.createElement('div');
    circle.className='hl-circle';
    var im=document.createElement('img');
    im.setAttribute('src',mainSrc);
    im.setAttribute('style','width:100%;height:100%;object-fit:cover;object-position:center 25%;display:block;');
    im.setAttribute('alt','');
    circle.appendChild(im);
    var lbl=document.createElement('div');
    lbl.className='hl-label';
    lbl.textContent=name;
    newItem.appendChild(circle);
    newItem.appendChild(lbl);
    var anchor=row.children[1];
    if(anchor)row.insertBefore(newItem,anchor);
    else row.appendChild(newItem);
  }
  resetHlCreator();
  closeHlSheet();
}
function toggleHlSelect(el,picSrc){
  el.classList.toggle('selected');
  var ring=el.querySelector('.hl-gi-sel');
  if(ring){
    ring.classList.remove('hl-gi-sel-pop');
    void ring.offsetWidth;
    ring.classList.add('hl-gi-sel-pop');
    var onPopEnd=function(ev){
      if(ev&&ev.animationName&&ev.animationName!=='hlGisPop')return;
      ring.classList.remove('hl-gi-sel-pop');
      ring.removeEventListener('animationend',onPopEnd);
    };
    ring.addEventListener('animationend',onPopEnd);
  }
  updateHlCreateEnabled();
}
function initHlItems(){
  if(window.__hlItemsDelegated)return;
  window.__hlItemsDelegated=1;
  document.addEventListener('pointerdown',function(e){
    var item=e.target.closest('.hl-item');
    if(!item)return;
    var row=item.closest('.hl-row');
    if(!row)return;
    var circle=item.querySelector('.hl-circle');
    if(!circle)return;
    if(circle.classList.contains('hl-new')){e.preventDefault();openHlSheet('new');return;}
    var lbl=item.querySelector('.hl-label');
    if(!lbl)return;
    e.preventDefault();
    var screen=row.closest('.screen');
    var ctx='mine';
    if(screen){
      if(screen.id==='s-friend')ctx='friend';
      else if(screen.id==='s-nonfriend')ctx='nonfriend';
      else if(screen.id==='s-official')ctx='official';
    }
    openHlSheet('view',lbl.textContent.trim(),ctx);
  },true);
}
function initGridDetailOpen(){
  document.querySelectorAll('.grd').forEach(function(grd){
    var screenEl=grd.closest('.screen');var ctx='mine';
    if(screenEl){if(screenEl.id==='s-friend')ctx='friend';else if(screenEl.id==='s-nonfriend')ctx='nonfriend';else if(screenEl.id==='s-official')ctx='official';}
    grd.addEventListener('click',function(e){
      if(e.target.closest('.gisf'))return;
      var gi=e.target.closest('.gi');if(!gi)return;
      var mainImg=gi.querySelector(':scope > img');var sfImg=gi.querySelector('.gisf img');
      if(mainImg)openBeRealDetail(mainImg.src,sfImg?sfImg.src:null,ctx);
    });
  });
}
initHlCoverSlotTap();
initHlNameFieldSync();
updateHlCreateEnabled();
initHlItems();
initGridDetailOpen();
initCtxMenuDismiss();
