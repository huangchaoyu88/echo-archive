const KEY='echoArchiveProgressV2';
const state=JSON.parse(localStorage.getItem(KEY)||'{"solved":[],"evidence":[],"errors":{}}');
const content=document.querySelector('#content');
const chapters=['p01','p02','p03','p04','p05','p06','p07','p08'];
const labels=['2008 年封存資料','原始與核定索引','附件列印紀錄','帳號使用紀錄','設備報修附件','備份還原清單','資料核對紀錄','事件重建摘要'];
let current='home', currentData=null;

function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function escapeHTML(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

const pages={
 home:`<h2>資料復原首頁</h2><div class="notice"><strong>系統公告：</strong>本站為 2008 年 11 月資料復原版本，部分導覽圖示與附件可能遺失。</div><table class="news"><tr><th>日期</th><th>消息</th></tr><tr><td>2008-11-07</td><td>網站資料復原作業暫告一段落</td></tr><tr><td>2008-10-20</td><td>伺服器設備檢修公告</td></tr><tr><td>2007-12-28</td><td><a href="#notice2007">年度網站維護說明</a></td></tr></table><p class="missing-icon">[圖片遺失：歷年資料（2008）]</p><p><a href="#p01">文字版：歷年資料（2008）</a></p>`,
 about:`<h2>中心簡介</h2><p>岬角地方文化數位保存中心成立於 2001 年，位於望潮鎮，辦理地方刊物、照片與口述訪談數位化。</p><h3>服務項目</h3><ul><li>地方文獻數位建檔</li><li>口述歷史訪談整理</li><li>社區影像與刊物保存</li></ul>`,
 news:`<h2>最新消息</h2><table class="news"><tr><th>日期</th><th>分類</th><th>標題</th></tr><tr><td>2008-11-07</td><td>系統</td><td>資料復原完成</td></tr><tr><td>2008-10-20</td><td>系統</td><td>設備檢修</td></tr><tr><td>2008-10-14</td><td>行政</td><td>特展內容確認會議</td></tr><tr><td>2008-09-18</td><td>活動</td><td>望潮港口述史整理</td></tr></table>`,
 staff:`<h2>工作人員</h2><table class="news"><tr><th>姓名</th><th>職務</th><th>分機</th></tr><tr><td>高文淵</td><td>主任｜計畫與行政核定</td><td>101</td></tr><tr><td>許靜宜</td><td>資料管理員｜索引與備份</td><td>203</td></tr><tr><td>蘇婉玲</td><td>研究企劃｜口述訪談</td><td>205</td></tr><tr><td>林佩真</td><td>約聘網站助理｜網站更新</td><td>207</td></tr></table>`,
 sitemap:`<h2>文字版網站導覽</h2><ul class="directory"><li><a href="#home">首頁</a></li><li><a href="#news">最新消息</a></li><li><a href="#staff">工作人員</a></li><li><a href="#p01">歷年資料／2008</a></li><li><a href="#notice2007">年度網站維護說明</a></li><li><a href="#about">中心簡介</a></li></ul>`,
 notice2007:`<h2>年度網站維護說明</h2><div class="document"><div class="meta">資訊維護組｜2007-12-28</div><p>年度封存後，各年份資料仍可由首頁「歷年資料」圖示或網站導覽進入。若圖示遺失，請使用文字版網站導覽。</p></div><p><a href="#p01">歷年資料：2008</a></p>`,
 ending:`<h2>2009 年封存信件</h2><div class="document"><div class="meta">收件封存資料｜2009</div><p>接手資料的人您好。我沒有失蹤，也沒有遭遇事故。我只是希望往後有人能分清楚：哪些內容在事故前就被改過、哪些資料是操作失誤刪掉、又有哪些檔案明明能還原卻被決定留下。</p><p>若你能靠文件自己得到答案，這份紀錄才算真的被保存。</p><p>——林佩真</p></div>`
};

async function render(){
 current=(location.hash||'#home').slice(1);currentData=null;
 if(pages[current]){content.innerHTML=pages[current];content.focus();return}
 if(chapters.includes(current)){
  try{const r=await fetch(`data/${current}.json`);if(!r.ok)throw new Error();currentData=await r.json();renderChapter(currentData)}
  catch{content.innerHTML='<h2>資料讀取失敗</h2><p>此筆復原資料暫時無法開啟。</p>'}
 }else content.innerHTML='<h2>404 找不到資料</h2><p>此頁可能在復原時移動。請查看 <a href="#sitemap">文字版網站導覽</a>。</p>';
 content.focus();
}

function renderChapter(d){
 const locked=d.requires&&!state.solved.includes(d.requires);
 if(locked){content.innerHTML=`<h2>${escapeHTML(d.title.replace(/^P\d+｜/,''))}</h2><p class="status error">此筆資料的索引尚未復原。請先查閱前一筆相關紀錄。</p>`;return}
 const docs=d.documents.map(x=>`<section class="${x.type||'document'}"><h3>${escapeHTML(x.title)}</h3>${x.meta?`<div class="meta">${escapeHTML(x.meta)}</div>`:''}${x.body||''}</section>`).join('');
 const links=d.choices.map(c=>`<li><a href="#" data-record="${escapeHTML(c.id)}">${escapeHTML(c.label)}</a></li>`).join('');
 content.innerHTML=`<h2>${escapeHTML(d.title.replace(/^P\d+｜/,''))}</h2><p class="archive-note">${escapeHTML(d.task)}</p>${docs}<h3>相關檔案與索引</h3><ul class="directory">${links}</ul><div id="feedback" aria-live="polite"></div>`;
 document.querySelectorAll('[data-record]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openRecord(a.dataset.record)}));
}

function openRecord(id){
 const fb=document.querySelector('#feedback');
 if(id===currentData.answer){
  if(!state.solved.includes(current))state.solved.push(current);
  for(const e of currentData.evidence||[])if(!state.evidence.includes(e))state.evidence.push(e);
  save();
  const next=chapters[chapters.indexOf(current)+1];
  fb.innerHTML=`<div class="system-message"><strong>索引更新：</strong>${currentData.success}</div><p>${next?`<a href="#${next}">開啟下一筆：${labels[chapters.indexOf(next)]}</a>`:'<a href="#ending">開啟後續封存資料</a>'}</p>`;
 }else{
  state.errors[current]=(state.errors[current]||0)+1;save();
  const n=state.errors[current];
  const note=n>=4?currentData.hints[1]:n>=2?currentData.hints[0]:'';
  fb.innerHTML=`<div class="system-message error"><strong>資料核對結果：</strong>此項目與目前的日期、編號或文件用途不符。${note?`<br><span class="maintenance-note">維護備註：${escapeHTML(note)}</span>`:''}</div>`;
 }
}

window.addEventListener('hashchange',render);
render();