/* 八哥手作 · 前台渲染与交互 */
(function () {
  'use strict';

  var C = window.SITE_CONTENT;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function phMarkup(src, alt, extraClass) {
    if (!src) return '';
    return '<div class="ph ' + (extraClass || '') + '" data-file="' + esc(src) + '">' +
      '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '"></div>';
  }

  function iconMarkup(name) {
    var icons = {
      telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 3.3 2.9 10.5c-1 .4-1 1.9.1 2.2l4.5 1.4 1.7 5.4c.3 1 1.5 1.2 2.2.5l2.4-2.3 4.6 3.4c.8.6 2 .2 2.2-.8l2.6-15.4c.2-1.1-.8-1.9-1.6-1.6ZM9.6 14.2l8.4-5.2-6.9 6.6-.3 3-1.2-4.4Z"/></svg>',
      mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6.5 9 6.5 9-6.5"/></svg>',
      paypal: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.7 21.3h-3c-.4 0-.7-.4-.6-.8L7.5 3.2c.1-.4.4-.7.8-.7h6.6c3.4 0 5.4 1.7 5 4.8-.4 3.3-2.8 5.1-6.2 5.1h-2.3l-.9 5.7c-.1.4-.4.6-.8.6Zm2.1-11.7h1.6c1.8 0 3.1-.8 3.3-2.4.2-1.4-.7-2-2.2-2h-1.9l-.8 4.4Z"/></svg>'
    };
    return icons[name] || icons.mail;
  }

  function renderBrandAndFooter() {
    var brand = C.brand || {};
    ['brandName', 'footerBrandName'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = brand.name || '';
    });
    var en = document.getElementById('brandEn');
    if (en) en.textContent = brand.nameEn || '';
    document.getElementById('brandSeal').textContent = brand.seal || '手作';
    document.getElementById('footerSeal').textContent = brand.seal || '手作';

    var footer = C.footer || {};
    document.getElementById('footerLine1').textContent = footer.line1 || '';
    document.getElementById('footerLine2').textContent = footer.line2 || '';
    document.getElementById('footerCopyright').textContent = footer.copyright || '';
  }

  function renderHome() {
    var main = document.getElementById('homeMain');
    if (!main) return;

    var hero = C.hero || {};
    var about = C.about || {};
    var works = C.works || {};
    var articles = C.articles || {};
    var contact = C.contact || {};

    var lead = esc(hero.lead || '').replace(/\n/g, '<br>');
    var meta = (hero.meta || []).map(function (item) {
      return '<li>' + esc(item) + '</li>';
    }).join('');

    var workCards = (works.items || []).map(function (item) {
      return '<article class="work-card reveal">' +
        phMarkup(item.image, item.title + '作品', 'ratio-4-3') +
        '<div class="work-info">' +
          '<div class="work-top"><h3>' + esc(item.title) + '</h3>' +
          (item.tag ? '<span class="tag">' + esc(item.tag) + '</span>' : '') +
          '</div>' +
          '<p>' + esc(item.desc) + '</p>' +
        '</div>' +
      '</article>';
    }).join('');

    var articleCards = (articles.items || []).map(function (item) {
      return '<a class="article-card reveal" href="article.html?id=' + encodeURIComponent(item.id) + '">' +
        phMarkup(item.cover, item.title + '封面', 'ratio-3-2') +
        '<div class="article-body">' +
          '<p class="article-meta">' + esc(item.meta) + '</p>' +
          '<h3>' + esc(item.title) + '</h3>' +
          '<p class="excerpt">' + esc(item.excerpt) + '</p>' +
          '<span class="read-more">阅读全文</span>' +
        '</div>' +
      '</a>';
    }).join('');

    var contactCards = (contact.cards || []).map(function (card) {
      var external = /^https?:\/\//i.test(card.href || '');
      return '<a class="contact-card reveal" href="' + esc(card.href) + '"' +
        (external ? ' target="_blank" rel="noopener"' : '') + '>' +
        '<span class="contact-icon" aria-hidden="true">' + iconMarkup(card.icon) + '</span>' +
        '<div class="contact-card-body">' +
          '<h3>' + esc(card.title) + '</h3>' +
          '<p class="contact-value">' + esc(card.value) + '</p>' +
          '<p class="contact-desc">' + esc(card.desc) + '</p>' +
        '</div>' +
        '<span class="contact-arrow" aria-hidden="true">→</span>' +
      '</a>';
    }).join('');

    var facts = (about.facts || []).map(function (fact) {
      return '<div class="fact"><dt>' + esc(fact.label) + '</dt><dd>' + esc(fact.value) + '</dd></div>';
    }).join('');

    var paragraphs = (about.paragraphs || []).map(function (text) {
      return '<p>' + esc(text) + '</p>';
    }).join('');

    main.innerHTML =
      '<section class="hero">' +
        '<div class="hero-cloud" aria-hidden="true">' +
          '<svg viewBox="0 0 240 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
            '<path d="M18 92c-9 0-16-7-16-16 0-10 8-18 18-18 1-13 12-23 25-23 10 0 19 6 23 15 2-1 5-2 8-2 10 0 18 8 18 18"/>' +
            '<path d="M62 78c-6 0-11-5-11-11 0-7 5-12 12-12 8 0 13 6 13 14 0 6-4 11-9 11-4 0-7-3-7-7 0-3 2-5 5-5"/>' +
            '<path d="M132 92c-9 0-16-7-16-16 0-10 8-18 18-18 1-13 12-23 25-23 10 0 18 6 22 15 2-1 5-2 8-2 10 0 18 8 18 18"/>' +
            '<path d="M176 78c-6 0-11-5-11-11 0-7 5-12 12-12 8 0 13 6 13 14 0 6-4 11-9 11-4 0-7-3-7-7 0-3 2-5 5-5"/>' +
          '</svg>' +
        '</div>' +
        '<div class="container hero-inner">' +
          '<div class="hero-text">' +
            '<p class="eyebrow"><span class="dot"></span>' + esc(hero.eyebrow) + '</p>' +
            '<h1>' + esc(hero.titleTop) + '<br><span class="accent">' + esc(hero.titleAccent) + '</span></h1>' +
            '<p class="lead">' + lead + '</p>' +
            '<div class="hero-actions">' +
              '<a class="btn btn-red" href="' + esc(hero.primary.href) + '">' + esc(hero.primary.label) + '</a>' +
              '<a class="btn btn-ghost" href="' + esc(hero.secondary.href) + '">' + esc(hero.secondary.label) + '</a>' +
            '</div>' +
            '<ul class="hero-meta">' + meta + '</ul>' +
          '</div>' +
          '<div class="hero-visual">' +
            '<div class="arch-frame">' + phMarkup(hero.image, '个人照片') + '</div>' +
            '<span class="seal seal-lg" aria-hidden="true">' + esc(C.brand.seal) + '</span>' +
            '<span class="hero-caption">' + esc(hero.caption) + '</span>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section about" id="about">' +
        '<div class="container about-grid">' +
          '<div class="about-media reveal">' +
            phMarkup(about.image, '工作照：编织过程', 'ratio-4-5') +
            '<span class="media-caption">' + esc(about.caption) + '</span>' +
          '</div>' +
          '<div class="about-text reveal">' +
            '<p class="kicker">' + esc(about.kicker) + '</p>' +
            '<h2>' + esc(about.title) + '</h2>' +
            paragraphs +
            '<dl class="facts">' + facts + '</dl>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section works" id="works">' +
        '<div class="container">' +
          '<div class="section-head reveal">' +
            '<p class="kicker">' + esc(works.kicker) + '</p>' +
            '<h2>' + esc(works.title) + '</h2>' +
            '<p class="section-desc">' + esc(works.desc) + '</p>' +
          '</div>' +
          '<div class="work-grid">' + workCards + '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section articles" id="articles">' +
        '<div class="container">' +
          '<div class="section-head reveal">' +
            '<p class="kicker">' + esc(articles.kicker) + '</p>' +
            '<h2>' + esc(articles.title) + '</h2>' +
            '<p class="section-desc">' + esc(articles.desc) + '</p>' +
          '</div>' +
          '<div class="article-grid">' + articleCards + '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section contact" id="contact">' +
        '<div class="container">' +
          '<div class="section-head light reveal">' +
            '<p class="kicker">' + esc(contact.kicker) + '</p>' +
            '<h2>' + esc(contact.title) + '</h2>' +
            '<p class="section-desc">' + esc(contact.desc) + '</p>' +
          '</div>' +
          '<div class="contact-grid">' + contactCards + '</div>' +
          '<p class="contact-note reveal">' + esc(contact.note) + '</p>' +
        '</div>' +
      '</section>';
  }

  function renderArticlePage() {
    var titleEl = document.getElementById('articleTitle');
    if (!titleEl) return;

    var list = (C.articles && C.articles.items) || [];
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var article = null;

    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { article = list[i]; break; }
    }
    if (!article && list.length) article = list[0];

    if (!article) {
      titleEl.textContent = '文章暂未发布';
      document.getElementById('articleMeta').innerHTML = '';
      document.getElementById('articleCover').style.display = 'none';
      document.getElementById('articleBody').innerHTML = '<p>还没有可显示的文章，请先到后台添加一篇。</p>';
      return;
    }

    document.title = article.title + ' · ' + (C.brand.name || '');
    titleEl.textContent = article.title;

    document.getElementById('articleMeta').innerHTML =
      '<span>' + esc(article.author) + '</span>' +
      '<span>' + esc(article.date) + '</span>' +
      '<span>' + esc(article.meta) + '</span>';

    var cover = document.getElementById('articleCover');
    cover.innerHTML = phMarkup(article.cover, article.title + '封面');

    var body = document.getElementById('articleBody');
    body.innerHTML = article.bodyHtml || '';
  }

  function initImages() {
    var placeholders = document.querySelectorAll('.ph');
    Array.prototype.forEach.call(placeholders, function (ph) {
      var img = ph.querySelector('img');
      if (!img) {
        ph.classList.add('is-empty');
        return;
      }
      var markEmpty = function () {
        ph.classList.add('is-empty');
      };
      if (img.complete && img.naturalWidth === 0) {
        markEmpty();
      }
      img.addEventListener('error', markEmpty);
      img.addEventListener('load', function () {
        ph.classList.remove('is-empty');
      });
    });
  }

  function initHeader() {
    var header = document.getElementById('siteHeader');
    var onScroll = function () {
      if (!header) return;
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var nav = document.getElementById('nav');
    var navToggle = document.getElementById('navToggle');

    if (nav && navToggle) {
      var closeNav = function () {
        nav.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      };

      navToggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        navToggle.classList.toggle('is-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
      });

      Array.prototype.forEach.call(nav.querySelectorAll('a'), function (link) {
        link.addEventListener('click', closeNav);
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth > 860) closeNav();
      });
    }
  }

  function initReveal() {
    var reveals = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(reveals, function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    Array.prototype.forEach.call(reveals, function (el) {
      observer.observe(el);
    });
  }

  function initNavHighlight() {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
    var sections = navLinks.map(function (link) {
      return document.querySelector(link.getAttribute('href'));
    }).filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function init() {
    if (!C) {
      var main = document.getElementById('homeMain');
      if (main) main.innerHTML = '<div class="container" style="padding:120px 28px"><p>内容数据加载失败，请检查 assets/js/content.js。</p></div>';
      return;
    }

    renderBrandAndFooter();

    if (document.body.getAttribute('data-page') === 'article') {
      renderArticlePage();
    } else {
      renderHome();
    }

    initImages();
    initHeader();
    initReveal();
    initNavHighlight();

    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  init();
})();
