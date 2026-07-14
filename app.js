const KEY='echoArchiveProgressV1';
const state=JSON.parse(localStorage.getItem(KEY)||'{"solved":[],"hint":{},"evidence":[]}');
const content=document.querySelector('#content');
const progress=document.querySelector('#progress');
const hintBox=document.querySelector('#hint');
const chapters=['p01','p02','p03','p04','p05','p06','p07','p08'];
const labels=['停更日之後','兩套索引','不存在的附件','誰在那台電腦上','故障之前','只還原核定版','佩真的稽核鏈','事件重建報告'];
let current='home', currentData=null;

function save(){localStorage.setItem(KEY,JSON.stringify(state));renderProgress()}
function renderProgress(){progress.innerHTML=chapters.map((id,i)=>`<li class="${state.solved.includes(id)?'done':''}">${state.solved.includes(id)?'完成：':''}${labels[i]}</li>`).join('')}
function escapeHTML(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function setRoute(route){location.hash=route}

const pages={
 home:`<h2>資料復原首頁</h2><div class="notice"><strong>系統公告：</strong>本站為 2008 年 11 月資料復原版本，部分導覽圖示與附件可能遺失。</div><table class="news"><tr><th>日期</th><th>消息</th></tr><tr><td>2008-11-07</td><td>網站資料復原作業暫告一段落</td></tr><tr><td>2008-10-20</td><td>伺服器設備檢修公告</td></tr><tr><td>2007-12-28</td><td><a href="#notice2007">年度網站維護說明</a></td></tr></table><p class="status">左側原有「歷年資料」圖示目前無法顯示。圖示替代文字：<button class="action" data-go="p01">歷年資料（2008）</button></p>`,
 about:`<h2>中心簡介</h2><p>岬角地方文化數位保存中心成立於 2001 年，位於虛構的望潮鎮，辦理地方刊物、照片與口述訪談數位化。</p><div class="notice">本網站及所有內容均為虛構解謎作品，非真實機構或事件。</div>`,
 news:`<h2>最新消息</h2><table class="news"><tr><th>日期</th><th>分類</th><th>標題</th></tr><tr><td>2008-11-07</td><td>系統</td><td>資料復原完成</td></tr><tr><td>2008-10-20</td><td>系統</td><td>設備檢修</td></tr><tr><td>2008-10-14</td><td>行政</td><td>特展內容確認會議</td></tr><tr><td>2008-09-18</td><td>活動</td><td>望潮港口述史整理</td></tr></table>`,
 staff:`<h2>工作人員</h2><div class="cards"><div class="card"><h3>高文淵</h3><p>主任｜計畫與行政核定</p></div><div class="card"><h3>許靜宜</h3><p>資料管理員｜索引與備份</p></div><div class="card"><h3>蘇婉玲</h3><p>研究企劃｜口述訪談</p></div><div class="card"><h3>林佩真</h3><p>約聘網站助理｜網站更新</p></div></div>`,
 sitemap:`<h2>網站導覽</h2><ul><li><a href="#home">首頁</a></li><li><a href="#news">最新消息</a></li><li><a href="#staff">工作人員</a></li><li><a href="#p01">歷年資料：2008</a></li><li><a href="#about">作品說明</a></li></ul>`,
 notice2007:`<h2>年度網站維護說明</h2><div class="document"><div class="meta">資訊維護組｜2007-12-28</div><p>年度封存後，各年份資料仍可由首頁「歷年資料」圖示或網站導覽進入。若圖示遺失，請使用文字版網站導覽。</p></div><button class="action" data-go="p01">前往 2008 年資料</button>`
};

async function render(){
 current=(location.hash||'#home').slice(1); hintBox.textContent=''; currentData=null;
 if(pages[current]){content.innerHTML=pages[current];bind();content.focus();return}
 if(chapters.includes(current)){
   try{const r=await fetch(`data/${current}.json`); if(!r.ok)throw new Error(); currentData=await r.json(); renderChapter(currentData)}catch{content.innerHTML='<h2>資料讀取失敗</h2><p>請確認網站檔案已完整載入。</p>'}
 }else{content.innerHTML='<h2>404 找不到資料</h2><p>此頁可能在復原時移動。請查看 <a href="#sitemap">網站導覽</a>。</p>'}
 content.focus();
}

function renderChapter(d){
 const locked=d.requires&&!state.solved.includes(d.requires);
 if(locked){content.innerHTML=`<h2>${escapeHTML(d.title)}</h2><p class="status error">尚缺少前一階段證據。請先完成「${labels[chapters.indexOf(d.requires)]}」。</p>`;return}
 const docs=d.documents.map(x=>`<section class="${x.type||'document'}"><h3>${escapeHTML(x.title)}</h3>${x.meta?`<div class="meta">${escapeHTML(x.meta)}</div>`:''}${x.body||''}</section>`).join('');
 const choices=d.choices.map(c=>`<button data-answer="${escapeHTML(c.id)}">${escapeHTML(c.label)}</button>`).join('');
 content.innerHTML=`<h2>${escapeHTML(d.title)}</h2><p>${escapeHTML(d.task)}</p>${docs}<h3>你的判斷</h3><div class="choices">${choices}</div><div id="feedback" aria-live="polite"></div>`;
 bind();
}

function answer(id){
 const fb=document.querySelector('#feedback');
 if(id===currentData.answer){
   if(!state.solved.includes(current))state.solved.push(current);
   for(const e of currentData.evidence||[])if(!state.evidence.includes(e))state.evidence.push(e);
   save();
   const next=chapters[chapters.indexOf(current)+1];
   fb.innerHTML=`<p class="status success"><strong>推理成立。</strong> ${currentData.success}</p>${next?`<button class="action" data-go="${next}">繼續調查</button>`:'<button class="action" data-go="ending">閱讀結語</button>'}`;
   bind();
 }else fb.innerHTML=`<p class="status error">這個說法與目前文件仍有衝突。${currentData.feedback||'請重新比對日期與文件用途。'}</p>`;
}
function bind(){document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>setRoute(b.dataset.go));document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(b.dataset.answer))}

document.querySelectorAll('nav [data-route]').forEach(b=>b.onclick=()=>setRoute(b.dataset.route));
document.querySelector('#hintButton').onclick=()=>{if(!currentData){hintBox.textContent='先從首頁的資料復原公告與網站導覽開始。';return}const n=Math.min((state.hint[current]||0)+1,2);state.hint[current]=n;save();hintBox.textContent=currentData.hints[n-1]};
document.querySelector('#resetButton').onclick=()=>{if(confirm('確定清除遊戲進度？')){localStorage.removeItem(KEY);location.reload()}};
window.addEventListener('hashchange',render);
pages.ending=`<h2>調查完成</h2><div class="document"><div class="meta">2009 年封存信件摘要</div><p>接手資料的人您好。我沒有失蹤，也沒有遭遇事故。我只是希望往後有人能分清楚：哪些內容在事故前就被改過、哪些資料是操作失誤刪掉、又有哪些檔案明明能還原卻被決定留下。若你能靠文件自己得到答案，這份紀錄才算真的被保存。</p><p>——林佩真</p></div><div class="notice">《回聲資料室》為完全虛構的網頁解謎作品。</div>`;
renderProgress();render();