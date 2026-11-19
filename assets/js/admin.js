/* 八哥手作 · 本地内容后台 */
(function () {
  'use strict';

  var DEFAULT_PASSWORD = 'bage1818';
  var SESSION_KEY = 'bageAdminAuthed';
  var C = window.SITE_CONTENT;

  var loginView = document.getElementById('loginView');
  var appView = document.getElementById('appView');
  var loginForm = document.getElementById('loginForm');
  var loginPassword = document.getElementById('loginPassword');
  var loginError = document.getElementById('loginError');
  var statusEl = document.getElementById('adminStatus');
  var saveBtn = document.getElementById('saveBtn');

  if (!C) {
    loginView.innerHTML = '<div class="login-card"><h1>数据加载失败</h1><p class="login-sub">请检查 assets/js/content.js 是否存在。</p></div>';
    return;
  }

  var data = JSON.parse(JSON.stringify(C));
  var dirHandle = null;
  var pendingImages = new Map();
  var dirty = false;
  var rendered = false;
  var toastEl = null;
  var toastTimer = null;

  /* ---------- 基础工具 ---------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function toast(message, isError) {
    if (!toastEl) {
      toastEl = el('div', 'admin-toast');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.toggle('is-error', !!isError);
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-show');
    }, 2600);
  }

  function markDirty() {
    dirty = true;
    document.title = '内容后台 · 有未保存修改';
  }

  function setStatus(text, tone) {
    statusEl.textContent = text;
    statusEl.classList.remove('is-ok', 'is-warn');
    if (tone) statusEl.classList.add(tone);
  }

  function field(labelText, value, onChange, opts) {
    opts = opts || {};
    var wrap = el('div', 'adm-field');
    wrap.appendChild(el('label', null, labelText));
    var input;
    if (opts.multiline) {
      input = el('textarea');
      input.rows = opts.rows || 4;
    } else {
      input = el('input');
      input.type = opts.type || 'text';
    }
    input.value = value == null ? '' : value;
    if (opts.placeholder) input.placeholder = opts.placeholder;
    input.addEventListener('input', function () {
      onChange(input.value);
      markDirty();
    });
    wrap.appendChild(input);
    if (opts.hint) wrap.appendChild(el('span', 'hint', opts.hint));
    return wrap;
  }

  function row() {
    var grid = el('div', 'adm-row');
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i]) grid.appendChild(arguments[i]);
    }
    return grid;
  }

  function panelHead(panel, title, desc) {
    panel.appendChild(el('h2', null, title));
    panel.appendChild(el('p', 'panel-desc', desc));
  }

  function imageField(labelText, value, apply) {
    var wrap = el('div', 'adm-field');
    wrap.appendChild(el('div', 'adm-field-label', labelText));

    var box = el('div', 'adm-image');
    var preview = el('div', 'adm-image-preview');
    var img = el('img');
    img.alt = '';
    if (value) img.src = value;
    preview.appendChild(img);

    var meta = el('div', 'adm-image-meta');
    var pathText = el('span', 'adm-image-path', value || '尚未设置图片');
    var fileBtn = el('label', 'adm-file-btn', '选择图片');
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    fileBtn.appendChild(input);

    meta.appendChild(pathText);
    meta.appendChild(fileBtn);
    box.appendChild(preview);
    box.appendChild(meta);
    wrap.appendChild(box);

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      img.src = URL.createObjectURL(file);
      pathText.textContent = '待保存：' + file.name;
      pendingImages.set(apply, file);
      markDirty();
    });

    return wrap;
  }

  function addButton(label, onClick) {
    var btn = el('button', 'adm-add', label);
    btn.type = 'button';
    btn.addEventListener('click', onClick);
    return btn;
  }

  function cardTools(container, onUp, onDown, onDelete) {
    var tools = el('div', 'adm-card-tools');
    [
      { text: '↑', title: '上移', fn: onUp },
      { text: '↓', title: '下移', fn: onDown },
      { text: '✕', title: '删除', fn: onDelete }
    ].forEach(function (item) {
      var btn = el('button', 'adm-icon-btn', item.text);
      btn.type = 'button';
      btn.title = item.title;
      btn.addEventListener('click', item.fn);
      tools.appendChild(btn);
    });
    return tools;
  }

  function moveItem(list, index, delta) {
    var target = index + delta;
    if (target < 0 || target >= list.length) return false;
    var temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    return true;
  }

  /* ---------- 主视觉 ---------- */

  function buildHero(panel) {
    panelHead(panel, '主视觉', '修改首页顶部的标题、按钮、标签和人像照片。');
    var hero = data.hero;

    panel.appendChild(field('顶部小标题', hero.eyebrow, function (v) { hero.eyebrow = v; }));
    panel.appendChild(row(
      field('主标题第一行', hero.titleTop, function (v) { hero.titleTop = v; }),
      field('主标题第二行（红色）', hero.titleAccent, function (v) { hero.titleAccent = v; })
    ));
    panel.appendChild(field('副标题文案', hero.lead, function (v) { hero.lead = v; }, {
      multiline: true, rows: 3, hint: '换行会保留在页面上。'
    }));
    panel.appendChild(imageField('人像照片', hero.image, function (v) { hero.image = v; }));
    panel.appendChild(field('照片下方小字', hero.caption, function (v) { hero.caption = v; }));

    panel.appendChild(row(
      field('主按钮文字', hero.primary.label, function (v) { hero.primary.label = v; }),
      field('主按钮链接', hero.primary.href, function (v) { hero.primary.href = v; }, { hint: '例如 #works' })
    ));
    panel.appendChild(row(
      field('次按钮文字', hero.secondary.label, function (v) { hero.secondary.label = v; }),
      field('次按钮链接', hero.secondary.href, function (v) { hero.secondary.href = v; }, { hint: '例如 #contact' })
    ));
    panel.appendChild(field('底部三个标签', (hero.meta || []).join('\n'), function (v) {
      hero.meta = v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    }, { multiline: true, rows: 3, hint: '每行一个标签。' }));
  }

  /* ---------- 关于我 ---------- */

  function buildAbout(panel) {
    panelHead(panel, '关于我', '修改个人介绍、工作照和资料条目。');
    var about = data.about;

    panel.appendChild(field('小标题（英文式眉题）', about.kicker, function (v) { about.kicker = v; }));
    panel.appendChild(field('标题', about.title, function (v) { about.title = v; }));
    panel.appendChild(field('正文段落', (about.paragraphs || []).join('\n\n'), function (v) {
      about.paragraphs = v.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    }, { multiline: true, rows: 7, hint: '段落之间空一行。' }));
    panel.appendChild(imageField('工作照', about.image, function (v) { about.image = v; }));
    panel.appendChild(field('照片说明', about.caption, function (v) { about.caption = v; }));

    panel.appendChild(el('div', 'adm-list-head')).appendChild(el('h3', null, '资料条目'));
    var factList = el('div');
    panel.appendChild(factList);

    function renderFacts() {
      factList.innerHTML = '';
      (about.facts || []).forEach(function (fact, index) {
        var line = el('div', 'adm-fact-row');
        var labelInput = el('input');
        labelInput.type = 'text';
        labelInput.value = fact.label || '';
        labelInput.placeholder = '名称';
        labelInput.addEventListener('input', function () {
          fact.label = labelInput.value;
          markDirty();
        });

        var valueInput = el('input');
        valueInput.type = 'text';
        valueInput.value = fact.value || '';
        valueInput.placeholder = '内容';
        valueInput.addEventListener('input', function () {
          fact.value = valueInput.value;
          markDirty();
        });

        var del = el('button', 'adm-icon-btn', '✕');
        del.type = 'button';
        del.title = '删除';
        del.addEventListener('click', function () {
          about.facts.splice(index, 1);
          renderFacts();
          markDirty();
        });

        line.appendChild(labelInput);
        line.appendChild(valueInput);
        line.appendChild(del);
        factList.appendChild(line);
      });
    }

    renderFacts();
    panel.appendChild(addButton('+ 添加条目', function () {
      about.facts = about.facts || [];
      about.facts.push({ label: '新条目', value: '' });
      renderFacts();
      markDirty();
    }));
  }

  /* ---------- 作品 ---------- */

  function buildWorks(panel) {
    panelHead(panel, '作品', '添加、删除、排序作品，并替换作品图片。');
    var works = data.works;
    var list = el('div');
    panel.appendChild(list);

    function renderList() {
      list.innerHTML = '';
      works.items.forEach(function (item, index) {
        var card = el('div', 'adm-card');
        var head = el('div', 'adm-card-head');
        head.appendChild(el('strong', null, '作品 ' + String(index + 1).padStart(2, '0')));
        head.appendChild(cardTools(card,
          function () { if (moveItem(works.items, index, -1)) { renderList(); markDirty(); } },
          function () { if (moveItem(works.items, index, 1)) { renderList(); markDirty(); } },
          function () {
            if (confirm('确定删除「' + (item.title || '未命名作品') + '」？')) {
              works.items.splice(index, 1);
              renderList();
              markDirty();
            }
          }
        ));
        card.appendChild(head);

        card.appendChild(row(
          field('作品名称', item.title, function (v) { item.title = v; }),
          field('分类标签', item.tag, function (v) { item.tag = v; }, { hint: '如：绳编 / 竹编' })
        ));
        card.appendChild(field('作品描述', item.desc, function (v) { item.desc = v; }, { multiline: true, rows: 2 }));
        card.appendChild(imageField('作品图片', item.image, function (v) { item.image = v; }));
        list.appendChild(card);
      });
    }

    renderList();
    panel.appendChild(addButton('+ 添加作品', function () {
      works.items.push({
        id: 'w' + Date.now(),
        title: '新作品',
        tag: '',
        desc: '',
        image: ''
      });
      renderList();
      markDirty();
    }));
  }

  /* ---------- 文章 ---------- */

  function buildArticles(panel) {
    panelHead(panel, '文章', '编辑文章标题、摘要与正文；正文支持加粗、小标题、引用和插图。');
    var articles = data.articles;
    var list = el('div');
    panel.appendChild(list);

    function renderList() {
      list.innerHTML = '';
      articles.items.forEach(function (item, index) {
        var card = el('div', 'adm-card');
        var head = el('div', 'adm-card-head');
        head.appendChild(el('strong', null, '文章 ' + String(index + 1).padStart(2, '0')));
        head.appendChild(cardTools(card,
          function () { if (moveItem(articles.items, index, -1)) { renderList(); markDirty(); } },
          function () { if (moveItem(articles.items, index, 1)) { renderList(); markDirty(); } },
          function () {
            if (confirm('确定删除「' + (item.title || '未命名文章') + '」？')) {
              articles.items.splice(index, 1);
              renderList();
              markDirty();
            }
          }
        ));
        card.appendChild(head);

        card.appendChild(field('文章标题', item.title, function (v) { item.title = v; }));
        card.appendChild(row(
          field('分类文字', item.meta, function (v) { item.meta = v; }, { hint: '显示在标题上方' }),
          field('作者', item.author, function (v) { item.author = v; })
        ));
        card.appendChild(field('日期', item.date, function (v) { item.date = v; }));
        card.appendChild(field('摘要', item.excerpt, function (v) { item.excerpt = v; }, {
          multiline: true, rows: 2, hint: '显示在首页文章卡片上，建议 60–80 字。'
        }));
        card.appendChild(imageField('封面图片', item.cover, function (v) { item.cover = v; }));

        /* 正文编辑器 */
        var wrap = el('div', 'adm-field');
        wrap.appendChild(el('div', 'adm-field-label', '正文'));
        var tools = el('div', 'adm-editor-tools');
        var editor = el('div', 'adm-editor');
        editor.contentEditable = 'true';
        editor.innerHTML = item.bodyHtml || '';

        function sync() {
          item.bodyHtml = editor.innerHTML;
          markDirty();
        }

        function toolBtn(text, command, value) {
          var btn = el('button', null, text);
          btn.type = 'button';
          btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
          btn.addEventListener('click', function () {
            editor.focus();
            document.execCommand(command, false, value || null);
            sync();
          });
          return btn;
        }

        tools.appendChild(toolBtn('加粗', 'bold'));
        tools.appendChild(toolBtn('小标题', 'formatBlock', 'h2'));
        tools.appendChild(toolBtn('引用', 'formatBlock', 'blockquote'));
        tools.appendChild(toolBtn('列表', 'insertUnorderedList'));

        var imgInput = document.createElement('input');
        imgInput.type = 'file';
        imgInput.accept = 'image/*';
        imgInput.style.display = 'none';
        var imgBtn = el('button', null, '插入图片');
        imgBtn.type = 'button';
        imgBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
        imgBtn.addEventListener('click', function () {
          if (!dirHandle) {
            toast('插入图片前，请先点击右上角「连接网站文件夹」', true);
            return;
          }
          imgInput.click();
        });
        tools.appendChild(imgBtn);
        tools.appendChild(imgInput);

        imgInput.addEventListener('change', async function () {
          var file = imgInput.files && imgInput.files[0];
          if (!file) return;
          imgInput.value = '';
          try {
            var imgDir = await dirHandle.getDirectoryHandle('images', { create: true });
            var name = uniqueName(file);
            await writeFile(imgDir, name, file);
            var src = 'images/' + name;
            var html = '<figure class="inline-figure"><div class="ph" data-file="' + src + '">' +
              '<img src="' + src + '" alt="文章插图"></div>' +
              '<figcaption>图片说明（在后台或正文里修改）</figcaption></figure><p><br></p>';
            editor.focus();
            document.execCommand('insertHTML', false, html);
            sync();
            toast('图片已写入 images/' + name);
          } catch (err) {
            toast('插入图片失败：' + err.message, true);
          }
        });

        editor.addEventListener('input', sync);
        wrap.appendChild(tools);
        wrap.appendChild(editor);
        wrap.appendChild(el('span', 'hint', '可视化编辑，保存后直接显示在文章页。'));
        card.appendChild(wrap);

        list.appendChild(card);
      });
    }

    renderList();
    panel.appendChild(addButton('+ 添加文章', function () {
      articles.items.push({
        id: 'a' + Date.now(),
        meta: '编织笔记',
        title: '新文章标题',
        excerpt: '',
        cover: '',
        author: '八哥',
        date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }),
        bodyHtml: '<p>在这里写正文……</p>'
      });
      renderList();
      markDirty();
    }));
  }

  /* ---------- 联系方式 ---------- */

  function buildContact(panel) {
    panelHead(panel, '联系方式', '修改联系区文案，增删 Telegram、邮箱、PayPal 等联系方式。');
    var contact = data.contact;

    panel.appendChild(field('小标题', contact.kicker, function (v) { contact.kicker = v; }));
    panel.appendChild(field('标题', contact.title, function (v) { contact.title = v; }));
    panel.appendChild(field('说明文字', contact.desc, function (v) { contact.desc = v; }));
    panel.appendChild(field('底部小字', contact.note, function (v) { contact.note = v; }));

    panel.appendChild(el('div', 'adm-list-head')).appendChild(el('h3', null, '联系方式卡片'));
    var list = el('div');
    panel.appendChild(list);

    function renderList() {
      list.innerHTML = '';
      contact.cards.forEach(function (card, index) {
        var box = el('div', 'adm-card');
        var head = el('div', 'adm-card-head');
        head.appendChild(el('strong', null, '卡片 ' + (index + 1)));
        head.appendChild(cardTools(box,
          function () { if (moveItem(contact.cards, index, -1)) { renderList(); markDirty(); } },
          function () { if (moveItem(contact.cards, index, 1)) { renderList(); markDirty(); } },
          function () {
            if (confirm('确定删除这张联系卡片？')) {
              contact.cards.splice(index, 1);
              renderList();
              markDirty();
            }
          }
        ));
        box.appendChild(head);

        var iconWrap = el('div', 'adm-field');
        iconWrap.appendChild(el('label', null, '图标'));
        var select = el('select');
        [['telegram', 'Telegram'], ['mail', '邮箱'], ['paypal', 'PayPal']].forEach(function (opt) {
          var o = el('option', null, opt[1]);
          o.value = opt[0];
          if (card.icon === opt[0]) o.selected = true;
          select.appendChild(o);
        });
        select.addEventListener('change', function () {
          card.icon = select.value;
          markDirty();
        });
        iconWrap.appendChild(select);
        box.appendChild(iconWrap);

        box.appendChild(row(
          field('标题', card.title, function (v) { card.title = v; }),
          field('显示内容', card.value, function (v) { card.value = v; })
        ));
        box.appendChild(field('跳转链接', card.href, function (v) { card.href = v; }, {
          hint: '网址或 mailto: 邮箱地址'
        }));
        box.appendChild(field('一句说明', card.desc, function (v) { card.desc = v; }, { multiline: true, rows: 2 }));

        list.appendChild(box);
      });
    }

    renderList();
    panel.appendChild(addButton('+ 添加联系卡片', function () {
      contact.cards.push({
        icon: 'mail',
        title: '新联系方式',
        value: '',
        href: '',
        desc: ''
      });
      renderList();
      markDirty();
    }));
  }

  /* ---------- 品牌与页脚 ---------- */

  function buildBrand(panel) {
    panelHead(panel, '品牌与页脚', '修改站名、印章文字和页脚信息。');
    var brand = data.brand;
    var footer = data.footer;

    panel.appendChild(row(
      field('网站名称', brand.name, function (v) { brand.name = v; document.getElementById('adminBrandName').textContent = v; }),
      field('印章文字（两个字）', brand.seal, function (v) { brand.seal = v; })
    ));
    panel.appendChild(field('英文标识', brand.nameEn, function (v) { brand.nameEn = v; }));
    panel.appendChild(field('页脚第一行', footer.line1, function (v) { footer.line1 = v; }));
    panel.appendChild(field('页脚第二行', footer.line2, function (v) { footer.line2 = v; }));
    panel.appendChild(field('版权文字', footer.copyright, function (v) { footer.copyright = v; }));

    panel.appendChild(el('div', 'adm-list-head')).appendChild(el('h3', null, '后台密码'));
    panel.appendChild(field('新密码', '', function () {}, {
      type: 'password',
      placeholder: '输入新密码（至少 4 位）',
      hint: '修改后点击「保存修改」才会生效。此密码仅用于本地后台。'
    }));
    var pwInput = panel.querySelector('input[type="password"]');
    var pwBtn = el('button', 'adm-btn', '更新密码');
    pwBtn.type = 'button';
    pwBtn.addEventListener('click', async function () {
      var pw = pwInput.value.trim();
      if (pw.length < 4) {
        toast('密码至少 4 位', true);
        return;
      }
      try {
        data.admin = data.admin || {};
        data.admin.passwordHash = await sha256(pw);
        pwInput.value = '';
        markDirty();
        toast('密码已更新，保存后生效');
      } catch (err) {
        toast('更新密码失败：' + err.message, true);
      }
    });
    panel.appendChild(pwBtn);
  }

  /* ---------- 登录与权限 ---------- */

  async function sha256(text) {
    var buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.prototype.map.call(new Uint8Array(buffer), function (byte) {
      return ('00' + byte.toString(16)).slice(-2);
    }).join('');
  }

  async function passwordMatches(pw) {
    var stored = data.admin && data.admin.passwordHash;
    if (stored) return (await sha256(pw)) === stored;
    return pw === DEFAULT_PASSWORD;
  }

  function buildPanels() {
    if (rendered) return;
    var panels = {
      hero: document.querySelector('[data-panel="hero"]'),
      about: document.querySelector('[data-panel="about"]'),
      works: document.querySelector('[data-panel="works"]'),
      articles: document.querySelector('[data-panel="articles"]'),
      contact: document.querySelector('[data-panel="contact"]'),
      brand: document.querySelector('[data-panel="brand"]')
    };
    buildHero(panels.hero);
    buildAbout(panels.about);
    buildWorks(panels.works);
    buildArticles(panels.articles);
    buildContact(panels.contact);
    buildBrand(panels.brand);
    rendered = true;
  }

  function showApp() {
    loginView.hidden = true;
    appView.hidden = false;
    document.getElementById('adminBrandName').textContent = data.brand.name || '内容后台';
    buildPanels();
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var pw = loginPassword.value;
    if (!pw) {
      loginError.textContent = '请输入密码';
      return;
    }
    try {
      if (await passwordMatches(pw)) {
        sessionStorage.setItem(SESSION_KEY, '1');
        loginError.textContent = '';
        showApp();
      } else {
        loginError.textContent = '密码不正确，请再试一次';
      }
    } catch (err) {
      loginError.textContent = '当前浏览器不支持密码校验，请改用 Edge 或 Chrome';
    }
  });

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    showApp();
  }

  document.getElementById('logoutBtn').addEventListener('click', function () {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  });

  /* ---------- 文件夹连接与保存 ---------- */

  function uniqueName(file) {
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].indexOf(ext) < 0) ext = 'jpg';
    return 'upload-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) + '.' + ext;
  }

  async function writeFile(dir, name, content) {
    var handle = await dir.getFileHandle(name, { create: true });
    var writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  function serialize() {
    return '/* 网站内容数据 —— 由后台编辑器写入，请勿手动删除本文件。\n' +
      '   保存后需要重新部署，线上网站才会更新。 */\n' +
      'window.SITE_CONTENT = ' + JSON.stringify(data, null, 2) + ';\n';
  }

  document.getElementById('connectBtn').addEventListener('click', async function () {
    if (!window.showDirectoryPicker) {
      toast('当前浏览器不支持文件夹写入，请用 Edge 或 Chrome 打开后台', true);
      return;
    }
    try {
      var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await handle.getFileHandle('index.html');
      dirHandle = handle;
      setStatus('已连接：' + handle.name, 'is-ok');
      toast('已连接网站文件夹');
    } catch (err) {
      if (err && err.name !== 'AbortError') {
        dirHandle = null;
        setStatus('未连接网站文件夹', 'is-warn');
        toast('连接失败，请选择包含 index.html 的网站文件夹', true);
      }
    }
  });

  saveBtn.addEventListener('click', async function () {
    if (!dirHandle) {
      toast('请先点击「连接网站文件夹」，选择你的网站目录', true);
      return;
    }

    saveBtn.disabled = true;
    setStatus('正在保存…');

    try {
      var imgDir = await dirHandle.getDirectoryHandle('images', { create: true });
      var uploads = Array.from(pendingImages.entries());
      for (var i = 0; i < uploads.length; i++) {
        var apply = uploads[i][0];
        var file = uploads[i][1];
        var name = uniqueName(file);
        await writeFile(imgDir, name, file);
        apply('images/' + name);
      }
      pendingImages.clear();

      var assets = await dirHandle.getDirectoryHandle('assets');
      var jsDir = await assets.getDirectoryHandle('js');
      await writeFile(jsDir, 'content.js', serialize());

      dirty = false;
      document.title = '内容后台 · 八哥手作';
      setStatus('已保存 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), 'is-ok');
      toast('已保存到网站文件夹，重新部署后线上生效');
    } catch (err) {
      setStatus('保存失败', 'is-warn');
      toast('保存失败：' + err.message, true);
    } finally {
      saveBtn.disabled = false;
    }
  });

  document.getElementById('downloadBtn').addEventListener('click', function () {
    if (pendingImages.size) {
      toast('还有未保存的新图片，请先「连接网站文件夹」并保存', true);
      return;
    }
    var blob = new Blob([serialize()], { type: 'text/javascript;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'content.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
    toast('已下载 content.js，用它替换 assets/js/content.js');
  });

  /* ---------- 标签切换 ---------- */

  document.getElementById('adminTabs').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    Array.prototype.forEach.call(this.querySelectorAll('button'), function (b) {
      b.classList.toggle('is-active', b === btn);
    });
    var tab = btn.getAttribute('data-tab');
    Array.prototype.forEach.call(document.querySelectorAll('.admin-panel'), function (panel) {
      panel.classList.toggle('is-active', panel.getAttribute('data-panel') === tab);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('beforeunload', function (e) {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });
})();
