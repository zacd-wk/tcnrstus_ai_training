const fs = require('fs');
const path = require('path');

// 網頁根目錄路徑
const rootDir = path.join(__dirname, '..');

// 定義要完全排除的資料夾名稱
const excludeDirs = ['.vscode', 'css', 'images', 'js', 'other'];
// 定義要排除的特定根目錄 HTML 檔案
const excludeFiles = ['index.html', 'template.html', 'index00.html'];

/**
 * 遞迴搜尋指定目錄下的所有 HTML 檔案
 */
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

    // 排序：有日期的放上面（由新到舊），沒日期的放最下面
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

    allHtmlFiles.forEach((fileInfo, index) => {
        const content = fs.readFileSync(fileInfo.absolutePath, 'utf8');

        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        const displayTitle = (titleMatch && titleMatch[1]) ? titleMatch[1].trim() : path.basename(fileInfo.webPath);

        const fileNameOnly = path.basename(fileInfo.webPath);
        const dateMatch = fileNameOnly.match(/^(\d{4})(\d{2})(\d{2})/);
        const displayDate = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : '其他項目';

        const dirName = path.dirname(fileInfo.webPath);
        const folderBadge = dirName !== '.' ? `<span class="badge bg-secondary me-1">${dirName}</span>` : '';

        // 生成時間軸節點 HTML，將預覽按鈕改為絕對定位，使其永久維持在字卡的最右下角
        listItems += `
            <div class="timeline-item mb-4 position-relative ps-4 portfolio-item" data-url="${fileInfo.webPath}">
                <div class="timeline-marker position-absolute top-0 start-0 bg-success rounded-circle" style="width:12px; height:12px; margin-top:6px;"></div>
                <div class="text-success small fw-bold font-monospace mb-1">${displayDate}</div>
                <div class="p-3 pb-5 bg-white border border-light-subtle rounded shadow-sm item-card position-relative" style="cursor: pointer;">
                    <h5 class="fw-bold text-dark mb-2" style="padding-right: 15px;">${displayTitle}</h5>
                    <div class="text-muted small font-monospace text-break mb-0">
                        ${folderBadge}${fileNameOnly}
                    </div>
                    <button class="btn btn-success btn-sm px-3 preview-btn position-absolute" style="right: 1rem; bottom: 1rem;">預覽</button>
                </div>
            </div>\n`;
    });

    // 4. 定義新版美化模板
    const template = `<!DOCTYPE html>
<html lang="zh-tw">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>學習歷程首頁</title>
    <!-- Bootstrap 5 CSS -->
    <link class="main-css" rel="stylesheet" href="css/bootstrap.min.css">
    <!-- 原有自訂 CSS -->
    <link rel="stylesheet" href="css/myall.css">
    <style>
        /* 使用整體 Flex 佈局，徹底揮別死板的固定高度計算 */
        body { background-color: #f4f7f6; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

        /* 全新美化的頂部標題列：改用內襯撐開，加入微光漸層背景與精緻陰影 */
        .top-header {
            background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
            border-bottom: 1px solid #e9ecef;
            z-index: 1020;
        }

        .main-title {
            letter-spacing: 2px;
            background: linear-gradient(45deg, #198754, #0b5ed7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* 綠色閃爍 Live 小圓點動畫 */
        .pulse-dot {
            width: 8px;
            height: 8px;
            background-color: #198754;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.7);
            animation: pulse 1.6s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(25, 135, 84, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
        }

        /* 主要內容主區塊：全自動彈性收縮，完美填滿剩餘高度 */
        .main-content { flex: 1; min-height: 0; }

        /* 左側目錄獨立捲動 */
        .scrollable-menu { height: 100%; overflow-y: auto; padding-right: 15px; }

        /* 時間軸線條樣式 */
        .timeline-container { border-left: 2px solid #dee2e6; margin-left: 6px; }
        .timeline-marker { transform: translateX(-7px); box-shadow: 0 0 0 4px rgba(25, 135, 84, 0.2); }

        /* 點擊選取時的底色與動態過渡 */
        .item-card { transition: background-color 0.25s ease, border-color 0.25s ease; }
        .portfolio-item.active-preview .item-card { background-color: #d1e7dd !important; border-color: #a3cfbb !important; }

        /* 右側固定預覽區域 */
        .preview-wrapper { height: 100%; padding-bottom: 20px; }
        .preview-container { height: 100%; border: 1px solid #dee2e6; border-radius: 12px; overflow: hidden; background-color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
        .preview-iframe { width: 100%; height: 100%; border: none; }
    </style>
</head>

<body>
    <!-- 1. 全新美化置頂標題列 -->
    <div class="top-header text-center py-4">
        <h1 class="main-title fw-extrabold display-6 mb-2">學習歷程時間軸</h1>
        <div class="d-flex align-items-center justify-content-center gap-2">
            <span class="pulse-dot"></span>
            <p class="text-muted small mb-0 font-monospace">CODE PORTFOLIO</p>
        </div>
    </div>

    <!-- 2. 下方彈性主區塊 -->
    <div class="container-fluid main-content px-4 mt-3">
        <div class="row h-100 pb-2">

            <!-- 左側：獨立捲動的目錄項目列 (佔 3 格寬度) -->
            <div class="col-md-3 scrollable-menu">
                <div class="timeline-container ps-2 position-relative">
` + listItems + `                </div>
            </div>

            <!-- 右側：固定尺寸的預覽框 (佔 9 格寬度，即與左側目錄形成 3:7 比例) -->
            <div class="col-md-9 preview-wrapper">
                <div class="preview-container">
                    <iframe id="preview-box" class="preview-iframe" src="about:blank"></iframe>
                </div>
            </div>

        </div>
    </div>

    <!-- jQuery & Bootstrap JS -->
    <script src="js/jquery-4.0.0.js"></script>
    <script src="js/bootstrap.bundle.min.js"></script>
    <script>
        \$(document).ready(function() {
            // 點擊目錄卡片或預覽按鈕時觸發
            \$(document).on('click', '.portfolio-item', function(e) {
                const \$item = \$(this);
                const url = \$item.data('url');

                // 1. 更換選取項目的底色 (移除其他、加入當前)
                $('.portfolio-item').removeClass('active-preview');
                \$item.addClass('active-preview');

                // 2. 將網頁網址填入 iframe 內實現即時預覽
                $('#preview-box').attr('src', url);
            });

            // 預設自動點擊選取第一個作品進行預覽
            $('.portfolio-item').first().trigger('click');
        });
    </script>
</body>

</html>`;

    fs.writeFileSync(path.join(rootDir, 'index.html'), template, 'utf8');
    console.log(`成功！已自動更新 index.html (標題列外觀升級，擠壓問題完美修復)`);

} catch (error) {
    console.error('執行過程中發生錯誤：', error);
}
