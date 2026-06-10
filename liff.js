// ════════════════════════════════════════
//  LINE LIFF 共用工具
//  使用前請至 LINE Developers Console 取得 LIFF ID
//  https://developers.line.biz/console/
// ════════════════════════════════════════

const LIFF_ID = '2010206168-yvy2iMOs'; // ← 你的 LIFF ID

let _liffReady = false;
let _liffUser  = null;

/**
 * 初始化 LIFF（每頁呼叫一次）
 * 成功後可呼叫 getLiffUser() 取得用戶資料
 */
async function initLiff() {
  if (typeof liff === 'undefined') return;
  try {
    await liff.init({ liffId: LIFF_ID });
    _liffReady = true;
    if (liff.isLoggedIn()) {
      _liffUser = await liff.getProfile();
    } else if (liff.isInClient()) {
      liff.login();
    }
  } catch (e) {
    // 在 LINE 外部開啟時正常失敗，不影響功能
  }
}

/** 是否在 LINE App 內開啟 */
function isInLiff() {
  return _liffReady && typeof liff !== 'undefined' && liff.isInClient();
}

/** 取得 LINE 用戶資料（displayName, pictureUrl, userId） */
function getLiffUser() {
  return _liffUser;
}

/**
 * 分享到 LINE
 * @param {Array} messages - LINE Flex Messages 陣列
 */
async function shareToLine(messages) {
  if (isInLiff() && liff.isApiAvailable('shareTargetPicker')) {
    try {
      const result = await liff.shareTargetPicker(messages, { isMultiple: true });
      return result;
    } catch (e) {
      if (e.code !== 'FORBIDDEN') _fallbackLineShare();
    }
  } else {
    _fallbackLineShare();
  }
}

function _fallbackLineShare() {
  const url = encodeURIComponent(window.location.href);
  window.open('https://social-plugins.line.me/lineit/share?url=' + url, '_blank');
}

/**
 * 建立「今日祝福」Flex Message
 * @param {string} intuitionText - 直覺祝福文字
 * @param {object} chakra - 脈輪資料 { name, en, color, blessing, action, element, location, transform }
 */
function buildBlessingFlexMessage(intuitionText, chakra) {
  const elementIcon = chakra.element === '地' ? '🌍' :
                      chakra.element === '水' ? '💧' :
                      chakra.element === '火' ? '🔥' :
                      chakra.element === '風' ? '💨' :
                      chakra.element === '空' ? '☁️' :
                      chakra.element === '靈' ? '✨' : '⭕';

  const bodyContents = [
    {
      type: 'text',
      text: intuitionText.replace('\n', '\n'),
      wrap: true,
      align: 'center',
      size: 'xl',
      weight: 'bold',
      color: '#2e2a26'
    },
    {
      type: 'separator',
      margin: 'lg',
      color: '#ece8e2'
    }
  ];

  // 脈輪信息
  if (chakra.name) {
    bodyContents.push({
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'sm',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              flex: 0,
              contents: [{
                type: 'box',
                layout: 'vertical',
                width: '10px',
                height: '10px',
                cornerRadius: '5px',
                backgroundColor: chakra.color
              }],
              justifyContent: 'center'
            },
            {
              type: 'box',
              layout: 'vertical',
              flex: 5,
              contents: [
                { type: 'text', text: chakra.name, size: 'sm', color: '#2e2a26', weight: 'bold' },
                { type: 'text', text: chakra.en,   size: 'xxs', color: '#999' }
              ]
            }
          ]
        },
        // 元素和位置
        chakra.element && chakra.location ? {
          type: 'text',
          text: `${elementIcon} ${chakra.element}元素 · ${chakra.location}`,
          size: 'xxs',
          color: '#999',
          margin: 'sm'
        } : null
      ].filter(Boolean)
    });
  }

  bodyContents.push({
    type: 'text',
    text: chakra.blessing ? chakra.blessing.replace('\n', ' ') : '',
    wrap: true,
    align: 'center',
    size: 'md',
    color: '#2e2a26',
    margin: 'md'
  });

  bodyContents.push({
    type: 'separator',
    margin: 'lg',
    color: '#ece8e2'
  });

  // 行動建議
  bodyContents.push({
    type: 'text',
    text: '今天可以',
    size: 'xxs',
    color: '#c5c0b8',
    letterSpacing: '3px',
    margin: 'md'
  });

  bodyContents.push({
    type: 'text',
    text: chakra.action || '',
    wrap: true,
    size: 'sm',
    color: '#6a6560',
    margin: 'sm'
  });

  // 深度理解（如果有的話）
  if (chakra.deeper) {
    bodyContents.push({
      type: 'separator',
      margin: 'md',
      color: '#f0ede8'
    });

    bodyContents.push({
      type: 'text',
      text: '💡 深度理解',
      size: 'xxs',
      color: '#c5c0b8',
      letterSpacing: '3px',
      margin: 'md'
    });

    bodyContents.push({
      type: 'text',
      text: chakra.deeper,
      wrap: true,
      size: 'xs',
      color: '#6a6560',
      margin: 'sm'
    });
  }

  // 轉化方向（如果有的話）
  if (chakra.transform) {
    bodyContents.push({
      type: 'separator',
      margin: 'md',
      color: '#f0ede8'
    });

    bodyContents.push({
      type: 'text',
      text: '🔄 轉化方向',
      size: 'xxs',
      color: '#c5c0b8',
      letterSpacing: '3px',
      margin: 'md'
    });

    bodyContents.push({
      type: 'text',
      text: chakra.transform,
      wrap: true,
      size: 'xs',
      color: '#8b7f94',
      margin: 'sm',
      style: 'italic'
    });
  }

  return [{
    type: 'flex',
    altText: `✨ 今日祝福｜${chakra.name || 'Spirit'} — ${intuitionText.replace('\n', ' ')}`,
    contents: {
      type: 'bubble',
      styles: {
        header: { backgroundColor: chakra.color },
        body:   { backgroundColor: '#fefefc' },
        footer: { backgroundColor: '#f7f5f2' }
      },
      header: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: '✨  今 日 祝 福',
            color: '#ffffff',
            size: 'xs',
            align: 'center',
            weight: 'bold',
            letterSpacing: '4px'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '24px',
        spacing: 'md',
        contents: bodyContents
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '每 日 色 彩',
            align: 'center',
            size: 'xxs',
            color: '#c0bcb6',
            letterSpacing: '4px'
          }
        ]
      }
    }
  }];
}

/**
 * 建立「脈輪狀態」Flex Message
 * @param {Array} activeChakras - 點亮的脈輪陣列 [{ name, en, color, desc }]
 */
function buildChakraFlexMessage(activeChakras) {
  const elementIcon = (element) => {
    const iconMap = {
      '地': '🌍', '水': '💧', '火': '🔥', '風': '💨',
      '空': '☁️', '靈': '✨', '無': '⭕'
    };
    return iconMap[element] || '⭕';
  };

  const contents = activeChakras.slice(0, 4).map(c => {
    const extra = c.extra || {};
    const items = [
      {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        margin: 'sm',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            flex: 0,
            width: '12px',
            height: '12px',
            cornerRadius: '6px',
            backgroundColor: c.color,
            offsetTop: '4px'
          },
          {
            type: 'box',
            layout: 'vertical',
            flex: 5,
            contents: [
              { type: 'text', text: `${c.name}  ${c.en}`, size: 'xs', color: '#2e2a26', weight: 'bold' },
              { type: 'text', text: c.desc || c.blessing || '', size: 'xxs', color: '#888', wrap: true }
            ]
          }
        ]
      }
    ];

    // 位置 + 元素
    if (extra.position || extra.element) {
      items.push({
        type: 'text',
        text: `${extra.position || ''} ${extra.element ? elementIcon(extra.element) + ' ' + extra.element : ''}`.trim(),
        size: 'xxs',
        color: '#999',
        margin: 'sm'
      });
    }

    // 轉化方向
    if (extra.transform) {
      items.push({
        type: 'box',
        layout: 'vertical',
        margin: 'sm',
        contents: [
          { type: 'text', text: '🔄 轉化', size: 'xxs', color: '#9b8db5', weight: 'bold' },
          { type: 'text', text: extra.transform, size: 'xxs', color: '#6a6560', wrap: true, style: 'italic' }
        ]
      });
    }

    return {
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      spacing: 'sm',
      contents: items
    };
  });

  return [{
    type: 'flex',
    altText: `🌈 我的脈輪狀態｜${activeChakras.map(c => c.name).join(' · ')}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '24px',
        contents: [
          { type: 'text', text: '🌈  身體正在說什麼', size: 'sm', color: '#888', letterSpacing: '2px', align: 'center' },
          { type: 'separator', margin: 'md' },
          ...contents,
          { type: 'separator', margin: 'lg' },
          { type: 'text', text: '每 日 色 彩', align: 'center', size: 'xxs', color: '#c0bcb6', letterSpacing: '4px', margin: 'md' }
        ]
      }
    }
  }];
}

/**
 * 生成 Instagram Stories 用的圖片
 * @param {string} title - 標題
 * @param {string} text - 主要文字
 * @param {string} bgColor - 背景色
 */
function generateInstagramImage(title, text, bgColor = '#F5F3F8') {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // 背景
  const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
  gradient.addColorStop(0, bgColor);
  gradient.addColorStop(1, '#FFF8F5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // 裝飾圓點
  ctx.fillStyle = 'rgba(147,112,219,0.15)';
  ctx.beginPath();
  ctx.arc(100, 150, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(980, 1800, 120, 0, Math.PI * 2);
  ctx.fill();

  // 標題
  ctx.font = 'bold 72px "Noto Serif TC", serif';
  ctx.fillStyle = '#5A5059';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 540, 400);

  // 主文字
  ctx.font = '48px "Noto Serif TC", serif';
  ctx.fillStyle = '#3d3556';
  const lineHeight = 80;
  const maxWidth = 900;
  let y = 700;

  // 文字換行
  const lines = [];
  const words = text.split('');
  let line = '';
  for (let word of words) {
    const testLine = line + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // 繪製每一行
  lines.forEach((l, i) => {
    ctx.fillText(l, 540, y + i * lineHeight);
  });

  // Logo
  ctx.font = '32px "Noto Serif TC", serif';
  ctx.fillStyle = '#9b8db5';
  ctx.textAlign = 'center';
  ctx.fillText('每日色彩 Anmita Riga', 540, 1850);

  return canvas.toDataURL('image/png');
}

/**
 * 建立「貓咪房間」Flex Message
 * @param {string} item1 - 選擇的物件1
 * @param {string} item2 - 選擇的物件2
 * @param {string} colorName - 選擇的顏色名稱
 * @param {string} colorHex - 顏色色碼
 * @param {string} message - 房間給的訊息
 */
function buildRoomFlexMessage(item1, item2, colorName, colorHex, message) {
  return [{
    type: 'flex',
    altText: `🏠 貓咪的房間｜${item1} × ${item2} × ${colorName}`,
    contents: {
      type: 'bubble',
      styles: {
        header: { backgroundColor: colorHex || '#7a6aaa' }
      },
      header: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: '🏠  貓 咪 的 房 間', color: '#ffffff', size: 'xs', align: 'center', weight: 'bold', letterSpacing: '3px' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '24px',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            contents: [
              { type: 'text', text: item1, align: 'center', flex: 1, size: 'lg', color: '#2e2a26' },
              { type: 'text', text: '×', align: 'center', flex: 0, size: 'sm', color: '#ccc' },
              { type: 'text', text: item2, align: 'center', flex: 1, size: 'lg', color: '#2e2a26' },
              { type: 'text', text: '×', align: 'center', flex: 0, size: 'sm', color: '#ccc' },
              { type: 'text', text: colorName, align: 'center', flex: 1, size: 'lg', color: colorHex || '#7a6aaa' }
            ]
          },
          { type: 'separator', margin: 'lg', color: '#ece8e2' },
          { type: 'text', text: message || '', wrap: true, align: 'center', size: 'md', color: '#2e2a26', margin: 'md' },
          { type: 'separator', margin: 'lg', color: '#ece8e2' },
          { type: 'text', text: '每 日 色 彩', align: 'center', size: 'xxs', color: '#c0bcb6', letterSpacing: '4px', margin: 'md' }
        ]
      }
    }
  }];
}
