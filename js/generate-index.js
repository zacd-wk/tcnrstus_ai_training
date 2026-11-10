const fs = require('fs');
const path = require('path');

// 網頁根目錄路徑(腳本放在根目錄的子資料夾內)
const rootDir = path.join(__dirname, '..');

// 輸出檔名(不再覆蓋履歷 index.html)
const OUTPUT_FILE = 'tcnrstus_ai_training_portfolio.html';

// 完全排除的資料夾
const excludeDirs = ['.vscode', 'css', 'images', 'js', 'other'];
// 排除的根目錄 HTML(原本的排除清單 + 本腳本的輸出檔,避免自己掃描自己)
const excludeFiles = ['index.html', 'template.html', 'index00.html', OUTPUT_FILE];

// HTML 跳脫,避免標題或檔名內的特殊字元破壞版面
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 遞迴搜尋所有 HTML 檔案
function getAllHtmlFiles(dirPath, relativePath = '') {
    let results = [];
    const list = fs.readdirSync(dirPath);

    list.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const itemRelativePath = relativePath ? path.join(relativePath, item) : item;
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            if (excludeDirs.includes(item)) return;
            results = results.concat(getAllHtmlFiles(itemPath, itemRelativePath));
        } else if (stat.isFile()) {
            if (item.toLowerCase().endsWith('.html')) {
                if (relativePath === '' && excludeFiles.includes(item)) return;
                results.push({
                    absolutePath: itemPath,
                    webPath: itemRelativePath.replace(/\\/g, '/')
                });
            }
        }
    });

    return results;
}

try {
    const allHtmlFiles = getAllHtmlFiles(rootDir);

    // 排序:有日期的在上(由新到舊),沒日期的在最下
    allHtmlFiles.sort((a, b) => {
        const fileA = path.basename(a.webPath);
        const fileB = path.basename(b.webPath);
        const hasDateA = /^\d{8}/.test(fileA);
        const hasDateB = /^\d{8}/.test(fileB);

        if (hasDateA && hasDateB) return fileB.localeCompare(fileA);
        if (hasDateA && !hasDateB) return -1;
        if (!hasDateA && hasDateB) return 1;
        return fileA.localeCompare(fileB);
    });

    let listItems = '';

    allHtmlFiles.forEach(fileInfo => {
        const content = fs.readFileSync(fileInfo.absolutePath, 'utf8');

        // 支援跨行 <title>,並壓縮多餘空白
        const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const rawTitle = (titleMatch && titleMatch[1].replace(/\s+/g, ' ').trim())
            || path.basename(fileInfo.webPath);

        const fileNameOnly = path.basename(fileInfo.webPath);
        const dateMatch = fileNameOnly.match(/^(\d{4})(\d{2})(\d{2})/);
        const displayDate = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : '其他項目';

        const dirName = path.dirname(fileInfo.webPath);
        const folderBadge = dirName !== '.'
            ? `<span class="tl-folder">${escapeHtml(dirName)}</span>` : '';

        const urlAttr = escapeHtml(encodeURI(fileInfo.webPath));
        const fileAttr = escapeHtml(fileInfo.webPath);
        const searchAttr = escapeHtml((rawTitle + ' ' + fileInfo.webPath).toLowerCase());

        listItems += `
                    <div class="tl-item" role="button" tabindex="0" data-url="${urlAttr}" data-file="${fileAttr}" data-search="${searchAttr}">
                        <span class="tl-dot"></span>
                        <div class="tl-date">${displayDate}</div>
                        <div class="tl-card">
                            <h2 class="tl-title">${escapeHtml(rawTitle)}</h2>
                            <div class="tl-file">${folderBadge}${escapeHtml(fileNameOnly)}</div>
                            <span class="tl-go"><i class="bi bi-play-fill"></i> PREVIEW</span>
                        </div>
                    </div>\n`;
    });

    const total = allHtmlFiles.length;

    const template = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI輔助全端設計課程練習 | Zac.D</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root{
            --bg-main:#080B11;
            --bg-card:#111622;
            --accent-cyan:#00F2FE;
            --accent-green:#00FF87;
            --text-primary:#E2E8F0;
            --text-secondary:#94A3B8;
            --border-color:rgba(0,242,254,.15);
            --glow-cyan:0 0 18px rgba(0,242,254,.35);
            --font-mono:'JetBrains Mono',Consolas,monospace;
            --font-main:'Noto Sans TC','Segoe UI',sans-serif;
            --top-h:60px;
        }
        html,body{height:100%}
        body{
            margin:0;display:flex;flex-direction:column;overflow:hidden;
            background:var(--bg-main);color:var(--text-primary);font-family:var(--font-main);
            background-image:
                radial-gradient(circle at 15% 10%,rgba(0,242,254,.06),transparent 40%),
                radial-gradient(circle at 85% 90%,rgba(0,255,135,.04),transparent 40%);
        }
        ::selection{background:var(--accent-cyan);color:var(--bg-main)}
        ::-webkit-scrollbar{width:8px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:linear-gradient(var(--accent-cyan),var(--accent-green));border-radius:4px}

        .g-grad-text{background:linear-gradient(90deg,var(--accent-cyan),var(--accent-green));-webkit-background-clip:text;background-clip:text;color:transparent}

        /* 頂部列 */
        .topbar{flex:0 0 var(--top-h);height:var(--top-h);display:flex;align-items:center;gap:.8rem;padding:0 1rem;
            background:rgba(8,11,17,.85);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
            border-bottom:1px solid var(--border-color);z-index:50}
        .brand{font-family:var(--font-mono);font-weight:700;color:var(--text-primary);text-decoration:none;white-space:nowrap;font-size:.95rem}
        .brand .slash{color:var(--accent-cyan)}
        .brand .core{color:var(--accent-green)}
        .count{font-family:var(--font-mono);font-size:.72rem;color:var(--accent-cyan);border:1px solid var(--border-color);padding:.15rem .6rem;border-radius:20px;white-space:nowrap}
        .spacer{flex:1}
        .btn-x{display:inline-flex;align-items:center;gap:.4rem;font-family:var(--font-mono);font-size:.82rem;color:var(--accent-cyan);
            background:transparent;border:1px solid var(--accent-cyan);border-radius:6px;padding:.35rem .9rem;text-decoration:none;transition:all .3s;cursor:pointer;white-space:nowrap}
        .btn-x:hover{background:var(--accent-cyan);color:var(--bg-main);box-shadow:var(--glow-cyan)}
        .menu-btn{display:none}

        /* 主版面 */
        .layout{flex:1;min-height:0;display:flex}
        .sidebar{flex:0 0 380px;width:380px;display:flex;flex-direction:column;min-height:0;
            background:rgba(17,22,34,.55);border-right:1px solid var(--border-color)}
        .side-head{padding:1rem 1rem .8rem;border-bottom:1px solid var(--border-color)}
        .side-title{font-weight:700;font-size:1.05rem;margin:0 0 .15rem}
        .side-sub{font-family:var(--font-mono);font-size:.72rem;color:var(--text-secondary);margin:0 0 .8rem}
        .search{position:relative}
        .search i{position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:var(--text-secondary);font-size:.85rem}
        .search input{width:100%;background:rgba(8,11,17,.8);border:1px solid var(--border-color);border-radius:8px;
            color:var(--text-primary);font-family:var(--font-mono);font-size:.85rem;padding:.5rem .8rem .5rem 2.1rem;outline:none}
        .search input:focus{border-color:var(--accent-cyan);box-shadow:var(--glow-cyan)}
        .search input::placeholder{color:#475569}
        .list{flex:1;min-height:0;overflow-y:auto;padding:1.2rem 1rem 2rem 1.3rem}

        /* 時間軸 */
        .tl{position:relative;padding-left:1.3rem}
        .tl::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;
            background:linear-gradient(180deg,var(--accent-cyan),var(--accent-green),transparent);opacity:.55}
        .tl-item{position:relative;margin-bottom:1.3rem;cursor:pointer;outline:none}
        .tl-item.hidden{display:none}
        .tl-dot{position:absolute;left:calc(-1.3rem - 5px);top:6px;width:12px;height:12px;border-radius:50%;
            background:var(--bg-main);border:2px solid var(--accent-cyan);box-shadow:0 0 8px rgba(0,242,254,.6);transition:all .3s}
        .tl-date{font-family:var(--font-mono);font-size:.74rem;font-weight:700;color:var(--accent-green);margin-bottom:.35rem}
        .tl-card{position:relative;padding:.9rem 1rem 2.4rem;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;transition:all .3s}
        .tl-item:hover .tl-card,.tl-item:focus-visible .tl-card{border-color:rgba(0,242,254,.5);transform:translateX(4px)}
        .tl-item.active .tl-card{border-color:var(--accent-cyan);background:rgba(0,242,254,.08);box-shadow:var(--glow-cyan)}
        .tl-item.active .tl-dot{background:var(--accent-cyan);box-shadow:0 0 14px var(--accent-cyan)}
        .tl-title{font-size:.95rem;font-weight:700;line-height:1.5;margin:0 0 .45rem}
        .tl-file{font-family:var(--font-mono);font-size:.7rem;color:var(--text-secondary);word-break:break-all}
        .tl-folder{display:inline-block;color:var(--accent-cyan);border:1px solid var(--border-color);border-radius:4px;padding:0 .4rem;margin-right:.4rem}
        .tl-go{position:absolute;right:.8rem;bottom:.7rem;font-family:var(--font-mono);font-size:.7rem;color:var(--accent-cyan);
            border:1px solid var(--border-color);border-radius:6px;padding:.1rem .6rem;transition:all .3s}
        .tl-item:hover .tl-go,.tl-item.active .tl-go{background:var(--accent-cyan);color:var(--bg-main);border-color:var(--accent-cyan)}
        .no-result{display:none;text-align:center;color:var(--text-secondary);font-family:var(--font-mono);font-size:.85rem;padding:2rem 0}
        .no-result.show{display:block}

        /* 預覽區 */
        .preview{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;padding:1rem}
        .term{flex:1;min-height:0;display:flex;flex-direction:column;background:#05080d;border:1px solid var(--border-color);
            border-radius:12px;overflow:hidden;box-shadow:0 0 40px rgba(0,242,254,.1)}
        .term-bar{flex:0 0 auto;display:flex;align-items:center;gap:.5rem;padding:.55rem 1rem;background:var(--bg-card);border-bottom:1px solid var(--border-color)}
        .dot{width:12px;height:12px;border-radius:50%;flex:0 0 auto}
        .dot.d1{background:#ff5f56}.dot.d2{background:#ffbd2e}.dot.d3{background:#27c93f}
        .term-title{flex:1;min-width:0;margin-left:.5rem;font-family:var(--font-mono);font-size:.76rem;color:var(--text-secondary);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .open-new{flex:0 0 auto;font-family:var(--font-mono);font-size:.74rem;color:var(--accent-cyan);text-decoration:none;
            border:1px solid var(--border-color);border-radius:6px;padding:.15rem .6rem;transition:all .3s}
        .open-new:hover{background:var(--accent-cyan);color:var(--bg-main)}
        .open-new.disabled{opacity:.4;pointer-events:none}
        .term-body{position:relative;flex:1;min-height:0;background:#fff}
        .term-body iframe{position:absolute;inset:0;width:100%;height:100%;border:0}

        .scrim{display:none}

        /* 手機 / 平板:目錄改為可滑出的面板 */
        @media (max-width:991.98px){
            .menu-btn{display:inline-flex}
            .brand .brand-sub{display:none}
            .sidebar{position:fixed;top:var(--top-h);bottom:0;left:0;width:min(88vw,380px);flex:none;z-index:60;
                background:var(--bg-card);transform:translateX(-100%);transition:transform .3s ease}
            body.menu-open .sidebar{transform:none}
            body.menu-open .scrim{display:block;position:fixed;top:var(--top-h);left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:55}
            .preview{padding:.5rem}
        }
        @media (max-width:575.98px){
            .count{display:none}
            .btn-x{padding:.35rem .6rem;font-size:.76rem}
        }
    </style>
</head>

<body>
    <header class="topbar">
        <button class="btn-x menu-btn" id="menuBtn" type="button"><i class="bi bi-list-ul"></i> 目錄</button>
        <a class="brand" href="index.html">
            <span class="slash">&lt;/&gt;</span> Zac.D <span class="slash">//</span> <span class="core">AI</span><span class="brand-sub"> Training Portfolio</span>
        </a>
        <span class="count"><span id="shownCount">${total}</span> / ${total} WORKS</span>
        <span class="spacer"></span>
        <a class="btn-x" href="index.html"><i class="bi bi-arrow-left"></i> 回到履歷</a>
    </header>

    <div class="layout">
        <aside class="sidebar">
            <div class="side-head">
                <h1 class="side-title g-grad-text">AI輔助全端設計課程練習</h1>
                <p class="side-sub">// learning timeline · auto generated</p>
                <div class="search">
                    <i class="bi bi-search"></i>
                    <input id="searchInput" type="search" placeholder="搜尋標題或檔名..." autocomplete="off">
                </div>
            </div>
            <div class="list">
                <div class="tl">
${listItems}                </div>
                <div class="no-result" id="noResult">[ERR] 找不到符合的作品</div>
            </div>
        </aside>

        <main class="preview">
            <div class="term">
                <div class="term-bar">
                    <span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span>
                    <span class="term-title" id="termTitle">zac@ai-core: ~/ (select a file)</span>
                    <a class="open-new disabled" id="openNew" href="#" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right"></i> 新分頁開啟</a>
                </div>
                <div class="term-body">
                    <iframe id="previewFrame" src="about:blank" title="作品預覽"></iframe>
                </div>
            </div>
        </main>
    </div>
    <div class="scrim" id="scrim"></div>

    <script>
    (function () {
        var items = document.querySelectorAll('.tl-item');
        var frame = document.getElementById('previewFrame');
        var titleEl = document.getElementById('termTitle');
        var openBtn = document.getElementById('openNew');
        var search = document.getElementById('searchInput');
        var countEl = document.getElementById('shownCount');
        var empty = document.getElementById('noResult');

        function select(item) {
            items.forEach(function (el) { el.classList.remove('active'); });
            item.classList.add('active');
            var url = item.getAttribute('data-url');
            var file = item.getAttribute('data-file');
            frame.src = url;
            titleEl.textContent = 'zac@ai-core: ~/' + file;
            openBtn.href = url;
            openBtn.classList.remove('disabled');
            try { history.replaceState(null, '', '#' + encodeURIComponent(file)); } catch (e) {}
            document.body.classList.remove('menu-open');
        }

        items.forEach(function (item) {
            item.addEventListener('click', function () { select(item); });
            item.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(item); }
            });
        });

        search.addEventListener('input', function () {
            var q = search.value.trim().toLowerCase();
            var shown = 0;
            items.forEach(function (el) {
                var hit = !q || el.getAttribute('data-search').indexOf(q) > -1;
                el.classList.toggle('hidden', !hit);
                if (hit) shown++;
            });
            countEl.textContent = shown;
            empty.classList.toggle('show', shown === 0);
        });

        document.getElementById('menuBtn').addEventListener('click', function () {
            document.body.classList.toggle('menu-open');
        });
        document.getElementById('scrim').addEventListener('click', function () {
            document.body.classList.remove('menu-open');
        });

        // 預設選取:網址 hash 指定的作品,否則第一筆
        var hashFile = '';
        try { hashFile = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
        var target = null;
        items.forEach(function (el) { if (hashFile && el.getAttribute('data-file') === hashFile) target = el; });
        if (!target && items.length) target = items[0];
        if (target) select(target);
    })();
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(rootDir, OUTPUT_FILE), template, 'utf8');
    console.log(`成功!已產生 ${OUTPUT_FILE},共收錄 ${total} 筆作品`);

} catch (error) {
    console.error('執行過程中發生錯誤:', error);
}
