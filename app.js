// ========================================
// LUMIÈRE INTÉRIEURE — App Logic
// ========================================

(function () {
  'use strict';

  // --- Admin email constant (early definition for auth checks) ---
  var ADMIN_EMAIL = 'philippe.medium45@gmail.com';

  // --- API Proxy URLs (keys stored server-side in Supabase Edge Functions) ---
  var EDGE_FN_BASE = 'https://dhbbwzpfwtdtdiuixrmq.supabase.co/functions/v1';
  var BREVO_PROXY = EDGE_FN_BASE + '/brevo-proxy';
  var CAL_PROXY = EDGE_FN_BASE + '/cal-proxy';

  // --- Safe storage wrappers (fallback to in-memory when sandboxed) ---
  var _memStore = {};
  var _memSession = {};
  function _safeStorage(type) {
    var mem = type === 'session' ? _memSession : _memStore;
    var fallback = {
      getItem: function(k) { return mem[k] !== undefined ? mem[k] : null; },
      setItem: function(k, v) { mem[k] = String(v); },
      removeItem: function(k) { delete mem[k]; }
    };
    try {
      var key = (type === 'session' ? 'session' : 'local') + 'Storage';
      var s = window[key];
      if (!s) return fallback;
      s.setItem('__test__', '1');
      s.removeItem('__test__');
      return s;
    } catch (e) {
      return fallback;
    }
  }
  var safeLocal = _safeStorage('local');
  var safeSession = _safeStorage('session');

  // --- HTML sanitization helper (XSS prevention) ---
  function sanitizeForHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  // --- Theme Toggle ---
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  updateToggleIcon();

  if (toggle) {
    toggle.addEventListener('click', function () {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateToggleIcon();
    });
  }

  function updateToggleIcon() {
    if (!toggle) return;
    toggle.setAttribute('aria-label', 'Passer en mode ' + (theme === 'dark' ? 'clair' : 'sombre'));
    toggle.innerHTML = theme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  // --- Page Navigation (SPA) ---
  var pages = document.querySelectorAll('.page');
  var navLinks = document.querySelectorAll('[data-page]');
  var navButtons = document.querySelectorAll('[data-nav]');

  function showPage(pageId) {
    pages.forEach(function (p) {
      p.classList.remove('active');
    });
    var target = document.getElementById(pageId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    navLinks.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === pageId) {
        link.classList.add('active');
      }
    });

    // Close mobile nav
    var nav = document.querySelector('.header__nav');
    var hamburger = document.querySelector('.hamburger');
    if (nav) nav.classList.remove('open');
    if (hamburger) {
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }

    // Close blog overlay if navigating away
    closeBlogOverlay();

    // Unified FAB : newsletter sub-button visible sur accueil, blog, boutique et services
    var ufabNl = document.getElementById('ufab-newsletter');
    if (ufabNl) {
      var nlPages = ['accueil', 'blog', 'boutique', 'services'];
      ufabNl.style.display = nlPages.indexOf(pageId) !== -1 ? '' : 'none';
    }
    // Fermer le menu FAB lors du changement de page
    var ufab = document.getElementById('unified-fab');
    if (ufab) ufab.classList.remove('ufab--open');
    var nlCard = document.getElementById('nl-float-card');
    if (nlCard) nlCard.hidden = true;
  }

  // Nav link clicks
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var pageId = this.getAttribute('data-page');
      history.pushState(null, '', '#' + pageId);
      showPage(pageId);
    });
  });

  // CTA button clicks
  navButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var pageId = this.getAttribute('data-nav');
      history.pushState(null, '', '#' + pageId);
      showPage(pageId);
    });
  });

  // Footer links
  document.querySelectorAll('.footer__col a[data-page], .footer__brand a[data-nav]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var pageId = this.getAttribute('data-page') || this.getAttribute('data-nav');
      if (pageId) {
        history.pushState(null, '', '#' + pageId);
        showPage(pageId);
      }
    });
  });

  // Handle initial hash
  var initialPage = location.hash.replace('#', '') || 'accueil';
  showPage(initialPage);

  // Handle browser back/forward
  window.addEventListener('popstate', function () {
    var pageId = location.hash.replace('#', '') || 'accueil';
    showPage(pageId);
  });

  // --- Hamburger Menu ---
  var hamburger = document.querySelector('.hamburger');
  var mobileNav = document.querySelector('.header__nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // --- Header scroll shadow ---
  var header = document.querySelector('.header');
  var lastScroll = 0;

  if (header) {
    window.addEventListener('scroll', function () {
      var currentScroll = window.scrollY;
      if (currentScroll > 60) {
        header.style.boxShadow = 'var(--shadow-sm)';
      } else {
        header.style.boxShadow = 'none';
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // --- Blog Article Content ---
  var blogArticles = {
    belline: {
      category: 'Oracle Belline',
      title: 'Comprendre l\u2019Oracle Belline : guide pour d\u00e9butants',
      date: '10 mars 2026',
      content: '<h2>Un h\u00e9ritage de la voyance fran\u00e7aise</h2>' +
        '<p>L\u2019Oracle Belline est n\u00e9 de la collaboration entre deux figures majeures de la voyance : <strong>Edmond</strong>, c\u00e9l\u00e8bre voyant du XIXe si\u00e8cle, et <strong>Marcel Forget, dit Belline</strong>, qui a red\u00e9couvert et popularis\u00e9 ce jeu dans les ann\u00e9es 1960. Compos\u00e9 de 53 cartes organis\u00e9es en 7 groupes plan\u00e9taires de 7 cartes, plus 3 cartes introductives et la carte de la Clef, cet oracle est consid\u00e9r\u00e9 comme l\u2019un des plus pr\u00e9cis de la tradition divinatoire europ\u00e9enne.</p>' +
        '<p>Ce qui rend le Belline unique, c\u2019est son lien direct avec <strong>l\u2019astrologie</strong>. Chaque carte est rattach\u00e9e \u00e0 une plan\u00e8te \u2014 Soleil, Lune, Mercure, V\u00e9nus, Mars, Jupiter, Saturne \u2014 ce qui permet une lecture riche et nuanc\u00e9e des \u00e9nergies \u00e0 l\u2019\u0153uvre dans votre vie.</p>' +
        '<h2>Les 7 groupes plan\u00e9taires</h2>' +
        '<p>Les cartes sont organis\u00e9es en sept familles, chacune sous l\u2019influence d\u2019une plan\u00e8te :</p>' +
        '<ul>' +
        '<li><strong>Soleil :</strong> succ\u00e8s, vitalit\u00e9, rayonnement personnel</li>' +
        '<li><strong>Lune :</strong> intuition, \u00e9motions, vie int\u00e9rieure</li>' +
        '<li><strong>Mercure :</strong> communication, \u00e9changes, d\u00e9placements</li>' +
        '<li><strong>V\u00e9nus :</strong> amour, harmonie, relations affectives</li>' +
        '<li><strong>Mars :</strong> action, conflit, \u00e9nergie</li>' +
        '<li><strong>Jupiter :</strong> chance, expansion, prosp\u00e9rit\u00e9</li>' +
        '<li><strong>Saturne :</strong> \u00e9preuves, temps, le\u00e7ons de vie</li>' +
        '</ul>' +
        '<h2>Comment se d\u00e9roule un tirage ?</h2>' +
        '<p>Lors d\u2019une consultation, je vous invite d\u2019abord \u00e0 formuler votre question ou \u00e0 simplement vous ouvrir \u00e0 ce que les cartes souhaitent r\u00e9v\u00e9ler. Le tirage peut \u00eatre cibl\u00e9 (une question pr\u00e9cise) ou g\u00e9n\u00e9ral (un panorama de votre situation actuelle).</p>' +
        '<p>Chaque carte tir\u00e9e est interpr\u00e9t\u00e9e selon sa symbolique plan\u00e9taire, sa position dans le tirage et ses interactions avec les cartes voisines. C\u2019est cette combinaison qui donne au Belline sa remarquable <strong>pr\u00e9cision</strong>.</p>' +
        '<h2>Pour qui est-ce adapt\u00e9 ?</h2>' +
        '<p>L\u2019Oracle Belline convient particuli\u00e8rement aux personnes qui cherchent des r\u00e9ponses concr\u00e8tes et dat\u00e9es. Que ce soit pour l\u2019amour, le travail, un projet ou une p\u00e9riode de transition, le Belline \u00e9claire avec clart\u00e9 les \u00e9nergies qui vous entourent et les tendances \u00e0 venir.</p>' +
        '<div class="blog-article__cta"><p>Envie de d\u00e9couvrir ce que le Belline a \u00e0 vous r\u00e9v\u00e9ler ?</p></div>'
    },
    cristaux: {
      category: '\u00c9nergies',
      title: 'Les cristaux et la voyance : alli\u00e9s de votre intuition',
      date: '7 mars 2026',
      content: '<h2>Des alli\u00e9s millénaires</h2>' +
        '<p>Depuis l\u2019Antiquit\u00e9, les cristaux sont utilis\u00e9s pour leurs propri\u00e9t\u00e9s \u00e9nerg\u00e9tiques. En \u00c9gypte, en Inde, en Chine et dans les traditions am\u00e9rindiennes, les pierres \u00e9taient consid\u00e9r\u00e9es comme des ponts entre le monde visible et invisible. Aujourd\u2019hui encore, elles accompagnent de nombreuses pratiques spirituelles et intuitives.</p>' +
        '<h2>Comment les cristaux amplifient l\u2019intuition</h2>' +
        '<p>Chaque cristal poss\u00e8de une vibration propre, li\u00e9e \u00e0 sa composition min\u00e9rale et \u00e0 sa structure cristalline. En travaillant avec les pierres, on peut :</p>' +
        '<ul>' +
        '<li><strong>Apaiser le mental</strong> pour mieux \u00e9couter sa voix int\u00e9rieure</li>' +
        '<li><strong>Amplifier le ressenti</strong> lors d\u2019un tirage de cartes</li>' +
        '<li><strong>Cr\u00e9er un espace sacr\u00e9</strong> propice \u00e0 la m\u00e9ditation et \u00e0 la connexion</li>' +
        '<li><strong>Prot\u00e9ger l\u2019\u00e9nergie</strong> du praticien et du consultant</li>' +
        '</ul>' +
        '<h2>Mes cristaux favoris pour la voyance</h2>' +
        '<p><strong>L\u2019am\u00e9thyste</strong> est ma pierre de pr\u00e9dilection. Pierre de l\u2019intuition par excellence, elle ouvre le troisi\u00e8me \u0153il et facilite la r\u00e9ception des messages subtils. Je la place souvent pr\u00e8s de mes oracles pendant les tirages.</p>' +
        '<p><strong>Le quartz rose</strong> apporte douceur et bienveillance \u00e0 la consultation. Il cr\u00e9e une atmosph\u00e8re rassurante et aide \u00e0 aborder les sujets du c\u0153ur avec s\u00e9r\u00e9nit\u00e9.</p>' +
        '<p><strong>La labradorite</strong> est une pierre de protection \u00e9nerg\u00e9tique. Elle aide \u00e0 maintenir un espace clair et \u00e0 \u00e9viter d\u2019absorber les \u00e9nergies n\u00e9gatives pendant une s\u00e9ance.</p>' +
        '<p><strong>Le lapis-lazuli</strong> stimule la clairvoyance et la communication. Il favorise l\u2019expression de la v\u00e9rit\u00e9 et la compr\u00e9hension profonde des situations.</p>' +
        '<h2>Comment les utiliser au quotidien</h2>' +
        '<p>Vous n\u2019avez pas besoin d\u2019\u00eatre voyant pour b\u00e9n\u00e9ficier des cristaux. Posez une am\u00e9thyste sur votre table de nuit pour des r\u00eaves plus lucides, gardez un quartz rose dans votre poche pour cultiver la douceur, ou m\u00e9ditez avec une labradorite pour renforcer votre ancrage.</p>' +
        '<p>L\u2019essentiel est de choisir une pierre qui vous <strong>attire instinctivement</strong> \u2014 votre intuition sait d\u00e9j\u00e0 ce dont vous avez besoin.</p>' +
        '<div class="blog-article__cta"><p>Les cristaux vous int\u00e9ressent ? Parlons-en lors de votre prochaine consultation.</p></div>'
    },
    rituel: {
      category: 'D\u00e9veloppement personnel',
      title: 'Rituel du matin : se connecter \u00e0 soi avant de consulter',
      date: '3 mars 2026',
      content: '<h2>Pourquoi un rituel matinal ?</h2>' +
        '<p>La qualit\u00e9 d\u2019une consultation de voyance d\u00e9pend autant du praticien que de la disposition int\u00e9rieure du consultant. Arriver \u00e0 une s\u00e9ance avec un esprit agit\u00e9, plong\u00e9 dans le bruit du quotidien, peut brouiller la r\u00e9ception des messages.</p>' +
        '<p>Un rituel du matin \u2014 m\u00eame simple et court \u2014 permet de <strong>poser son intention</strong>, de calmer le flot des pens\u00e9es et de s\u2019ouvrir \u00e0 la guidance avec clart\u00e9.</p>' +
        '<h2>Un rituel en 4 \u00e9tapes</h2>' +
        '<p><strong>1. Le silence (3 minutes)</strong></p>' +
        '<p>Avant de consulter votre t\u00e9l\u00e9phone ou de lancer la machine \u00e0 caf\u00e9, accordez-vous trois minutes de silence. Asseyez-vous confortablement, fermez les yeux et observez simplement votre respiration. Pas besoin de m\u00e9diter \u00ab parfaitement \u00bb \u2014 l\u2019objectif est juste de revenir \u00e0 soi.</p>' +
        '<p><strong>2. L\u2019intention (2 minutes)</strong></p>' +
        '<p>Posez-vous une question simple : \u00ab Qu\u2019est-ce que j\u2019ai besoin de comprendre aujourd\u2019hui ? \u00bb. Ne cherchez pas \u00e0 forcer une r\u00e9ponse. Laissez la question flotter en vous. Souvent, une image, un mot ou une sensation \u00e9merge naturellement.</p>' +
        '<p><strong>3. L\u2019ancrage (2 minutes)</strong></p>' +
        '<p>Posez vos pieds \u00e0 plat sur le sol. Visualisez des racines qui partent de vos pieds et s\u2019enfoncent dans la terre. Cet exercice simple mais puissant vous reconnecte \u00e0 votre corps et \u00e9vite de rester \u00ab dans la t\u00eate \u00bb pendant la journ\u00e9e.</p>' +
        '<p><strong>4. La gratitude (1 minute)</strong></p>' +
        '<p>Nommez mentalement trois choses pour lesquelles vous \u00eates reconnaissant. Elles peuvent \u00eatre toutes simples : la chaleur de votre lit, le chant d\u2019un oiseau, une personne qui vous est ch\u00e8re. La gratitude \u00e9l\u00e8ve la vibration et ouvre le c\u0153ur.</p>' +
        '<h2>Adapter le rituel \u00e0 votre rythme</h2>' +
        '<p>Ce rituel prend environ 8 minutes. Mais si vous n\u2019avez que 2 minutes, concentrez-vous sur le silence et l\u2019intention. L\u2019important n\u2019est pas la dur\u00e9e, mais la <strong>r\u00e9gularit\u00e9</strong>. Un petit rituel pratiqu\u00e9 chaque jour vaut mieux qu\u2019une longue m\u00e9ditation occasionnelle.</p>' +
        '<p>Avec le temps, vous remarquerez que votre intuition se renforce, que vos r\u00eaves deviennent plus clairs et que vous abordez vos consultations avec une profondeur nouvelle.</p>' +
        '<div class="blog-article__cta"><p>Envie d\u2019aller plus loin dans votre d\u00e9veloppement personnel ? D\u00e9couvrez mes accompagnements holistiques.</p></div>'
    },
    'libre-arbitre': {
      category: 'Voyance',
      title: 'Voyance et libre arbitre : ce que les cartes peuvent (et ne peuvent pas) faire',
      date: '27 f\u00e9vrier 2026',
      content: '<h2>La question qui revient toujours</h2>' +
        '<p>\u00ab Si les cartes pr\u00e9disent l\u2019avenir, est-ce que tout est d\u00e9j\u00e0 \u00e9crit ? \u00bb C\u2019est sans doute la question que l\u2019on me pose le plus souvent. Et ma r\u00e9ponse est toujours la m\u00eame : <strong>non</strong>. Les cartes ne pr\u00e9disent pas un avenir fig\u00e9. Elles \u00e9clairent les \u00e9nergies en mouvement, les tendances, les possibilit\u00e9s. Mais c\u2019est vous qui d\u00e9cidez.</p>' +
        '<h2>Les cartes comme miroir</h2>' +
        '<p>Une consultation de voyance fonctionne davantage comme un miroir que comme une boule de cristal. Les cartes refl\u00e8tent ce qui se passe en vous et autour de vous \u00e0 un instant T. Elles mettent en lumi\u00e8re des dynamiques que vous ne voyez peut-\u00eatre pas encore clairement :</p>' +
        '<ul>' +
        '<li>Des sch\u00e9mas r\u00e9p\u00e9titifs qui vous freinent</li>' +
        '<li>Des opportunit\u00e9s qui se dessinent</li>' +
        '<li>Des \u00e9motions enfouies qui demandent attention</li>' +
        '<li>Des influences ext\u00e9rieures dont vous n\u2019avez pas conscience</li>' +
        '</ul>' +
        '<h2>La responsabilit\u00e9 du voyant</h2>' +
        '<p>Un voyant \u00e9thique ne vous dira jamais \u00ab vous devez faire ceci \u00bb ou \u00ab il va vous arriver cela sans possibilit\u00e9 d\u2019y \u00e9chapper \u00bb. Mon r\u00f4le est de vous transmettre les messages des cartes avec honn\u00eatet\u00e9 et bienveillance, puis de vous laisser <strong>libre de vos choix</strong>.</p>' +
        '<p>Si un tirage r\u00e9v\u00e8le une p\u00e9riode difficile, ce n\u2019est pas une condamnation. C\u2019est une invitation \u00e0 se pr\u00e9parer, \u00e0 ajuster ses actions, \u00e0 prendre soin de soi. Les cartes vous donnent les cl\u00e9s \u2014 mais c\u2019est vous qui ouvrez les portes.</p>' +
        '<h2>Ce que la voyance peut vous apporter</h2>' +
        '<p>Quand elle est pratiqu\u00e9e dans le respect du libre arbitre, la voyance devient un outil puissant de <strong>connaissance de soi</strong>. Elle ne remplace pas votre discernement, elle le nourrit. Elle ne dicte pas votre chemin, elle l\u2019\u00e9claire.</p>' +
        '<p>C\u2019est cette vision de la voyance que je porte dans chacune de mes consultations : un espace de lumi\u00e8re o\u00f9 vous pouvez voir plus clair, pour avancer en pleine conscience sur votre chemin de vie.</p>' +
        '<div class="blog-article__cta"><p>Vous avez des questions sur ma d\u00e9marche ? N\u2019h\u00e9sitez pas \u00e0 me contacter.</p></div>'
    },
    'biologie-emotions': {
      category: 'Th\u00e9rapie',
      title: 'La Bio-Logique des \u00c9motions : quand le corps parle de nos blessures',
      date: '14 mars 2026',
      content: '<h2>Qu\u2019est-ce que la Bio-Logique des \u00c9motions\u202f?</h2>' +
        '<p>La Bio-Logique des \u00c9motions est une approche d\u2019accompagnement qui s\u2019int\u00e9resse aux liens profonds entre les \u00e9motions v\u00e9cues, l\u2019histoire personnelle et les manifestations physiques. Son principe fondamental\u202f: certains d\u00e9s\u00e9quilibres corporels, douleurs ou troubles fonctionnels peuvent \u00eatre l\u2019expression d\u2019un stress \u00e9motionnel non r\u00e9solu, conscient ou inconscient.</p>' +
        '<h2>Le corps comme m\u00e9moire vivante</h2>' +
        '<p>Nous portons en nous l\u2019empreinte de nos exp\u00e9riences. Lorsqu\u2019une \u00e9motion intense n\u2019a pas pu \u00eatre exprim\u00e9e ou trait\u00e9e au moment o\u00f9 elle a \u00e9t\u00e9 v\u00e9cue, elle ne dispara\u00eet pas pour autant. Elle se loge dans le corps, parfois pendant des ann\u00e9es, avant de se manifester sous forme de tensions, de douleurs chroniques ou de d\u00e9s\u00e9quilibres r\u00e9currents.</p>' +
        '<p>La Bio-Logique des \u00c9motions propose une <strong>lecture compr\u00e9hensive</strong> de ces manifestations. Plut\u00f4t que de se limiter au sympt\u00f4me, elle cherche \u00e0 comprendre le message que le corps essaie de transmettre, en remontant \u00e0 la source \u00e9motionnelle.</p>' +
        '<h2>Le r\u00f4le du cerveau inconscient</h2>' +
        '<p>L\u2019un des piliers de cette approche est le r\u00f4le central du <strong>cerveau inconscient</strong>. Le v\u00e9ritable acteur de la maladie \u2014 et de la gu\u00e9rison \u2014 serait ce cerveau inconscient qui met en place des \u00ab programmes \u00bb biologiques en r\u00e9ponse aux chocs \u00e9motionnels.</p>' +
        '<p>Ces m\u00e9canismes, loin d\u2019\u00eatre al\u00e9atoires, suivent une <strong>logique biologique pr\u00e9cise</strong>. Comprendre cette logique, c\u2019est acc\u00e9der \u00e0 une cl\u00e9 de lecture qui permet d\u2019\u00e9clairer pourquoi tel sympt\u00f4me appara\u00eet \u00e0 tel moment de notre vie, et en quoi il est li\u00e9 \u00e0 notre histoire personnelle ou familiale.</p>' +
        '<h2>Pour qui est-ce adapt\u00e9\u202f?</h2>' +
        '<p>La Bio-Logique des \u00c9motions s\u2019adresse \u00e0 toute personne souhaitant\u202f:</p>' +
        '<ul>' +
        '<li>Mieux comprendre l\u2019<strong>origine \u00e9motionnelle</strong> de tensions ou d\u2019inconforts persistants</li>' +
        '<li>Prendre du recul face \u00e0 des <strong>sch\u00e9mas r\u00e9p\u00e9titifs</strong> (stress, fatigue, blocages)</li>' +
        '<li>Accompagner une d\u00e9marche de mieux-\u00eatre en <strong>compl\u00e9ment d\u2019un suivi m\u00e9dical</strong></li>' +
        '<li>Se <strong>reconnecter \u00e0 ses ressentis</strong> corporels et \u00e9motionnels</li>' +
        '</ul>' +
        '<h2>Mon chemin avec cette approche</h2>' +
        '<p>Je suis actuellement en formation en Bio-Logique des \u00c9motions. Cette d\u00e9couverte enrichit profond\u00e9ment ma pratique de th\u00e9rapeute et de voyant. Comprendre les liens entre \u00e9motions refoul\u00e9es, stress et manifestations corporelles me permet d\u2019offrir un accompagnement encore plus global et nuanc\u00e9.</p>' +
        '<p>Ce qui me touche particuli\u00e8rement dans cette approche, c\u2019est qu\u2019elle rejoint ma conviction profonde\u202f: <strong>le corps et l\u2019\u00e2me sont indissociables</strong>. Les cartes r\u00e9v\u00e8lent les \u00e9nergies \u00e0 l\u2019\u0153uvre, et la Bio-Logique des \u00c9motions aide \u00e0 comprendre comment ces \u00e9nergies s\u2019inscrivent concr\u00e8tement dans le corps.</p>' +
        '<h2>Un avertissement important</h2>' +
        '<p>Il est essentiel de rappeler que la Bio-Logique des \u00c9motions n\u2019est pas reconnue comme discipline th\u00e9rapeutique par les autorit\u00e9s sanitaires. Elle ne se substitue en aucun cas \u00e0 un diagnostic ou un traitement m\u00e9dical. C\u2019est un <strong>compl\u00e9ment</strong>, un \u00e9clairage suppl\u00e9mentaire pour celles et ceux qui souhaitent explorer la dimension \u00e9motionnelle de leur parcours de sant\u00e9.</p>' +
        '<div class="blog-article__cta"><p>Ce sujet vous parle\u202f? N\u2019h\u00e9sitez pas \u00e0 m\u2019\u00e9crire pour en discuter.</p></div>'
    },
    'astrologie-lumiere-interieur': {
      category: 'Astrologie',
      title: 'Astrologie\u00a0: une boussole pour \u00e9clairer votre chemin int\u00e9rieur',
      date: '21 mars 2026',
      content: '<h2>Un langage symbolique universel</h2>' +
        '<p>Loin des horoscopes de magazine, l\u2019astrologie est un <strong>langage symbolique</strong> qui relie le mouvement des astres \u00e0 notre vie int\u00e9rieure. Pratiqu\u00e9e depuis des mill\u00e9naires, elle offre une grille de lecture unique pour mieux se comprendre, identifier ses cycles de vie et \u00e9clairer ses choix.</p>' +
        '<p>Sur <strong>Lumi\u00e8re Int\u00e9rieure</strong>, l\u2019astrologie est envisag\u00e9e comme un art sacr\u00e9 de connaissance de soi, compl\u00e9mentaire \u00e0 la voyance et \u00e0 la cartomancie.</p>' +
        '<h2>Votre th\u00e8me natal\u00a0: une carte du ciel unique</h2>' +
        '<p>Le th\u00e8me natal (ou carte du ciel) est calcul\u00e9 \u00e0 partir de votre <strong>date, heure et lieu de naissance</strong>. Il repr\u00e9sente la position exacte des plan\u00e8tes au moment o\u00f9 vous \u00eates n\u00e9(e) et r\u00e9v\u00e8le vos forces, vos d\u00e9fis, vos talents et les grandes dynamiques de votre parcours de vie.</p>' +
        '<p>Chaque plan\u00e8te, chaque signe et chaque maison astrologique raconte une partie de votre histoire int\u00e9rieure.</p>' +
        '<h2>Les cycles plan\u00e9taires et votre quotidien</h2>' +
        '<p>L\u2019astrologie ne se limite pas au signe solaire. Les <strong>transits plan\u00e9taires</strong> \u2014 le mouvement actuel des plan\u00e8tes par rapport \u00e0 votre th\u00e8me natal \u2014 \u00e9clairent les p\u00e9riodes favorables, les moments de transformation et les fen\u00eatres d\u2019opportunit\u00e9.</p>' +
        '<p>Comprendre ces cycles, c\u2019est comme disposer d\u2019une boussole int\u00e9rieure pour naviguer les hauts et les bas de la vie avec plus de s\u00e9r\u00e9nit\u00e9.</p>' +
        '<h2>Astrologie et voyance\u00a0: deux lumi\u00e8res compl\u00e9mentaires</h2>' +
        '<p>Les cartes captent l\u2019\u00e9nergie du moment pr\u00e9sent. L\u2019astrologie, elle, offre une vision plus large des cycles et des tendances. En combinant les deux, on obtient un accompagnement \u00e0 la fois <strong>pr\u00e9cis et profond</strong>\u00a0: les cartes \u00e9clairent le \u00ab ici et maintenant \u00bb, et l\u2019astrologie met en perspective le \u00ab d\u2019o\u00f9 je viens et vers o\u00f9 je vais \u00bb.</p>' +
        '<h2>L\u2019objectif n\u2019est jamais d\u2019enfermer</h2>' +
        '<p>L\u2019astrologie telle que je la pratique n\u2019a pas pour but de vous enfermer dans un signe ou une \u00e9tiquette, mais au contraire d\u2019<strong>ouvrir des portes</strong>, de vous r\u00e9concilier avec vous-m\u00eame et de vous rappeler que vous faites partie d\u2019un grand mouvement vivant.</p>' +
        '<p>Si vous ressentez l\u2019appel de mieux comprendre votre th\u00e8me natal ou de combiner astrologie et tirages de cartes, vous pouvez r\u00e9server une consultation sur <strong>Lumi\u00e8re Int\u00e9rieure</strong>. Ensemble, nous lirons le ciel comme une boussole symbolique au service de votre chemin int\u00e9rieur.</p>' +
        '<div class="blog-article__cta"><p>Envie de d\u00e9couvrir votre carte du ciel\u00a0? R\u00e9servez votre consultation astrologique.</p></div>'
    },
    'vraie-spiritualite': {
      category: 'Spiritualit\u00e9',
      title: 'La v\u00e9ritable spiritualit\u00e9\u00a0: au-del\u00e0 des illusions du web',
      date: '18 mars 2026',
      content: '<h2>Quand la spiritualit\u00e9 devient un produit de consommation</h2>' +
        '<p>Il suffit de quelques minutes sur les r\u00e9seaux sociaux pour \u00eatre submerg\u00e9 de contenus dits \u00ab\u00a0spirituels\u00a0\u00bb\u00a0: mantras en stories, tirages de tarot en direct, promesses d\u2019\u00e9veil en 7\u00a0jours, formules magiques pour attirer l\u2019abondance. La spiritualit\u00e9 est devenue un march\u00e9. Elle se vend, se consomme et se scrolle comme n\u2019importe quel autre contenu.</p>' +
        '<p>Derri\u00e8re les filtres dor\u00e9s et les phrases inspir\u00e9es se cache souvent une r\u00e9alit\u00e9 bien diff\u00e9rente\u00a0: des formations express sans fondement, des gourous 2.0 qui exploitent la vuln\u00e9rabilit\u00e9 de personnes en qu\u00eate de sens, et une course au contenu qui transforme le sacr\u00e9 en spectacle. Ce n\u2019est pas le propos ici de juger quiconque. Mais il est l\u00e9gitime de se demander\u00a0: <strong>o\u00f9 est pass\u00e9e la profondeur\u00a0?</strong></p>' +
        '<h2>Le pi\u00e8ge de l\u2019imm\u00e9diatet\u00e9</h2>' +
        '<p>Nous vivons dans une \u00e9poque o\u00f9 tout doit aller vite\u00a0: les r\u00e9ponses, les gu\u00e9risons, les prises de conscience. On veut un d\u00e9clic en un post, un \u00e9veil en un stage, une gu\u00e9rison en un soin. Mais la vie int\u00e9rieure ne fonctionne pas ainsi. Elle demande du <strong>temps</strong>, de la patience, de la r\u00e9p\u00e9tition et surtout de l\u2019honn\u00eatet\u00e9 envers soi-m\u00eame.</p>' +
        '<p>Un vrai cheminement spirituel n\u2019est pas toujours lumineux ni confortable. Il implique de regarder ses ombres, de traverser des p\u00e9riodes de doute, de silence, parfois m\u00eame d\u2019ennui. Il n\u2019y a pas de raccourci. Et c\u2019est justement parce qu\u2019il est exigeant qu\u2019il est transformateur.</p>' +
        '<p>Ce que les algorithmes mettent en avant, ce sont les promesses rapides, les r\u00e9sultats visibles, le spectaculaire. Pas les longues nuits de r\u00e9flexion, pas les larmes lib\u00e9ratrices, pas la lente reconstruction int\u00e9rieure. Parce que \u00e7a ne fait pas de likes.</p>' +
        '<h2>Les nouveaux gourous\u00a0: quand Internet remplace le discernement</h2>' +
        '<p>Derri\u00e8re certains comptes \u00e0 milliers d\u2019abonn\u00e9s se cachent parfois des personnes sans formation, sans exp\u00e9rience v\u00e9ritable et sans \u00e9thique. Ils proposent des \u00ab\u00a0soins \u00e9nerg\u00e9tiques\u00a0\u00bb miracles, des \u00ab\u00a0nettoyages karmiques\u00a0\u00bb \u00e0 prix d\u2019or, des \u00ab\u00a0d\u00e9blocages de vies ant\u00e9rieures\u00a0\u00bb en visio de 30\u00a0minutes. Le vocabulaire est s\u00e9duisant, l\u2019emballage est beau, mais le fond est creux.</p>' +
        '<p>Les autorit\u00e9s fran\u00e7aises alertent r\u00e9guli\u00e8rement sur la mont\u00e9e des d\u00e9rives sectaires li\u00e9es au bien-\u00eatre et au d\u00e9veloppement personnel en ligne. Ce ph\u00e9nom\u00e8ne s\u2019est consid\u00e9rablement amplifi\u00e9 depuis la crise sanitaire, nourri par l\u2019isolement, l\u2019anxi\u00e9t\u00e9 et la qu\u00eate de rep\u00e8res. Des \u00ab\u00a0coachs de vie\u00a0\u00bb et des \u00ab\u00a0influenceurs spirituels\u00a0\u00bb dont les comp\u00e9tences sont, au mieux, al\u00e9atoires, ont profit\u00e9 de ce contexte pour diffuser leurs doctrines \u00e0 grande \u00e9chelle.</p>' +
        '<p>Le plus inqui\u00e9tant, c\u2019est que ces discours touchent souvent des personnes fragiles\u00a0: en deuil, en rupture, en perte de sens. Des gens qui m\u00e9ritent un accompagnement sinc\u00e8re, pas une manipulation d\u00e9guis\u00e9e en lumi\u00e8re.</p>' +
        '<h2>Alors, c\u2019est quoi la vraie spiritualit\u00e9\u00a0?</h2>' +
        '<p>La v\u00e9ritable spiritualit\u00e9 est <strong>silencieuse</strong>. Elle ne cherche pas \u00e0 convaincre, \u00e0 briller ni \u00e0 vendre. Elle ne se met pas en sc\u00e8ne. Elle se vit de l\u2019int\u00e9rieur, dans la simplicit\u00e9 du quotidien, dans ces petits moments o\u00f9 l\u2019on se retrouve face \u00e0 soi-m\u00eame.</p>' +
        '<p>La spiritualit\u00e9 authentique, c\u2019est\u00a0:</p>' +
        '<ul>' +
        '<li><strong>\u00c9couter</strong> avant de parler \u2014 laisser le silence r\u00e9v\u00e9ler ce que les mots ne peuvent pas dire</li>' +
        '<li><strong>Douter</strong> plut\u00f4t que de tout savoir \u2014 le doute est le signe d\u2019une intelligence en mouvement</li>' +
        '<li><strong>Accueillir</strong> ce qui vient sans chercher \u00e0 tout contr\u00f4ler \u2014 accepter que certaines r\u00e9ponses viendront en leur temps</li>' +
        '<li>Respecter le <strong>libre arbitre</strong> de chacun, toujours \u2014 ne jamais imposer, ne jamais forcer</li>' +
        '<li>Reconna\u00eetre ses <strong>limites</strong> \u2014 un guide n\u2019est pas un sauveur, et admettre qu\u2019on ne sait pas est une force</li>' +
        '</ul>' +
        '<p>Elle ne promet rien. Elle accompagne. Elle \u00e9claire. Elle offre un espace de recul pour mieux se comprendre et avancer \u00e0 son propre rythme, sans pression, sans urgence.</p>' +
        '<h2>Revenir \u00e0 l\u2019int\u00e9riorit\u00e9</h2>' +
        '<p>Avant l\u2019\u00e8re des r\u00e9seaux sociaux, la spiritualit\u00e9 se transmettait dans l\u2019intimit\u00e9\u00a0: au coin du feu, dans les temples, dans le secret d\u2019une for\u00eat ou d\u2019une chambre silencieuse. Elle n\u2019avait pas besoin de public. Elle n\u2019avait pas besoin de validation.</p>' +
        '<p>Cette int\u00e9riorit\u00e9 est toujours l\u00e0, disponible, en chacun de nous. Il suffit de se donner la permission de ralentir. De fermer les \u00e9crans. De respirer. De s\u2019asseoir avec soi-m\u00eame, m\u00eame quand c\u2019est inconfortable.</p>' +
        '<p>La vraie lumi\u00e8re ne vient pas d\u2019un feed Instagram. Elle vient de ce moment o\u00f9 vous vous arr\u00eatez, o\u00f9 vous \u00e9coutez votre c\u0153ur battre et o\u00f9 vous sentez, au fond de vous, que <strong>vous \u00eates d\u00e9j\u00e0 entier</strong>.</p>' +
        '<h2>Comment reconna\u00eetre un accompagnement sinc\u00e8re\u00a0?</h2>' +
        '<p>Si vous cherchez un accompagnement spirituel \u2014 que ce soit en voyance, en \u00e9nerg\u00e9tique ou en d\u00e9veloppement personnel \u2014 voici quelques rep\u00e8res simples pour faire la diff\u00e9rence entre un praticien sinc\u00e8re et un profiteur\u00a0:</p>' +
        '<ul>' +
        '<li>Un praticien honn\u00eate ne vous rendra <strong>jamais d\u00e9pendant</strong> de lui. Il vous donne des cl\u00e9s pour avancer seul</li>' +
        '<li>Il ne vous fera <strong>jamais peur</strong> pour vous pousser \u00e0 payer. Pas de mal\u00e9diction, pas de karma bloqu\u00e9 qui n\u00e9cessite un soin urgentissime</li>' +
        '<li>Il reconna\u00eetra <strong>les limites</strong> de sa pratique et ne se substituera jamais \u00e0 un m\u00e9decin, un psychiatre ou un psychologue</li>' +
        '<li>Il respectera votre <strong>rythme</strong> et vos choix, m\u00eame s\u2019ils diff\u00e8rent de ses conseils</li>' +
        '<li>Il sera <strong>transparent</strong> sur ses tarifs, sa formation et son parcours</li>' +
        '</ul>' +
        '<h2>Mon engagement sur Lumi\u00e8re Int\u00e9rieure</h2>' +
        '<p>C\u2019est cette vision de la spiritualit\u00e9 que je porte au quotidien dans ma pratique. Mes consultations ne sont pas l\u00e0 pour vous dire quoi faire, mais pour vous aider \u00e0 <strong>voir plus clair</strong>. Les cartes sont un miroir, pas une v\u00e9rit\u00e9 absolue. Elles \u00e9clairent des \u00e9nergies, des tendances, des possibilit\u00e9s \u2014 mais c\u2019est toujours vous qui d\u00e9cidez.</p>' +
        '<p>Je ne pr\u00e9tends pas d\u00e9tenir la v\u00e9rit\u00e9. Je ne promets ni miracles ni \u00e9veil instantan\u00e9. Ce que je propose, c\u2019est un espace d\u2019\u00e9coute, de sinc\u00e9rit\u00e9 et de respect. Un moment pour vous, o\u00f9 vous pouvez d\u00e9poser vos questions sans \u00eatre jug\u00e9.</p>' +
        '<p>Dans un monde o\u00f9 tout va vite, je crois profond\u00e9ment que la vraie lumi\u00e8re vient de l\u2019int\u00e9rieur. Pas d\u2019un \u00e9cran, pas d\u2019un gourou, pas d\u2019une tendance. <strong>De vous.</strong> De votre capacit\u00e9 \u00e0 vous arr\u00eater, \u00e0 respirer et \u00e0 \u00e9couter ce qui vibre en vous.</p>' +
        '<p>Et c\u2019est peut-\u00eatre \u00e7a, finalement, la v\u00e9ritable spiritualit\u00e9\u00a0: non pas chercher la lumi\u00e8re \u00e0 l\u2019ext\u00e9rieur, mais se rappeler qu\u2019elle a toujours \u00e9t\u00e9 l\u00e0, en soi, patiente et silencieuse, attendant simplement qu\u2019on lui accorde un instant d\u2019attention.</p>' +
        '<div class="blog-article__cta"><p>Envie d\u2019un espace d\u2019\u00e9coute sinc\u00e8re et bienveillant\u00a0? N\u2019h\u00e9sitez pas \u00e0 me contacter.</p></div>'
    },
    'numerologie-pythagoricienne': {
      category: 'Num\u00e9rologie',
      title: 'La num\u00e9rologie pythagoricienne : d\u00e9coder les chiffres de votre vie',
      date: '20 mars 2026',
      content: '<h2>Pythagore et les chiffres sacr\u00e9s</h2>' +
        '<p>Bien avant que les chiffres ne deviennent de simples outils math\u00e9matiques, <strong>Pythagore</strong> \u2014 philosophe et math\u00e9maticien grec du VIe si\u00e8cle avant J.-C. \u2014 enseignait que chaque nombre poss\u00e8de une vibration propre, un sens profond qui va bien au-del\u00e0 de sa valeur num\u00e9rique. Pour lui, \u00ab tout est nombre \u00bb. Cette intuition fondatrice est \u00e0 l\u2019origine de ce que nous appelons aujourd\u2019hui la <strong>num\u00e9rologie pythagoricienne</strong>.</p>' +
        '<p>Contrairement \u00e0 d\u2019autres syst\u00e8mes divinatoires, la num\u00e9rologie ne s\u2019appuie pas sur des symboles externes. Elle puise ses informations dans ce que vous portez d\u00e9j\u00e0 : votre <strong>date de naissance</strong> et les lettres de votre <strong>pr\u00e9nom et nom</strong>. Elle part du principe que rien n\u2019est accidentel dans ces donn\u00e9es \u2014 qu\u2019elles contiennent une information pr\u00e9cieuse sur votre essence, votre mission de vie et vos cycles.</p>' +
        '<h2>Les trois nombres fondamentaux</h2>' +
        '<p><strong>Le Chemin de vie</strong> est sans doute le nombre le plus important. Calcul\u00e9 \u00e0 partir de votre date de naissance, il r\u00e9v\u00e8le votre orientation profonde, ce que vous \u00eates venu(e) exp\u00e9rimenter et d\u00e9velopper au cours de cette existence. C\u2019est la colonne vert\u00e9brale de votre num\u00e9rologie personnelle.</p>' +
        '<p><strong>Le nombre d\u2019Expression</strong> est obtenu en convertissant les lettres de votre nom complet en chiffres. Il r\u00e9v\u00e8le vos talents naturels, vos aptitudes et la fa\u00e7on dont vous vous manifestez dans le monde. C\u2019est en quelque sorte ce que vous <em>avez</em> pour accomplir votre chemin.</p>' +
        '<p><strong>L\u2019Intime Conviction</strong> (ou nombre de l\u2019\u00catre intime) est calcul\u00e9 \u00e0 partir des seules voyelles de votre nom. Il repr\u00e9sente vos motivations profondes, vos d\u00e9sirs secrets, ce qui vous anime int\u00e9rieurement mais que vous montrez rarement au monde.</p>' +
        '<h2>Les chiffres de 1 \u00e0 9 et leurs vibrations</h2>' +
        '<p>En num\u00e9rologie pythagoricienne, tout nombre est r\u00e9duit \u00e0 un chiffre de 1 \u00e0 9 (sauf les <strong>nombres ma\u00eetres</strong> 11, 22 et 33, qui conservent leur double nature). Chacun porte une vibration symbolique :</p>' +
        '<ul>' +
        '<li><strong>1 :</strong> leadership, pionnier, individualit\u00e9, nouveau d\u00e9part</li>' +
        '<li><strong>2 :</strong> coop\u00e9ration, sensibilit\u00e9, diplomatie, relation \u00e0 l\u2019autre</li>' +
        '<li><strong>3 :</strong> cr\u00e9ativit\u00e9, expression, joie de vivre, communication</li>' +
        '<li><strong>4 :</strong> stabilit\u00e9, travail, structure, sens du concret</li>' +
        '<li><strong>5 :</strong> libert\u00e9, changement, aventure, adaptabilit\u00e9</li>' +
        '<li><strong>6 :</strong> responsabilit\u00e9, harmonie, famille, service aux autres</li>' +
        '<li><strong>7 :</strong> introspection, spiritualit\u00e9, analyse, qu\u00eate de v\u00e9rit\u00e9</li>' +
        '<li><strong>8 :</strong> ambition, pouvoir, r\u00e9ussite mat\u00e9rielle, karma de l\u2019abondance</li>' +
        '<li><strong>9 :</strong> sagesse, universalit\u00e9, accomplissement, transmission</li>' +
        '</ul>' +
        '<h2>Les nombres ma\u00eetres : une vibration d\u2019exception</h2>' +
        '<p>Les nombres <strong>11, 22 et 33</strong> sont appel\u00e9s \u00ab nombres ma\u00eetres \u00bb car ils portent une vibration particuli\u00e8rement intense. Le 11 est le nombre de l\u2019intuition et de l\u2019\u00e9veil spirituel ; le 22 est le \u00ab b\u00e2tisseur ma\u00eetre \u00bb, celui qui peut construire quelque chose de grand et de durable ; le 33 est le nombre de la compassion universelle et de l\u2019enseignement spirituel.</p>' +
        '<p>Porter un nombre ma\u00eetre dans son num\u00e9roth\u00e8me est une invitation \u00e0 un chemin plus exigeant, mais aussi plus riche en profondeur et en sens.</p>' +
        '<h2>La num\u00e9rologie et les cycles de vie</h2>' +
        '<p>Au-del\u00e0 du caract\u00e8re, la num\u00e9rologie pythagoricienne permet de comprendre les <strong>cycles temporels</strong> qui rythment votre existence. L\u2019Ann\u00e9e Personnelle, calcul\u00e9e \u00e0 partir de votre date d\u2019anniversaire et de l\u2019ann\u00e9e en cours, donne une couleur particuli\u00e8re \u00e0 chaque p\u00e9riode de 12 mois.</p>' +
        '<p>Par exemple, une Ann\u00e9e Personnelle 1 annonce un nouveau d\u00e9part, une p\u00e9riode de semailles ; une Ann\u00e9e 9 marque la fin d\u2019un cycle, une invitation \u00e0 l\u00e2cher ce qui ne vous correspond plus pour pr\u00e9parer un nouveau commencement. Conna\u00eetre son cycle permet d\u2019agir <strong>en harmonie avec ses propres rythmes</strong>, plut\u00f4t qu\u2019\u00e0 contre-courant.</p>' +
        '<h2>Num\u00e9rologie et voyance : deux lectures compl\u00e9mentaires</h2>' +
        '<p>Comme l\u2019astrologie, la num\u00e9rologie offre une vision \u00e0 plus long terme, une cartographie de fond. Les cartes, elles, s\u2019ancrent dans l\u2019\u00e9nergie du moment pr\u00e9sent. Associer les deux, c\u2019est disposer \u00e0 la fois d\u2019une <strong>boussole de vie</strong> et d\u2019un \u00e9clairage sur le \u00ab ici et maintenant \u00bb.</p>' +
        '<p>Lors d\u2019une consultation sur <strong>Lumi\u00e8re Int\u00e9rieure</strong>, il m\u2019arrive d\u2019int\u00e9grer des \u00e9l\u00e9ments num\u00e9rologiques pour enrichir la lecture des cartes \u2014 notamment pour comprendre pourquoi certains th\u00e8mes reviennent, ou pour situer une question dans un cycle de vie plus large.</p>' +
        '<h2>La num\u00e9rologie n\u2019enferme pas, elle \u00e9claire</h2>' +
        '<p>Comme toute approche divinatoire ou symbolique, la num\u00e9rologie n\u2019a pas vocation \u00e0 vous figer dans une \u00e9tiquette. Un Chemin de vie 4 n\u2019est pas \u00ab condamn\u00e9 \u00bb \u00e0 la routine, pas plus qu\u2019un Chemin de vie 5 n\u2019est incapable de stabilit\u00e9. Ces vibrations sont des <strong>tendances, des ressources, des invitations</strong> \u2014 jamais des sentences.</p>' +
        '<p>L\u2019objectif est de mieux vous conna\u00eetre, de comprendre vos forces et vos d\u00e9fis avec bienveillance, et de cheminer vers une vie plus align\u00e9e avec ce que vous \u00eates profond\u00e9ment.</p>' +
        '<div class="blog-article__cta"><p>Curieux(se) de d\u00e9couvrir votre Chemin de vie ou votre num\u00e9roth\u00e8me complet ? Parlons-en lors de votre prochaine consultation.</p></div>'
},
    'vampires-energetiques': {
      category: 'Protection \u00e9nerg\u00e9tique',
      title: 'Vampires \u00e9nerg\u00e9tiques\u00a0: reconna\u00eetre les personnes toxiques et s\u2019en prot\u00e9ger',
      date: '17 mars 2026',
      content: '<h2>Qu\u2019est-ce qu\u2019un vampire \u00e9nerg\u00e9tique\u202f?</h2>' +
        '<p>Vous est-il d\u00e9j\u00e0 arriv\u00e9 de quitter une conversation en vous sentant vid\u00e9(e), \u00e9puis\u00e9(e) ou inexplicablement triste, alors que tout allait bien avant\u202f? Ce ph\u00e9nom\u00e8ne, beaucoup d\u2019entre nous le connaissent sans savoir le nommer. En \u00e9nerg\u00e9tique, on parle de <strong>vampires \u00e9nerg\u00e9tiques</strong>\u00a0: des personnes qui, consciemment ou non, se nourrissent de l\u2019\u00e9nergie vitale de leur entourage.</p>' +
        '<p>Il ne s\u2019agit pas de diaboliser qui que ce soit. Un vampire \u00e9nerg\u00e9tique n\u2019est pas forc\u00e9ment une mauvaise personne. C\u2019est souvent quelqu\u2019un en souffrance, en manque, dont le vide int\u00e9rieur aspire l\u2019\u00e9nergie autour de lui comme une \u00e9ponge. Mais comprendre ce m\u00e9canisme est essentiel pour <strong>pr\u00e9server votre \u00e9quilibre</strong>.</p>' +
        '<h2>Les profils les plus courants</h2>' +
        '<p>Les vampires \u00e9nerg\u00e9tiques prennent des formes tr\u00e8s diff\u00e9rentes. Savoir les reconna\u00eetre, c\u2019est d\u00e9j\u00e0 se prot\u00e9ger\u00a0:</p>' +
        '<ul>' +
        '<li><strong>Le plaignant chronique</strong> \u2014 Tout va toujours mal. Il sollicite votre \u00e9coute en permanence, mais ne cherche jamais de solution. Apr\u00e8s l\u2019\u00e9change, c\u2019est vous qui portez le poids de ses probl\u00e8mes.</li>' +
        '<li><strong>Le manipulateur</strong> \u2014 Subtil, charmant, il utilise la culpabilit\u00e9, le chantage \u00e9motionnel ou la flatterie pour obtenir ce qu\u2019il veut. Vous vous sentez confus(e) apr\u00e8s vos \u00e9changes, sans vraiment comprendre pourquoi.</li>' +
        '<li><strong>Le critique permanent</strong> \u2014 Rien n\u2019est jamais assez bien. Chaque d\u00e9cision, chaque r\u00e9ussite est minimis\u00e9e ou d\u00e9valoris\u00e9e. Il sape votre confiance en vous \u00e0 petit feu.</li>' +
        '<li><strong>Le drame ambulant</strong> \u2014 Sa vie est un th\u00e9\u00e2tre permanent de crises et d\u2019urgences. Il vous entra\u00eene dans son chaos \u00e9motionnel et vous \u00eates toujours appel\u00e9(e) \u00e0 la rescousse.</li>' +
        '<li><strong>Le dominateur</strong> \u2014 Il impose ses id\u00e9es, ses envies, son rythme. Tout tourne autour de lui. Votre propre \u00e9nergie est mise au service de ses besoins, jamais des v\u00f4tres.</li>' +
        '</ul>' +
        '<h2>Les signes que votre \u00e9nergie est pomp\u00e9e</h2>' +
        '<p>Votre corps et vos \u00e9motions vous envoient des signaux clairs quand vous \u00eates en pr\u00e9sence d\u2019un vampire \u00e9nerg\u00e9tique. Apprenez \u00e0 les \u00e9couter\u00a0:</p>' +
        '<ul>' +
        '<li><strong>Fatigue soudaine</strong> apr\u00e8s un appel ou une rencontre, m\u00eame br\u00e8ve</li>' +
        '<li>Sensation de <strong>vide</strong>, de lourdeur ou de brouillard mental</li>' +
        '<li><strong>Irritabilit\u00e9</strong> ou tristesse inexplicable apr\u00e8s un \u00e9change</li>' +
        '<li>Envie de <strong>fuir</strong> ou de vous isoler sans raison apparente</li>' +
        '<li><strong>Maux de t\u00eate</strong>, tensions dans le plexus solaire ou la nuque</li>' +
        '<li>Impression de perdre confiance en vous au fil du temps avec cette personne</li>' +
        '</ul>' +
        '<p>Si vous reconnaissez plusieurs de ces signes de mani\u00e8re r\u00e9currente avec la m\u00eame personne, il est probable que votre \u00e9nergie est aspir\u00e9e.</p>' +
        '<h2>Pourquoi certaines personnes attirent les vampires \u00e9nerg\u00e9tiques\u202f?</h2>' +
        '<p>Les personnes les plus touch\u00e9es sont souvent celles qui ont un <strong>c\u0153ur grand ouvert</strong>\u00a0: les empathes, les hypersensibles, les \u00ab donneurs naturels \u00bb. Leur lumi\u00e8re int\u00e9rieure attire comme un aimant ceux qui en manquent. C\u2019est une belle qualit\u00e9, mais elle doit s\u2019accompagner d\u2019une conscience claire de ses propres limites.</p>' +
        '<p>Donner sans limite, c\u2019est se vider. La bienveillance envers les autres commence par la <strong>bienveillance envers soi-m\u00eame</strong>.</p>' +
        '<h2>Comment se prot\u00e9ger\u00a0: 7 cl\u00e9s concr\u00e8tes</h2>' +
        '<p><strong>1. Identifiez les personnes qui vous \u00e9puisent.</strong> Prenez le temps d\u2019observer comment vous vous sentez apr\u00e8s chaque interaction. Notez-le dans un carnet si n\u00e9cessaire. La prise de conscience est la premi\u00e8re \u00e9tape.</p>' +
        '<p><strong>2. Posez des limites claires.</strong> Dire \u00ab non \u00bb n\u2019est pas un manque d\u2019amour. C\u2019est un acte de respect envers vous-m\u00eame. Limitez le temps pass\u00e9 avec les personnes toxiques. Vous n\u2019\u00eates pas oblig\u00e9(e) de r\u00e9pondre \u00e0 chaque appel, chaque message, chaque sollicitation.</p>' +
        '<p><strong>3. Pratiquez la visualisation de protection.</strong> Avant une rencontre difficile, visualisez une bulle de lumi\u00e8re dor\u00e9e qui vous enveloppe. Cette technique simple mais puissante renforce votre champ \u00e9nerg\u00e9tique et cr\u00e9e une barri\u00e8re symbolique qui prot\u00e8ge votre espace int\u00e9rieur.</p>' +
        '<p><strong>4. Ancrez-vous au quotidien.</strong> La marche en nature, le contact pieds nus avec la terre, la respiration consciente\u2026 Toutes ces pratiques renforcent votre ancrage et vous rendent moins vuln\u00e9rable aux influences ext\u00e9rieures. Un arbre profond\u00e9ment enracin\u00e9 ne plie pas au premier coup de vent.</p>' +
        '<p><strong>5. Utilisez les pierres de protection.</strong> La <strong>tourmaline noire</strong> est la pierre de protection par excellence\u00a0: elle absorbe les \u00e9nergies n\u00e9gatives. L\u2019<strong>\u0153il-de-tigre</strong> renvoie les mauvaises intentions comme un miroir. La <strong>labradorite</strong> agit comme un bouclier \u00e9nerg\u00e9tique pour les th\u00e9rapeutes et les empathes.</p>' +
        '<p><strong>6. Purifiez votre espace r\u00e9guli\u00e8rement.</strong> Br\u00fblez de la sauge, du palo santo ou de l\u2019encens apr\u00e8s la visite d\u2019une personne \u00e9puisante. A\u00e9rez votre int\u00e9rieur. Ces gestes simples nettoient les \u00e9nergies stagnantes et redonnent de la l\u00e9g\u00e8ret\u00e9 \u00e0 votre lieu de vie.</p>' +
        '<p><strong>7. Si n\u00e9cessaire, prenez de la distance.</strong> Parfois, la seule v\u00e9ritable protection est l\u2019\u00e9loignement. Si une relation vous d\u00e9truit, vous avez le droit de vous en lib\u00e9rer. Ce n\u2019est pas de la l\u00e2chet\u00e9, c\u2019est de la <strong>survie \u00e9nerg\u00e9tique</strong>.</p>' +
        '<h2>Et si le vampire \u00e9nerg\u00e9tique est un proche\u202f?</h2>' +
        '<p>C\u2019est souvent la situation la plus douloureuse. Un parent, un conjoint, un ami d\u2019enfance\u2026 Il n\u2019est pas toujours possible de couper les ponts. Dans ce cas, le travail consiste \u00e0 <strong>renforcer vos propres d\u00e9fenses</strong> plut\u00f4t qu\u2019\u00e0 changer l\u2019autre.</p>' +
        '<p>Apprenez \u00e0 \u00eatre pr\u00e9sent sans absorber. \u00c0 \u00e9couter sans porter. \u00c0 aimer sans vous perdre. C\u2019est un \u00e9quilibre subtil, qui demande de la pratique, mais qui transforme profond\u00e9ment la relation \u00e0 l\u2019autre et \u00e0 soi-m\u00eame.</p>' +
        '<h2>La voyance comme outil de discernement</h2>' +
        '<p>Les cartes peuvent r\u00e9v\u00e9ler des dynamiques relationnelles invisibles \u00e0 l\u2019\u0153il nu. Un tirage cibl\u00e9 permet d\u2019\u00e9clairer\u00a0:</p>' +
        '<ul>' +
        '<li>La nature \u00e9nerg\u00e9tique d\u2019une relation qui vous pr\u00e9occupe</li>' +
        '<li>Les sch\u00e9mas inconscients qui vous rendent vuln\u00e9rable</li>' +
        '<li>Les ressources dont vous disposez pour vous prot\u00e9ger</li>' +
        '<li>Le chemin vers un \u00e9quilibre \u00e9nerg\u00e9tique retrouv\u00e9</li>' +
        '</ul>' +
        '<p>Prot\u00e9ger votre \u00e9nergie, ce n\u2019est pas devenir froid ou ferm\u00e9. C\u2019est apprendre \u00e0 <strong>briller sans se consumer</strong>. C\u2019est honorer votre lumi\u00e8re int\u00e9rieure en la prot\u00e9geant avec la m\u00eame attention que vous accordez \u00e0 celle des autres.</p>' +
        '<div class="blog-article__cta"><p>Vous sentez que votre \u00e9nergie est aspir\u00e9e par une relation\u202f? Parlons-en lors d\u2019une consultation pour \u00e9clairer la situation et trouver des solutions.</p></div>'
    },
    'confiance-ressenti': {
      category: 'D\u00e9veloppement personnel',
      title: 'Faire confiance \u00e0 son ressenti quand les autres le minimisent',
      date: '15 mars 2026',
      content: '<h2>\u00ab Tu te fais des id\u00e9es \u00bb</h2>' +
        '<p>Combien de fois avez-vous entendu cette phrase\u202f? Vous ressentez quelque chose de fort \u2014 un malaise face \u00e0 une personne, une intuition sur une situation, une \u00e9motion qui monte sans raison apparente \u2014 et quand vous osez en parler, on vous r\u00e9pond\u00a0: <strong>\u00ab tu exag\u00e8res \u00bb, \u00ab c\u2019est dans ta t\u00eate \u00bb, \u00ab arr\u00eate de tout analyser \u00bb</strong>.</p>' +
        '<p>\u00c0 force, vous finissez par douter. Peut-\u00eatre que c\u2019est vrai, peut-\u00eatre que vous \u00eates trop sensible, peut-\u00eatre que vous imaginez des choses. Et petit \u00e0 petit, vous \u00e9teignez cette voix int\u00e9rieure qui pourtant essayait de vous guider.</p>' +
        '<p>Cet article est pour vous. Pour toutes celles et ceux dont le ressenti a \u00e9t\u00e9 ni\u00e9, minimis\u00e9, ridiculis\u00e9. Pour vous rappeler une v\u00e9rit\u00e9 fondamentale\u00a0: <strong>ce que vous ressentez est r\u00e9el</strong>.</p>' +
        '<h2>Pourquoi les autres minimisent votre ressenti</h2>' +
        '<p>Avant de comprendre comment retrouver confiance en vous, il est utile de comprendre pourquoi votre entourage r\u00e9agit ainsi. Dans la grande majorit\u00e9 des cas, ce n\u2019est m\u00eame pas de la m\u00e9chancet\u00e9. C\u2019est\u00a0:</p>' +
        '<ul>' +
        '<li><strong>De la peur.</strong> Votre ressenti met en lumi\u00e8re quelque chose qu\u2019ils ne veulent pas voir. Si vous dites \u00ab je sens que cette personne n\u2019est pas bienveillante \u00bb et que c\u2019est un ami commun, \u00e7a les oblige \u00e0 remettre en question leur propre jugement.</li>' +
        '<li><strong>De l\u2019incompr\u00e9hension.</strong> Tout le monde ne fonctionne pas avec le m\u00eame degr\u00e9 de sensibilit\u00e9. Ce que vous percevez avec finesse, d\u2019autres ne le captent tout simplement pas. Et ce qu\u2019on ne per\u00e7oit pas, on a tendance \u00e0 le nier.</li>' +
        '<li><strong>Un conditionnement culturel.</strong> Dans notre soci\u00e9t\u00e9, on valorise le rationnel, le logique, le mesurable. Le ressenti, l\u2019intuition, la perception subtile sont souvent relegu\u00e9s au rang de \u00ab superstition \u00bb ou de \u00ab fragilit\u00e9 \u00e9motionnelle \u00bb.</li>' +
        '<li><strong>Leur propre blessure.</strong> Parfois, ceux qui vous disent \u00ab arr\u00eate de ressentir autant \u00bb sont eux-m\u00eames des personnes qui ont appris \u00e0 couper leurs propres \u00e9motions pour survivre. Votre ouverture leur renvoie un miroir inconfortable.</li>' +
        '</ul>' +
        '<h2>Ce qu\u2019est vraiment l\u2019invalidation \u00e9motionnelle</h2>' +
        '<p>Quand quelqu\u2019un vous dit \u00ab tu te fais des id\u00e9es \u00bb, il ne commente pas la r\u00e9alit\u00e9 \u2014 il <strong>invalide votre exp\u00e9rience</strong>. C\u2019est ce qu\u2019on appelle l\u2019invalidation \u00e9motionnelle, et c\u2019est un m\u00e9canisme profond\u00e9ment destructeur quand il se r\u00e9p\u00e8te.</p>' +
        '<p>Les formes les plus courantes\u00a0:</p>' +
        '<ul>' +
        '<li>\u00ab Tu es trop sensible \u00bb \u2014 comme si ressentir \u00e9tait un d\u00e9faut</li>' +
        '<li>\u00ab Ce n\u2019est pas si grave \u00bb \u2014 qui d\u00e9cide de la gravit\u00e9 de ce que vous vivez\u202f?</li>' +
        '<li>\u00ab Tout le monde vit \u00e7a, arr\u00eate de te plaindre \u00bb \u2014 comparer la souffrance ne la supprime pas</li>' +
        '<li>\u00ab Tu devrais passer \u00e0 autre chose \u00bb \u2014 le deuil, la col\u00e8re, la tristesse n\u2019ont pas de minuterie</li>' +
        '<li>Changer de sujet d\u00e8s que vous exprimez une \u00e9motion \u2014 le silence est aussi une forme d\u2019invalidation</li>' +
        '</ul>' +
        '<p>\u00c0 long terme, l\u2019invalidation r\u00e9p\u00e9t\u00e9e peut mener \u00e0 une <strong>d\u00e9connexion de soi</strong>\u00a0: on ne sait plus ce qu\u2019on ressent vraiment, on se m\u00e9fie de ses propres \u00e9motions, on cherche constamment la validation ext\u00e9rieure pour savoir si on a \u00ab le droit \u00bb de ressentir quelque chose.</p>' +
        '<h2>Votre ressenti est une boussole, pas un d\u00e9faut</h2>' +
        '<p>Ce que vous ressentez n\u2019a pas besoin d\u2019\u00eatre valid\u00e9 par quelqu\u2019un d\u2019autre pour \u00eatre l\u00e9gitime. Votre corps, vos \u00e9motions et votre intuition sont des <strong>instruments de perception</strong> d\u2019une pr\u00e9cision remarquable \u2014 bien plus que ce que la soci\u00e9t\u00e9 veut nous faire croire.</p>' +
        '<p>Pensez \u00e0 toutes ces fois o\u00f9 vous avez \u00ab senti \u00bb que quelque chose n\u2019allait pas avant m\u00eame de pouvoir l\u2019expliquer. Ces moments o\u00f9 votre ventre se nouait en pr\u00e9sence d\u2019une personne, o\u00f9 un frisson vous traversait avant une d\u00e9cision. C\u2019\u00e9tait votre sagesse int\u00e9rieure qui parlait. Elle n\u2019avait juste pas les mots.</p>' +
        '<p>En voyance, c\u2019est ce m\u00eame ressenti que j\u2019utilise pour lire les cartes. Les images, les couleurs, les vibrations \u2014 tout passe d\u2019abord par le corps, par l\u2019\u00e9motion, avant d\u2019\u00eatre traduit en mots. <strong>Votre ressenti fonctionne exactement de la m\u00eame fa\u00e7on.</strong></p>' +
        '<h2>Comment retrouver confiance en ce que vous ressentez</h2>' +
        '<p><strong>1. Tenez un journal de ressentis.</strong> Chaque soir, notez une ou deux choses que vous avez ressenties dans la journ\u00e9e, sans les juger. Pas \u00ab j\u2019ai eu tort de ressentir \u00e7a \u00bb, mais simplement\u00a0: \u00ab j\u2019ai ressenti de la col\u00e8re pendant cette conversation \u00bb, \u00ab j\u2019ai senti un malaise en entrant dans cette pi\u00e8ce \u00bb. Avec le temps, vous verrez des sch\u00e9mas \u00e9merger et votre confiance se renforcer.</p>' +
        '<p><strong>2. Arr\u00eatez de demander la permission de ressentir.</strong> Vous n\u2019avez pas besoin que quelqu\u2019un valide votre tristesse, votre joie ou votre intuition. Votre exp\u00e9rience est la v\u00f4tre. Si vous ressentez quelque chose, c\u2019est que <strong>c\u2019est l\u00e0</strong>. Point.</p>' +
        '<p><strong>3. Entourez-vous de personnes qui vous \u00e9l\u00e8vent.</strong> Cherchez des personnes qui accueillent vos \u00e9motions au lieu de les corriger. Un \u00ab je te crois \u00bb, un \u00ab je comprends que tu ressentes \u00e7a \u00bb \u2014 ces mots simples ont un pouvoir de gu\u00e9rison immense.</p>' +
        '<p><strong>4. Reconnectez-vous \u00e0 votre corps.</strong> Le mental doute. Le corps, lui, ne ment jamais. Pratiquez la respiration consciente, la m\u00e9ditation, la marche en pleine conscience. Apprenez \u00e0 \u00e9couter les signaux physiques\u00a0: tensions, chaleur, l\u00e9g\u00e8ret\u00e9, oppression. Ce sont vos indicateurs int\u00e9rieurs, vos rep\u00e8res personnels.</p>' +
        '<p><strong>5. Distinguez l\u2019\u00e9motion de l\u2019interpr\u00e9tation.</strong> Ressentir de la m\u00e9fiance envers quelqu\u2019un est un signal. Conclure que cette personne est dangereuse est une interpr\u00e9tation. Les deux sont utiles, mais la premi\u00e8re \u2014 le ressenti brut \u2014 est rarement fausse. C\u2019est l\u2019histoire qu\u2019on se raconte ensuite qui peut \u00eatre nuanc\u00e9e.</p>' +
        '<p><strong>6. Honorez votre sensibilit\u00e9.</strong> \u00catre sensible n\u2019est pas une faiblesse. C\u2019est une <strong>perception \u00e9largie du r\u00e9el</strong>. Les empathes, les intuitifs, les hypersensibles per\u00e7oivent des couches de r\u00e9alit\u00e9 que d\u2019autres ne captent pas. C\u2019est un don, pas un fardeau \u2014 \u00e0 condition d\u2019apprendre \u00e0 le porter avec conscience.</p>' +
        '<h2>Quand l\u2019invalidation vient de l\u2019enfance</h2>' +
        '<p>Pour certains, la minimisation du ressenti remonte \u00e0 tr\u00e8s loin. Un enfant \u00e0 qui l\u2019on r\u00e9p\u00e8te \u00ab arr\u00eate de pleurer, ce n\u2019est rien \u00bb apprend que ses \u00e9motions ne sont pas l\u00e9gitimes. Il grandit en se coupant de lui-m\u00eame, en cherchant \u00e0 l\u2019ext\u00e9rieur ce qu\u2019il devrait trouver en lui\u00a0: la confirmation que ce qu\u2019il vit a de la valeur.</p>' +
        '<p>Si c\u2019est votre cas, sachez que ce cheminement de reconnexion est possible \u00e0 tout \u00e2ge. Le travail de guidance peut justement aider \u00e0 <strong>remettre en lumi\u00e8re ce qui a \u00e9t\u00e9 \u00e9teint</strong>, \u00e0 retrouver la confiance en cette voix int\u00e9rieure que personne n\u2019a le droit de faire taire.</p>' +
        '<h2>Les cartes, un miroir de votre ressenti profond</h2>' +
        '<p>Lors d\u2019une consultation, les cartes ne font pas que \u00ab pr\u00e9dire \u00bb. Elles <strong>confirment</strong>. Elles mettent des images et des mots sur ce que vous ressentez d\u00e9j\u00e0 sans oser vous l\u2019avouer. Elles donnent une forme \u00e0 l\u2019informulable.</p>' +
        '<p>Beaucoup de personnes viennent me consulter en disant \u00ab je savais d\u00e9j\u00e0, au fond \u00bb. Les cartes n\u2019ont fait que confirmer ce que leur c\u0153ur leur soufflait depuis longtemps. Et c\u2019est peut-\u00eatre la plus belle fonction de la voyance\u00a0: non pas r\u00e9v\u00e9ler l\u2019inconnu, mais <strong>vous r\u00e9concilier avec ce que vous savez d\u00e9j\u00e0</strong>.</p>' +
        '<p>Votre ressenti n\u2019est pas votre ennemi. Il est votre alli\u00e9 le plus fid\u00e8le. Apprenez \u00e0 l\u2019\u00e9couter, \u00e0 le respecter, \u00e0 lui faire de la place. Car la lumi\u00e8re que vous cherchez \u00e0 l\u2019ext\u00e9rieur est d\u00e9j\u00e0 l\u00e0, en vous. Elle attend simplement que vous lui fassiez confiance.</p>' +
        '<div class="blog-article__cta"><p>Vous avez besoin d\u2019un espace o\u00f9 votre ressenti est entendu et respect\u00e9\u202f? R\u00e9servez une consultation, je suis l\u00e0 pour \u00e9clairer ce que vous portez en vous.</p></div>'
    },
    'lithotherapie': {
      category: 'Lithoth\u00e9rapie',
      title: 'La lithoth\u00e9rapie\u00a0: quand les pierres accompagnent votre chemin de vie',
      date: '12 mars 2026',
      content: '<h2>Qu\u2019est-ce que la lithoth\u00e9rapie\u202f?</h2>' +
        '<p>La lithoth\u00e9rapie est une pratique ancestrale qui utilise les <strong>pierres et cristaux</strong> comme supports de mieux-\u00eatre. Son principe repose sur l\u2019id\u00e9e que chaque min\u00e9ral poss\u00e8de une vibration propre, une \u00e9nergie particuli\u00e8re li\u00e9e \u00e0 sa composition chimique, sa couleur et sa structure cristalline.</p>' +
        '<p>Utilis\u00e9e depuis la nuit des temps \u2014 en \u00c9gypte ancienne, en Inde, en Chine, dans les traditions am\u00e9rindiennes \u2014 la lithoth\u00e9rapie conna\u00eet aujourd\u2019hui un renouveau profond. De plus en plus de personnes se tournent vers les pierres pour accompagner un travail sur soi, compl\u00e9ter une d\u00e9marche de d\u00e9veloppement personnel ou simplement retrouver un sentiment d\u2019\u00e9quilibre au quotidien.</p>' +
        '<p>Il est important de pr\u00e9ciser que la lithoth\u00e9rapie ne se substitue en aucun cas \u00e0 un traitement m\u00e9dical. C\u2019est un <strong>compl\u00e9ment</strong>, un soutien \u00e9nerg\u00e9tique et symbolique pour celles et ceux qui y sont sensibles.</p>' +
        '<h2>Les pierres essentielles et leurs vertus</h2>' +
        '<p>Voici les pierres que je recommande le plus souvent, que j\u2019utilise moi-m\u00eame dans ma pratique de voyance et que je conseille r\u00e9guli\u00e8rement en consultation\u00a0:</p>' +
        '<p><strong>Am\u00e9thyste</strong> \u2014 La pierre de l\u2019intuition et de la s\u00e9r\u00e9nit\u00e9. Elle apaise le mental, favorise la m\u00e9ditation et ouvre le troisi\u00e8me \u0153il. C\u2019est ma compagne de chaque tirage de cartes. Plac\u00e9e sur la table de nuit, elle favorise un sommeil paisible et des r\u00eaves \u00e9clairants.</p>' +
        '<p><strong>Quartz rose</strong> \u2014 La pierre du c\u0153ur par excellence. Elle incarne l\u2019amour inconditionnel, la douceur et la compassion. Id\u00e9ale pour apaiser les blessures \u00e9motionnelles, elle aide \u00e0 s\u2019ouvrir \u00e0 l\u2019amour de soi et des autres. Indispensable quand on traverse une p\u00e9riode de rupture ou de doute affectif.</p>' +
        '<p><strong>Tourmaline noire</strong> \u2014 La reine de la protection \u00e9nerg\u00e9tique. Elle absorbe les \u00e9nergies n\u00e9gatives comme une \u00e9ponge et cr\u00e9e un v\u00e9ritable bouclier autour de vous. Je la recommande syst\u00e9matiquement aux personnes hypersensibles ou en contact r\u00e9gulier avec des personnalites \u00e9puisantes.</p>' +
        '<p><strong>Citrine</strong> \u2014 La pierre de la joie et de l\u2019abondance. Elle rayonne d\u2019une \u00e9nergie solaire qui redonne confiance et optimisme. Elle aide \u00e0 manifester ses projets et \u00e0 attirer la prosp\u00e9rit\u00e9. Excellente pour accompagner une p\u00e9riode de nouveau d\u00e9part.</p>' +
        '<p><strong>Lapis-lazuli</strong> \u2014 La pierre de la v\u00e9rit\u00e9 et de la communication. Elle stimule la clairvoyance, aide \u00e0 exprimer sa v\u00e9rit\u00e9 int\u00e9rieure et renforce l\u2019honn\u00eatet\u00e9 envers soi-m\u00eame. Tr\u00e8s utile pour ceux qui ont du mal \u00e0 poser des limites ou \u00e0 dire non.</p>' +
        '<p><strong>Labradorite</strong> \u2014 La pierre des th\u00e9rapeutes et des empathes. Elle agit comme un bouclier \u00e9nerg\u00e9tique qui prot\u00e8ge de l\u2019absorption des \u00e9motions d\u2019autrui. C\u2019est la pierre que je porte le plus souvent sur moi pendant les consultations.</p>' +
        '<p><strong>\u0152il-de-tigre</strong> \u2014 La pierre du courage et de l\u2019ancrage. Elle renvoie les mauvaises intentions comme un miroir, renforce la volont\u00e9 et aide \u00e0 prendre des d\u00e9cisions avec assurance. Parfaite pour les p\u00e9riodes de doute ou de vuln\u00e9rabilit\u00e9.</p>' +
        '<p><strong>Quartz clair (cristal de roche)</strong> \u2014 Le ma\u00eetre cristal, l\u2019amplificateur universel. Il renforce l\u2019\u00e9nergie de toutes les autres pierres et clarifie les intentions. C\u2019est la pierre id\u00e9ale pour accompagner la m\u00e9ditation et la visualisation.</p>' +
        '<h2>Comment choisir sa pierre\u202f?</h2>' +
        '<p>La r\u00e8gle la plus importante en lithoth\u00e9rapie est simple\u00a0: <strong>laissez-vous guider par votre intuition</strong>. La pierre qui vous attire est celle dont vous avez besoin. Ce n\u2019est pas un hasard si votre regard se pose toujours sur la m\u00eame am\u00e9thyste, ou si vous ressentez une chaleur en tenant un quartz rose.</p>' +
        '<p>Quelques conseils pratiques\u00a0:</p>' +
        '<ul>' +
        '<li>En boutique, prenez le temps de <strong>toucher les pierres</strong>. Celle qui vous attire, qui vous procure une sensation agr\u00e9able, est la bonne</li>' +
        '<li>Ne vous fiez pas uniquement aux \u00ab propri\u00e9t\u00e9s \u00bb list\u00e9es dans les livres. Votre ressenti personnel prime toujours</li>' +
        '<li>Une pierre peut vous appeler \u00e0 un moment pr\u00e9cis de votre vie, puis ne plus r\u00e9sonner quelques mois plus tard. C\u2019est normal\u00a0: vos besoins \u00e9voluent</li>' +
        '<li>\u00c9vitez d\u2019acheter des pierres sur Internet sans les avoir vues \u2014 la connexion se fait par le toucher et le regard</li>' +
        '</ul>' +
        '<h2>Purifier et recharger ses pierres</h2>' +
        '<p>Les pierres absorbent les \u00e9nergies. Il est donc essentiel de les <strong>purifier r\u00e9guli\u00e8rement</strong> et de les <strong>recharger</strong> pour qu\u2019elles conservent toute leur puissance.</p>' +
        '<p><strong>Purification\u00a0:</strong></p>' +
        '<ul>' +
        '<li><strong>Eau claire</strong> \u2014 Passez la pierre sous l\u2019eau courante pendant quelques minutes (attention\u00a0: certaines pierres comme la s\u00e9l\u00e9nite ou la pyrite ne supportent pas l\u2019eau)</li>' +
        '<li><strong>Fum\u00e9e de sauge ou palo santo</strong> \u2014 M\u00e9thode douce et universelle, adapt\u00e9e \u00e0 toutes les pierres</li>' +
        '<li><strong>Sel</strong> \u2014 Posez la pierre sur un lit de gros sel pendant quelques heures (m\u00e9thode plus intense, \u00e0 utiliser avec pr\u00e9caution)</li>' +
        '</ul>' +
        '<p><strong>Rechargement\u00a0:</strong></p>' +
        '<ul>' +
        '<li><strong>Lumi\u00e8re de la lune</strong> \u2014 Posez vos pierres sur le rebord d\u2019une fen\u00eatre une nuit de pleine lune. C\u2019est la m\u00e9thode la plus douce et la plus universelle</li>' +
        '<li><strong>Lumi\u00e8re du soleil</strong> \u2014 Quelques heures au soleil matinal pour les pierres chaudes (citrine, \u0153il-de-tigre, cornaline). Attention\u00a0: l\u2019am\u00e9thyste et le quartz rose p\u00e2lissent au soleil</li>' +
        '<li><strong>G\u00e9ode de quartz ou d\u2019am\u00e9thyste</strong> \u2014 Posez vos pierres dedans pour un rechargement en douceur</li>' +
        '</ul>' +
        '<h2>Int\u00e9grer les pierres au quotidien</h2>' +
        '<p>La lithoth\u00e9rapie ne se limite pas \u00e0 poser une pierre sur une \u00e9tag\u00e8re. Voici des mani\u00e8res concr\u00e8tes de les int\u00e9grer \u00e0 votre vie\u00a0:</p>' +
        '<ul>' +
        '<li><strong>Dans votre poche</strong> \u2014 Gardez une tourmaline noire ou un \u0153il-de-tigre sur vous pour les journ\u00e9es difficiles</li>' +
        '<li><strong>Sur votre table de nuit</strong> \u2014 Am\u00e9thyste pour un sommeil paisible, s\u00e9l\u00e9nite pour purifier l\u2019espace</li>' +
        '<li><strong>Pendant la m\u00e9ditation</strong> \u2014 Tenez un cristal de roche dans la main ou posez-le devant vous pour amplifier votre intention</li>' +
        '<li><strong>Sur votre bureau</strong> \u2014 Citrine pour la cr\u00e9ativit\u00e9 et la concentration, fluorite pour la clart\u00e9 mentale</li>' +
        '<li><strong>En bijou</strong> \u2014 Bracelet, pendentif ou bague\u00a0: porter la pierre au contact de la peau renforce son action</li>' +
        '</ul>' +
        '<h2>Lithoth\u00e9rapie et voyance\u00a0: un duo puissant</h2>' +
        '<p>Dans ma pratique, les pierres sont des alli\u00e9es pr\u00e9cieuses. Elles m\u2019aident \u00e0 <strong>cr\u00e9er un espace sacr\u00e9</strong> pour les consultations, \u00e0 aff\u00fbter mon intuition et \u00e0 prot\u00e9ger l\u2019\u00e9nergie de l\u2019\u00e9change. Il m\u2019arrive souvent de recommander une pierre sp\u00e9cifique \u00e0 la fin d\u2019une consultation, en lien avec ce que les cartes ont r\u00e9v\u00e9l\u00e9.</p>' +
        '<p>Les pierres ne remplacent pas la guidance des cartes, et les cartes ne remplacent pas les pierres. Ensemble, elles offrent un accompagnement \u00e0 la fois subtil et concret\u00a0: les cartes \u00e9clairent le chemin, et les pierres vous soutiennent en le parcourant.</p>' +
        '<p>Si vous \u00eates curieux(se) de d\u00e9couvrir quelle pierre vous accompagnerait le mieux en ce moment, n\u2019h\u00e9sitez pas \u00e0 en parler lors de votre prochaine consultation. Ensemble, nous trouverons la pierre qui r\u00e9sonne avec votre \u00e9nergie du moment.</p>' +
        '<div class="blog-article__cta"><p>Envie de savoir quelle pierre vous correspond\u202f? Parlons-en lors d\u2019une consultation pour trouver votre alli\u00e9e min\u00e9rale.</p></div>'
    },
    mediumnite: {
      category: 'M\u00e9diumnit\u00e9',
      title: 'La m\u00e9diumnit\u00e9\u00a0: quand l\u2019invisible se r\u00e9v\u00e8le',
      date: '23 mars 2026',
      content: '<h2>Qu\u2019est-ce que la m\u00e9diumnit\u00e9\u202f?</h2>' +
        '<p>La m\u00e9diumnit\u00e9 est la capacit\u00e9 de percevoir des informations, des \u00e9nergies ou des pr\u00e9sences qui \u00e9chappent aux cinq sens habituels. Le mot \u00ab\u00a0m\u00e9dium\u00a0\u00bb vient du latin <em>medium</em>, qui signifie \u00ab\u00a0milieu\u00a0\u00bb, \u00ab\u00a0interm\u00e9diaire\u00a0\u00bb. Un m\u00e9dium est litt\u00e9ralement un pont entre le monde visible et l\u2019invisible.</p>' +
        '<p>Contrairement \u00e0 certaines id\u00e9es re\u00e7ues, la m\u00e9diumnit\u00e9 n\u2019est pas r\u00e9serv\u00e9e \u00e0 une \u00e9lite. <strong>Nous poss\u00e9dons tous, \u00e0 des degr\u00e9s divers, une sensibilit\u00e9 subtile.</strong> Certains la ressentent d\u00e8s l\u2019enfance, d\u2019autres la d\u00e9couvrent \u00e0 l\u2019\u00e2ge adulte, souvent \u00e0 la suite d\u2019un \u00e9v\u00e9nement de vie marquant.</p>' +
        '<h2>Les diff\u00e9rentes formes de m\u00e9diumnit\u00e9</h2>' +
        '<p>La m\u00e9diumnit\u00e9 ne se manifeste pas de la m\u00eame fa\u00e7on chez tout le monde. Voici les principales formes\u00a0:</p>' +
        '<ul>' +
        '<li><strong>Clairvoyance\u00a0:</strong> percevoir des images, des sc\u00e8nes ou des symboles par l\u2019\u0153il int\u00e9rieur. C\u2019est souvent sous forme de flashs ou de visions.</li>' +
        '<li><strong>Clairaudience\u00a0:</strong> entendre des mots, des phrases ou des sons qui ne proviennent pas du monde physique. Une petite voix int\u00e9rieure, distincte de la pens\u00e9e.</li>' +
        '<li><strong>Clairsentience\u00a0:</strong> ressentir dans son corps les \u00e9motions ou les sensations d\u2019autrui. C\u2019est la forme la plus r\u00e9pandue, souvent confondue avec l\u2019hypersensibilit\u00e9.</li>' +
        '<li><strong>Claircognizance\u00a0:</strong> savoir quelque chose sans pouvoir l\u2019expliquer rationnellement. Une certitude int\u00e9rieure qui surgit spontan\u00e9ment.</li>' +
        '</ul>' +
        '<p>Dans ma pratique, je fais appel \u00e0 plusieurs de ces canaux simultan\u00e9ment. Les cartes servent de support, mais c\u2019est le ressenti qui guide v\u00e9ritablement la consultation.</p>' +
        '<h2>Signes que vous avez une sensibilit\u00e9 m\u00e9diumnique</h2>' +
        '<p>Certaines exp\u00e9riences peuvent indiquer une m\u00e9diumnit\u00e9 latente\u00a0:</p>' +
        '<ul>' +
        '<li>Vous ressentez l\u2019atmosph\u00e8re d\u2019un lieu d\u00e8s que vous y entrez</li>' +
        '<li>Vous captez les \u00e9motions des autres, parfois au point de les confondre avec les v\u00f4tres</li>' +
        '<li>Vous avez des r\u00eaves pr\u00e9monitoires ou tr\u00e8s symboliques</li>' +
        '<li>Vous ressentez des pr\u00e9sences invisibles, surtout dans certains lieux</li>' +
        '<li>Vous avez une intuition tr\u00e8s d\u00e9velopp\u00e9e qui se confirme souvent</li>' +
        '<li>Enfant, vous aviez des amis \u00ab\u00a0imaginaires\u00a0\u00bb ou vous perceviez des choses que les adultes ne voyaient pas</li>' +
        '</ul>' +
        '<p>Si vous vous reconnaissez dans plusieurs de ces signes, il est possible que votre sensibilit\u00e9 m\u00e9diumnique demande \u00e0 \u00eatre reconnue et accompagn\u00e9e.</p>' +
        '<h2>Comment d\u00e9velopper sa m\u00e9diumnit\u00e9 en toute s\u00e9curit\u00e9</h2>' +
        '<p>D\u00e9velopper sa m\u00e9diumnit\u00e9 n\u2019est pas un jeu. C\u2019est un chemin qui demande <strong>discipline, humilit\u00e9 et ancrage</strong>. Voici quelques fondamentaux\u00a0:</p>' +
        '<ul>' +
        '<li><strong>La m\u00e9ditation\u00a0:</strong> c\u2019est la base. En calmant le mental, on permet aux perceptions subtiles de se manifester.</li>' +
        '<li><strong>L\u2019ancrage\u00a0:</strong> rester connect\u00e9 \u00e0 la terre est essentiel pour ne pas se perdre dans les perceptions. Marcher pieds nus, jardiner, respirer consciemment.</li>' +
        '<li><strong>La protection \u00e9nerg\u00e9tique\u00a0:</strong> avant toute pratique, prot\u00e9gez votre espace et votre \u00e9nergie. La visualisation d\u2019une bulle de lumi\u00e8re blanche est un exercice simple et puissant.</li>' +
        '<li><strong>Le journal de bord\u00a0:</strong> notez vos ressentis, vos r\u00eaves, vos impressions. Avec le temps, des sch\u00e9mas se r\u00e9v\u00e8lent.</li>' +
        '<li><strong>L\u2019accompagnement\u00a0:</strong> ne restez pas seul(e) avec vos perceptions. Un m\u00e9dium exp\u00e9riment\u00e9 peut vous guider et vous aider \u00e0 comprendre ce que vous vivez.</li>' +
        '</ul>' +
        '<h2>M\u00e9diumnit\u00e9 et voyance\u00a0: quelle diff\u00e9rence\u202f?</h2>' +
        '<p>On confond souvent les deux, mais ils sont compl\u00e9mentaires\u00a0:</p>' +
        '<ul>' +
        '<li><strong>La voyance</strong> consiste \u00e0 percevoir des \u00e9v\u00e9nements pass\u00e9s, pr\u00e9sents ou futurs \u2014 souvent \u00e0 l\u2019aide de supports (cartes, pendule, boule de cristal).</li>' +
        '<li><strong>La m\u00e9diumnit\u00e9</strong> va au-del\u00e0\u00a0: c\u2019est la connexion directe avec des \u00e9nergies, des entit\u00e9s ou des \u00e2mes d\u00e9sincarnes. Le m\u00e9dium re\u00e7oit des messages qui ne viennent pas de sa propre pens\u00e9e.</li>' +
        '</ul>' +
        '<p>Dans mes consultations, je combine les deux. Les cartes ouvrent le dialogue, et la m\u00e9diumnit\u00e9 apporte la profondeur et la pr\u00e9cision qui touchent au c\u0153ur de ce que vous traversez.</p>' +
        '<h2>Un don au service de l\u2019autre</h2>' +
        '<p>La m\u00e9diumnit\u00e9 n\u2019est pas un pouvoir, c\u2019est une <strong>responsabilit\u00e9</strong>. Recevoir des messages, c\u2019est accepter de les transmettre avec justesse, bienveillance et honnetet\u00e9 \u2014 m\u00eame quand ils sont d\u00e9licats \u00e0 entendre.</p>' +
        '<p>Ce qui me guide dans chaque consultation, c\u2019est le respect de votre libre arbitre. Les messages que je re\u00e7ois ne sont jamais des ordres. Ce sont des \u00e9clairages, des pistes, des confirmations. <strong>C\u2019est toujours vous qui d\u00e9cidez.</strong></p>' +
        '<p>Si vous ressentez un appel vers la m\u00e9diumnit\u00e9, que ce soit pour comprendre vos propres capacit\u00e9s ou pour recevoir des messages, sachez que cet espace est fait pour vous accueillir sans jugement.</p>' +
        '<div class="blog-article__cta"><p>Vous souhaitez explorer votre sensibilit\u00e9 m\u00e9diumnique ou recevoir des messages de guidance\u202f? R\u00e9servez une consultation, je serai honor\u00e9 de vous accompagner.</p></div>'
    },
    reflexologie: {
      category: 'R\u00e9flexologie',
      title: 'La r\u00e9flexologie plantaire\u00a0: quand vos pieds racontent votre corps',
      date: '24 mars 2026',
      content: '<h2>Une pratique mill\u00e9naire au service du bien-\u00eatre</h2>' +
        '<p>La r\u00e9flexologie plantaire est une technique de soin naturelle qui repose sur un principe simple mais puissant\u00a0: <strong>chaque zone du pied correspond \u00e0 un organe, une glande ou une partie du corps</strong>. En stimulant ces zones par des pressions douces et pr\u00e9cises, le r\u00e9flexologue favorise la d\u00e9tente profonde et accompagne le processus naturel d\u2019auto-r\u00e9gulation du corps.</p>' +
        '<p>Pratiqu\u00e9e depuis des mill\u00e9naires en Chine, en \u00c9gypte et dans les traditions am\u00e9rindiennes, la r\u00e9flexologie conna\u00eet aujourd\u2019hui un renouveau remarquable. Elle s\u2019inscrit dans une approche globale de la sant\u00e9, o\u00f9 le corps est consid\u00e9r\u00e9 comme un tout interconnect\u00e9.</p>' +
        '<h2>Comment se d\u00e9roule une s\u00e9ance\u202f?</h2>' +
        '<p>La s\u00e9ance commence par un temps d\u2019\u00e9change pour comprendre vos besoins et votre \u00e9tat g\u00e9n\u00e9ral. Ensuite, install\u00e9(e) confortablement, vous n\u2019avez qu\u2019\u00e0 vous laisser guider.</p>' +
        '<p>Le r\u00e9flexologue travaille sur l\u2019ensemble de la vo\u00fbte plantaire, en insistant sur les zones qui pr\u00e9sentent des tensions ou des d\u00e9s\u00e9quilibres. Chaque pression est adapt\u00e9e \u00e0 votre sensibilit\u00e9. La s\u00e9ance dure g\u00e9n\u00e9ralement entre 45 minutes et 1 heure.</p>' +
        '<h2>Les bienfaits de la r\u00e9flexologie</h2>' +
        '<ul>' +
        '<li><strong>R\u00e9duction du stress et de l\u2019anxi\u00e9t\u00e9\u00a0:</strong> la stimulation des zones r\u00e9flexes active le syst\u00e8me nerveux parasympathique, favorisant un \u00e9tat de relaxation profonde.</li>' +
        '<li><strong>Soulagement des tensions musculaires\u00a0:</strong> les zones de crispation du corps se rel\u00e2chent progressivement au fil de la s\u00e9ance.</li>' +
        '<li><strong>Am\u00e9lioration de la circulation sanguine\u00a0:</strong> les pressions r\u00e9p\u00e9t\u00e9es stimulent le flux sanguin et lymphatique.</li>' +
        '<li><strong>Meilleur sommeil\u00a0:</strong> beaucoup de personnes rapportent un sommeil plus r\u00e9parateur apr\u00e8s une s\u00e9ance.</li>' +
        '<li><strong>R\u00e9\u00e9quilibrage \u00e9nerg\u00e9tique\u00a0:</strong> en travaillant sur les m\u00e9ridiens, la r\u00e9flexologie aide \u00e0 r\u00e9harmoniser la circulation de l\u2019\u00e9nergie dans le corps.</li>' +
        '</ul>' +
        '<h2>R\u00e9flexologie et accompagnement spirituel</h2>' +
        '<p>Dans ma pratique, je consid\u00e8re la r\u00e9flexologie comme un <strong>compl\u00e9ment naturel</strong> \u00e0 la guidance intuitive. Le corps porte en lui les traces de nos \u00e9motions, de nos blocages et de notre histoire. En lib\u00e9rant les tensions physiques, on cr\u00e9e un espace int\u00e9rieur plus clair, plus r\u00e9ceptif aux messages de l\u2019\u00e2me.</p>' +
        '<p>C\u2019est pourquoi je propose cette approche en collaboration avec <strong>Christine Foucault</strong>, r\u00e9flexologue exp\u00e9riment\u00e9e \u00e0 proximit\u00e9 d\u2019Orl\u00e9ans. Son savoir-faire et sa douceur en font une alli\u00e9e pr\u00e9cieuse pour tous ceux qui cherchent \u00e0 prendre soin d\u2019eux en profondeur.</p>' +
        '<h2>Pour qui\u202f?</h2>' +
        '<p>La r\u00e9flexologie s\u2019adresse \u00e0 tous\u00a0: adultes, personnes \u00e2g\u00e9es, et m\u00eame les enfants. Elle est particuli\u00e8rement indiqu\u00e9e pour\u00a0:</p>' +
        '<ul>' +
        '<li>Les personnes stress\u00e9es ou surmen\u00e9es</li>' +
        '<li>Celles qui souffrent de troubles du sommeil</li>' +
        '<li>Les personnes en p\u00e9riode de transition ou de changement</li>' +
        '<li>Tous ceux qui souhaitent simplement se reconnecter \u00e0 leur corps</li>' +
        '</ul>' +
        '<p>Il est important de noter que la r\u00e9flexologie ne se substitue pas \u00e0 un traitement m\u00e9dical. C\u2019est un accompagnement, un soutien qui s\u2019inscrit dans une d\u00e9marche globale de mieux-\u00eatre.</p>' +
        '<div class="blog-article__cta"><p>Envie de d\u00e9couvrir la r\u00e9flexologie plantaire\u202f? Prenez rendez-vous avec Christine Foucault depuis la section Th\u00e9rapie de notre site.</p></div>'
    }
  };

  // --- Dernières nouveautés (Accueil) — Toutes rubriques ---
  window.__populateNouveautes = async function populateNouveautes() {
    var grid = document.getElementById('nouveautes-grid');
    if (!grid) return;

    var pinnedItems = window.__pinnedItems || await loadPinsFromSupabase();
    var isAdmin = window.__isAdmin || false;
    function isItemPinned(slug) { return pinnedItems.indexOf(slug) !== -1; }

    var items = [];
    var moisFr = {'janvier':0,'f\u00e9vrier':1,'mars':2,'avril':3,'mai':4,'juin':5,'juillet':6,'ao\u00fbt':7,'septembre':8,'octobre':9,'novembre':10,'d\u00e9cembre':11};
    function parseDate(str) {
      var parts = str.trim().split(' ');
      if (parts.length !== 3) return new Date(0);
      return new Date(parseInt(parts[2]), moisFr[parts[1].toLowerCase()] || 0, parseInt(parts[0]));
    }

    // Ic\u00f4nes SVG par type
    var icons = {
      blog: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
      service: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
      therapie: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      boutique: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
    };

    // 1. ARTICLES DE BLOG
    document.querySelectorAll('.blog-card[data-article]').forEach(function(card) {
      var slug = card.getAttribute('data-article');
      var img = card.querySelector('.blog-card__image img');
      var cat = card.querySelector('.blog-card__category');
      var title = card.querySelector('.blog-card__title');
      var excerpt = card.querySelector('.blog-card__excerpt');
      var date = card.querySelector('.blog-card__date');
      if (title && date) {
        items.push({
          type: 'blog', slug: slug,
          pinned: isItemPinned(slug),
          img: img ? img.getAttribute('src') : '',
          imgAlt: img ? img.getAttribute('alt') : '',
          category: cat ? cat.textContent : 'Blog',
          title: title.textContent,
          excerpt: excerpt ? excerpt.textContent : '',
          dateStr: date.textContent,
          dateObj: parseDate(date.textContent),
          price: null,
          navTarget: 'blog'
        });
      }
    });

    // 2. SERVICES (consultations)
    document.querySelectorAll('#services .service-card').forEach(function(card) {
      var h3 = card.querySelector('h3');
      var p = card.querySelector('.service-card__content > p');
      var img = card.querySelector('.service-card__image img');
      var price = card.querySelector('.service-card__price');
      if (h3) {
        var slug = 'svc-' + (h3.textContent || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
        items.push({
          type: 'service', slug: slug,
          pinned: isItemPinned(slug),
          img: img ? img.getAttribute('src') : 'services-tarot.png',
          imgAlt: h3.textContent,
          category: 'Consultation',
          title: h3.textContent,
          excerpt: p ? p.textContent.substring(0, 120) + '\u2026' : '',
          dateStr: 'Disponible',
          dateObj: new Date(2026, 2, 20),
          price: price ? price.textContent.trim() : null,
          navTarget: 'services'
        });
      }
    });

    // 3. TH\u00c9RAPIE (soins)
    document.querySelectorAll('#therapie .service-card').forEach(function(card) {
      var h3 = card.querySelector('h3');
      var p = card.querySelector('.service-card__content > p');
      var img = card.querySelector('.service-card__image img');
      if (h3) {
        var slug = 'thp-' + (h3.textContent || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
        items.push({
          type: 'therapie', slug: slug,
          pinned: isItemPinned(slug),
          img: img ? img.getAttribute('src') : 'crystals-nature.png',
          imgAlt: h3.textContent,
          category: 'Th\u00e9rapie',
          title: h3.textContent,
          excerpt: p ? p.textContent.substring(0, 120) + '\u2026' : '',
          dateStr: '\u00c0 venir',
          dateObj: new Date(2026, 2, 18),
          price: null,
          navTarget: 'therapie'
        });
      }
    });

    // 4. BOUTIQUE — dynamic products from Supabase + fallback
    var boutiqueProductCards = document.querySelectorAll('.boutique-product-card[data-product-slug]');
    if (boutiqueProductCards.length > 0) {
      boutiqueProductCards.forEach(function(card) {
        var pslug = card.getAttribute('data-product-slug');
        var pimg = card.querySelector('.boutique-product-card__image img');
        var pcat = card.querySelector('.boutique-product-card__category');
        var pname = card.querySelector('.boutique-product-card__name');
        var pdesc = card.querySelector('.boutique-product-card__desc');
        var pprice = card.querySelector('.boutique-product-card__price');
        if (pname) {
          items.push({
            type: 'boutique', slug: 'btq-' + pslug,
            pinned: isItemPinned('btq-' + pslug),
            img: pimg ? pimg.getAttribute('src') : 'crystals-nature.png',
            imgAlt: pimg ? pimg.getAttribute('alt') : '',
            category: pcat ? pcat.textContent : 'Boutique',
            title: pname.textContent,
            excerpt: pdesc ? pdesc.textContent.substring(0, 120) : '',
            dateStr: pprice ? pprice.textContent.trim() : '',
            dateObj: new Date(),
            price: pprice ? pprice.textContent.trim() : null,
            navTarget: 'boutique'
          });
        }
      });
    } else {
      var boutiquePage = document.getElementById('boutique');
      if (boutiquePage) {
        var boutiqueComing = boutiquePage.querySelector('.boutique-coming__title');
        if (boutiqueComing) {
          items.push({
            type: 'boutique', slug: 'boutique-coming',
            pinned: isItemPinned('boutique-coming'),
            img: 'crystals-nature.png',
            imgAlt: 'Boutique Lumi\u00e8re Int\u00e9rieure',
            category: 'Boutique',
            title: 'Boutique bient\u00f4t disponible',
            excerpt: 'Cristaux, encens naturels, supports de m\u00e9ditation\u2026 Inscrivez-vous pour \u00eatre pr\u00e9venu(e) d\u00e8s l\u2019ouverture.',
            dateStr: 'Bient\u00f4t',
            dateObj: new Date(2026, 2, 15),
            price: null,
            navTarget: 'boutique'
          });
        }
      }
    }

    // Deduplicate items by slug
    var seenSlugs = {};
    items = items.filter(function(item) {
      if (seenSlugs[item.slug]) return false;
      seenSlugs[item.slug] = true;
      return true;
    });

    // Trier par date d\u00e9croissante
    items.sort(function(a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.dateObj - a.dateObj;
    });

    // S\u00e9lection intelligente : garantir un mix de toutes les rubriques
    var display = [];
    var byType = {};
    items.forEach(function(item) {
      if (!byType[item.type]) byType[item.type] = [];
      byType[item.type].push(item);
    });

    // 1. Prendre le plus r\u00e9cent de chaque type d'abord
    var types = ['blog', 'service', 'therapie', 'boutique'];
    types.forEach(function(t) {
      if (byType[t] && byType[t].length > 0) {
        display.push(byType[t][0]);
        byType[t] = byType[t].slice(1);
      }
    });

    // 2. Compl\u00e9ter jusqu'\u00e0 9 avec les plus r\u00e9cents restants (tous types)
    var remaining = [];
    types.forEach(function(t) {
      if (byType[t]) remaining = remaining.concat(byType[t]);
    });
    remaining.sort(function(a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.dateObj - a.dateObj;
    });
    var i = 0;
    while (display.length < 9 && i < remaining.length) {
      display.push(remaining[i]);
      i++;
    }

    // Retrier le display final : épinglés d'abord, puis par date
    display.sort(function(a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.dateObj - a.dateObj;
    });

    // G\u00e9n\u00e9rer les cartes
    display.forEach(function(item) {
      var card = document.createElement('div');
      card.className = 'nouveautes-card fade-in';
      card.setAttribute('data-type', item.type);

      var metaRight = item.price
        ? '<span class="nouveautes-card__price">' + item.price + '</span>'
        : '<span>' + item.dateStr + '</span>';

      card.innerHTML =
        '<div class="nouveautes-card__image" style="position:relative">' +
          '<span class="nouveautes-card__badge nouveautes-card__badge--' + item.type + '">' + icons[item.type] + ' ' + item.category + '</span>' +
          (isAdmin ? '<button class="pin-toggle-btn' + (item.pinned ? ' pin-toggle-btn--active' : '') + '" data-pin-slug="' + item.slug + '" data-pin-section="' + item.navTarget + '" title="\u00c9pingler">\ud83d\udccc</button>' : '') +
          (isAdmin && item.pinned ? '<span class="pinned-badge">\ud83d\udccc \u00c9pingl\u00e9</span>' : '') +
          '<img src="' + item.img + '" alt="' + item.imgAlt + '" width="640" height="400" loading="lazy">' +
        '</div>' +
        '<div class="nouveautes-card__body">' +
          '<p class="nouveautes-card__category">' + item.category + '</p>' +
          '<h3 class="nouveautes-card__title">' + item.title + '</h3>' +
          '<p class="nouveautes-card__excerpt">' + item.excerpt + '</p>' +
          '<div class="nouveautes-card__meta">' +
            '<span>' + item.type.charAt(0).toUpperCase() + item.type.slice(1) + '</span>' +
            metaRight +
          '</div>' +
        '</div>';

      card.addEventListener('click', function() {
        document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
        var target = document.getElementById(item.navTarget);
        if (target) target.classList.add('active');
        document.querySelectorAll('[data-nav]').forEach(function(n) { n.classList.remove('active'); });
        document.querySelectorAll('[data-nav="' + item.navTarget + '"]').forEach(function(n) { n.classList.add('active'); });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (item.type === 'blog') {
          setTimeout(function() {
            var blogCard = document.querySelector('.blog-card[data-article="' + item.slug + '"]');
            if (blogCard) blogCard.click();
          }, 300);
        }
      });

      grid.appendChild(card);
    });

    // Pin toggle listeners for feed cards (admin only — buttons only exist if admin)
    if (isAdmin) {
      grid.querySelectorAll('.pin-toggle-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var slug = btn.getAttribute('data-pin-slug');
          var index = pinnedItems.indexOf(slug);
          if (index > -1) {
            pinnedItems.splice(index, 1);
            removePinFromSupabase(slug);
          } else {
            pinnedItems.push(slug);
            addPinToSupabase(slug);
          }
          window.__pinnedItems = pinnedItems;
          // Refresh the feed
          if (window.__populateNouveautes) window.__populateNouveautes();
        });
      });
    }

    // Filtres (attach once only)
    if (!window.__nouveautesFiltersInit) {
      window.__nouveautesFiltersInit = true;
      document.querySelectorAll('.nouveautes-filter').forEach(function(btn) {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.nouveautes-filter').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var filter = btn.getAttribute('data-filter');
          var g = document.getElementById('nouveautes-grid');
          if (g) g.querySelectorAll('.nouveautes-card').forEach(function(c) {
            if (filter === 'all' || c.getAttribute('data-type') === filter) {
              c.classList.remove('hidden');
            } else {
              c.classList.add('hidden');
            }
          });
        });
      });
    }
  };
  window.__populateNouveautes();

  // --- Blog Overlay Logic ---
  var overlay = document.getElementById('blog-article-overlay');
  var articleBody = document.getElementById('blog-article-body');
  var closeBtn = overlay ? overlay.querySelector('.blog-overlay__close') : null;
  var backdrop = overlay ? overlay.querySelector('.blog-overlay__backdrop') : null;

  // --- CountAPI base URL (used for both views and likes) ---
  var COUNTAPI_BASE = 'https://countapi.mileshilliard.com/api/v1';

  // --- Likes: Supabase-backed with CountAPI fallback ---
  var likesCache = {};
  var LIKES_PREFIX = 'lumiere-likes-';
  function hasLiked(articleId) {
    try { return safeLocal.getItem('blog_liked_' + articleId) === '1'; }
    catch(e) { return false; }
  }
  function setLiked(articleId, val) {
    try { safeLocal.setItem('blog_liked_' + articleId, val ? '1' : '0'); } catch(e) {}
  }
  function fetchLikes(articleId, callback) {
    // Try Supabase first
    if (supabase) {
      supabase.from('blog_likes').select('count').eq('article_id', articleId).maybeSingle().then(function(result) {
        if (!result.error && result.data && result.data.count !== undefined) {
          likesCache[articleId] = parseInt(result.data.count, 10) || 0;
          if (callback) callback(likesCache[articleId]);
        } else {
          // Fallback to CountAPI
          fetchLikesFromCountAPI(articleId, callback);
        }
      }).catch(function() { fetchLikesFromCountAPI(articleId, callback); });
    } else {
      fetchLikesFromCountAPI(articleId, callback);
    }
  }
  function fetchLikesFromCountAPI(articleId, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', COUNTAPI_BASE + '/get/' + LIKES_PREFIX + articleId);
    xhr.responseType = 'json';
    xhr.timeout = 5000;
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
        if (xhr.response.error) {
          // Key not found — treat as 0
          likesCache[articleId] = 0;
          if (callback) callback(0);
          return;
        }
        if (xhr.response.value !== undefined) {
          var val = parseInt(xhr.response.value, 10) || 0;
          likesCache[articleId] = val;
          if (callback) callback(val);
        } else {
          if (callback) callback(likesCache[articleId] || 0);
        }
      } else {
        if (callback) callback(likesCache[articleId] || 0);
      }
    };
    xhr.onerror = xhr.ontimeout = function() { if (callback) callback(likesCache[articleId] || 0); };
    try { xhr.send(); } catch(e) { if (callback) callback(0); }
  }
  function addLike(articleId, callback) {
    // Increment in Supabase (upsert)
    if (supabase) {
      supabase.rpc('increment_blog_like', { p_article_id: articleId }).then(function(result) {
        if (!result.error && result.data !== undefined) {
          likesCache[articleId] = parseInt(result.data, 10) || (likesCache[articleId] || 0) + 1;
        }
        if (callback) callback(likesCache[articleId] || 0);
      }).catch(function() {
        addLikeCountAPI(articleId, callback);
      });
    } else {
      addLikeCountAPI(articleId, callback);
    }
    // Also hit CountAPI for backwards compatibility
    addLikeCountAPI(articleId, function() {});
  }
  function addLikeCountAPI(articleId, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', COUNTAPI_BASE + '/hit/' + LIKES_PREFIX + articleId);
    xhr.responseType = 'json';
    xhr.timeout = 5000;
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response && xhr.response.value !== undefined) {
        var val = parseInt(xhr.response.value, 10) || 0;
        if (!likesCache[articleId] || val > likesCache[articleId]) likesCache[articleId] = val;
        if (callback) callback(val);
      } else {
        if (callback) callback(likesCache[articleId] || 0);
      }
    };
    xhr.onerror = xhr.ontimeout = function() { if (callback) callback(likesCache[articleId] || 0); };
    try { xhr.send(); } catch(e) { if (callback) callback(0); }
  }
  function getLikes(articleId) {
    return { count: likesCache[articleId] || 0, liked: hasLiked(articleId) };
  }
  function saveLikes(articleId, data) {
    setLiked(articleId, data.liked);
  }
  // --- Views: Supabase-backed with CountAPI fallback ---
  var viewsCache = {};
  var COUNTAPI_PREFIX = 'lumiere-interieure-';
  function fetchViews(articleId, callback) {
    if (supabase) {
      supabase.from('blog_views').select('count').eq('article_id', articleId).maybeSingle().then(function(result) {
        if (!result.error && result.data && result.data.count !== undefined) {
          viewsCache[articleId] = parseInt(result.data.count, 10) || 0;
          if (callback) callback(viewsCache[articleId]);
        } else {
          fetchViewsFromCountAPI(articleId, callback);
        }
      }).catch(function() { fetchViewsFromCountAPI(articleId, callback); });
    } else {
      fetchViewsFromCountAPI(articleId, callback);
    }
  }
  function fetchViewsFromCountAPI(articleId, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', COUNTAPI_BASE + '/get/' + COUNTAPI_PREFIX + articleId);
    xhr.responseType = 'json';
    xhr.timeout = 5000;
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
        if (xhr.response.error) {
          // Key not found — treat as 0
          viewsCache[articleId] = 0;
          if (callback) callback(0);
          return;
        }
        if (xhr.response.value !== undefined) {
          var val = parseInt(xhr.response.value, 10) || 0;
          viewsCache[articleId] = val;
          if (callback) callback(val);
        } else {
          if (callback) callback(viewsCache[articleId] || 0);
        }
      } else {
        if (callback) callback(viewsCache[articleId] || 0);
      }
    };
    xhr.onerror = xhr.ontimeout = function() { if (callback) callback(viewsCache[articleId] || 0); };
    try { xhr.send(); } catch(e) { if (callback) callback(0); }
  }
  function addView(articleId, callback) {
    if (supabase) {
      supabase.rpc('increment_blog_view', { p_article_id: articleId }).then(function(result) {
        if (!result.error && result.data !== undefined) {
          viewsCache[articleId] = parseInt(result.data, 10) || (viewsCache[articleId] || 0) + 1;
        }
        if (callback) callback(viewsCache[articleId] || 0);
      }).catch(function() {
        addViewCountAPI(articleId, callback);
      });
    } else {
      addViewCountAPI(articleId, callback);
    }
    addViewCountAPI(articleId, function() {});
  }
  function addViewCountAPI(articleId, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', COUNTAPI_BASE + '/hit/' + COUNTAPI_PREFIX + articleId);
    xhr.responseType = 'json';
    xhr.timeout = 5000;
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response && xhr.response.value !== undefined) {
        var val = parseInt(xhr.response.value, 10) || 0;
        if (!viewsCache[articleId] || val > viewsCache[articleId]) viewsCache[articleId] = val;
        if (callback) callback(val);
      } else {
        if (callback) callback(viewsCache[articleId] || 0);
      }
    };
    xhr.onerror = xhr.ontimeout = function() { if (callback) callback(viewsCache[articleId] || 0); };
    try { xhr.send(); } catch(e) { if (callback) callback(0); }
  }
  function updateCardStats(articleId) {
    var card = document.querySelector('.blog-card[data-article="' + articleId + '"]');
    if (!card) return;
    var viewEl = card.querySelector('.view-count');
    var heartBtn = card.querySelector('.blog-card__heart');
    var heartCount = card.querySelector('.heart-count');
    var likes = getLikes(articleId);
    if (viewEl && viewsCache[articleId] !== undefined) viewEl.textContent = viewsCache[articleId];
    if (heartCount) heartCount.textContent = likes.count;
    if (heartBtn) {
      if (likes.liked) { heartBtn.classList.add('hearted'); heartBtn.querySelector('svg').setAttribute('fill', 'var(--color-terracotta)'); }
      else { heartBtn.classList.remove('hearted'); heartBtn.querySelector('svg').setAttribute('fill', 'none'); }
    }
  }
  // --- Comments: Supabase-backed with localStorage fallback ---
var commentsCache = {};
function getComments(articleId) {
    return commentsCache[articleId] || [];
  }
  function fetchComments(articleId, callback) {
    if (!supabase) {
      commentsCache[articleId] = getLocalComments(articleId);
      if (callback) callback(commentsCache[articleId]);
      return;
    }
    supabase.from('blog_comments').select('*').eq('article_id', articleId).order('created_at', { ascending: false }).then(function(result) {
      if (result.error || !result.data) {
        commentsCache[articleId] = getLocalComments(articleId);
      } else {
        commentsCache[articleId] = result.data.map(function(row) {
          return { name: row.name, text: row.text, date: row.created_at ? formatDate(new Date(row.created_at)) : '' };
        });
      }
      if (callback) callback(commentsCache[articleId]);
    }).catch(function() {
      commentsCache[articleId] = getLocalComments(articleId);
      if (callback) callback(commentsCache[articleId]);
    });
  }
  function getLocalComments(articleId) {
    try { return JSON.parse(safeLocal.getItem('blog_comments_' + articleId)) || []; }
    catch(e) { return []; }
  }
  function saveComment(articleId, name, text, callback) {
    name = sanitizeForHtml(name);
    text = sanitizeForHtml(text);
    var comment = { name: name, text: text, date: formatDate(new Date()) };
    if (!supabase) {
      var local = getLocalComments(articleId);
      local.unshift(comment);
      try { safeLocal.setItem('blog_comments_' + articleId, JSON.stringify(local)); } catch(e) {}
      commentsCache[articleId] = local;
      if (callback) callback();
      return;
    }
    supabase.from('blog_comments').insert({ article_id: articleId, name: name, text: text }).then(function(result) {
      if (result.error) {
        // Fallback local
        var local = getLocalComments(articleId);
        local.unshift(comment);
        try { safeLocal.setItem('blog_comments_' + articleId, JSON.stringify(local)); } catch(e) {}
        commentsCache[articleId] = local;
      } else {
        fetchComments(articleId, function() {});
      }
      if (callback) callback();
    }).catch(function() {
      var local = getLocalComments(articleId);
      local.unshift(comment);
      try { safeLocal.setItem('blog_comments_' + articleId, JSON.stringify(local)); } catch(e) {}
      commentsCache[articleId] = local;
      if (callback) callback();
    });
  }
  function formatDate(d) {
    var day = d.getDate();
    var months = ['janv.','f\u00e9vr.','mars','avr.','mai','juin','juil.','ao\u00fbt','sept.','oct.','nov.','d\u00e9c.'];
    return day + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }
  function renderComments(articleId, listEl) {
    var comments = getComments(articleId);
    if (comments.length === 0) {
      listEl.innerHTML = '<p class="blog-comments__empty">Soyez le premier \u00e0 laisser un commentaire.</p>';
    } else {
      listEl.innerHTML = comments.map(function(c) {
        return '<div class="blog-comment">' +
          '<div class="blog-comment__header">' +
            '<span class="blog-comment__name">' + sanitizeForHtml(c.name) + '</span>' +
            '<span class="blog-comment__date">' + sanitizeForHtml(c.date) + '</span>' +
          '</div>' +
          '<p class="blog-comment__text">' + sanitizeForHtml(c.text) + '</p>' +
        '</div>';
      }).join('');
    }
  }

  function buildInteractionsHTML(articleId) {
    var likes = getLikes(articleId);
    var likedClass = likes.liked ? ' liked' : '';
    var heartFill = likes.liked ? 'var(--color-terracotta)' : 'none';
    return '<div class="blog-interactions">' +
      '<div class="blog-like">' +
        '<button class="blog-like__btn' + likedClass + '" data-like-article="' + articleId + '">' +
          '<svg class="like-anim" viewBox="0 0 24 24" fill="' + heartFill + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' +
          '</svg>' +
          '<span class="like-count">' + likes.count + '</span>' +
        '</button>' +
        '<span class="blog-overlay__views"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> <span class="overlay-view-count">0</span> vues</span>' +
      '</div>' +
      '<div class="blog-comments">' +
        '<h3 class="blog-comments__title">Commentaires</h3>' +
        '<div class="blog-comments__form">' +
          '<input type="text" class="blog-comments__input" id="comment-name" placeholder="Votre pr\u00e9nom" maxlength="40">' +
          '<textarea class="blog-comments__input" id="comment-text" placeholder="Votre commentaire\u2026" maxlength="500"></textarea>' +
          '<button class="blog-comments__submit" data-comment-article="' + articleId + '">Publier</button>' +
        '</div>' +
        '<div class="blog-comments__list" id="comments-list-' + articleId + '"></div>' +
      '</div>' +
    '</div>';
  }

  function openBlogArticle(articleId) {
    var article = blogArticles[articleId];
    if (!article || !overlay || !articleBody) return;

    // Increment views (shared counter)
    addView(articleId, function() {
      updateCardStats(articleId);
    });

    // Refresh likes from API to avoid stale count
    fetchLikes(articleId, function() {
      updateCardStats(articleId);
      var likeCountEl = articleBody.querySelector('.like-count');
      if (likeCountEl) likeCountEl.textContent = likesCache[articleId] || 0;
    });

    articleBody.innerHTML =
      '<p class="blog-article__category">' + article.category + '</p>' +
      '<h1 class="blog-article__title">' + article.title + '</h1>' +
      '<p class="blog-article__meta">' + article.date + '</p>' +
      article.content +
      buildInteractionsHTML(articleId);

    // Update overlay view count
    fetchViews(articleId, function(count) {
      var viewCountEl = articleBody.querySelector('.overlay-view-count');
      if (viewCountEl) viewCountEl.textContent = count || 0;
    });

    // Fetch and render existing comments
    var listEl = document.getElementById('comments-list-' + articleId);
    if (listEl) {
      fetchComments(articleId, function() {
        renderComments(articleId, listEl);
      });
    }

    // Like button handler
    var likeBtn = articleBody.querySelector('[data-like-article="' + articleId + '"]');
    if (likeBtn) {
      // Set initial state based on whether user already liked
      if (hasLiked(articleId)) {
        likeBtn.classList.add('liked');
        var initSvg = likeBtn.querySelector('svg');
        if (initSvg) initSvg.setAttribute('fill', 'var(--color-terracotta)');
      }
      likeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (hasLiked(articleId)) return; // already liked, do nothing
        setLiked(articleId, true);
        var self = this;
        addLike(articleId, function(newCount) {
          self.querySelector('.like-count').textContent = newCount;
          updateCardStats(articleId);
        });
        // Optimistic UI update
        likesCache[articleId] = (likesCache[articleId] || 0) + 1;
        this.classList.add('liked');
        var svg = this.querySelector('svg');
        svg.setAttribute('fill', 'var(--color-terracotta)');
        svg.classList.remove('like-anim');
        void svg.offsetWidth;
        svg.classList.add('like-anim');
        this.querySelector('.like-count').textContent = likesCache[articleId];
        updateCardStats(articleId);
      });
    }

    // Comment submit handler
    var submitBtn = articleBody.querySelector('[data-comment-article="' + articleId + '"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var nameInput = document.getElementById('comment-name');
        var textInput = document.getElementById('comment-text');
        var name = nameInput.value.trim();
        var text = textInput.value.trim();
        if (!name || !text) {
          if (!name && nameInput) nameInput.style.borderColor = '#e74c3c';
          if (!text && textInput) textInput.style.borderColor = '#e74c3c';
          return;
        }
        if (nameInput) nameInput.style.borderColor = '';
        if (textInput) textInput.style.borderColor = '';
        saveComment(articleId, name, text, function() {
          fetchComments(articleId, function() {
            if (listEl) renderComments(articleId, listEl);
          });
        });
        nameInput.value = '';
        textInput.value = '';
      });
    }

    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    overlay.scrollTop = 0;
  }

  function closeBlogOverlay() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  // Blog card click handlers
  document.querySelectorAll('.blog-card[data-article]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      // Don't open article if clicking the heart button
      if (e.target.closest('.blog-card__heart')) return;
      var articleId = this.getAttribute('data-article');
      openBlogArticle(articleId);
    });
  });

  // Initialize card stats & heart click handlers
  document.querySelectorAll('.blog-card__heart[data-heart]').forEach(function (btn) {
    var articleId = btn.getAttribute('data-heart');
    // Fetch shared view count from API, then update display
    fetchViews(articleId, function() {
      updateCardStats(articleId);
    });
    // Fetch shared like count from API, then update display
    fetchLikes(articleId, function() {
      updateCardStats(articleId);
    });
    // Init likes display (local liked state)
    updateCardStats(articleId);
    // Heart click on card
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (hasLiked(articleId)) return; // already liked, do nothing
      setLiked(articleId, true);
      addLike(articleId, function() {
        updateCardStats(articleId);
      });
      // Optimistic UI update
      likesCache[articleId] = (likesCache[articleId] || 0) + 1;
      updateCardStats(articleId);
      // Sync overlay like button if open
      if (overlay && !overlay.hidden) {
        var overlayBtn = overlay.querySelector('[data-like-article="' + articleId + '"]');
        if (overlayBtn) {
          overlayBtn.classList.add('liked');
          var oSvg = overlayBtn.querySelector('svg');
          if (oSvg) oSvg.setAttribute('fill', 'var(--color-terracotta)');
          var oCount = overlayBtn.querySelector('.like-count');
          if (oCount) oCount.textContent = likesCache[articleId];
        }
      }
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeBlogOverlay);
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeBlogOverlay);
  }

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && !overlay.hidden) {
      closeBlogOverlay();
    }
  });


  document.querySelectorAll('[data-newsletter]').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var prenomInput = form.querySelector('input[name="prenom"]');
      var emailInput = form.querySelector('input[name="email"]');
      var prenom = prenomInput.value.trim();
      var email = emailInput.value.trim();

      if (!prenom || !email) return;

      var successEl = form.parentElement.querySelector('.newsletter-success');
      var submitBtn = form.querySelector('button[type="submit"]');
      var btnOriginalHTML = submitBtn ? submitBtn.innerHTML : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Inscription en cours\u2026';
      }

      function resetBtn() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = btnOriginalHTML;
        }
      }

      function showSuccess(msg) {
        if (successEl) {
          if (msg) successEl.querySelector('p').textContent = msg;
          form.hidden = true;
          successEl.hidden = false;
        } else {
          form.innerHTML = '<p style="color:var(--color-primary);font-weight:500;text-align:center;">' + (msg || 'Merci ' + prenom + ', inscription enregistr\u00e9e\u00a0!') + '</p>';
        }
      }

      var safetyTimer = setTimeout(function() { showSuccess(); }, 12000);

      fetch(BREVO_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/v3/contacts',
          method: 'POST',
          body: {
            email: email,
            attributes: { PRENOM: prenom },
            listIds: [3],
            updateEnabled: true
          }
        })
      })
      .then(function(r) {
        clearTimeout(safetyTimer);
        if (r.status === 201) {
          showSuccess('Merci ' + prenom + '\u00a0! Vous recevrez nos prochaines actualit\u00e9s.');
        } else if (r.status === 204) {
          showSuccess('Merci ' + prenom + '\u00a0! Votre inscription a \u00e9t\u00e9 mise \u00e0 jour.');
        } else {
          r.json().then(function(d) {
            if (d.code === 'duplicate_parameter') {
              showSuccess('Vous \u00eates d\u00e9j\u00e0 inscrit(e)\u00a0! Merci ' + prenom + '.');
            } else {
              showSuccess('Merci ' + prenom + '\u00a0! Inscription enregistr\u00e9e.');
            }
          }).catch(function() { showSuccess(); });
        }
      })
      .catch(function(err) {
        clearTimeout(safetyTimer);
        var msgEl = form.querySelector('.newsletter__msg') || form.parentElement.querySelector('.newsletter__msg');
        if (msgEl) {
          msgEl.textContent = 'Une erreur est survenue. Veuillez réessayer plus tard.';
          msgEl.className = 'newsletter__msg newsletter__msg--error';
          msgEl.hidden = false;
        }
        resetBtn();
      });
    });
  });

  // ========================================
  // AUTHENTIFICATION — Supabase Auth
  // ========================================

  var SUPABASE_URL = 'https://dhbbwzpfwtdtdiuixrmq.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYmJ3enBmd3RkdGRpdWl4cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTY4MTQsImV4cCI6MjA4OTY3MjgxNH0.ysMB2mgIV83NjTI_63WNlkHVul20zu34us-W-wzdyfg';
  var supabase;
  try {
    supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
  } catch(e) {
    console.warn('Supabase non disponible:', e.message);
    supabase = null;
  }

  // --- Safe Supabase wrapper: auto-retry + user feedback on failure ---
  async function safeSupabase(operation, description) {
    var maxRetries = 2;
    for (var attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        var result = await operation();
        if (result && result.error) {
          if (attempt < maxRetries) {
            await new Promise(function(r) { setTimeout(r, 1000 * (attempt + 1)); });
            continue;
          }
          console.error('[Supabase] Erreur ' + description + ':', result.error.message);
          showSaveError(description);
          return result;
        }
        return result;
      } catch(err) {
        if (attempt < maxRetries) {
          await new Promise(function(r) { setTimeout(r, 1000 * (attempt + 1)); });
          continue;
        }
        console.error('[Supabase] Exception ' + description + ':', err.message);
        showSaveError(description);
        return { error: err };
      }
    }
  }

  // --- Traduction des erreurs Supabase Auth ---
  function traduireErreurAuth(msg) {
    var traductions = {
      'missing email or phone': 'Veuillez saisir votre adresse email.',
      'Invalid login credentials': 'Email ou mot de passe incorrect.',
      'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
      'User already registered': 'Un compte existe déjà avec cette adresse email.',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
      'Signup requires a valid password': 'Veuillez saisir un mot de passe valide.',
      'Email rate limit exceeded': 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
      'For security purposes, you can only request this after': 'Pour des raisons de sécurité, veuillez patienter avant de réessayer.'
    };
    for (var key in traductions) {
      if (msg && msg.toLowerCase().indexOf(key.toLowerCase()) !== -1) return traductions[key];
    }
    return msg || 'Une erreur est survenue. Veuillez réessayer.';
  }

  function showSaveError(description) {
    // Show a toast notification for save failures
    var existing = document.querySelector('.save-error-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'save-error-toast';
    toast.innerHTML = '<strong>⚠ Sauvegarde échouée</strong><br><span>' + sanitizeForHtml(description) + '</span><br><small>Vérifiez votre connexion et réessayez.</small>';
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#e74c3c;color:#fff;padding:16px 20px;border-radius:12px;z-index:99999;font-size:0.9rem;max-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:fadeInUp 0.3s ease;cursor:pointer;';
    toast.addEventListener('click', function() { toast.remove(); });
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 8000);
  }

  var navConnexion = document.getElementById('nav-connexion');
  var navCompte = document.getElementById('nav-compte');

  // --- Vérifier l'état de connexion au chargement ---
  async function verifierStatutAuth() {
    if (!supabase) { window.__isAdmin = false; afficherEtatDeconnecte(); return; }
    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        var meta = session.user.user_metadata || {};
        window.__isAdmin = !!(session.user.email === ADMIN_EMAIL);
        afficherEtatConnecte({ prenom: meta.prenom || '', nom: meta.nom || '', email: session.user.email });
      } else {
        window.__isAdmin = false;
        afficherEtatDeconnecte();
      }
    } catch (e) {
      window.__isAdmin = false;
      afficherEtatDeconnecte();
    }
  }

  // Écouter les changements d'état d'auth
  if (supabase) supabase.auth.onAuthStateChange(function (event, session) {
    if (session && session.user) {
      var meta = session.user.user_metadata || {};
      var wasAdmin = window.__isAdmin;
      window.__isAdmin = !!(session.user.email === ADMIN_EMAIL);
      afficherEtatConnecte({ prenom: meta.prenom || '', nom: meta.nom || '', email: session.user.email });
      // Si l'admin vient de se connecter ou si la session est restaurée, recharger la boutique
      if (window.__isAdmin && !wasAdmin) {
        try {
          var prodGrid = document.getElementById('boutique-products-grid');
          if (prodGrid && prodGrid.children.length === 0) {
            initDynamicContent(true);
          }
        } catch(dynErr) { console.warn('[Auth] Rechargement boutique admin:', dynErr); }
      }
      // Charger et fusionner le panier Supabase à la connexion
      try { loadAndMergeCartFromSupabase(); } catch(cartErr) { console.warn('[Auth] Panier merge:', cartErr); }
    } else {
      window.__isAdmin = false;
      afficherEtatDeconnecte();
    }
  });

  // Charger le panier Supabase au chargement de la page si connecté
  verifierStatutAuth().then(function() {
    try { loadAndMergeCartFromSupabase(); } catch(e) { console.warn('[Init] Panier merge:', e); }
  });

  function afficherEtatConnecte(client) {
    if (navConnexion) navConnexion.hidden = true;
    if (navCompte) {
      navCompte.hidden = false;
      navCompte.textContent = window.__isAdmin ? 'Administration' : (client.prenom || 'Mon compte');
    }
    // Afficher/masquer les vues guest/auth
    var guestEl = document.getElementById('compte-guest');
    var authEl = document.getElementById('compte-auth');
    var adminDash = document.getElementById('admin-dashboard');
    if (guestEl) guestEl.hidden = true;
    // If admin, show admin dashboard instead of regular compte-auth
    if (window.__isAdmin && adminDash) {
      if (authEl) authEl.hidden = true;
      adminDash.hidden = false;
      // Widen container for admin — remove narrow constraint
      var narrowContainer = adminDash.closest('.container--narrow');
      if (narrowContainer) {
        narrowContainer.classList.remove('container--narrow');
        narrowContainer.classList.add('container--admin-wide');
      }
      // Load admin dashboard data if on the mon-compte page (fixes refresh losing data)
      var currentPage = location.hash.replace('#', '') || 'accueil';
      if (currentPage === 'mon-compte') {
        chargerDashboardAdmin();
      }
    } else {
      if (adminDash) adminDash.hidden = true;
      if (authEl) authEl.hidden = false;
    }
    // Mettre à jour l'avatar avec les initiales
    var avatar = document.getElementById('compte-avatar');
    if (avatar) {
      var initiales = ((client.prenom || '').charAt(0) + (client.nom || '').charAt(0)).toUpperCase();
      avatar.textContent = initiales || '?';
    }
    // Update admin avatar too
    var adminAvatar = document.getElementById('admin-avatar');
    if (adminAvatar) {
      var adminInitiales = ((client.prenom || '').charAt(0) + (client.nom || '').charAt(0)).toUpperCase();
      adminAvatar.textContent = adminInitiales || 'AD';
    }
  }

  function afficherEtatDeconnecte() {
    if (navConnexion) navConnexion.hidden = false;
    if (navCompte) navCompte.hidden = true;
    // Afficher/masquer les vues guest/auth
    var guestEl = document.getElementById('compte-guest');
    var authEl = document.getElementById('compte-auth');
    var adminDash = document.getElementById('admin-dashboard');
    if (guestEl) guestEl.hidden = false;
    if (authEl) authEl.hidden = true;
    if (adminDash) adminDash.hidden = true;
    // Reset container width
    var adminWide = document.querySelector('#mon-compte .container--admin-wide');
    if (adminWide) {
      adminWide.classList.remove('container--admin-wide');
      adminWide.classList.add('container--narrow');
    }
  }

  // Afficher un message dans un formulaire d'auth
  function afficherMessage(elementId, message, type) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.hidden = false;
    el.className = 'auth-form__message auth-form__message--' + type;
    if (Array.isArray(message)) {
      el.innerHTML = message.join('<br>');
    } else {
      el.textContent = message;
    }
  }

  function cacherMessage(elementId) {
    var el = document.getElementById(elementId);
    if (el) el.hidden = true;
  }

  // --- Boutons afficher/masquer mot de passe ---
  document.querySelectorAll('[data-toggle-pwd]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var inputId = this.getAttribute('data-toggle-pwd');
      var input = document.getElementById(inputId);
      if (!input) return;
      var estVisible = input.type === 'text';
      input.type = estVisible ? 'password' : 'text';
      this.setAttribute('aria-label', estVisible ? 'Afficher le mot de passe' : 'Masquer le mot de passe');
    });
  });

  // --- Formulaire d'inscription ---
  var formInscription = document.getElementById('form-inscription');
  if (formInscription) {
    formInscription.addEventListener('submit', async function (e) {
      e.preventDefault();
      cacherMessage('insc-message');
      var btnSubmit = document.getElementById('btn-inscription');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Création en cours…';

      var prenom = document.getElementById('insc-prenom').value.trim();
      var nom = document.getElementById('insc-nom').value.trim();
      var email = document.getElementById('insc-email').value.trim();
      var motDePasse = document.getElementById('insc-mdp').value;
      var telephone = document.getElementById('insc-tel').value.trim();

      // Validation côté client
      if (!prenom || !nom || !email || !motDePasse) {
        afficherMessage('insc-message', 'Veuillez remplir tous les champs obligatoires.', 'erreur');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Créer mon compte';
        return;
      }
      if (motDePasse.length < 8) {
        afficherMessage('insc-message', 'Le mot de passe doit contenir au moins 8 caractères.', 'erreur');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Créer mon compte';
        return;
      }

      try {
        var { data, error } = await supabase.auth.signUp({
          email: email,
          password: motDePasse,
          options: {
            data: {
              prenom: prenom,
              nom: nom,
              telephone: telephone
            }
          }
        });

        if (error) {
          afficherMessage('insc-message', traduireErreurAuth(error.message), 'erreur');
        } else {
          afficherMessage('insc-message', 'Inscription réussie\u00a0! Bienvenue, ' + prenom + '.', 'succes');
          afficherEtatConnecte({ prenom: prenom, nom: nom, email: email });
          formInscription.reset();

          // Toast de confirmation explicite
          (function () {
            var toast = document.createElement('div');
            toast.className = 'toast-confirmation toast-confirmation--show';
            toast.innerHTML = '<div class="toast-confirmation__icon">\u2714</div>' +
              '<div class="toast-confirmation__body">' +
                '<strong>Compte cr\u00e9\u00e9 avec succ\u00e8s\u00a0!</strong><br>' +
                'Bienvenue ' + prenom + '\u00a0! Votre espace client est pr\u00eat.' +
              '</div>' +
              '<button class="toast-confirmation__close" aria-label="Fermer">&times;</button>';
            document.body.appendChild(toast);
            toast.querySelector('.toast-confirmation__close').addEventListener('click', function () {
              toast.classList.remove('toast-confirmation--show');
              setTimeout(function () { toast.remove(); }, 400);
            });
            setTimeout(function () {
              toast.classList.remove('toast-confirmation--show');
              setTimeout(function () { toast.remove(); }, 400);
            }, 5000);
          })();

          setTimeout(function () {
            history.pushState(null, '', '#mon-compte');
            showPage('mon-compte');
            chargerProfil();
          }, 1500);
        }
      } catch (err) {
        afficherMessage('insc-message', 'Erreur de connexion. Veuillez réessayer.', 'erreur');
      }

      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Créer mon compte';
    });
  }

  // --- Formulaire de connexion ---
  var formConnexion = document.getElementById('form-connexion');
  if (formConnexion) {
    formConnexion.addEventListener('submit', async function (e) {
      e.preventDefault();
      cacherMessage('conn-message');
      var btnSubmit = document.getElementById('btn-connexion');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Connexion en cours…';

      var email = document.getElementById('conn-email').value.trim();
      var motDePasse = document.getElementById('conn-mdp').value;

      try {
        var { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: motDePasse
        });

        if (error) {
          afficherMessage('conn-message', traduireErreurAuth(error.message), 'erreur');
        } else {
          var meta = data.user.user_metadata || {};
          window.__isAdmin = !!(data.user.email === ADMIN_EMAIL);
          afficherMessage('conn-message', 'Connexion réussie ! Bonjour, ' + (meta.prenom || '') + '.', 'succes');
          afficherEtatConnecte({ prenom: meta.prenom || '', nom: meta.nom || '', email: data.user.email });
          formConnexion.reset();
          // Recharger le contenu dynamique maintenant que isAdmin est défini
          if (window.__isAdmin) {
            try { initDynamicContent(true); } catch(dynErr) { console.warn('[Admin] Rechargement boutique:', dynErr); }
          }
          setTimeout(function () {
            history.pushState(null, '', '#mon-compte');
            showPage('mon-compte');
            if (!window.__isAdmin) chargerProfil();
          }, 1500);
        }
      } catch (err) {
        afficherMessage('conn-message', 'Erreur de connexion. Veuillez réessayer.', 'erreur');
      }

      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Se connecter';
    });
  }

  // --- Charger le profil sur la page Mon compte ---
  async function chargerProfil() {
    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        var u = session.user;
        var meta = u.user_metadata || {};
        var el;
        el = document.getElementById('compte-titre');
        if (el) el.textContent = 'Bonjour, ' + (meta.prenom || '') + ' !';
        el = document.getElementById('compte-prenom');
        if (el) el.textContent = meta.prenom || '';
        el = document.getElementById('compte-nom');
        if (el) el.textContent = meta.nom || '';
        el = document.getElementById('compte-email');
        if (el) el.textContent = u.email;
        el = document.getElementById('compte-telephone');
        if (el) el.textContent = meta.telephone || 'Non renseigné';
        // Mettre à jour l'avatar
        var avatar = document.getElementById('compte-avatar');
        if (avatar) {
          var initiales = ((meta.prenom || '').charAt(0) + (meta.nom || '').charAt(0)).toUpperCase();
          avatar.textContent = initiales || '?';
        }
        el = document.getElementById('compte-date');
        if (el) el.textContent = new Date(u.created_at).toLocaleDateString('fr-FR', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      }
    } catch (e) {}
  }

  // --- Modification du profil ---
  var btnModifierProfil = document.getElementById('btn-modifier-profil');
  var compteEditForm = document.getElementById('compte-edit-form');
  var btnAnnulerEdit = document.getElementById('btn-annuler-edit');
  var btnSauvegarderProfil = document.getElementById('btn-sauvegarder-profil');

  if (btnModifierProfil && compteEditForm) {
    btnModifierProfil.addEventListener('click', async function () {
      // Pré-remplir les champs avec les données actuelles
      try {
        var { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          var meta = session.user.user_metadata || {};
          var editPrenom = document.getElementById('edit-prenom');
          var editNom = document.getElementById('edit-nom');
          var editTel = document.getElementById('edit-telephone');
          if (editPrenom) editPrenom.value = meta.prenom || '';
          if (editNom) editNom.value = meta.nom || '';
          if (editTel) editTel.value = meta.telephone || '';
        }
      } catch (e) {}
      btnModifierProfil.hidden = true;
      compteEditForm.hidden = false;
      cacherMessage('edit-profil-message');
    });
  }

  if (btnAnnulerEdit) {
    btnAnnulerEdit.addEventListener('click', function () {
      compteEditForm.hidden = true;
      btnModifierProfil.hidden = false;
      cacherMessage('edit-profil-message');
    });
  }

  if (btnSauvegarderProfil) {
    btnSauvegarderProfil.addEventListener('click', async function () {
      var editPrenom = document.getElementById('edit-prenom');
      var editNom = document.getElementById('edit-nom');
      var editTel = document.getElementById('edit-telephone');
      var prenom = editPrenom ? editPrenom.value.trim() : '';
      var nom = editNom ? editNom.value.trim() : '';
      var telephone = editTel ? editTel.value.trim() : '';

      if (!prenom || !nom) {
        afficherMessage('edit-profil-message', 'Le prénom et le nom sont obligatoires.', 'erreur');
        return;
      }

      btnSauvegarderProfil.disabled = true;
      btnSauvegarderProfil.textContent = 'Enregistrement…';

      try {
        var { error } = await supabase.auth.updateUser({
          data: { prenom: prenom, nom: nom, telephone: telephone }
        });

        if (error) {
          afficherMessage('edit-profil-message', 'Erreur lors de la mise à jour.', 'erreur');
        } else {
          afficherMessage('edit-profil-message', 'Profil mis à jour avec succès.', 'succes');
          afficherEtatConnecte({ prenom: prenom, nom: nom });
          chargerProfil();
          setTimeout(function () {
            compteEditForm.hidden = true;
            btnModifierProfil.hidden = false;
            cacherMessage('edit-profil-message');
          }, 1500);
        }
      } catch (err) {
        afficherMessage('edit-profil-message', 'Erreur de connexion. Veuillez réessayer.', 'erreur');
      }

      btnSauvegarderProfil.disabled = false;
      btnSauvegarderProfil.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Enregistrer';
    });
  }

  // --- Déconnexion ---
  var btnDeconnexion = document.getElementById('btn-deconnexion');
  if (btnDeconnexion) {
    btnDeconnexion.addEventListener('click', async function () {
      if (supabase) await supabase.auth.signOut();
      afficherEtatDeconnecte();
      history.pushState(null, '', '#accueil');
      showPage('accueil');
    });
  }

  // --- Suppression du compte (avec confirmation mot de passe) ---
  var btnSupprimer = document.getElementById('btn-supprimer-compte');
  var groupeMdp = document.getElementById('groupe-mdp-suppression');
  var inputMdp = document.getElementById('mdp-suppression');
  var erreurMdp = document.getElementById('erreur-mdp-suppression');
  var btnAnnuler = document.getElementById('btn-annuler-suppression');
  var etapeSuppr = 0; // 0 = bouton initial, 1 = mot de passe demand\u00e9

  function annulerSuppression() {
    etapeSuppr = 0;
    if (groupeMdp) groupeMdp.hidden = true;
    if (inputMdp) inputMdp.value = '';
    if (erreurMdp) erreurMdp.hidden = true;
    if (btnAnnuler) btnAnnuler.hidden = true;
    if (btnSupprimer) {
      btnSupprimer.disabled = false;
      btnSupprimer.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Supprimer mon compte';
    }
  }

  if (btnAnnuler) {
    btnAnnuler.addEventListener('click', annulerSuppression);
  }

  if (btnSupprimer && groupeMdp && inputMdp) {
    btnSupprimer.addEventListener('click', async function () {

      // \u00c9tape 1 : afficher le champ mot de passe
      if (etapeSuppr === 0) {
        groupeMdp.hidden = false;
        if (btnAnnuler) btnAnnuler.hidden = false;
        inputMdp.focus();
        btnSupprimer.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Confirmer la suppression';
        etapeSuppr = 1;
        return;
      }

      // \u00c9tape 2 : v\u00e9rifier le mot de passe et supprimer
      var mdp = inputMdp.value.trim();
      if (!mdp) {
        erreurMdp.textContent = 'Veuillez saisir votre mot de passe.';
        erreurMdp.hidden = false;
        inputMdp.focus();
        return;
      }

      erreurMdp.hidden = true;
      btnSupprimer.disabled = true;
      btnSupprimer.textContent = 'V\u00e9rification en cours\u2026';

      try {
        // R\u00e9cup\u00e9rer l'email de l'utilisateur connect\u00e9
        var { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('Vous devez \u00eatre connect\u00e9 pour supprimer votre compte.');
          resetBtnSuppr();
          return;
        }

        var email = session.user.email;

        // V\u00e9rifier le mot de passe en se reconnectant
        var { error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: mdp
        });

        if (authError) {
          erreurMdp.textContent = 'Mot de passe incorrect.';
          erreurMdp.hidden = false;
          inputMdp.value = '';
          inputMdp.focus();
          resetBtnSuppr();
          return;
        }

        // Mot de passe correct \u2014 supprimer le compte
        btnSupprimer.textContent = 'Suppression en cours\u2026';
        var userId = session.user.id;

        await supabase.from('rendez_vous').delete().eq('user_id', userId);
        await supabase.from('commandes').delete().eq('user_id', userId);
        await supabase.from('paiements').delete().eq('user_id', userId);
        await supabase.from('coupons_utilises').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);

        var { error: rpcError } = await supabase.rpc('delete_own_account');
        if (rpcError) {
          console.warn('RPC delete_own_account non disponible:', rpcError.message);
        }

        await supabase.auth.signOut();
        afficherEtatDeconnecte();
        history.pushState(null, '', '#accueil');
        showPage('accueil');
        alert('Votre compte a \u00e9t\u00e9 supprim\u00e9. Merci d\u2019avoir fait partie de Lumi\u00e8re Int\u00e9rieure.');
      } catch (err) {
        console.error('Erreur suppression compte:', err);
        resetBtnSuppr();
        alert('Une erreur est survenue. Veuillez r\u00e9essayer.');
      }
    });
  }

  function resetBtnSuppr() {
    if (btnSupprimer) {
      btnSupprimer.disabled = false;
      btnSupprimer.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Confirmer la suppression';
    }
  }

  // Charger le profil et toutes les donn\u00e9es quand on navigue vers Mon compte
  var origShowPage = showPage;
  showPage = function (pageId) {
    origShowPage(pageId);
    if (pageId === 'mon-compte') {
      if (window.__isAdmin) {
        chargerDashboardAdmin();
      } else {
        chargerProfil();
        chargerRDV();
        chargerCommandes();
        chargerPaiements();
        chargerCoupons();
      }
    }
    // Unified FAB : newsletter sub-button visible sur accueil, blog, boutique et services
    var ufabNl2 = document.getElementById('ufab-newsletter');
    if (ufabNl2) {
      var nlPages = ['accueil', 'blog', 'boutique', 'services'];
      ufabNl2.style.display = nlPages.indexOf(pageId) !== -1 ? '' : 'none';
    }
    // Fermer le menu FAB et la card newsletter
    var ufab2 = document.getElementById('unified-fab');
    if (ufab2) ufab2.classList.remove('ufab--open');
    var nlCard2 = document.getElementById('nl-float-card');
    if (nlCard2) nlCard2.hidden = true;
  };

  // Vérifier le statut auth au chargement
  verifierStatutAuth();

  // ========================================
  // COMMANDES / PAIEMENTS / COUPONS — Supabase
  // ========================================

  // Map des Payment Links Stripe pour les produits boutique (slug -> lien)
  var BOUTIQUE_STRIPE_LINKS = {
    'pendule-spirale-dore': 'https://buy.stripe.com/4gMcMYgbleXL4GaadXeAg0a',
    'amethyste-pierre-roulee': 'https://buy.stripe.com/4gM14gcZ9bLzgoSbi1eAg0f',
    'sauge-blanche-baton-de-purification': 'https://buy.stripe.com/7sY3co7EP4j7goS99TeAg0d',
    'quartz-rose-pierre-brute': 'https://buy.stripe.com/4gMdR21grbLzfkO2LveAg0e',
    'tourmaline-noire-pierre-de-protection': 'https://buy.stripe.com/6oUcMY6AL3f3c8CeudeAg0c',
    'bracelet-elastique-6mm': '',
    'bracelet-pierre-de-lave-6mm': ''
  };

  // Map des liens Stripe vers les noms de services
  var STRIPE_SERVICES = {
    '6oUcMYgbl5nbdcGgCleAg04': { service: 'Focus Intuitif', montant: 40 },
    '6oU5kw7EPbLzc8CgCleAg05': { service: 'R\u00e9v\u00e9lations Intuitives', montant: 55 },
    'eVq7sEaR1bLz8Wqbi1eAg06': { service: 'Panorama Intuitif', montant: 75 },
    'cNidR20cn02R1tY4TDeAg07': { service: 'Voyance par mail — 1 question', montant: 9 }
  };

  // Map des services vers leurs prix de base (pour lookup par nom)
  var SERVICE_PRICES = {
    'Focus Intuitif': 40,
    'R\u00e9v\u00e9lations Intuitives': 55,
    'Panorama Intuitif': 75,
    'Voyance par mail — 1 question': 9
  };

  // --- R\u00e9cup\u00e9rer le coupon actif de l'utilisateur pour les services ---
  var _cachedCoupon = null;
  var _couponCacheTime = 0;
  async function getActiveCouponForServices() {
    // Cache pendant 30 secondes pour \u00e9viter trop de requ\u00eates
    if (_cachedCoupon !== null && Date.now() - _couponCacheTime < 30000) {
      return _cachedCoupon;
    }

    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session) { _cachedCoupon = false; _couponCacheTime = Date.now(); return false; }

      // R\u00e9cup\u00e9rer les coupons utilis\u00e9s par l'utilisateur (non encore utilis\u00e9s pour un paiement)
      var { data: couponUsages, error } = await supabase
        .from('coupons_utilises')
        .select('*, coupons(*)')
        .eq('user_id', session.user.id)
        .is('commande_id', null);

      if (error || !couponUsages || couponUsages.length === 0) {
        _cachedCoupon = false;
        _couponCacheTime = Date.now();
        return false;
      }

      // Trouver un coupon actif applicable aux services
      for (var i = 0; i < couponUsages.length; i++) {
        var cu = couponUsages[i];
        var c = cu.coupons;
        if (!c || !c.actif) continue;
        if (c.valide_jusqu_au && new Date(c.valide_jusqu_au) < new Date()) continue;
        if (c.applicable_a !== 'services' && c.applicable_a !== 'services_boutique') continue;

        _cachedCoupon = {
          id: c.id,
          code: c.code,
          reduction_pourcent: c.reduction_pourcent,
          reduction_montant: c.reduction_montant,
          usage_id: cu.id
        };
        _couponCacheTime = Date.now();
        console.log('[Coupon] Coupon actif trouv\u00e9:', c.code, '| R\u00e9duction:', c.reduction_pourcent ? c.reduction_pourcent + '%' : c.reduction_montant + '\u20ac');
        return _cachedCoupon;
      }

      _cachedCoupon = false;
      _couponCacheTime = Date.now();
      return false;
    } catch (e) {
      _cachedCoupon = false;
      _couponCacheTime = Date.now();
      return false;
    }
  }

  // Invalider le cache coupon (apr\u00e8s application d'un coupon, etc.)
  function invalidateCouponCache() {
    _cachedCoupon = null;
    _couponCacheTime = 0;
  }

  // --- Calculer le montant r\u00e9duit ---
  function calculerMontantReduit(montantOriginal, coupon) {
    if (!coupon) return montantOriginal;
    var montant = Number(montantOriginal);
    if (coupon.reduction_pourcent) {
      montant = montant * (1 - coupon.reduction_pourcent / 100);
    } else if (coupon.reduction_montant) {
      montant = montant - Number(coupon.reduction_montant);
    }
    return Math.max(Math.round(montant * 100) / 100, 0.50);
  }

  // --- Formater la r\u00e9duction pour l'affichage ---
  function formatReduction(coupon) {
    if (!coupon) return '';
    if (coupon.reduction_pourcent) return '-' + coupon.reduction_pourcent + '%';
    if (coupon.reduction_montant) return '-' + Number(coupon.reduction_montant).toFixed(2) + ' \u20ac';
    return '';
  }

  // --- Construire l'URL Stripe Payment Link avec code promo ---
  // Stripe Payment Links supportent ?prefilled_promo_code=CODE
  // quand les codes promo sont activ\u00e9s sur le lien dans le Dashboard Stripe.
  // Le propri\u00e9taire du site doit cr\u00e9er des codes promo dans Stripe Dashboard
  // correspondant aux codes coupons dans Supabase (ex: BIENVENUE10).
  function buildStripeUrlWithPromo(baseUrl, couponCode) {
    if (!couponCode) return baseUrl;
    var separator = baseUrl.indexOf('?') === -1 ? '?' : '&';
    var url = baseUrl + separator + 'prefilled_promo_code=' + encodeURIComponent(couponCode);
    console.log('[Coupon Stripe] URL avec code promo:', url);
    return url;
  }

  // --- V\u00e9rifier si retour de Stripe (success) ---
  // Payment Links redirigent avec ?session_id=... et le service key dans l'URL
  async function verifierRetourStripe() {
    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get('session_id');
    var serviceKey = params.get('service');

    if (!sessionId) return;

    console.log('[Stripe] Retour de paiement d\u00e9tect\u00e9, session:', sessionId);

    // Nettoyer l'URL
    history.replaceState(null, '', window.location.pathname + '#mon-compte');

    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // V\u00e9rifier que cette session n'a pas d\u00e9j\u00e0 \u00e9t\u00e9 enregistr\u00e9e
      var { data: existe } = await supabase
        .from('commandes')
        .select('id')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (existe) {
        console.log('[Stripe] Session d\u00e9j\u00e0 enregistr\u00e9e, ignor\u00e9e');
        return;
      }

      var serviceName, montant;

      if (serviceKey && STRIPE_SERVICES[serviceKey]) {
        var infos = STRIPE_SERVICES[serviceKey];
        serviceName = infos.service;
        montant = infos.montant;
      } else if (serviceKey && serviceKey.indexOf('boutique_') === 0) {
        // Boutique product payment
        var productSlug = decodeURIComponent(serviceKey.replace('boutique_', ''));
        try {
          var stripeSession = await stripeApiCall('/checkout/sessions/' + sessionId, 'GET');
          if (stripeSession) {
            serviceName = 'Boutique: ' + (productSlug || 'Produit');
            montant = (stripeSession.amount_total || 0) / 100;
          } else {
            serviceName = 'Boutique: ' + productSlug;
            montant = 0;
          }
        } catch(bErr) {
          serviceName = 'Boutique: ' + productSlug;
          montant = 0;
        }
      } else {
        console.log('[Stripe] Service key inconnu:', serviceKey);
        return;
      }

      // Enregistrer la commande
      var commandeResult = await safeSupabase(function() {
        return supabase.from('commandes').insert({
          user_id: session.user.id,
          service: serviceName,
          montant: montant,
          methode_paiement: 'stripe',
          statut: 'pay\u00e9',
          stripe_session_id: sessionId
        }).select('id').single();
      }, 'enregistrement de la commande');
      var commande = commandeResult && !commandeResult.error ? commandeResult.data : null;

      console.log('[Stripe] Commande enregistr\u00e9e:', serviceName, montant + '\u20ac');

      // Vider le panier apr\u00e8s paiement r\u00e9ussi (local + Supabase)
      try { localStorage.removeItem('lumiere_cart'); } catch(ce) {}
      try { clearCartSupabase(); } catch(cse) {}

      // Naviguer vers Mon compte > Commandes
      showPage('mon-compte');
      setTimeout(function () {
        var btnCommandes = document.querySelector('[data-tab="commandes"]');
        if (btnCommandes) btnCommandes.click();
      }, 500);
    } catch (e) {
      console.error('[Stripe] Erreur retour:', e);
    }
  }

  // --- Charger les commandes ---
  async function chargerCommandes() {
    var liste = document.getElementById('commandes-liste');
    var vide = document.getElementById('commandes-vide');
    if (!liste || !vide) return;

    try {
      var { data, error } = await supabase
        .from('commandes')
        .select('*')
        .order('date_creation', { ascending: false });

      if (error || !data || data.length === 0) {
        liste.innerHTML = '';
        vide.style.display = '';
        return;
      }

      vide.style.display = 'none';
      liste.innerHTML = '<div class="compte-liste">' + data.map(function (c) {
        var date = new Date(c.date_creation).toLocaleDateString('fr-FR', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        return '<div class="compte-liste__item">' +
          '<div class="compte-liste__info">' +
            '<span class="compte-liste__service">' + c.service + '</span>' +
            '<span class="compte-liste__date">' + date + ' — ' + c.methode_paiement + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:0.75rem">' +
            '<span class="compte-liste__statut compte-liste__statut--paye">Pay\u00e9</span>' +
            '<span class="compte-liste__montant">' + Number(c.montant).toFixed(2) + ' \u20ac</span>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    } catch (e) {}
  }

  // --- Charger les paiements (m\u00eame donn\u00e9es, vue diff\u00e9rente) ---
  async function chargerPaiements() {
    var liste = document.getElementById('paiements-liste');
    var vide = document.getElementById('paiements-vide');
    if (!liste || !vide) return;

    try {
      var { data, error } = await supabase
        .from('commandes')
        .select('*')
        .order('date_creation', { ascending: false });

      if (error || !data || data.length === 0) {
        liste.innerHTML = '';
        vide.style.display = '';
        return;
      }

      vide.style.display = 'none';
      var total = data.reduce(function (s, c) { return s + Number(c.montant); }, 0);
      liste.innerHTML = '<div class="compte-liste">' + data.map(function (c) {
        var date = new Date(c.date_creation).toLocaleDateString('fr-FR', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        var methode = c.methode_paiement === 'stripe' ? 'Carte bancaire' : 'PayPal';
        return '<div class="compte-liste__item">' +
          '<div class="compte-liste__info">' +
            '<span class="compte-liste__service">' + methode + '</span>' +
            '<span class="compte-liste__date">' + date + ' — ' + c.service + '</span>' +
          '</div>' +
          '<span class="compte-liste__montant">' + Number(c.montant).toFixed(2) + ' \u20ac</span>' +
        '</div>';
      }).join('') + '</div>' +
      '<div class="compte-liste__item" style="margin-top:0.5rem;border-color:var(--color-primary)">' +
        '<span class="compte-liste__service">Total</span>' +
        '<span class="compte-liste__montant">' + total.toFixed(2) + ' \u20ac</span>' +
      '</div>';
    } catch (e) {}
  }

  // --- Charger les coupons ---
  async function chargerCoupons() {
    var liste = document.getElementById('coupons-liste');
    var vide = document.getElementById('coupons-vide');
    if (!liste || !vide) return;

    try {
      var { data, error } = await supabase
        .from('coupons_utilises')
        .select('*, coupons(*)')
        .order('date_utilisation', { ascending: false });

      if (error || !data || data.length === 0) {
        liste.innerHTML = '';
        vide.style.display = '';
        return;
      }

      vide.style.display = 'none';
      liste.innerHTML = '<div class="compte-liste">' + data.map(function (cu) {
        var c = cu.coupons;
        if (!c) return '';
        var date = new Date(cu.date_utilisation).toLocaleDateString('fr-FR', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        var reduction = c.reduction_pourcent
          ? '-' + c.reduction_pourcent + '%'
          : '-' + Number(c.reduction_montant).toFixed(2) + ' \u20ac';
        var scopeLabels = { 'services': 'Services', 'boutique': 'Boutique', 'services_boutique': 'Services + Boutique' };
        var scopeLabel = scopeLabels[c.applicable_a] || '';
        return '<div class="compte-liste__item">' +
          '<div class="compte-liste__info">' +
            '<span class="compte-liste__coupon-code">' + c.code + '</span>' +
            '<span class="compte-liste__coupon-desc">' + c.description + (scopeLabel ? ' \u2022 ' + scopeLabel : '') + '</span>' +
            '<span class="compte-liste__date">Utilis\u00e9 le ' + date + '</span>' +
          '</div>' +
          '<span class="compte-liste__statut compte-liste__statut--actif">' + reduction + '</span>' +
        '</div>';
      }).join('') + '</div>';
    } catch (e) {}
  }

  // --- Appliquer un coupon ---
  var btnCoupon = document.getElementById('btn-appliquer-coupon');
  if (btnCoupon) {
    btnCoupon.addEventListener('click', async function () {
      var input = document.getElementById('coupon-input');
      var code = input.value.trim().toUpperCase();
      if (!code) return;

      cacherMessage('coupon-message');
      btnCoupon.disabled = true;
      btnCoupon.textContent = 'V\u00e9rification\u2026';

      try {
        var { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          afficherMessage('coupon-message', 'Vous devez \u00eatre connect\u00e9.', 'erreur');
          btnCoupon.disabled = false;
          btnCoupon.textContent = 'Appliquer';
          return;
        }

        // V\u00e9rifier le coupon
        var { data: coupon, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', code)
          .eq('actif', true)
          .maybeSingle();

        if (!coupon) {
          console.log('[Coupon] Code invalide ou introuvable:', code);
          afficherMessage('coupon-message', 'Code coupon invalide ou expir\u00e9.', 'erreur');
        } else if (coupon.valide_jusqu_au && new Date(coupon.valide_jusqu_au) < new Date()) {
          console.log('[Coupon] Coupon expir\u00e9:', code, '| Expiration:', coupon.valide_jusqu_au);
          afficherMessage('coupon-message', 'Ce coupon a expir\u00e9.', 'erreur');
        } else if (coupon.usage_max && coupon.usage_actuel >= coupon.usage_max) {
          console.log('[Coupon] Usage max atteint:', code, '|', coupon.usage_actuel + '/' + coupon.usage_max);
          afficherMessage('coupon-message', 'Ce coupon a atteint son nombre maximum d\u2019utilisations.', 'erreur');
        } else {
          // V\u00e9rifier si d\u00e9j\u00e0 utilis\u00e9 par ce client
          var { data: dejaUtilise } = await supabase
            .from('coupons_utilises')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('coupon_id', coupon.id)
            .maybeSingle();

          if (dejaUtilise) {
            console.log('[Coupon] D\u00e9j\u00e0 utilis\u00e9 par cet utilisateur:', code);
            afficherMessage('coupon-message', 'Vous avez d\u00e9j\u00e0 utilis\u00e9 ce coupon.', 'erreur');
          } else {
            // Enregistrer l'utilisation
            var { error: insertError } = await supabase
              .from('coupons_utilises')
              .insert({
                user_id: session.user.id,
                coupon_id: coupon.id
              });

            if (insertError) {
              console.error('[Coupon] Erreur insertion:', insertError);
              afficherMessage('coupon-message', 'Erreur lors de l\u2019application du coupon.', 'erreur');
            } else {
              console.log('[Coupon] Coupon appliqu\u00e9 avec succ\u00e8s:', code,
                '| R\u00e9duction:', coupon.reduction_pourcent ? coupon.reduction_pourcent + '%' : coupon.reduction_montant + '\u20ac',
                '| Applicable \u00e0:', coupon.applicable_a);
              var red = coupon.reduction_pourcent
                ? '-' + coupon.reduction_pourcent + '%'
                : '-' + Number(coupon.reduction_montant).toFixed(2) + ' \u20ac';
              var scopeMsg = { 'services': 'les services', 'boutique': 'la boutique', 'services_boutique': 'les services et la boutique' };
              var scopeText = scopeMsg[coupon.applicable_a] || 'les services et la boutique';
              afficherMessage('coupon-message', 'Coupon appliqu\u00e9 ! ' + red + ' sur ' + scopeText + '. La r\u00e9duction sera automatiquement appliqu\u00e9e lors de votre prochain paiement.', 'succes');
              input.value = '';
              invalidateCouponCache();
              chargerCoupons();
            }
          }
        }
      } catch (err) {
        afficherMessage('coupon-message', 'Erreur de connexion. Veuillez r\u00e9essayer.', 'erreur');
      }

      btnCoupon.disabled = false;
      btnCoupon.textContent = 'Appliquer';
    });
  }

  // --- Charger les RDV ---
  async function chargerRDV() {
    var liste = document.getElementById('rdv-liste');
    var vide = document.getElementById('rdv-vide');
    if (!liste || !vide) return;

    try {
      // Charger les r\u00e9servations
      var { data: rdvData, error: rdvError } = await supabase
        .from('reservations')
        .select('*')
        .order('date_rdv', { ascending: true });

      // Charger les commandes pour savoir lesquelles sont pay\u00e9es
      var { data: cmdData } = await supabase
        .from('commandes')
        .select('service, statut')
        .eq('statut', 'pay\u00e9');

      // Construire un set des services pay\u00e9s (avec compteur)
      var servicesPaies = {};
      if (cmdData) {
        cmdData.forEach(function (c) {
          servicesPaies[c.service] = (servicesPaies[c.service] || 0) + 1;
        });
      }

      if (rdvError || !rdvData || rdvData.length === 0) {
        liste.innerHTML = '';
        vide.style.display = '';
        return;
      }

      vide.style.display = 'none';
      var maintenant = new Date();
      // Compter les RDV d\u00e9j\u00e0 trait\u00e9s par service pour le matching
      var compteurRdv = {};

      liste.innerHTML = '<div class="compte-liste">' + rdvData.map(function (r) {
        var dateRdv = new Date(r.date_rdv);
        var dateStr = dateRdv.toLocaleDateString('fr-FR', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        var heureStr = dateRdv.toLocaleTimeString('fr-FR', {
          hour: '2-digit', minute: '2-digit'
        });
        var passe = dateRdv < maintenant;

        // D\u00e9terminer le statut temporel
        var statutTexte = passe ? 'Termin\u00e9' : '\u00c0 venir';
        if (r.statut === 'annul\u00e9') statutTexte = 'Annul\u00e9';

        // D\u00e9terminer si pay\u00e9 : soit via notes stripe:, soit via une commande correspondante
        var estPaye = false;
        if (r.notes && r.notes.indexOf('stripe:') === 0) {
          estPaye = true;
        } else if (servicesPaies[r.service] && servicesPaies[r.service] > (compteurRdv[r.service] || 0)) {
          estPaye = true;
          compteurRdv[r.service] = (compteurRdv[r.service] || 0) + 1;
        }

        // Ic\u00f4ne paiement : rond vert = pay\u00e9, rond rouge = non pay\u00e9
        var paiementIcone = estPaye
          ? '<span class="rdv-paiement rdv-paiement--paye" title="Pay\u00e9"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="hsl(142 50% 45%)" stroke="hsl(142 50% 35%)"/><path d="M9 12l2 2 4-4" stroke="white" stroke-width="2.5"/></svg></span>'
          : '<span class="rdv-paiement rdv-paiement--nonpaye" title="Non pay\u00e9"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="hsl(0 60% 50%)" stroke="hsl(0 60% 40%)"/><path d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2.5"/></svg></span>';

        var dateAffichee = dateStr + ' \u00e0 ' + heureStr;

        return '<div class="compte-liste__item">' +
          '<div class="compte-liste__info">' +
            '<span class="compte-liste__service">' + paiementIcone + ' ' + r.service + '</span>' +
            '<span class="compte-liste__date">' + dateAffichee + '</span>' +
          '</div>' +
          '<span class="compte-liste__statut ' + (r.statut === 'annul\u00e9' ? 'compte-liste__statut--expire' : (passe ? 'compte-liste__statut--expire' : 'compte-liste__statut--actif')) + '">' + statutTexte + '</span>' +
        '</div>';
      }).join('') + '</div>';
    } catch (e) {
      console.error('Erreur chargerRDV:', e);
    }
  }

  // --- Pr\u00e9remplir les liens Cal.com avec l'email du client connect\u00e9 ---
  async function personnaliserLiensCal() {
    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;
      var email = encodeURIComponent(session.user.email);
      var meta = session.user.user_metadata || {};
      var nom = encodeURIComponent((meta.prenom || '') + ' ' + (meta.nom || ''));
      document.querySelectorAll('a[href*="cal.eu/philippe-medium-amzdok"]').forEach(function (lien) {
        var url = lien.getAttribute('href');
        if (url.indexOf('email=') === -1) {
          var sep = url.indexOf('?') === -1 ? '?' : '&';
          lien.setAttribute('href', url + sep + 'email=' + email + '&name=' + nom);
        }
      });
    } catch (e) {}
  }

  // --- Stocker le service Cal.com avant ouverture du popup ---
  document.querySelectorAll('[data-cal-service]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var service = this.getAttribute('data-cal-service');
      if (service) {
        safeSession.setItem('cal_service_pending', service);
      }
    });
  });

  // --- \u00c9couter les r\u00e9servations Cal.com embed ---
  function setupCalListener() {
    if (!window.Cal || !window.Cal.ns || !window.Cal.ns.consultations) return false;
    Cal.ns.consultations('on', {
      action: 'bookingSuccessfulV2',
      callback: async function (e) {
        var data = e.detail.data;
        var uid = data.uid;
        var startTime = data.startTime;
        var title = data.title;
        var serviceName = safeSession.getItem('cal_service_pending') || title || 'Consultation';
        safeSession.removeItem('cal_service_pending');

        try {
          var { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          // V\u00e9rifier doublon
          var { data: existe } = await supabase
            .from('reservations')
            .select('id')
            .eq('notes', 'cal:' + uid)
            .maybeSingle();
          if (existe) return;

          await safeSupabase(function() { return supabase.from('reservations').insert({
            user_id: session.user.id,
            service: serviceName,
            date_rdv: startTime || new Date().toISOString(),
            statut: '\u00e0 venir',
            notes: 'cal:' + uid
          }); }, 'enregistrement du rendez-vous');

          // Naviguer vers Mes RDV
          history.pushState(null, '', '#mon-compte');
          showPage('mon-compte');
          setTimeout(function () {
            var btnRdv = document.querySelector('[data-tab="rdv"]');
            if (btnRdv) btnRdv.click();
          }, 500);
        } catch (err) {
          console.error('Erreur enregistrement RDV Cal.com:', err);
        }
      }
    });
    return true;
  }
  // Tenter de configurer le listener, r\u00e9essayer si Cal.com n'est pas encore charg\u00e9
  if (!setupCalListener()) {
    var calRetry = setInterval(function () {
      if (setupCalListener()) clearInterval(calRetry);
    }, 500);
    setTimeout(function () { clearInterval(calRetry); }, 10000);
  }

  // --- V\u00e9rifier retour Cal.com apr\u00e8s r\u00e9servation ---
  // Cal.com envoie : uid, title, startTime, endTime, email, attendeeName
  async function verifierRetourCal() {
    var params = new URLSearchParams(window.location.search);

    // Lire les param\u00e8tres Cal.com (format officiel)
    var calUid = params.get('uid');
    var calTitle = params.get('title');
    var calStart = params.get('startTime');

    // Compatibilit\u00e9 avec les anciens param\u00e8tres
    var calBookingLegacy = params.get('cal_booking');

    var bookingId = calUid || calBookingLegacy;
    if (!bookingId) return;

    // R\u00e9cup\u00e9rer le nom du service depuis safeSession (stock\u00e9 au clic sur le bouton)
    var serviceName = safeSession.getItem('cal_service_pending')
      || params.get('cal_service')
      || calTitle
      || 'Consultation';
    safeSession.removeItem('cal_service_pending');

    // Date du RDV
    var dateRdv = calStart || params.get('cal_date') || new Date().toISOString();

    history.replaceState(null, '', window.location.pathname + '#mon-compte');

    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // V\u00e9rifier doublon
      var { data: existe } = await supabase
        .from('reservations')
        .select('id')
        .eq('notes', 'cal:' + bookingId)
        .maybeSingle();
      if (existe) return;

      await safeSupabase(function() { return supabase.from('reservations').insert({
        user_id: session.user.id,
        service: decodeURIComponent(serviceName),
        date_rdv: dateRdv,
        statut: '\u00e0 venir',
        notes: 'cal:' + bookingId
      }); }, 'enregistrement du rendez-vous');

      showPage('mon-compte');
      setTimeout(function () {
        var btnRdv = document.querySelector('[data-tab="rdv"]');
        if (btnRdv) btnRdv.click();
      }, 500);
    } catch (e) {
      console.error('Erreur retour Cal:', e);
    }
  }

  personnaliserLiensCal();
  verifierRetourCal();
  verifierRetourStripe();

  // --- Onglets Mon Compte ---
  document.querySelectorAll('.compte-tabs__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tabId = this.getAttribute('data-tab');

      // Désactiver tous les onglets
      document.querySelectorAll('.compte-tabs__btn').forEach(function (b) {
        b.classList.remove('compte-tabs__btn--active');
      });
      document.querySelectorAll('.compte-tab-content').forEach(function (c) {
        c.classList.remove('compte-tab-content--active');
      });

      // Activer l'onglet cliqué
      this.classList.add('compte-tabs__btn--active');
      var target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('compte-tab-content--active');

      // Charger les données de l'onglet
      if (tabId === 'rdv') chargerRDV();
      if (tabId === 'commandes') chargerCommandes();
      if (tabId === 'paiements') chargerPaiements();
      if (tabId === 'coupons') chargerCoupons();
    });
  });


  // ========================================
  // ENVOI EMAIL — via Brevo (Sendinblue) API
  // ========================================
  async function envoyerEmailBrevo(options) {
    try {
      var response = await fetch(BREVO_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/v3/smtp/email',
          method: 'POST',
          body: {
            sender: { name: 'Lumi\u00e8re Int\u00e9rieure', email: 'philippe.medium45@gmail.com' },
            to: [{ email: options.destinataire, name: 'Philippe' }],
            replyTo: options.replyTo ? { email: options.replyTo, name: options.replyName || '' } : undefined,
            subject: options.sujet,
            htmlContent: '<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#2c1f1a;">'
              + '<div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e8e2d5;">'
              + '<strong style="color:#b5704a;font-size:18px;">Lumi\u00e8re Int\u00e9rieure</strong></div>'
              + options.contenu
              + '<hr style="border:none;border-top:1px solid #e8e2d5;margin:24px 0;">'
              + '<p style="font-size:12px;color:#999;">Envoy\u00e9 depuis le site lumiere-interieure.com</p>'
              + '</div>'
          }
        })
      });
      return response.ok || response.status === 201;
    } catch (e) {
      console.error('Erreur envoi email Brevo:', e);
      return false;
    }
  }

  // ========================================
  // NEWSLETTER AUTO — Envoi aux abonnés via campagne Brevo
  // ========================================
  async function envoyerNewsletterAbonnes(type, titre, lien) {
    try {
      var sectionLabels = { 'blog': 'Nouveau sur le blog', 'boutique': 'Nouveaut\u00e9 boutique', 'service': 'Mise \u00e0 jour des services' };
      var sectionLabel = sectionLabels[type] || 'Nouveaut\u00e9';
      var sujet = sectionLabel + ' : ' + titre;
      var siteUrl = 'https://phm045.github.io/Lumiere-interieure';
      var sectionUrl = siteUrl + '/#' + (type === 'blog' ? 'blog' : 'boutique');

      var htmlContent = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>'
        + '<body style="margin:0;padding:0;background-color:#faf8f5;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">'
        + '<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">'
        + '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#2d1b4e 100%);padding:40px 30px;text-align:center;">'
        + '<h1 style="color:#d4a574;font-size:24px;margin:0;font-weight:300;letter-spacing:2px;">Lumi\u00e8re Int\u00e9rieure</h1>'
        + '<p style="color:#c0b0a0;font-size:14px;margin-top:8px;">Voyance &amp; Guidance</p>'
        + '</div>'
        + '<div style="padding:30px;">'
        + '<p style="font-size:16px;color:#333;line-height:1.6;">Bonjour {{ contact.PRENOM | default: "cher(e) abonn\u00e9(e)" }},</p>'
        + '<p style="font-size:16px;color:#333;line-height:1.6;">De nouvelles mises \u00e0 jour vous attendent sur <strong>Lumi\u00e8re Int\u00e9rieure</strong> :</p>'
        + '<h2 style="color:#8b5e3c;margin-top:30px;">' + sectionLabel + '</h2>'
        + '<p style="font-size:16px;color:#333;">' + titre + '</p>'
        + '<div style="text-align:center;margin:35px 0;">'
        + '<a href="' + sectionUrl + '" style="display:inline-block;background:linear-gradient(135deg,#8b5e3c,#d4a574);color:#ffffff;text-decoration:none;padding:14px 35px;border-radius:8px;font-size:16px;font-weight:600;">D\u00e9couvrir</a>'
        + '</div>'
        + '<p style="font-size:14px;color:#888;line-height:1.5;">\u00c0 tr\u00e8s bient\u00f4t,<br><em>Philippe \u2014 Lumi\u00e8re Int\u00e9rieure</em></p>'
        + '</div>'
        + '<div style="background:#f5f0eb;padding:20px 30px;text-align:center;border-top:1px solid #e8e0d8;">'
        + '<p style="font-size:12px;color:#999;margin:0;">Vous recevez cet email car vous \u00eates inscrit(e) \u00e0 la newsletter.<br><a href="{{ unsubscribe }}" style="color:#8b5e3c;">Se d\u00e9sinscrire</a></p>'
        + '</div></div></body></html>';

      var now = new Date();
      var campaignName = 'Auto \u2014 ' + now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});

      // 1. Creer la campagne
      var createResp = await fetch(BREVO_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/v3/emailCampaigns',
          method: 'POST',
          body: {
            sender: { name: 'Lumi\u00e8re Int\u00e9rieure', email: 'philippe.medium45@gmail.com' },
            name: campaignName,
            subject: sujet,
            htmlContent: htmlContent,
            recipients: { listIds: [3] },
            inlineImageActivation: false
          }
        })
      });

      if (!createResp.ok) {
        console.warn('Erreur creation campagne Brevo:', await createResp.text());
        return false;
      }

      var campaign = await createResp.json();
      var campaignId = campaign.id;

      // 2. Envoyer immediatement
      var sendResp = await fetch(BREVO_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/v3/emailCampaigns/' + campaignId + '/sendNow',
          method: 'POST'
        })
      });

      if (sendResp.ok || sendResp.status === 204) {
        console.log('Newsletter envoyee aux abonnes pour: ' + titre);
        return true;
      } else {
        console.warn('Erreur envoi campagne:', await sendResp.text());
        return false;
      }
    } catch(e) {
      console.warn('Erreur newsletter:', e);
      return false;
    }
  }

  // ========================================
  // POP-UPS / MODALES — Système générique
  // ========================================

  // --- Utilitaires modale ---
  function openModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      // Focus trap
      setTimeout(function () {
        var firstBtn = modal.querySelector('.btn, button, input, textarea, select');
        if (firstBtn) firstBtn.focus();
      }, 100);
    }
  }

  function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
      modal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(function (m) {
      m.hidden = true;
    });
    document.body.style.overflow = '';
  }

  // Fermer en cliquant sur le fond ou les boutons [data-modal-close]
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) {
      closeAllModals();
    }
    if (e.target.hasAttribute('data-modal-close') || e.target.closest('[data-modal-close]')) {
      closeAllModals();
    }
    // Navigation depuis les modales légales
    if (e.target.hasAttribute('data-modal-nav') || e.target.closest('[data-modal-nav]')) {
      closeAllModals();
    }
  });

  // Fermer avec Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAllModals();
  });

  // --- Pop-ups PayPal ---
  var pendingPaypalForm = null;
  var pendingPaypalServiceName = '';
  var pendingPaypalOriginalAmount = 0;
  var pendingPaypalCoupon = null;
  document.querySelectorAll('.btn--paypal').forEach(function (btn) {
    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      e.stopPropagation();
      var form = btn.closest('form.paypal-form');
      pendingPaypalForm = form;
      // Trouver le nom du service
      var card = btn.closest('.service-card') || btn.closest('.voyance-mail');
      var serviceName = '';
      if (card) {
        var h3 = card.querySelector('h3');
        if (h3) serviceName = h3.textContent.trim();
      }
      if (!serviceName) {
        var label = btn.getAttribute('aria-label') || '';
        var match = label.match(/pour (.+)$/);
        if (match) serviceName = match[1];
      }
      pendingPaypalServiceName = serviceName;

      // R\u00e9cup\u00e9rer le montant original du formulaire
      var amountInput = form ? form.querySelector('input[name="amount"]') : null;
      pendingPaypalOriginalAmount = amountInput ? parseFloat(amountInput.value) : 0;

      // V\u00e9rifier si un coupon est actif
      pendingPaypalCoupon = await getActiveCouponForServices();
      var serviceEl = document.getElementById('modal-paypal-service');
      var discountEl = document.getElementById('modal-paypal-discount');

      if (pendingPaypalCoupon && pendingPaypalOriginalAmount > 0) {
        var reduit = calculerMontantReduit(pendingPaypalOriginalAmount, pendingPaypalCoupon);
        if (serviceEl) serviceEl.textContent = serviceName + ' \u2014 ' + reduit.toFixed(2) + ' \u20ac';
        if (discountEl) {
          discountEl.textContent = 'Coupon ' + pendingPaypalCoupon.code + ' appliqu\u00e9 : ' + formatReduction(pendingPaypalCoupon) + ' (prix initial : ' + pendingPaypalOriginalAmount.toFixed(2) + ' \u20ac)';
          discountEl.hidden = false;
        }
      } else {
        if (serviceEl) serviceEl.textContent = serviceName || '';
        if (discountEl) discountEl.hidden = true;
      }
      openModal('modal-paypal');
    });
  });

  var btnPaypalConfirm = document.getElementById('modal-paypal-confirm');
  if (btnPaypalConfirm) {
    btnPaypalConfirm.addEventListener('click', function () {
      closeAllModals();
      // Marquer le paiement Voyance par mail si c'est ce service
      if (pendingPaypalServiceName && pendingPaypalServiceName.toLowerCase().indexOf('mail') !== -1) {
        safeLocal.setItem('vm_payment_initiated', JSON.stringify({
          timestamp: Date.now(),
          method: 'PayPal',
          service: pendingPaypalServiceName
        }));
        updateVmPaymentStatus();
      }
      if (pendingPaypalForm) {
        // Appliquer le coupon au montant PayPal
        if (pendingPaypalCoupon && pendingPaypalOriginalAmount > 0) {
          var reduit = calculerMontantReduit(pendingPaypalOriginalAmount, pendingPaypalCoupon);
          console.log('[Coupon PayPal] Service:', pendingPaypalServiceName,
            '| Prix original:', pendingPaypalOriginalAmount + '\u20ac',
            '| Coupon:', pendingPaypalCoupon.code,
            '| R\u00e9duction:', formatReduction(pendingPaypalCoupon),
            '| Prix r\u00e9duit:', reduit.toFixed(2) + '\u20ac');
          var amountInput = pendingPaypalForm.querySelector('input[name="amount"]');
          if (amountInput) amountInput.value = reduit.toFixed(2);
          var itemNameInput = pendingPaypalForm.querySelector('input[name="item_name"]');
          if (itemNameInput) {
            itemNameInput.value = itemNameInput.value + ' (coupon ' + pendingPaypalCoupon.code + ')';
          }
          invalidateCouponCache();
        } else {
          console.log('[PayPal] Paiement sans coupon pour:', pendingPaypalServiceName);
        }
        pendingPaypalForm.submit();
        pendingPaypalForm = null;
      }
      pendingPaypalServiceName = '';
      pendingPaypalCoupon = null;
      pendingPaypalOriginalAmount = 0;
    });
  }

  // --- Pop-ups Stripe / CB ---
  var pendingStripeUrl = '';
  var pendingStripeServiceName = '';
  var pendingStripeOriginalAmount = 0;
  var pendingStripeCoupon = null;
  document.querySelectorAll('.btn--stripe').forEach(function (btn) {
    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      e.stopPropagation();
      pendingStripeUrl = btn.getAttribute('href') || btn.closest('a').getAttribute('href');
      var card = btn.closest('.service-card') || btn.closest('.voyance-mail');
      var serviceName = '';
      if (card) {
        var h3 = card.querySelector('h3');
        if (h3) serviceName = h3.textContent.trim();
      }
      if (!serviceName) {
        var label = btn.getAttribute('aria-label') || '';
        var match = label.match(/pour (.+)$/);
        if (match) serviceName = match[1];
      }
      pendingStripeServiceName = serviceName;
      pendingStripeOriginalAmount = SERVICE_PRICES[serviceName] || 0;

      // V\u00e9rifier si un coupon est actif
      pendingStripeCoupon = await getActiveCouponForServices();
      var serviceEl = document.getElementById('modal-stripe-service');
      var discountEl = document.getElementById('modal-stripe-discount');

      if (pendingStripeCoupon && pendingStripeOriginalAmount > 0) {
        var reduit = calculerMontantReduit(pendingStripeOriginalAmount, pendingStripeCoupon);
        if (serviceEl) serviceEl.textContent = serviceName + ' \u2014 ' + reduit.toFixed(2) + ' \u20ac';
        if (discountEl) {
          discountEl.textContent = 'Coupon ' + pendingStripeCoupon.code + ' appliqu\u00e9 : ' + formatReduction(pendingStripeCoupon) + ' (prix initial : ' + pendingStripeOriginalAmount.toFixed(2) + ' \u20ac). Le code promo sera pr\u00e9-rempli sur la page de paiement Stripe.';
          discountEl.hidden = false;
        }
        console.log('[Coupon Stripe] Coupon d\u00e9tect\u00e9:', pendingStripeCoupon.code, '| Service:', serviceName, '| Prix r\u00e9duit:', reduit.toFixed(2) + '\u20ac');
      } else {
        if (serviceEl) serviceEl.textContent = serviceName || '';
        if (discountEl) discountEl.hidden = true;
      }
      openModal('modal-stripe');
    });
  });

  var btnStripeConfirm = document.getElementById('modal-stripe-confirm');
  if (btnStripeConfirm) {
    btnStripeConfirm.addEventListener('click', async function () {
      // Marquer le paiement Voyance par mail si c'est ce service
      if (pendingStripeServiceName && pendingStripeServiceName.toLowerCase().indexOf('mail') !== -1) {
        safeLocal.setItem('vm_payment_initiated', JSON.stringify({
          timestamp: Date.now(),
          method: 'Carte bancaire (Stripe)',
          service: pendingStripeServiceName
        }));
        updateVmPaymentStatus();
      }

      // Si un coupon est actif, ajouter le code promo \u00e0 l'URL Stripe Payment Link
      if (pendingStripeCoupon && pendingStripeOriginalAmount > 0) {
        // Coupon actif : ouvrir le Payment Link avec le code promo pr\u00e9-rempli
        var stripeUrl = buildStripeUrlWithPromo(pendingStripeUrl, pendingStripeCoupon.code);
        console.log('[Coupon Stripe] Service:', pendingStripeServiceName,
          '| Prix original:', pendingStripeOriginalAmount + '\u20ac',
          '| Coupon:', pendingStripeCoupon.code,
          '| R\u00e9duction:', formatReduction(pendingStripeCoupon));
        closeAllModals();
        if (stripeUrl) {
          window.open(stripeUrl, '_blank', 'noopener,noreferrer');
        }
        invalidateCouponCache();
      } else {
        // Pas de coupon : ouvrir le lien Stripe habituel
        console.log('[Stripe] Paiement sans coupon pour:', pendingStripeServiceName);
        closeAllModals();
        if (pendingStripeUrl) {
          window.open(pendingStripeUrl, '_blank', 'noopener,noreferrer');
          pendingStripeUrl = '';
        }
      }
      pendingStripeServiceName = '';
      pendingStripeCoupon = null;
      pendingStripeOriginalAmount = 0;
    });
  }

  // --- Vérification paiement Voyance par mail ---
  function getVmPaymentInfo() {
    try {
      var raw = safeLocal.getItem('vm_payment_initiated');
      if (!raw) return null;
      var info = JSON.parse(raw);
      // Valide pendant 24h (86400000 ms)
      if (Date.now() - info.timestamp > 86400000) {
        safeLocal.removeItem('vm_payment_initiated');
        return null;
      }
      return info;
    } catch(e) { return null; }
  }

  function updateVmPaymentStatus() {
    var statusEl = document.getElementById('vm-payment-status');
    if (!statusEl) return;
    var info = getVmPaymentInfo();
    if (info) {
      var timeStr = new Date(info.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      statusEl.className = 'vm-payment-status vm-payment-status--verified';
      statusEl.innerHTML = '<span class="vm-payment-status__icon">\u2714</span> Paiement initi\u00e9 via ' + info.method + ' \u00e0 ' + timeStr;
      statusEl.hidden = false;
    } else {
      statusEl.className = 'vm-payment-status vm-payment-status--unverified';
      statusEl.innerHTML = '<span class="vm-payment-status__icon">\u26a0</span> Aucun paiement d\u00e9tect\u00e9 \u2014 veuillez d\u2019abord payer 9\u00a0\u20ac via PayPal ou CB dans la section Services.';
      statusEl.hidden = false;
    }
  }

  // --- Pop-ups Réservation Cal.com ---
  // Intercepter les boutons "Réserver maintenant" dans les services
  document.querySelectorAll('[data-cal-service]').forEach(function (btn) {
    var confirmed = false;
    btn.addEventListener('click', function (e) {
      if (confirmed) { confirmed = false; return; }
      e.preventDefault();
      e.stopPropagation();
      // On ne bloque pas Cal.com embed, on affiche juste la modal avant
      var serviceName = btn.getAttribute('data-cal-service') || '';
      var serviceEl = document.getElementById('modal-reservation-service');
      if (serviceEl) serviceEl.textContent = serviceName;

      openModal('modal-reservation');

      // Stocker la référence au bouton Cal.com pour le déclencher après confirmation
      var confirmBtn = document.getElementById('modal-reservation-confirm');
      if (confirmBtn) {
        confirmBtn.onclick = function () {
          closeAllModals();
          confirmed = true;
          btn.click();
        };
      }
    });
  });

  // --- Bouton réservation accueil -> popup Cal.com ---
  var accueilResBtn = document.getElementById('accueil-reservation-btn');
  if (accueilResBtn) {
    accueilResBtn.addEventListener('click', function () {
      if (typeof Cal !== 'undefined' && Cal.ns && Cal.ns.consultations) {
        Cal.ns.consultations('modal', {
          calLink: 'philippe-medium-amzdok/consultations'
        });
      } else {
        window.open('https://cal.eu/philippe-medium-amzdok/consultations', '_blank');
      }
    });
  }

  // --- Pop-up Réflexologie ---
  (function () {
    // Trouver le bouton "Prendre rendez-vous" dans la carte réflexologie
    var reflexoCards = document.querySelectorAll('.service-card');
    reflexoCards.forEach(function (card) {
      var h3 = card.querySelector('h3');
      if (h3 && h3.textContent.trim().toLowerCase().indexOf('flexologie') !== -1) {
        var link = card.querySelector('.btn--primary');
        if (link && link.getAttribute('href') && link.getAttribute('href').indexOf('youpra') !== -1) {
          var originalHref = link.getAttribute('href');
          link.addEventListener('click', function (e) {
            e.preventDefault();
            var modalLink = document.getElementById('modal-reflexo-link');
            if (modalLink) modalLink.href = originalHref;
            openModal('modal-reflexo');
          });
        }
      }
    });
  })();

  // --- Pop-up Email / Contact ---
  (function () {
    var emailActions = document.querySelectorAll('.contact-action');
    emailActions.forEach(function (action) {
      var cta = action.querySelector('.contact-action__cta');
      if (cta && cta.textContent.indexOf('Envoyer un email') !== -1) {
        action.addEventListener('click', function (e) {
          e.preventDefault();
          openModal('modal-email');
        });
      }
    });

    var formContact = document.getElementById('form-contact-modal');
    if (formContact) {
      formContact.addEventListener('submit', async function (e) {
        e.preventDefault();
        var nom = document.getElementById('contact-nom').value.trim();
        var email = document.getElementById('contact-email').value.trim();
        var sujet = document.getElementById('contact-sujet').value;
        var message = document.getElementById('contact-message').value.trim();
        var msgEl = document.getElementById('contact-modal-message');
        var submitBtn = formContact.querySelector('[type="submit"]');

        if (!nom || !email || !message) return;

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Envoi en cours\u2026'; }

        try {
          var ok = await envoyerEmailBrevo({
            destinataire: 'philippe.medium45@gmail.com',
            sujet: sujet + ' \u2014 ' + nom,
            contenu: '<h2>Message depuis le formulaire de contact</h2>'
              + '<p><strong>Nom :</strong> ' + nom + '</p>'
              + '<p><strong>Email :</strong> ' + email + '</p>'
              + '<p><strong>Sujet :</strong> ' + sujet + '</p>'
              + '<p><strong>Message :</strong></p>'
              + '<blockquote style="border-left:3px solid #6b7f4e;padding-left:12px;color:#333;">' + sanitizeForHtml(message).replace(/\n/g, '<br>') + '</blockquote>',
            replyTo: email,
            replyName: nom
          });

          if (ok) {
            if (msgEl) {
              msgEl.hidden = false;
              msgEl.className = 'auth-form__message auth-form__message--succes';
              msgEl.textContent = 'Message envoy\u00e9 avec succ\u00e8s\u00a0! Je vous r\u00e9pondrai sous 24h.';
            }
            formContact.reset();
            setTimeout(function () { closeAllModals(); if (msgEl) msgEl.hidden = true; }, 3000);
          } else {
            throw new Error('Envoi \u00e9chou\u00e9');
          }
        } catch (err) {
          if (msgEl) {
            msgEl.hidden = false;
            msgEl.className = 'auth-form__message auth-form__message--erreur';
            msgEl.textContent = 'Erreur lors de l\u2019envoi. Veuillez r\u00e9essayer.';
          }
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Envoyer';
        }
      });
    }
  })();

  // --- Pop-ups Légales (footer) ---
  (function () {
    var legalMap = {
      'mentions-legales': 'modal-mentions',
      'confidentialite': 'modal-confidentialite',
      'cgv': 'modal-cgv'
    };

    // Intercepter les clics sur les liens du footer
    document.querySelectorAll('.footer__col a[data-page]').forEach(function (link) {
      var pageId = link.getAttribute('data-page');
      if (legalMap[pageId]) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          openModal(legalMap[pageId]);
        }, true);
      }
    });
  })();

  // --- Pop-up Ajouter un avis ---
  var btnAjouterAvis = document.getElementById('btn-ajouter-avis');
  if (btnAjouterAvis) {
    btnAjouterAvis.addEventListener('click', function () {
      openModal('modal-avis');
    });
  }

  // Gestion des étoiles dans le formulaire d'avis
  (function () {
    var stars = document.querySelectorAll('.avis-star');
    var noteInput = document.getElementById('avis-note');
    stars.forEach(function (star) {
      star.addEventListener('click', function () {
        var val = parseInt(this.getAttribute('data-star'));
        if (noteInput) noteInput.value = val;
        stars.forEach(function (s) {
          var sv = parseInt(s.getAttribute('data-star'));
          if (sv <= val) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
      });
    });

    var formAvis = document.getElementById('form-avis-modal');
    if (formAvis) {
      formAvis.addEventListener('submit', async function (e) {
        e.preventDefault();
        var nom = document.getElementById('avis-nom').value.trim();
        var note = parseInt(document.getElementById('avis-note').value) || 0;
        var texte = document.getElementById('avis-texte').value.trim();
        var msgEl = document.getElementById('avis-modal-message');

        if (!nom || !texte) return;

        nom = sanitizeForHtml(nom);
        texte = sanitizeForHtml(texte);

        // Vérifier qu'une note a été sélectionnée
        if (note < 1 || note > 5) {
          if (msgEl) {
            msgEl.hidden = false;
            msgEl.className = 'auth-form__message auth-form__message--erreur';
            msgEl.textContent = 'Veuillez s\u00e9lectionner une note (1 \u00e0 5 \u00e9toiles).';
          }
          return;
        }

        // Sauvegarder dans Supabase avec statut "en attente de modération"
        var insertOk = false;
        try {
          if (window.supabase) {
            var result = await supabase.from('temoignages').insert({
              nom: nom,
              note: note,
              texte: texte,
              approuve: false
            });
            if (result.error) {
              throw result.error;
            }
            insertOk = true;
          }
        } catch (err) {
          console.error('Erreur insertion t\u00e9moignage:', err);
          if (msgEl) {
            msgEl.hidden = false;
            msgEl.className = 'auth-form__message auth-form__message--erreur';
            msgEl.textContent = 'Erreur lors de l\u2019envoi de votre t\u00e9moignage. Veuillez r\u00e9essayer.';
          }
          return;
        }

        // Message de succès avec mention de la modération
        if (msgEl) {
          msgEl.hidden = false;
          msgEl.className = 'auth-form__message auth-form__message--succes';
          msgEl.innerHTML = 'Merci pour votre t\u00e9moignage \u2764\ufe0f<br><span class="moderation-pending-notice" style="display:block;margin-top:0.5rem;">Votre avis sera visible apr\u00e8s validation par l\u2019\u00e9quipe.</span>';
        }

        setTimeout(function () {
          closeAllModals();
          formAvis.reset();
          if (msgEl) msgEl.hidden = true;
          // Reset étoiles à 0 (aucune sélectionnée)
          stars.forEach(function (s) { s.classList.remove('active'); });
          if (noteInput) noteInput.value = '0';
        }, 2000);
      });
    }
  })();



  // ========================================
  // POP-UP — Voyance par mail (1 question)
  // ========================================
  var btnVoyanceMail = document.getElementById('btn-voyance-mail');
  if (btnVoyanceMail) {
    btnVoyanceMail.addEventListener('click', function () {
      openModal('modal-voyance-mail');
      updateVmPaymentStatus();
    });
  }

  // Compteur de caractères
  var vmQuestion = document.getElementById('vm-question');
  var vmCount = document.getElementById('vm-question-count');
  if (vmQuestion && vmCount) {
    vmQuestion.addEventListener('input', function () {
      vmCount.textContent = vmQuestion.value.length;
    });
  }

  // ─── Masque de saisie date de naissance (JJ/MM/AAAA) ───
  (function () {
    var dobField = document.getElementById('vm-dob');
    if (!dobField) return;

    dobField.addEventListener('input', function (e) {
      var val = dobField.value.replace(/\D/g, '');
      if (val.length > 8) val = val.substring(0, 8);
      var formatted = '';
      if (val.length > 4) {
        formatted = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
      } else if (val.length > 2) {
        formatted = val.substring(0, 2) + '/' + val.substring(2);
      } else {
        formatted = val;
      }
      dobField.value = formatted;
    });

    // Validation visuelle au blur
    dobField.addEventListener('blur', function () {
      var val = dobField.value.trim();
      if (!val) return;
      var parts = val.split('/');
      if (parts.length === 3) {
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10);
        var year = parseInt(parts[2], 10);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= new Date().getFullYear()) {
          dobField.setCustomValidity('');
          return;
        }
      }
      dobField.setCustomValidity('Veuillez entrer une date valide au format JJ/MM/AAAA');
      dobField.reportValidity();
    });

    // Reset la validité quand on tape
    dobField.addEventListener('input', function () {
      dobField.setCustomValidity('');
    });
  })();

  // Soumission du formulaire
  var formVoyanceMail = document.getElementById('form-voyance-mail');
  if (formVoyanceMail) {
    formVoyanceMail.addEventListener('submit', async function (e) {
      e.preventDefault();
      var prenom = document.getElementById('vm-prenom').value.trim();
      var dobInput = document.getElementById('vm-dob');
      var dob = dobInput ? dobInput.value : '';
      var email = document.getElementById('vm-email').value.trim();
      var question = document.getElementById('vm-question').value.trim();
      var msgEl = document.getElementById('vm-message');
      var submitBtn = formVoyanceMail.querySelector('[type="submit"]');

      if (!prenom || !dob || !email || !question) return;

      // Vérifier le statut de paiement
      var paymentInfo = getVmPaymentInfo();
      var paymentStatusHtml = '';
      if (paymentInfo) {
        var payDate = new Date(paymentInfo.timestamp);
        var payDateStr = payDate.toLocaleDateString('fr-FR') + ' \u00e0 ' + payDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        paymentStatusHtml = '<div style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:6px;padding:10px 14px;margin-bottom:12px;">' +
          '<strong style="color:#2e7d32;">\u2714 Paiement d\u00e9tect\u00e9</strong><br>' +
          'M\u00e9thode\u00a0: ' + paymentInfo.method + '<br>' +
          'Initi\u00e9 le\u00a0: ' + payDateStr +
          '</div>';
      } else {
        paymentStatusHtml = '<div style="background:#fff3e0;border:1px solid #ffcc80;border-radius:6px;padding:10px 14px;margin-bottom:12px;">' +
          '<strong style="color:#e65100;">\u26a0 Aucun paiement d\u00e9tect\u00e9</strong><br>' +
          'Le client n\u2019a pas utilis\u00e9 le bouton de paiement avant d\u2019envoyer sa question. V\u00e9rifiez manuellement sur PayPal/Stripe.' +
          '</div>';
      }

      // Formater la date en français (entrée au format JJ/MM/AAAA)
      var dobFormatted = dob;
      try {
        var dobParts = dob.split('/');
        if (dobParts.length === 3) {
          var d = new Date(parseInt(dobParts[2], 10), parseInt(dobParts[1], 10) - 1, parseInt(dobParts[0], 10));
          if (!isNaN(d.getTime())) {
            dobFormatted = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
          }
        }
      } catch (e) {}

      // Désactiver le bouton pendant l'envoi
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Envoi en cours\u2026'; }

      try {
        var ok = await envoyerEmailBrevo({
          destinataire: 'philippe.medium45@gmail.com',
          sujet: 'Voyance par mail \u2013 1 question \u2014 ' + prenom + (paymentInfo ? ' \u2714' : ' \u26a0'),
          contenu: '<h2>Voyance par mail \u2013 1 question</h2>'
            + paymentStatusHtml
            + '<p><strong>Pr\u00e9nom :</strong> ' + prenom + '</p>'
            + '<p><strong>Date de naissance :</strong> ' + dobFormatted + '</p>'
            + '<p><strong>Email :</strong> ' + email + '</p>'
            + '<p><strong>Question :</strong></p>'
            + '<blockquote style="border-left:3px solid #b5704a;padding-left:12px;color:#333;">' + sanitizeForHtml(question).replace(/\n/g, '<br>') + '</blockquote>',
          replyTo: email,
          replyName: prenom
        });

        if (ok) {
          // Effacer le marqueur de paiement après envoi réussi
          safeLocal.removeItem('vm_payment_initiated');
          if (msgEl) {
            msgEl.hidden = false;
            msgEl.className = 'auth-form__message auth-form__message--succes';
            msgEl.textContent = 'Question envoy\u00e9e avec succ\u00e8s\u00a0! Vous recevrez votre r\u00e9ponse sous 48h.';
          }
          formVoyanceMail.reset();
          if (vmCount) vmCount.textContent = '0';
          setTimeout(function () { closeAllModals(); if (msgEl) msgEl.hidden = true; }, 3000);
        } else {
          throw new Error('Envoi \u00e9chou\u00e9');
        }
      } catch (err) {
        if (msgEl) {
          msgEl.hidden = false;
          msgEl.className = 'auth-form__message auth-form__message--erreur';
          msgEl.textContent = 'Erreur lors de l\u2019envoi. Veuillez r\u00e9essayer.';
        }
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Envoyer ma question';
      }
    });
  }


  // ========================================
  // BOUTON FLOTTANT UNIFIÉ (uFAB) — Newsletter + Musique + Panier
  // ========================================
  (function initUnifiedFAB() {
    var fab = document.getElementById('unified-fab');
    var toggleBtn = document.getElementById('ufab-toggle');
    var backdrop = document.getElementById('ufab-backdrop');
    if (!fab || !toggleBtn) return;

    var isOpen = false;

    function openFAB() {
      isOpen = true;
      fab.classList.add('ufab--open');
    }
    function closeFAB() {
      isOpen = false;
      fab.classList.remove('ufab--open');
      // Aussi fermer la card newsletter si elle est ouverte
      var nlCard = document.getElementById('nl-float-card');
      if (nlCard) nlCard.hidden = true;
    }
    function toggleFAB() {
      if (isOpen) closeFAB(); else openFAB();
    }

    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleFAB();
    });

    if (backdrop) {
      backdrop.addEventListener('click', function() {
        closeFAB();
      });
    }

    // Fermer avec Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) closeFAB();
    });

    // --- NEWSLETTER ---
    var nlBtn = document.getElementById('nl-float-toggle');
    var nlCard = document.getElementById('nl-float-card');
    var nlCardOpen = false;

    if (nlBtn && nlCard) {
      nlBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        nlCardOpen = !nlCardOpen;
        nlCard.hidden = !nlCardOpen;
      });
      // Fermer card si clic en dehors
      document.addEventListener('click', function(e) {
        if (nlCardOpen && !nlCard.contains(e.target) && e.target !== nlBtn && !nlBtn.contains(e.target)) {
          nlCardOpen = false;
          nlCard.hidden = true;
        }
      });
    }

    // --- SONS DE GUÉRISON ---
    var soundBtn = document.getElementById('sound-toggle');
    var soundContainer = document.getElementById('ufab-sound');
    var audio = document.getElementById('sound-audio');

    if (soundBtn && audio && soundContainer) {
      var iconOff = soundBtn.querySelector('.sound-healer__icon--off');
      var iconOn  = soundBtn.querySelector('.sound-healer__icon--on');
      var isPlaying = false;
      var fadeInterval = null;
      var targetVolume = 0.25;

      function fadeIn(duration) {
        audio.volume = 0;
        audio.play().then(function() {
          var step = targetVolume / (duration / 30);
          clearInterval(fadeInterval);
          fadeInterval = setInterval(function() {
            if (audio.volume + step >= targetVolume) {
              audio.volume = targetVolume;
              clearInterval(fadeInterval);
            } else {
              audio.volume = Math.min(audio.volume + step, 1);
            }
          }, 30);
        }).catch(function(e) {
          console.log('Audio autoplay bloqué:', e);
        });
      }

      function fadeOut(duration) {
        var step = audio.volume / (duration / 30);
        clearInterval(fadeInterval);
        fadeInterval = setInterval(function() {
          if (audio.volume - step <= 0.001) {
            audio.volume = 0;
            audio.pause();
            clearInterval(fadeInterval);
          } else {
            audio.volume = Math.max(audio.volume - step, 0);
          }
        }, 30);
      }

      function updateSoundUI() {
        if (isPlaying) {
          soundContainer.classList.add('ufab-sound--playing');
          if (iconOff) iconOff.style.display = 'none';
          if (iconOn) iconOn.style.display  = '';
          soundBtn.setAttribute('aria-label', 'Désactiver les sons de guérison');
        } else {
          soundContainer.classList.remove('ufab-sound--playing');
          if (iconOff) iconOff.style.display = '';
          if (iconOn) iconOn.style.display  = 'none';
          soundBtn.setAttribute('aria-label', 'Activer les sons de guérison');
        }
        try { safeLocal.setItem('li_sound', isPlaying ? '1' : '0'); } catch(e) {}
      }

      soundBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        isPlaying = !isPlaying;
        updateSoundUI();
        if (isPlaying) {
          fadeIn(1500);
        } else {
          fadeOut(800);
        }
      });

      // Restaurer l'état précédent
      try {
        if (safeLocal.getItem('li_sound') === '1') {
          // Indiquer visuellement que le son était actif
        }
      } catch(e) {}
    }

    // --- PANIER (délègue au cart drawer existant) ---
    var cartBtn = document.getElementById('ufab-cart-btn');
    if (cartBtn) {
      cartBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        // Appeler openCartDrawer si elle existe
        if (typeof openCartDrawer === 'function') {
          openCartDrawer();
        } else {
          // Fallback : simuler clic sur cart-toggle de la nav
          var navCart = document.getElementById('cart-toggle');
          if (navCart) navCart.click();
        }
      });
    }
  })();

  // ─── Interactive pin/unpin system — admin-only buttons, Supabase persistence ───
  // ADMIN_EMAIL already declared at top of file
  // window.__isAdmin already managed by auth state

  // Check if current user is the admin
  async function checkAdmin() {
    if (!supabase) return false;
    try {
      var result = await supabase.auth.getSession();
      var session = result.data.session;
      return !!(session && session.user && session.user.email === ADMIN_EMAIL);
    } catch(e) { return false; }
  }

  // Load pinned slugs from Supabase (for all visitors)
  async function loadPinsFromSupabase() {
    if (!supabase) return JSON.parse(safeLocal.getItem('pinned_items') || '[]');
    try {
      var result = await supabase.from('site_pins').select('slug');
      if (result.error) throw result.error;
      return result.data.map(function(r) { return r.slug; });
    } catch(e) {
      // Fallback to localStorage if table doesn't exist yet
      return JSON.parse(safeLocal.getItem('pinned_items') || '[]');
    }
  }

  // Save a pin to Supabase + localStorage (admin only)
  async function addPinToSupabase(slug) {
    if (supabase) {
      try {
        await supabase.from('site_pins').upsert({ slug: slug, pinned_at: new Date().toISOString() });
      } catch(e) {}
    }
    var items = JSON.parse(safeLocal.getItem('pinned_items') || '[]');
    if (items.indexOf(slug) === -1) items.push(slug);
    safeLocal.setItem('pinned_items', JSON.stringify(items));
  }

  // Remove a pin from Supabase + localStorage (admin only)
  async function removePinFromSupabase(slug) {
    if (supabase) {
      try {
        await supabase.from('site_pins').delete().eq('slug', slug);
      } catch(e) {}
    }
    var items = JSON.parse(safeLocal.getItem('pinned_items') || '[]');
    var idx = items.indexOf(slug);
    if (idx > -1) items.splice(idx, 1);
    safeLocal.setItem('pinned_items', JSON.stringify(items));
  }

  (async function initPinnedSystem() {
    var isAdmin = await checkAdmin();
    window.__isAdmin = isAdmin;
    var pinnedItems = await loadPinsFromSupabase();

    function slugify(text) {
      return (text || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function getCardSlug(card, section) {
      if (section === 'blog') { var titleEl = card.querySelector('.blog-card__title'); return card.getAttribute('data-article') || slugify(titleEl ? titleEl.textContent : ''); }
      var h3 = card.querySelector('h3');
      var prefix = section === 'therapie' ? 'thp-' : (section === 'boutique' ? 'btq-' : 'svc-');
      return h3 ? prefix + slugify(h3.textContent) : null;
    }

    function isPinned(slug) {
      return pinnedItems.indexOf(slug) !== -1;
    }

    async function togglePin(slug) {
      var idx = pinnedItems.indexOf(slug);
      if (idx === -1) {
        pinnedItems.push(slug);
        await addPinToSupabase(slug);
      } else {
        pinnedItems.splice(idx, 1);
        await removePinFromSupabase(slug);
      }
    }

    function createPinButton(slug) {
      var btn = document.createElement('button');
      btn.className = 'pin-toggle-btn' + (isPinned(slug) ? ' pin-toggle-btn--active' : '');
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-label', 'Épingler');
      btn.textContent = '\ud83d\udccc';
      return btn;
    }

    function createBadge() {
      var badge = document.createElement('span');
      badge.className = 'pinned-badge';
      badge.textContent = '\ud83d\udccc \u00c9pingl\u00e9';
      return badge;
    }

    function updateCardVisual(card, slug) {
      var btn = card.querySelector('.pin-toggle-btn');
      var badge = card.querySelector('.pinned-badge');
      if (isPinned(slug)) {
        if (btn) btn.classList.add('pin-toggle-btn--active');
        if (isAdmin && !badge) {
          var imgDiv = card.querySelector('.blog-card__image') || card.querySelector('.service-card__image');
          if (imgDiv) imgDiv.appendChild(createBadge());
        }
      } else {
        if (btn) btn.classList.remove('pin-toggle-btn--active');
        if (badge) badge.remove();
      }
    }

    function reorderCards(grid, cards, section) {
      if (!grid || !cards.length) return;
      var sorted = Array.prototype.slice.call(cards).sort(function(a, b) {
        var aSlug = getCardSlug(a, section);
        var bSlug = getCardSlug(b, section);
        var aP = isPinned(aSlug) ? 0 : 1;
        var bP = isPinned(bSlug) ? 0 : 1;
        return aP - bP;
      });
      sorted.forEach(function(card) { grid.appendChild(card); });
    }

    function setupSection(gridSelector, cardSelector, section) {
      var grid = document.querySelector(gridSelector);
      if (!grid) return;
      var cards = grid.querySelectorAll(cardSelector);
      cards.forEach(function(card) {
        var slug = getCardSlug(card, section);
        if (!slug) return;

        var imgDiv = card.querySelector('.blog-card__image') || card.querySelector('.service-card__image');
        if (!imgDiv) return;

        // Add pin toggle button ONLY for admin
        if (isAdmin && !imgDiv.querySelector('.pin-toggle-btn')) {
          var btn = createPinButton(slug);
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            togglePin(slug).then(function() {
              updateCardVisual(card, slug);
              reorderCards(grid, grid.querySelectorAll(cardSelector), section);
              refreshNouveautes();
            });
          });
          imgDiv.appendChild(btn);
        }

        // Set initial visual state (badges visible to everyone)
        updateCardVisual(card, slug);
      });

      // Initial reorder (visible to everyone)
      reorderCards(grid, cards, section);
    }

    // Setup all sections
    setupSection('.blog-grid', '.blog-card', 'blog');
    setupSection('#therapie .services-grid', '.service-card', 'therapie');
    setupSection('#boutique .services-grid', '.service-card', 'boutique');
    setupSection('#boutique .boutique-grid', '[class*="-card"]', 'boutique');

    // Expose for use by populateNouveautes
    window.__pinnedItems = pinnedItems;
    window.__isPinned = isPinned;

    // Refresh the nouveautes feed
    function refreshNouveautes() {
      window.__pinnedItems = pinnedItems;
      var grid = document.getElementById('nouveautes-grid');
      if (grid) {
        grid.innerHTML = '';
        if (typeof window.__populateNouveautes === 'function') {
          window.__populateNouveautes();
        }
      }
    }

    // Re-render feed with correct Supabase pins and admin status
    refreshNouveautes();

    // ─── Dynamic content from Supabase: blog_articles & boutique_products ───
    initDynamicContent(isAdmin);
  })();

  // ─── Admin content creation system ───

  function adminSlugify(text) {
    return (text || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function todayFrench() {
    var d = new Date();
    var mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    return d.getDate() + ' ' + mois[d.getMonth()] + ' ' + d.getFullYear();
  }

  function showAdminMsg(id, text, isError) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'admin-modal__message admin-modal__message--' + (isError ? 'error' : 'success');
    el.hidden = false;
    if (!isError) setTimeout(function() { el.hidden = true; }, 3000);
  }

  // Toast notification for Stripe sync feedback
  function showStripeToast(message, isError) {
    var toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;padding:12px 20px;border-radius:8px;font-size:0.9rem;max-width:420px;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.3s;'
      + (isError ? 'background:#fdecea;color:#b71c1c;border:1px solid #e57373;' : 'background:#e8f5e9;color:#2e7d32;border:1px solid #81c784;');
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() { toast.remove(); }, 300);
    }, isError ? 5000 : 3000);
  }

  // openModal/closeModal — unified version (extends the base version above)
  // We override the earlier openModal/closeModal to add admin modal cleanup
  (function() {
    var _baseOpenModal = openModal;
    var _baseCloseModal = closeModal;
    openModal = function(id) {
      var modal = document.getElementById(id);
      if (!modal) return;
      modal.hidden = false;
      // If it's an admin modal, no need for body overflow (they're inline)
      if (!modal.classList.contains('admin-modal')) {
        document.body.style.overflow = 'hidden';
      }
      setTimeout(function () {
        var firstBtn = modal.querySelector('.btn, button, input, textarea, select');
        if (firstBtn) firstBtn.focus();
      }, 100);
    };
    closeModal = function(id) {
      var modal = document.getElementById(id);
      if (!modal) return;
      modal.hidden = true;
      if (!modal.classList.contains('admin-modal')) {
        document.body.style.overflow = '';
      }
      // Admin modal cleanup
      var form = modal.querySelector('form');
      if (form) form.reset();
      var msg = modal.querySelector('.admin-modal__message');
      if (msg) msg.hidden = true;
      var fileInput = modal.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      var preview = modal.querySelector('[id$="-image-preview"]');
      if (preview) preview.style.display = 'none';
    };
  })();

  // Close modals on backdrop click / close button
  document.querySelectorAll('.admin-modal__backdrop').forEach(function(bd) {
    bd.addEventListener('click', function() {
      var modal = bd.closest('.admin-modal');
      if (modal) modal.hidden = true;
    });
  });
  document.querySelectorAll('.admin-modal__close').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var modal = btn.closest('.admin-modal');
      if (modal) modal.hidden = true;
    });
  });

  // Set default date in blog form
  var blogDateField = document.getElementById('admin-blog-date');
  if (blogDateField) blogDateField.value = todayFrench();

  // --- Create a blog card DOM element from data ---
  function createBlogCardElement(data, isAdmin) {
    var card = document.createElement('article');
    card.className = 'blog-card fade-in';
    card.setAttribute('data-article', data.slug);
    card.setAttribute('data-dynamic', 'true');
    card.innerHTML =
      '<div class="blog-card__image">' +
        (isAdmin ? '<button class="admin-delete-btn" data-delete-type="blog" data-delete-slug="' + data.slug + '" title="Supprimer">\ud83d\uddd1\ufe0f</button>' : '') +
        '<img src="' + (data.image_url || 'hero-voyance.png') + '" alt="' + data.title + '" width="640" height="400" loading="lazy">' +
      '</div>' +
      '<div class="blog-card__content">' +
        '<p class="blog-card__category">' + data.category + '</p>' +
        '<h2 class="blog-card__title">' + data.title + '</h2>' +
        '<p class="blog-card__excerpt">' + data.excerpt + '</p>' +
        '<p class="blog-card__date">' + data.date_publication + '</p>' +
        '<div class="blog-card__stats">' +
          '<span class="blog-card__views"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> <span class="view-count">0</span></span>' +
          '<button class="blog-card__heart" aria-label="Aimer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> <span class="heart-count">0</span></button>' +
        '</div>' +
      '</div>';
    return card;
  }

  // --- Create a boutique product card DOM element from data ---
  function createProductCardElement(data, isAdmin) {
    var card = document.createElement('div');
    card.className = 'boutique-product-card fade-in' + (isAdmin && data.visible === false ? ' boutique-product-card--hidden' : '');
    card.setAttribute('data-product-slug', data.slug);
    card.setAttribute('data-dynamic', 'true');
    var hiddenBadge = (isAdmin && data.visible === false) ? '<span class="boutique-product-card__badge-hidden">Masqu\u00e9</span>' : '';
    var isInStock = data.status !== 'epuise';
    var stockBadge = isInStock
      ? '<span class="boutique-product-card__stock-badge boutique-product-card__stock-badge--in">En stock</span>'
      : '<span class="boutique-product-card__stock-badge boutique-product-card__stock-badge--out">&Eacute;puis&eacute;</span>';

    // Build images array: main image + extra images
    var allImages = [data.image_url || 'crystals-nature.png'];
    if (data.extra_images && data.extra_images.length > 0) {
      for (var ei = 0; ei < data.extra_images.length; ei++) {
        allImages.push(data.extra_images[ei].image_url);
      }
    }

    var imageHTML = '';
    if (allImages.length > 1) {
      // Carousel with multiple images
      var slidesHTML = '';
      for (var si = 0; si < allImages.length; si++) {
        slidesHTML += '<div class="product-carousel__slide"><img src="' + allImages[si] + '" alt="' + data.name + ' - photo ' + (si + 1) + '" width="640" height="400" loading="lazy"></div>';
      }
      var dotsHTML = '<div class="product-carousel__dots">';
      for (var di = 0; di < allImages.length; di++) {
        dotsHTML += '<button class="product-carousel__dot' + (di === 0 ? ' product-carousel__dot--active' : '') + '" data-slide="' + di + '" aria-label="Photo ' + (di + 1) + '"></button>';
      }
      dotsHTML += '</div>';
      imageHTML =
        '<div class="product-carousel" data-carousel>' +
          '<div class="product-carousel__track">' + slidesHTML + '</div>' +
          '<button class="product-carousel__btn product-carousel__btn--prev" data-carousel-prev aria-label="Pr\u00e9c\u00e9dent">&#10094;</button>' +
          '<button class="product-carousel__btn product-carousel__btn--next" data-carousel-next aria-label="Suivant">&#10095;</button>' +
          dotsHTML +
        '</div>';
    } else {
      // Single image (no carousel)
      imageHTML = '<img src="' + allImages[0] + '" alt="' + data.name + '" width="640" height="400" loading="lazy">';
    }

    // Tronquer la description si trop longue (seuil : 100 caract\u00e8res)
    var descText = data.description || '';
    var descMax = 100;
    var isTruncated = descText.length > descMax;
    var descShort = isTruncated ? descText.substring(0, descMax).replace(/\s+\S*$/, '') + '\u2026' : descText;
    // Formater la description complète avec des paragraphes (séparer sur les retours à la ligne)
    var descFullFormatted = descText.split(/\n+/).filter(function(p) { return p.trim(); }).map(function(p) {
      return '<p style="margin:0.4rem 0;line-height:1.5">' + sanitizeForHtml(p.trim()) + '</p>';
    }).join('');

    var addCartBtnHTML = isInStock
      ? '<button class="boutique-product-card__add-cart" type="button" data-add-cart>' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' +
          ' Ajouter au panier' +
        '</button>'
      : '<button class="boutique-product-card__add-cart boutique-product-card__add-cart--disabled" type="button" disabled>' +
          '\u00c9puis\u00e9' +
        '</button>';

    card.innerHTML =
      '<div class="boutique-product-card__image">' +
        (isAdmin ? '<button class="admin-delete-btn" data-delete-type="boutique" data-delete-slug="' + data.slug + '" title="Supprimer">\ud83d\uddd1\ufe0f</button>' : '') +
        hiddenBadge +
        stockBadge +
        imageHTML +
      '</div>' +
      '<div class="boutique-product-card__content">' +
        '<p class="boutique-product-card__category">' + data.category + '</p>' +
        '<h3 class="boutique-product-card__name">' + data.name + '</h3>' +
        '<div class="boutique-product-card__desc-wrap">' +
          '<p class="boutique-product-card__desc boutique-product-card__desc--short">' + descShort + '</p>' +
          '<div class="boutique-product-card__desc boutique-product-card__desc--full" hidden>' + (descFullFormatted || sanitizeForHtml(descText)) + '</div>' +
          (isTruncated ? '<button class="boutique-product-card__more" type="button">Afficher plus</button>' : '') +
        '</div>' +
        '<div class="boutique-product-card__footer">' +
          '<p class="boutique-product-card__price">' + parseFloat(data.price).toFixed(2) + ' \u20ac</p>' +
          addCartBtnHTML +
        '</div>' +
      '</div>';

    // Initialize carousel if present
    initProductCarousel(card);

    // Bouton "Afficher plus" : bascule description courte/compl\u00e8te
    var moreBtn = card.querySelector('.boutique-product-card__more');
    if (moreBtn) {
      moreBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = card.querySelector('.boutique-product-card__desc-wrap');
        var shortP = wrap.querySelector('.boutique-product-card__desc--short');
        var fullP = wrap.querySelector('.boutique-product-card__desc--full');
        var isExpanded = !fullP.hidden;
        shortP.hidden = !isExpanded;
        fullP.hidden = isExpanded;
        moreBtn.textContent = isExpanded ? 'Afficher plus' : 'Afficher moins';
      });
    }

    // Bouton "Ajouter au panier"
    var addCartBtn = card.querySelector('[data-add-cart]');
    if (addCartBtn) {
      addCartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
          slug: data.slug,
          name: data.name,
          price: data.price,
          image_url: data.image_url || 'crystals-nature.png',
          category: data.category || '',
          stripe_link: data.stripe_link || ''
        });
      });
    }

    return card;
  }

  // --- Initialize carousel on a product card ---
  function initProductCarousel(card) {
    var carousel = card.querySelector('[data-carousel]');
    if (!carousel) return;
    var track = carousel.querySelector('.product-carousel__track');
    var dots = carousel.querySelectorAll('.product-carousel__dot');
    var prevBtn = carousel.querySelector('[data-carousel-prev]');
    var nextBtn = carousel.querySelector('[data-carousel-next]');
    var slideCount = carousel.querySelectorAll('.product-carousel__slide').length;
    var currentSlide = 0;

    function goToSlide(index) {
      if (index < 0) index = slideCount - 1;
      if (index >= slideCount) index = 0;
      currentSlide = index;
      track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
      for (var d = 0; d < dots.length; d++) {
        dots[d].classList.toggle('product-carousel__dot--active', d === currentSlide);
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); goToSlide(currentSlide - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); goToSlide(currentSlide + 1); });
    for (var d = 0; d < dots.length; d++) {
      dots[d].addEventListener('click', (function(idx) { return function(e) { e.preventDefault(); e.stopPropagation(); goToSlide(idx); }; })(d));
    }

    // Swipe support (touch)
    var startX = 0;
    carousel.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', function(e) {
      var diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { goToSlide(currentSlide + (diff > 0 ? 1 : -1)); }
    }, { passive: true });
  }

  // --- Attach delete handler ---
  function attachDeleteHandler(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var type = btn.getAttribute('data-delete-type');
      var slug = btn.getAttribute('data-delete-slug');
      var label = type === 'blog' ? 'cet article' : 'ce produit';
      if (!confirm('Supprimer ' + label + ' ?')) return;

      var table = type === 'blog' ? 'blog_articles' : 'boutique_products';
      supabase.from(table).delete().eq('slug', slug).then(function(result) {
        if (result.error) {
          alert('Erreur : ' + result.error.message);
          return;
        }
        // Remove from DOM
        if (type === 'blog') {
          var card = document.querySelector('.blog-card[data-article="' + slug + '"][data-dynamic]');
          if (card) card.remove();
          delete blogArticles[slug];
        } else {
          // Also delete associated extra images
          safeSupabase(function() { return supabase.from('product_images').delete().eq('product_slug', slug); }, 'suppression des images produit');
          var pcard = document.querySelector('.boutique-product-card[data-product-slug="' + slug + '"]');
          if (pcard) pcard.remove();
          // Show "coming soon" if no more products
          var grid = document.getElementById('boutique-products-grid');
          if (grid && grid.children.length === 0) {
            var coming = document.querySelector('.boutique-coming');
            if (coming) coming.style.display = '';
          }
        }
        // Refresh feed
        var feedGrid = document.getElementById('nouveautes-grid');
        if (feedGrid) { feedGrid.innerHTML = ''; }
        if (typeof window.__populateNouveautes === 'function') window.__populateNouveautes();
      });
    });
  }

  // --- Load dynamic content from Supabase on page load ---
  var _initDynamicRunning = false;
  async function initDynamicContent(isAdmin) {
    // Prevent concurrent calls — if already running, skip
    if (_initDynamicRunning) { console.log('[initDynamic] Skipped (already running)'); return; }
    _initDynamicRunning = true;
    try {
    // Clean up previous dynamic content to prevent duplicates on re-call
    var blogGrid = document.querySelector('.blog-grid');
    if (blogGrid) {
      blogGrid.querySelectorAll('[data-dynamic]').forEach(function(el) { el.remove(); });
      blogGrid.querySelectorAll('.admin-add-btn').forEach(function(el) { el.remove(); });
    }
    var prodGrid = document.getElementById('boutique-products-grid');
    if (prodGrid) prodGrid.innerHTML = '';
    // Remove all admin buttons from the entire boutique page (not just prodGrid parent)
    var boutiquePage = document.getElementById('boutique');
    if (boutiquePage) {
      boutiquePage.querySelectorAll('.admin-add-btn--boutique').forEach(function(el) { el.remove(); });
      boutiquePage.querySelectorAll('.admin-add-btn--coupon').forEach(function(el) { el.remove(); });
    }

    // Load blog articles
    try {
      var blogResult = await supabase.from('blog_articles').select('*').order('created_at', { ascending: false });
      if (!blogResult.error && blogResult.data) {
        var blogGrid = document.querySelector('.blog-grid');
        blogResult.data.forEach(function(article) {
          // Add to blogArticles JS object for overlay
          blogArticles[article.slug] = {
            category: article.category,
            title: article.title,
            date: article.date_publication,
            content: article.content
          };
          // Create card and append
          if (blogGrid) {
            var card = createBlogCardElement(article, isAdmin);
            blogGrid.appendChild(card);
            // Attach click to open overlay
            card.addEventListener('click', function(e) {
              if (e.target.closest('.admin-delete-btn') || e.target.closest('.blog-card__heart')) return;
              openBlogArticle(article.slug);
            });
            // Attach delete handler
            var delBtn = card.querySelector('.admin-delete-btn');
            if (delBtn) attachDeleteHandler(delBtn);
          }
        });
      }
    } catch(e) { /* table may not exist yet */ }

    // Load boutique products + their extra images
    // Produits démo (visibles uniquement pour l'admin, utilisés si la table Supabase est vide)
    var DEMO_PRODUCTS = [
      {
        slug: 'amethyste-pierre-roulee', name: 'Am\u00e9thyste \u2014 Pierre roul\u00e9e',
        description: 'Pierre roul\u00e9e d\u2019am\u00e9thyste naturelle, soigneusement s\u00e9lectionn\u00e9e. Favorise l\u2019intuition, la s\u00e9r\u00e9nit\u00e9 et la m\u00e9ditation. Taille\u00a0: 2-3\u00a0cm environ.\n\nL\u2019am\u00e9thyste est l\u2019une des pierres les plus populaires en lithoth\u00e9rapie, appr\u00e9ci\u00e9e depuis l\u2019Antiquit\u00e9 pour ses vertus apaisantes et spirituelles.\n\nPlan physique\nSommeil\u00a0: favorise un sommeil r\u00e9parateur et aide \u00e0 lutter contre les insomnies\nMaux de t\u00eate\u00a0: r\u00e9put\u00e9e pour soulager les tensions et les c\u00e9phal\u00e9es\nSyst\u00e8me nerveux\u00a0: apaise le syst\u00e8me nerveux et r\u00e9duit le stress physique\nD\u00e9toxification\u00a0: traditionnellement associ\u00e9e \u00e0 la purification du corps\n\nPlan \u00e9motionnel et mental\n- Apaisement\u00a0: calme les pens\u00e9es excessives et l\u2019anxi\u00e9t\u00e9\n- Clart\u00e9 mentale\u00a0: aide \u00e0 prendre du recul et \u00e0 voir les situations avec lucidit\u00e9\n- \u00c9quilibre \u00e9motionnel\u00a0: temp\u00e8re les sautes d\u2019humeur et les \u00e9motions excessives\n- Lâcher-prise\u00a0: accompagne la lib\u00e9ration des sch\u00e9mas r\u00e9p\u00e9titifs et des attachements\n\nPlan spirituel\n- Intuition\u00a0: ouvre le troisi\u00e8me \u0153il et renforce les capacit\u00e9s intuitives\n- M\u00e9ditation\u00a0: facilite l\u2019entr\u00e9e en m\u00e9ditation et approfondit la pratique\n- Protection\u00a0: cr\u00e9e un bouclier \u00e9nerg\u00e9tique contre les influences n\u00e9gatives\n- \u00c9l\u00e9vation\u00a0: favorise la connexion aux plans sup\u00e9rieurs de conscience\n\nChakra\u00a0: troisi\u00e8me \u0153il (6e chakra), couronne (7e chakra)\n\nSignes astrologiques\u00a0: Poissons, Vierge, Sagittaire\n\n\u00c9l\u00e9ment\u00a0: Air\n\nRechargement\u00a0: lumi\u00e8re lunaire (\u00e9viter le soleil direct qui peut alt\u00e9rer sa couleur), g\u00e9ode de quartz\n\nPurification\u00a0: eau claire, fumigation (sauge, palo santo)\n\nPierres compl\u00e9mentaires\u00a0: s\u2019associe bien avec le quartz rose (douceur), la labradorite (protection) ou la pierre de lune (f\u00e9minit\u00e9)\n\nCes propri\u00e9t\u00e9s rel\u00e8vent de la tradition lithoth\u00e9rapeutique et ne se substituent pas \u00e0 un avis m\u00e9dical.',
        price: 8.90, category: 'Cristaux', image_url: 'crystals-nature.png',
        stripe_link: BOUTIQUE_STRIPE_LINKS['amethyste-pierre-roulee'], visible: false, status: 'disponible', _demo: true
      },
      {
        slug: 'quartz-rose-pierre-brute', name: 'Quartz Rose \u2014 Pierre brute',
        description: 'Pierre brute de quartz rose naturel, pierre de l\u2019amour inconditionnel et de la paix int\u00e9rieure. Taille\u00a0: 3-5\u00a0cm environ.\n\nLe quartz rose est consid\u00e9r\u00e9 comme la pierre du c\u0153ur par excellence, symbole universel d\u2019amour et de tendresse.\n\nPlan physique\nSyst\u00e8me circulatoire\u00a0: r\u00e9put\u00e9 pour renforcer le c\u0153ur et favoriser une bonne circulation sanguine\nPeau\u00a0: traditionnellement associ\u00e9 \u00e0 l\u2019\u00e9clat du teint et \u00e0 la r\u00e9g\u00e9n\u00e9ration cutan\u00e9e\nSyst\u00e8me nerveux\u00a0: apaise les tensions et favorise la d\u00e9tente profonde\nSommeil\u00a0: aide \u00e0 trouver un sommeil paisible et r\u00e9parateur\n\nPlan \u00e9motionnel et mental\n- Amour de soi\u00a0: encourage la bienveillance envers soi-m\u00eame et l\u2019acceptation\n- Gu\u00e9rison \u00e9motionnelle\u00a0: aide \u00e0 panser les blessures affectives et \u00e0 lib\u00e9rer les peines de c\u0153ur\n- Confiance\u00a0: renforce l\u2019estime de soi et la capacit\u00e9 \u00e0 donner et recevoir l\u2019amour\n- Douceur\u00a0: temp\u00e8re l\u2019agressivit\u00e9 et apporte la paix int\u00e9rieure\n\nPlan spirituel\n- Ouverture du c\u0153ur\u00a0: active et harmonise le chakra du c\u0153ur\n- Compassion\u00a0: d\u00e9veloppe l\u2019empathie et le pardon\n- Harmonie relationnelle\u00a0: favorise les relations saines et \u00e9quilibr\u00e9es\n- Paix int\u00e9rieure\u00a0: invite \u00e0 la s\u00e9r\u00e9nit\u00e9 et \u00e0 la douceur de vivre\n\nChakra\u00a0: c\u0153ur (4e chakra)\n\nSignes astrologiques\u00a0: Taureau, Balance, Cancer\n\n\u00c9l\u00e9ment\u00a0: Eau\n\nRechargement\u00a0: lumi\u00e8re lunaire, amas de quartz\n\nPurification\u00a0: eau claire, fumigation (sauge, palo santo)\n\nPierres compl\u00e9mentaires\u00a0: s\u2019associe bien avec l\u2019am\u00e9thyste (apaisement), la rhodonite (gu\u00e9rison \u00e9motionnelle) ou la kunzite (ouverture du c\u0153ur)\n\nCes propri\u00e9t\u00e9s rel\u00e8vent de la tradition lithoth\u00e9rapeutique et ne se substituent pas \u00e0 un avis m\u00e9dical.',
        price: 12.90, category: 'Cristaux', image_url: 'crystals-nature.png',
        stripe_link: BOUTIQUE_STRIPE_LINKS['quartz-rose-pierre-brute'], visible: false, status: 'disponible', _demo: true
      },
      {
        slug: 'tourmaline-noire-pierre-de-protection', name: 'Tourmaline Noire \u2014 Pierre de protection',
        description: 'Tourmaline noire naturelle, pierre de protection par excellence. Absorbe les \u00e9nergies n\u00e9gatives et favorise l\u2019ancrage. Taille\u00a0: 2-4\u00a0cm environ.\n\nLa tourmaline noire (ou schorl) est la pierre de protection la plus r\u00e9put\u00e9e en lithoth\u00e9rapie, v\u00e9ritable bouclier \u00e9nerg\u00e9tique.\n\nPlan physique\nProtection \u00e9lectromagn\u00e9tique\u00a0: r\u00e9put\u00e9e pour absorber les ondes \u00e9lectromagn\u00e9tiques (\u00e9crans, Wi-Fi)\nSyst\u00e8me immunitaire\u00a0: traditionnellement associ\u00e9e au renforcement des d\u00e9fenses naturelles\nCirculation\u00a0: favorise une bonne circulation sanguine et \u00e9nerg\u00e9tique\nAncrage corporel\u00a0: reconnecte au corps physique et \u00e0 la sensation de solidit\u00e9\n\nPlan \u00e9motionnel et mental\n- Protection psychique\u00a0: agit comme un bouclier contre les \u00e9nergies n\u00e9gatives et les influences ext\u00e9rieures\n- Ancrage\u00a0: l\u2019une des pierres d\u2019ancrage les plus puissantes, stabilise et recentre\n- Confiance\u00a0: renforce le sentiment de s\u00e9curit\u00e9 int\u00e9rieure\n- Clart\u00e9\u00a0: aide \u00e0 dissiper la confusion mentale et les pens\u00e9es parasites\n\nPlan spirituel\n- Purification\u00a0: nettoie l\u2019aura et les espaces des \u00e9nergies stagnantes\n- Enracinement\u00a0: connecte profond\u00e9ment \u00e0 l\u2019\u00e9nergie terrestre\n- Protection lors de pratiques\u00a0: indispensable lors de m\u00e9ditations ou tirages pour prot\u00e9ger l\u2019espace sacr\u00e9\n- Transmutation\u00a0: transforme les \u00e9nergies lourdes en \u00e9nergies neutres\n\nChakra\u00a0: racine (1er chakra)\n\nSignes astrologiques\u00a0: Capricorne, Scorpion, Balance\n\n\u00c9l\u00e9ment\u00a0: Terre\n\nRechargement\u00a0: soleil, amas de quartz ou g\u00e9ode d\u2019am\u00e9thyste\n\nPurification\u00a0: eau courante, fumigation (sauge, palo santo), terre\n\nPierres compl\u00e9mentaires\u00a0: s\u2019associe bien avec la labradorite (protection renforc\u00e9e), l\u2019\u0153il de tigre (ancrage) ou l\u2019am\u00e9thyste (apaisement)\n\nCes propri\u00e9t\u00e9s rel\u00e8vent de la tradition lithoth\u00e9rapeutique et ne se substituent pas \u00e0 un avis m\u00e9dical.',
        price: 14.90, category: 'Cristaux', image_url: 'crystals-nature.png',
        stripe_link: BOUTIQUE_STRIPE_LINKS['tourmaline-noire-pierre-de-protection'], visible: false, status: 'disponible', _demo: true
      },
      {
        slug: 'sauge-blanche-baton-de-purification', name: 'Sauge Blanche \u2014 B\u00e2ton de purification',
        description: 'B\u00e2ton de sauge blanche de Californie pour la purification \u00e9nerg\u00e9tique des espaces et des personnes. Longueur\u00a0: environ 10\u00a0cm.\n\nLa sauge blanche (Salvia apiana) est utilis\u00e9e depuis des si\u00e8cles par les peuples am\u00e9rindiens pour ses propri\u00e9t\u00e9s purifiantes et protectrices.\n\nPropri\u00e9t\u00e9s\nPurification des espaces\u00a0: la fum\u00e9e de sauge neutralise les \u00e9nergies stagnantes et n\u00e9gatives dans un lieu\nNettoyage \u00e9nerg\u00e9tique\u00a0: purifie l\u2019aura et les objets (cristaux, cartes, pendules)\nProtection\u00a0: cr\u00e9e une barri\u00e8re \u00e9nerg\u00e9tique protectrice apr\u00e8s la purification\nRelaxation\u00a0: son parfum herbac\u00e9 favorise la d\u00e9tente et la concentration\n\nUtilisation\n- Allumez l\u2019extr\u00e9mit\u00e9 du b\u00e2ton et soufflez d\u00e9licatement pour obtenir une fum\u00e9e douce\n- Passez dans chaque pi\u00e8ce en insistant sur les coins et les zones de passage\n- Ouvrez une fen\u00eatre pour laisser les \u00e9nergies n\u00e9gatives s\u2019\u00e9vacuer\n- Id\u00e9al avant une m\u00e9ditation, un tirage de cartes ou une consultation\n- \u00c9teignez en posant le b\u00e2ton dans un r\u00e9cipient r\u00e9sistant \u00e0 la chaleur (coquille d\u2019ormeau, c\u00e9ramique)\n\nConseils\n- Ne jamais laisser la sauge br\u00fbler sans surveillance\n- Conserver dans un endroit sec \u00e0 l\u2019abri de la lumi\u00e8re\n- Un b\u00e2ton peut servir pour plusieurs purifications\n- Compl\u00e9mentaire avec le palo santo pour une purification douce\n\nAssociations courantes\u00a0: palo santo, tourmaline noire, am\u00e9thyste, s\u00e9l\u00e9nite\n\nCes informations rel\u00e8vent de la tradition \u00e9nerg\u00e9tique et ne se substituent pas \u00e0 un avis m\u00e9dical.',
        price: 7.50, category: 'Encens & Purification', image_url: 'crystals-nature.png',
        stripe_link: BOUTIQUE_STRIPE_LINKS['sauge-blanche-baton-de-purification'], visible: false, status: 'disponible', _demo: true
      },
      {
        slug: 'pendule-spirale-dore', name: 'Pendule Spirale Dor\u00e9',
        description: 'Pendule divinatoire en laiton, forme spirale conique avec cha\u00eene et perle ornementale. Id\u00e9al pour la radiesth\u00e9sie, la divination et la guidance intuitive. Livr\u00e9 avec sa cha\u00eene dor\u00e9e.\n\nLe pendule est l\u2019un des outils de divination les plus anciens et les plus accessibles. Sa forme en spirale favorise une circulation harmonieuse de l\u2019\u00e9nergie.\n\nCaract\u00e9ristiques\nMat\u00e9riau\u00a0: laiton dor\u00e9 de qualit\u00e9\nForme\u00a0: spirale conique, favorisant un mouvement fluide et pr\u00e9cis\nCha\u00eene\u00a0: cha\u00eene dor\u00e9e avec perle de pr\u00e9hension\nPoids\u00a0: \u00e9quilibr\u00e9 pour une oscillation naturelle et r\u00e9active\n\nUtilisation\n- Tenez le pendule par la perle entre le pouce et l\u2019index, le coude l\u00e9g\u00e8rement soulev\u00e9\n- Laissez-le se stabiliser puis posez votre question (r\u00e9ponse oui/non)\n- Convenez d\u2019abord de la signification des mouvements (rotation horaire = oui, antihoraire = non, par exemple)\n- Utilisez-le au-dessus d\u2019une planche de radiesth\u00e9sie pour des r\u00e9ponses plus d\u00e9taill\u00e9es\n- Nettoyez-le \u00e9nerg\u00e9tiquement r\u00e9guli\u00e8rement (fumigation, souffle, intention)\n\nConseils\n- Commencez par des questions simples dont vous connaissez la r\u00e9ponse pour calibrer votre pendule\n- Restez d\u00e9tendu et neutre\u00a0: \u00e9vitez d\u2019influencer le mouvement avec vos attentes\n- Pratiquez r\u00e9guli\u00e8rement pour affiner votre connexion intuitive\n- Conservez votre pendule dans une pochette d\u00e9di\u00e9e pour pr\u00e9server son \u00e9nergie\n\nAssociations courantes\u00a0: am\u00e9thyste (intuition), labradorite (protection), quartz clair (amplification)\n\nCes informations rel\u00e8vent de la tradition \u00e9nerg\u00e9tique et divinatoire et ne se substituent pas \u00e0 un avis m\u00e9dical.',
        price: 19.90, category: 'Accessoires', image_url: 'crystals-nature.png',
        stripe_link: BOUTIQUE_STRIPE_LINKS['pendule-spirale-dore'], visible: false, status: 'disponible', _demo: true
      },
      {
        slug: 'bracelet-elastique-6mm', name: 'Bracelet \u00c9lastique en Jaspe rouge \u2014 6\u00a0mm',
        description: 'Bracelet en Jaspe rouge de 6\u00a0mm mont\u00e9 sur \u00e9lastique r\u00e9sistant. L\u00e9ger et confortable, il s\u2019adapte \u00e0 tous les poignets. Id\u00e9al pour b\u00e9n\u00e9ficier des bienfaits de la lithoth\u00e9rapie au quotidien.\n\nLe jaspe rouge est une pierre tr\u00e8s appr\u00e9ci\u00e9e en lithoth\u00e9rapie pour ses vertus dynamisantes et protectrices.\n\nPlan physique\nVitalit\u00e9 et \u00e9nergie\u00a0: pierre dynamisante, elle stimule le corps et combat la fatigue\nCirculation sanguine\u00a0: r\u00e9put\u00e9e pour favoriser une bonne circulation et r\u00e9guler le syst\u00e8me sanguin\nSyst\u00e8me reproducteur\u00a0: traditionnellement associ\u00e9e \u00e0 la fertilit\u00e9 et \u00e0 l\u2019\u00e9quilibre hormonal\nAncrage corporel\u00a0: li\u00e9e au chakra racine, elle renforce le sentiment d\u2019enracinement physique\n\nPlan \u00e9motionnel et mental\n- Courage et d\u00e9termination\u00a0: consid\u00e9r\u00e9e comme une pierre de volont\u00e9, elle aide \u00e0 surmonter les obstacles\n- Stabilit\u00e9 \u00e9motionnelle\u00a0: apporte un sentiment de s\u00e9curit\u00e9 int\u00e9rieure et calme les \u00e9motions excessives\n- Confiance en soi\u00a0: encourage l\u2019affirmation de soi et la prise de d\u00e9cision\n- Protection\u00a0: traditionnellement utilis\u00e9e comme bouclier contre les \u00e9nergies n\u00e9gatives\n\nPlan spirituel\n- Ancrage et enracinement\u00a0: connecte \u00e0 l\u2019\u00e9nergie terrestre via le chakra racine (Muladhara)\n- Endurance spirituelle\u00a0: soutient la pers\u00e9v\u00e9rance dans les pratiques m\u00e9ditatives\n- Connexion \u00e0 la Terre\u00a0: renforce le lien avec la nature et les cycles naturels\n\nChakra\u00a0: racine (1er chakra)\n\nSignes astrologiques\u00a0: B\u00e9lier, Scorpion, Taureau\n\n\u00c9l\u00e9ment\u00a0: Terre\n\nRechargement\u00a0: soleil, amas de quartz ou g\u00e9ode d\u2019am\u00e9thyste\n\nPurification\u00a0: eau claire, fumigation (sauge, palo santo)\n\nPierres compl\u00e9mentaires\u00a0: s\u2019associe bien avec la cornaline (cr\u00e9ativit\u00e9), l\u2019\u0153il de tigre (protection) ou l\u2019h\u00e9matite (ancrage)\n\nCes propri\u00e9t\u00e9s rel\u00e8vent de la tradition lithoth\u00e9rapeutique et ne se substituent pas \u00e0 un avis m\u00e9dical.',
        price: 14.90, category: 'Bijoux & Lithoth\u00e9rapie', image_url: 'crystals-nature.png',
        stripe_link: BOUTIQUE_STRIPE_LINKS['bracelet-elastique-6mm'], visible: true, status: 'disponible', _demo: true
      },
      {
        slug: 'bracelet-pierre-de-lave-6mm', name: 'Bracelet \u00c9lastique Pierre de Lave \u2014 6\u00a0mm',
        description: 'Bracelet en perles de pierre de lave naturelle de 6\u00a0mm sur \u00e9lastique r\u00e9sistant. Pierre volcanique d\u2019ancrage et de protection, la lave apporte force int\u00e9rieure et stabilit\u00e9 \u00e9motionnelle. Poreuse, elle peut servir de diffuseur d\u2019huiles essentielles. L\u00e9ger et discret, il se porte au quotidien.',
        price: 14.90, category: 'Bijoux & Lithoth\u00e9rapie', image_url: 'crystals-nature.png',
        stripe_link: BOUTIQUE_STRIPE_LINKS['bracelet-pierre-de-lave-6mm'], visible: true, status: 'disponible', _demo: true
      },
      {
        slug: 'bracelet-lapis-lazuli-6mm', name: 'Bracelet \u00c9lastique Lapis-Lazuli \u2014 6\u00a0mm',
        description: 'Bracelet en perles de lapis-lazuli naturel de 6\u00a0mm mont\u00e9 sur \u00e9lastique r\u00e9sistant. Ses perles bleu royal profond parsem\u00e9es d\u2019\u00e9clats dor\u00e9s de pyrite en font un bijou aussi \u00e9l\u00e9gant que spirituel. L\u00e9ger et confortable, il se porte au quotidien.\n\nLe lapis-lazuli est une pierre sacr\u00e9e depuis l\u2019\u00c9gypte ancienne et la M\u00e9sopotamie, symbole de sagesse, de v\u00e9rit\u00e9 et de royaut\u00e9. Il \u00e9tait broy\u00e9 pour fabriquer le pigment outremer, le plus pr\u00e9cieux des bleus.\n\nPlan physique\nSyst\u00e8me nerveux\u00a0: apaise les maux de t\u00eate, les migraines et les tensions nerveuses\nGorge et voix\u00a0: r\u00e9put\u00e9 pour soulager les affections de la gorge et favoriser la voix\nSommeil\u00a0: aide \u00e0 lutter contre les insomnies et favorise des r\u00eaves r\u00e9parateurs\nPeau\u00a0: traditionnellement associ\u00e9 \u00e0 la r\u00e9g\u00e9n\u00e9ration cutan\u00e9e et aux probl\u00e8mes d\u2019allergie\n\nPlan \u00e9motionnel et mental\n- Sagesse\u00a0: stimule l\u2019intelligence, la clart\u00e9 d\u2019esprit et le discernement\n- Expression de soi\u00a0: lib\u00e8re la parole et encourage la communication authentique\n- Confiance\u00a0: renforce l\u2019estime de soi et aide \u00e0 s\u2019affirmer avec s\u00e9r\u00e9nit\u00e9\n- Cr\u00e9ativit\u00e9\u00a0: stimule l\u2019imagination et l\u2019inspiration artistique\n- Honn\u00eatet\u00e9\u00a0: encourage la v\u00e9rit\u00e9 int\u00e9rieure et la sinc\u00e9rit\u00e9 dans les relations\n\nPlan spirituel\n- Troisi\u00e8me \u0153il\u00a0: ouvre et active le chakra du troisi\u00e8me \u0153il, renfor\u00e7ant l\u2019intuition et la clairvoyance\n- \u00c9l\u00e9vation spirituelle\u00a0: facilite la m\u00e9ditation profonde et l\u2019acc\u00e8s \u00e0 la connaissance int\u00e9rieure\n- Protection\u00a0: bouclier puissant contre les attaques psychiques et les \u00e9nergies n\u00e9gatives\n- Harmonisation\u00a0: \u00e9quilibre les \u00e9nergies entre le corps et l\u2019esprit\n\nAssociations courantes\nChakra\u00a0: troisi\u00e8me \u0153il (6e chakra), gorge (5e chakra)\nSignes astrologiques\u00a0: Sagittaire, Poissons, Verseau\n\u00c9l\u00e9ment\u00a0: Eau\nRechargement\u00a0: lumi\u00e8re lunaire, amas de quartz (\u00e9viter le soleil direct)\nPurification\u00a0: fumigation (sauge, palo santo), son (bol tib\u00e9tain) \u2014 \u00e9viter l\u2019eau et le sel\nPierres compl\u00e9mentaires\u00a0: s\u2019associe bien avec la sodalite (communication), l\u2019am\u00e9thyste (spiritualit\u00e9) ou la labradorite (protection)\n\nCes propri\u00e9t\u00e9s rel\u00e8vent de la tradition lithoth\u00e9rapeutique et ne se substituent pas \u00e0 un avis m\u00e9dical.',
        price: 16.90, category: 'Bijoux & Lithoth\u00e9rapie', image_url: 'bracelet-lapis-lazuli-6mm.png',
        stripe_link: '', visible: true, status: 'disponible', _demo: true
      },
      {
        slug: 'bracelet-hematite-6mm', name: 'Bracelet \u00c9lastique H\u00e9matite \u2014 6\u00a0mm',
        description: 'Bracelet en perles d\u2019h\u00e9matite naturelle de 6\u00a0mm mont\u00e9 sur \u00e9lastique r\u00e9sistant. Ses perles gris m\u00e9tallique au reflet miroir apportent une touche sobre et \u00e9l\u00e9gante. L\u00e9ger et confortable, il se porte au quotidien.\n\nL\u2019h\u00e9matite est une pierre d\u2019ancrage et de vitalit\u00e9, utilis\u00e9e depuis l\u2019Antiquit\u00e9 pour ses propri\u00e9t\u00e9s protectrices et dynamisantes. Son nom vient du grec \u00ab haima \u00bb (sang) en raison de sa poudre rouge.\n\nPlan physique\nCirculation sanguine\u00a0: r\u00e9put\u00e9e pour stimuler la circulation et favoriser l\u2019oxyg\u00e9nation du sang\nVitalit\u00e9\u00a0: pierre dynamisante qui combat la fatigue et renforce l\u2019\u00e9nergie physique\nSyst\u00e8me immunitaire\u00a0: traditionnellement associ\u00e9e au renforcement des d\u00e9fenses naturelles\nR\u00e9cup\u00e9ration\u00a0: aide \u00e0 la r\u00e9cup\u00e9ration apr\u00e8s un effort physique ou une p\u00e9riode de convalescence\n\nPlan \u00e9motionnel et mental\n- Ancrage\u00a0: l\u2019une des pierres d\u2019ancrage les plus puissantes, elle recentre et stabilise\n- Confiance en soi\u00a0: renforce la volont\u00e9, le courage et la d\u00e9termination\n- Concentration\u00a0: am\u00e9liore la m\u00e9moire et les capacit\u00e9s de concentration\n- Protection\u00a0: cr\u00e9e un bouclier contre les \u00e9nergies n\u00e9gatives et les pens\u00e9es parasites\n- Optimisme\u00a0: aide \u00e0 surmonter les p\u00e9riodes difficiles avec r\u00e9silience\n\nPlan spirituel\n- Enracinement\u00a0: connecte profond\u00e9ment \u00e0 l\u2019\u00e9nergie terrestre et au moment pr\u00e9sent\n- Harmonisation\u00a0: \u00e9quilibre les \u00e9nergies yin et yang dans le corps\n- Protection spirituelle\u00a0: prot\u00e8ge l\u2019aura lors des pratiques m\u00e9ditatives et des tirages\n- Transmutation\u00a0: transforme les \u00e9nergies n\u00e9gatives en \u00e9nergies positives\n\nAssociations courantes\nChakra\u00a0: racine (1er chakra)\nSignes astrologiques\u00a0: B\u00e9lier, Scorpion, Capricorne\n\u00c9l\u00e9ment\u00a0: Terre et Feu\nRechargement\u00a0: soleil (courte exposition), amas de quartz ou g\u00e9ode d\u2019am\u00e9thyste\nPurification\u00a0: fumigation (sauge, palo santo), son (bol tib\u00e9tain) \u2014 \u00e9viter l\u2019eau prolong\u00e9e\nPierres compl\u00e9mentaires\u00a0: s\u2019associe bien avec la tourmaline noire (protection renforc\u00e9e), l\u2019\u0153il de tigre (confiance) ou le quartz clair (amplification)\n\nCes propri\u00e9t\u00e9s rel\u00e8vent de la tradition lithoth\u00e9rapeutique et ne se substituent pas \u00e0 un avis m\u00e9dical.',
        price: 14.90, category: 'Bijoux & Lithoth\u00e9rapie', image_url: 'bracelet-hematite-6mm.png',
        stripe_link: '', visible: true, status: 'disponible', _demo: true
      },
      {
        slug: 'bracelet-malachite-synthetique-6mm', name: 'Bracelet \u00c9lastique Malachite synth\u00e9tique \u2014 6\u00a0mm',
        description: 'Bracelet en perles de malachite synth\u00e9tique de 6\u00a0mm mont\u00e9 sur \u00e9lastique r\u00e9sistant. Ses perles vert intense aux motifs band\u00e9s caract\u00e9ristiques apportent une touche d\u2019\u00e9l\u00e9gance naturelle. L\u00e9ger et confortable, il se porte au quotidien.\n\nLa malachite est une pierre associ\u00e9e \u00e0 la transformation et \u00e0 la protection depuis l\u2019\u00c9gypte ancienne. Ce bracelet en version synth\u00e9tique reproduit fid\u00e8lement ses motifs verts band\u00e9s tout en offrant une grande r\u00e9gularit\u00e9 et une r\u00e9sistance accrue.\n\nPlan physique\nD\u00e9toxification\u00a0: traditionnellement associ\u00e9e au soutien des processus de purification du corps\nSyst\u00e8me immunitaire\u00a0: r\u00e9put\u00e9e pour stimuler les d\u00e9fenses naturelles\nCirculation\u00a0: favorise une bonne circulation sanguine et r\u00e9duit les inflammations\nDouleurs articulaires\u00a0: utilis\u00e9e en lithoth\u00e9rapie pour apaiser les tensions musculaires et articulaires\n\nPlan \u00e9motionnel et mental\n- Transformation\u00a0: pierre du changement, elle accompagne les transitions et aide \u00e0 briser les sch\u00e9mas r\u00e9p\u00e9titifs\n- Protection \u00e9motionnelle\u00a0: absorbe les \u00e9nergies n\u00e9gatives et prot\u00e8ge des influences ext\u00e9rieures\n- Confiance en soi\u00a0: encourage l\u2019affirmation personnelle et la prise de d\u00e9cision\n- L\u00e2cher-prise\u00a0: aide \u00e0 lib\u00e9rer les \u00e9motions refoul\u00e9es et les blocages int\u00e9rieurs\n- Empathie\u00a0: renforce la compr\u00e9hension des \u00e9motions d\u2019autrui\n\nPlan spirituel\n- Ouverture du c\u0153ur\u00a0: active et \u00e9quilibre le chakra du c\u0153ur, favorisant l\u2019amour inconditionnel\n- Guidance int\u00e9rieure\u00a0: renforce l\u2019intuition et aide \u00e0 suivre son chemin de vie\n- Purification \u00e9nerg\u00e9tique\u00a0: nettoie l\u2019aura et les espaces des \u00e9nergies stagnantes\n- Connexion \u00e0 la nature\u00a0: renforce le lien avec le monde v\u00e9g\u00e9tal et les \u00e9nergies terrestres\n\nAssociations courantes\nChakra\u00a0: c\u0153ur (4e chakra), plexus solaire (3e chakra)\nSignes astrologiques\u00a0: Scorpion, Capricorne, Balance\n\u00c9l\u00e9ment\u00a0: Terre\nRechargement\u00a0: lumi\u00e8re lunaire, amas de quartz (\u00e9viter le soleil direct et l\u2019eau)\nPurification\u00a0: fumigation (sauge, palo santo), fleur de vie, son (bol tib\u00e9tain)\nPierres compl\u00e9mentaires\u00a0: s\u2019associe bien avec le quartz rose (douceur), la chrysocolle (communication) ou la turquoise (protection)\n\nNote\u00a0: ce bracelet est en malachite synth\u00e9tique (reconstitu\u00e9e). Il reproduit les motifs et couleurs de la malachite naturelle avec une r\u00e9gularit\u00e9 et une durabilit\u00e9 sup\u00e9rieures.\n\nCes propri\u00e9t\u00e9s rel\u00e8vent de la tradition lithoth\u00e9rapeutique et ne se substituent pas \u00e0 un avis m\u00e9dical.',
        price: 12.90, category: 'Bijoux & Lithoth\u00e9rapie', image_url: 'bracelet-malachite-synthetique-6mm.png',
        stripe_link: '', visible: true, status: 'disponible', _demo: true
      }
    ];

    var productsFromDB = [];
    try {
      var prodResult = await supabase.from('boutique_products').select('*').order('created_at', { ascending: false });
      if (!prodResult.error && prodResult.data && prodResult.data.length > 0) {
        productsFromDB = prodResult.data;
      }
    } catch(e) {
      console.log('[Boutique] Table boutique_products non disponible');
    }

    // Admin auto-seed : insérer les produits démo en base s'ils n'y sont pas encore
    if (isAdmin) {
      var existingSlugs = productsFromDB.map(function(p) { return p.slug; });
      var toSeed = DEMO_PRODUCTS.filter(function(p) { return existingSlugs.indexOf(p.slug) === -1; });
      if (toSeed.length > 0) {
        console.log('[Boutique] Auto-seed: insertion de', toSeed.length, 'produits démo en base...');
        var seedData = toSeed.map(function(p) {
          return { slug: p.slug, name: p.name, description: p.description, price: p.price, category: p.category, image_url: p.image_url, stripe_link: p.stripe_link, visible: p.visible, status: p.status || 'disponible' };
        });
        try {
          var seedResult = await supabase.from('boutique_products').insert(seedData);
          if (seedResult.error) {
            console.warn('[Boutique] Auto-seed erreur:', seedResult.error.message);
          } else {
            console.log('[Boutique] Auto-seed réussi :', toSeed.length, 'produits insérés');
          }
        } catch(seedErr) {
          console.warn('[Boutique] Auto-seed exception:', seedErr.message);
        }
      }
      // Admin auto-sync : synchroniser tous les champs des produits DEMO avec la base
      var demoBySlug = {};
      DEMO_PRODUCTS.forEach(function(p) { demoBySlug[p.slug] = p; });
      var toUpdate = productsFromDB.filter(function(dbp) {
        var demo = demoBySlug[dbp.slug];
        if (!demo) return false;
        // Mettre à jour si le nom, le prix, la description, la catégorie ou l'image diffèrent
        return demo.name !== dbp.name
          || Math.abs(demo.price - (parseFloat(dbp.price) || 0)) > 0.01
          || demo.description.length !== (dbp.description || '').length
          || demo.category !== dbp.category
          || (demo.image_url && demo.image_url !== 'crystals-nature.png' && demo.image_url !== dbp.image_url);
      });
      if (toUpdate.length > 0) {
        console.log('[Boutique] Auto-sync:', toUpdate.length, 'produits à mettre à jour...');
        for (var ui = 0; ui < toUpdate.length; ui++) {
          var dbp = toUpdate[ui];
          var demo = demoBySlug[dbp.slug];
          var updFields = { name: demo.name, description: demo.description, price: demo.price, category: demo.category };
          if (demo.image_url && demo.image_url !== 'crystals-nature.png') updFields.image_url = demo.image_url;
          try {
            await supabase.from('boutique_products').update(updFields).eq('slug', dbp.slug);
            console.log('[Boutique] Synchro OK:', dbp.slug, '(nom, prix, desc, catégorie)');
          } catch(updErr) {
            console.warn('[Boutique] Sync erreur pour', dbp.slug, ':', updErr.message);
          }
        }
      }
      // Recharger depuis la base après seed/update
      if (toSeed.length > 0 || toUpdate.length > 0) {
        var reloadResult = await supabase.from('boutique_products').select('*').order('created_at', { ascending: false });
        if (!reloadResult.error && reloadResult.data) {
          productsFromDB = reloadResult.data;
        }
      }
    }

    // Utiliser les produits de la base, complétés par les démo visibles absents de la base
    var allProducts;
    if (productsFromDB.length > 0) {
      allProducts = productsFromDB.slice();
      var dbSlugs = productsFromDB.map(function(p) { return p.slug; });
      DEMO_PRODUCTS.forEach(function(dp) {
        if (dp.visible) {
          var idx = dbSlugs.indexOf(dp.slug);
          if (idx === -1) {
            // Produit démo visible absent de la base : l'ajouter en mémoire
            allProducts.push(dp);
          } else if (allProducts[idx].visible === false) {
            // Produit en base marqué invisible mais démo dit visible : forcer la visibilité
            allProducts[idx] = Object.assign({}, allProducts[idx], { visible: true });
          }
        }
      });
    } else {
      allProducts = DEMO_PRODUCTS;
    }
    console.log('[Boutique] Produits chargés:', allProducts.length, '(DB:', productsFromDB.length, ', isAdmin:', isAdmin, ')');

    if (allProducts.length > 0) {
      // Load all extra images at once (seulement si produits en base)
      var extraImagesMap = {};
      if (productsFromDB.length > 0) {
        try {
          var allSlugs = productsFromDB.map(function(p) { return p.slug; });
          var imgResult = await supabase.from('product_images').select('*').in('product_slug', allSlugs).order('position', { ascending: true });
          if (!imgResult.error && imgResult.data) {
            imgResult.data.forEach(function(img) {
              if (!extraImagesMap[img.product_slug]) extraImagesMap[img.product_slug] = [];
              extraImagesMap[img.product_slug].push(img);
            });
          }
        } catch(imgErr) { /* product_images table may not exist yet */ }
      }

      // Filter: visitors only see visible products, admin sees all
      var visibleProducts = isAdmin ? allProducts : allProducts.filter(function(p) { return p.visible !== false; });
      var prodGrid = document.getElementById('boutique-products-grid');
      var coming = document.querySelector('.boutique-coming');
      if (coming && visibleProducts.length > 0) coming.style.display = 'none';
      // Deduplicate products by slug before rendering
      var renderedSlugs = {};
      visibleProducts.forEach(function(product) {
        if (renderedSlugs[product.slug]) return; // skip duplicate
        renderedSlugs[product.slug] = true;
        product.extra_images = extraImagesMap[product.slug] || [];
        // Apply fallback stripe_link from hardcoded map if not set in DB
        if (!product.stripe_link && BOUTIQUE_STRIPE_LINKS[product.slug]) {
          product.stripe_link = BOUTIQUE_STRIPE_LINKS[product.slug];
        }
        _loadedProducts[product.slug] = product; // Cache for overlay
        if (prodGrid) {
          var card = createProductCardElement(product, isAdmin);
          prodGrid.appendChild(card);
          var delBtn = card.querySelector('.admin-delete-btn');
          if (delBtn) attachDeleteHandler(delBtn);
          // Click to open product detail (visitors)
          card.addEventListener('click', function(e) {
            if (e.target.closest('.admin-delete-btn')) return;
            var slug = card.getAttribute('data-product-slug');
            if (slug && _loadedProducts[slug]) openProductDetail(_loadedProducts[slug]);
          });
        }
      });
    }

    // ========================================
    // BOUTIQUE — Filtres par catégories + Suggestions e-commerce
    // ========================================
    (function buildCategoryFilters() {
      var prodGrid = document.getElementById('boutique-products-grid');
      if (!prodGrid) return;

      // Collecter les catégories uniques avec compteur
      var categoriesMap = {};
      var totalVisible = 0;
      var visibleProductsList = isAdmin ? allProducts : allProducts.filter(function(p) { return p.visible !== false; });
      // Dédupliquer par slug
      var seenSlugs = {};
      visibleProductsList.forEach(function(p) {
        if (seenSlugs[p.slug]) return;
        seenSlugs[p.slug] = true;
        var cat = (p.category || 'Autre').trim();
        if (!categoriesMap[cat]) categoriesMap[cat] = 0;
        categoriesMap[cat]++;
        totalVisible++;
      });

      // Ne pas afficher les filtres s'il y a moins de 2 catégories et moins de 4 produits
      var categoryNames = Object.keys(categoriesMap);
      if (categoryNames.length < 2 && totalVisible < 4) return;

      // Supprimer l'ancienne barre de filtres si elle existe (pour les re-calls)
      var existingFilters = prodGrid.parentNode.querySelector('.boutique-filters');
      if (existingFilters) existingFilters.remove();
      var existingTip = prodGrid.parentNode.querySelector('#boutique-category-tip');
      if (existingTip) existingTip.remove();
      var existingSuggestions = prodGrid.parentNode.querySelector('.boutique-suggestions');
      if (existingSuggestions) existingSuggestions.remove();

      // Créer la barre de filtres
      var filtersBar = document.createElement('div');
      filtersBar.className = 'boutique-filters';
      filtersBar.innerHTML =
        '<span class="boutique-filters__label">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>' +
          '</svg>' +
          'Filtrer' +
        '</span>';

      // Bouton "Tout"
      var allBtn = document.createElement('button');
      allBtn.className = 'boutique-filter-btn boutique-filter-btn--active';
      allBtn.setAttribute('type', 'button');
      allBtn.setAttribute('data-filter-cat', '__all__');
      allBtn.innerHTML = 'Tout <span class="boutique-filter-btn__count">' + totalVisible + '</span>';
      filtersBar.appendChild(allBtn);

      // Icônes par catégorie
      var catIcons = {
        'bijoux': '\uD83D\uDC8E', 'lithoth\u00e9rapie': '\uD83D\uDC8E', 'bijoux & lithoth\u00e9rapie': '\uD83D\uDC8E',
        'cristaux': '\uD83D\uDD2E', 'encens': '\uD83C\uDF3F', 'encens & purification': '\uD83C\uDF3F',
        'purification': '\uD83C\uDF3F', 'accessoires': '\u2728', 'pendules': '\uD83D\uDD2E',
        'm\u00e9ditation': '\uD83E\uDDD8', 'supports': '\uD83D\uDCD6', 'livres': '\uD83D\uDCD6',
        'huiles': '\uD83E\uDED7', 'bougies': '\uD83D\uDD6F\uFE0F'
      };

      function getCatIcon(catName) {
        var lower = catName.toLowerCase();
        for (var key in catIcons) {
          if (lower.indexOf(key) !== -1) return catIcons[key];
        }
        return '\uD83C\uDFF7\uFE0F';
      }

      // Trier les catégories par nombre de produits (décroissant)
      categoryNames.sort(function(a, b) { return categoriesMap[b] - categoriesMap[a]; });

      // Créer un bouton par catégorie
      categoryNames.forEach(function(cat) {
        var btn = document.createElement('button');
        btn.className = 'boutique-filter-btn';
        btn.setAttribute('type', 'button');
        btn.setAttribute('data-filter-cat', cat);
        btn.innerHTML = getCatIcon(cat) + ' ' + sanitizeForHtml(cat) + ' <span class="boutique-filter-btn__count">' + categoriesMap[cat] + '</span>';
        filtersBar.appendChild(btn);
      });

      // Compteur de résultats
      var resultsCount = document.createElement('span');
      resultsCount.className = 'boutique-results-count';
      resultsCount.id = 'boutique-results-count';
      resultsCount.textContent = totalVisible + ' produit' + (totalVisible > 1 ? 's' : '');
      filtersBar.appendChild(resultsCount);

      // Insérer AVANT la grille
      prodGrid.parentNode.insertBefore(filtersBar, prodGrid);

      // Conseils par catégorie (tips e-commerce)
      var categoryTips = {
        'bijoux & lithoth\u00e9rapie': {
          icon: '\uD83D\uDC8E',
          title: 'Conseil lithoth\u00e9rapie',
          text: 'Portez votre bracelet au poignet gauche (c\u00f4t\u00e9 r\u00e9ceptif) pour absorber les bienfaits de la pierre. Nettoyez-le r\u00e9guli\u00e8rement sous l\u2019eau claire ou avec de la fum\u00e9e de sauge.'
        },
        'cristaux': {
          icon: '\uD83D\uDD2E',
          title: 'Bien choisir son cristal',
          text: 'Laissez-vous guider par votre intuition\u00a0: la pierre qui vous attire est souvent celle dont vous avez besoin. Rechargez vos cristaux \u00e0 la lumi\u00e8re de la lune ou sur une druse d\u2019am\u00e9thyste.'
        },
        'encens & purification': {
          icon: '\uD83C\uDF3F',
          title: 'Purifier son espace',
          text: 'Pour purifier votre int\u00e9rieur, allumez la sauge et laissez la fum\u00e9e se diffuser dans chaque pi\u00e8ce en ouvrant une fen\u00eatre. Id\u00e9al avant une m\u00e9ditation ou un tirage de cartes.'
        },
        'accessoires': {
          icon: '\u2728',
          title: 'Outils de divination',
          text: 'Un pendule peut r\u00e9pondre \u00e0 vos questions par oui ou non. Tenez-le immobile et posez des questions claires. Avec la pratique, vous affinerez votre connexion intuitive.'
        }
      };

      // Zone de conseil contextuel
      var tipContainer = document.createElement('div');
      tipContainer.id = 'boutique-category-tip';
      tipContainer.style.display = 'none';
      prodGrid.parentNode.insertBefore(tipContainer, prodGrid);

      // Section \u00ab Vous pourriez aussi aimer \u00bb
      var suggestionsSection = document.createElement('div');
      suggestionsSection.className = 'boutique-suggestions';
      suggestionsSection.id = 'boutique-suggestions';
      suggestionsSection.style.display = 'none';
      suggestionsSection.innerHTML =
        '<div class="boutique-suggestions__header">' +
          '<div class="boutique-suggestions__icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' +
            '</svg>' +
          '</div>' +
          '<div>' +
            '<div class="boutique-suggestions__title">Vous pourriez aussi aimer</div>' +
            '<div class="boutique-suggestions__subtitle">D\u2019autres produits pour accompagner votre pratique</div>' +
          '</div>' +
        '</div>' +
        '<div class="boutique-suggestions__track" id="boutique-suggestions-track"></div>';
      prodGrid.parentNode.insertBefore(suggestionsSection, prodGrid.nextSibling);

      // Logique de filtrage
      var currentFilter = '__all__';

      function filterProducts(category) {
        currentFilter = category;
        var cards = prodGrid.querySelectorAll('.boutique-product-card');
        var visibleCount = 0;

        cards.forEach(function(card) {
          var cardSlug = card.getAttribute('data-product-slug');
          var productData = _loadedProducts[cardSlug];
          if (!productData) return;

          var cardCat = (productData.category || 'Autre').trim();
          var shouldShow = (category === '__all__') || (cardCat === category);

          if (shouldShow) {
            card.classList.remove('boutique-product-card--filtered-out');
            card.classList.add('boutique-product-card--filter-in');
            card.style.display = '';
            visibleCount++;
          } else {
            card.classList.add('boutique-product-card--filtered-out');
            card.classList.remove('boutique-product-card--filter-in');
            setTimeout(function() {
              if (card.classList.contains('boutique-product-card--filtered-out')) {
                card.style.display = 'none';
              }
            }, 350);
          }
        });

        // Mettre \u00e0 jour le compteur
        var countEl = document.getElementById('boutique-results-count');
        if (countEl) {
          countEl.textContent = visibleCount + ' produit' + (visibleCount > 1 ? 's' : '');
        }

        // Mettre \u00e0 jour les boutons actifs
        filtersBar.querySelectorAll('.boutique-filter-btn').forEach(function(btn) {
          btn.classList.toggle('boutique-filter-btn--active', btn.getAttribute('data-filter-cat') === category);
        });

        // Afficher le conseil contextuel
        showCategoryTip(category);

        // Afficher les suggestions (produits des AUTRES catégories)
        showSuggestions(category);

        // \u00c9tat vide
        var emptyState = prodGrid.querySelector('.boutique-empty-state');
        if (visibleCount === 0 && category !== '__all__') {
          if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.className = 'boutique-empty-state';
            emptyState.innerHTML =
              '<div class="boutique-empty-state__icon">' +
                '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                  '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
                '</svg>' +
              '</div>' +
              '<h3 class="boutique-empty-state__title">Aucun produit dans cette cat\u00e9gorie</h3>' +
              '<p class="boutique-empty-state__text">De nouveaux produits arrivent bient\u00f4t. Inscrivez-vous \u00e0 la newsletter pour \u00eatre pr\u00e9venu\u00a0!</p>';
            prodGrid.appendChild(emptyState);
          }
          emptyState.style.display = '';
        } else if (emptyState) {
          emptyState.style.display = 'none';
        }
      }

      function showCategoryTip(category) {
        var tipEl = document.getElementById('boutique-category-tip');
        if (!tipEl) return;

        if (category === '__all__') {
          tipEl.style.display = 'none';
          return;
        }

        var tipKey = category.toLowerCase();
        var tipData = categoryTips[tipKey];
        if (!tipData) {
          for (var key in categoryTips) {
            if (tipKey.indexOf(key) !== -1 || key.indexOf(tipKey) !== -1) {
              tipData = categoryTips[key];
              break;
            }
          }
        }

        if (tipData) {
          tipEl.innerHTML =
            '<div class="boutique-category-tip">' +
              '<div class="boutique-category-tip__icon">' + tipData.icon + '</div>' +
              '<div class="boutique-category-tip__content">' +
                '<div class="boutique-category-tip__title">' + tipData.title + '</div>' +
                '<p class="boutique-category-tip__text">' + tipData.text + '</p>' +
              '</div>' +
              '<button class="boutique-category-tip__close" type="button" aria-label="Fermer">&times;</button>' +
            '</div>';
          tipEl.style.display = '';

          var closeBtn = tipEl.querySelector('.boutique-category-tip__close');
          if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
              e.stopPropagation();
              tipEl.style.display = 'none';
            });
          }
        } else {
          tipEl.style.display = 'none';
        }
      }

      function showSuggestions(category) {
        var suggestionsEl = document.getElementById('boutique-suggestions');
        var trackEl = document.getElementById('boutique-suggestions-track');
        if (!suggestionsEl || !trackEl) return;

        if (category === '__all__') {
          suggestionsEl.style.display = 'none';
          return;
        }

        // Trouver les produits des AUTRES catégories (cross-selling)
        var seenSugSlugs = {};
        var otherProducts = visibleProductsList.filter(function(p) {
          if (seenSugSlugs[p.slug]) return false;
          seenSugSlugs[p.slug] = true;
          return (p.category || 'Autre').trim() !== category && p.visible !== false;
        });

        if (otherProducts.length === 0) {
          suggestionsEl.style.display = 'none';
          return;
        }

        trackEl.innerHTML = '';
        otherProducts.forEach(function(p) {
          var miniCard = document.createElement('div');
          miniCard.className = 'boutique-suggestion-card';
          miniCard.setAttribute('data-suggestion-slug', p.slug);
          miniCard.innerHTML =
            '<div class="boutique-suggestion-card__image">' +
              '<img src="' + (p.image_url || 'crystals-nature.png') + '" alt="' + sanitizeForHtml(p.name || '') + '" width="320" height="213" loading="lazy">' +
            '</div>' +
            '<div class="boutique-suggestion-card__body">' +
              '<div class="boutique-suggestion-card__cat">' + sanitizeForHtml(p.category || '') + '</div>' +
              '<div class="boutique-suggestion-card__name">' + sanitizeForHtml(p.name || '') + '</div>' +
              '<div class="boutique-suggestion-card__price">' + parseFloat(p.price).toFixed(2) + ' \u20ac</div>' +
            '</div>';

          miniCard.addEventListener('click', function() {
            if (_loadedProducts[p.slug]) {
              openProductDetail(_loadedProducts[p.slug]);
            }
          });

          trackEl.appendChild(miniCard);
        });

        suggestionsEl.style.display = '';
      }

      // Attacher les \u00e9v\u00e9nements de clic sur les filtres
      filtersBar.addEventListener('click', function(e) {
        var btn = e.target.closest('.boutique-filter-btn');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        var cat = btn.getAttribute('data-filter-cat');
        if (cat) filterProducts(cat);
      });

      // Exposer la fonction de filtrage
      window.__boutiqueFilterProducts = filterProducts;
    })();

    // Add admin "+" buttons (admin only) — skip if already present
    if (isAdmin) {
      // Blog add button - prepend to blog-grid
      var blogGrid = document.querySelector('.blog-grid');
      if (blogGrid && !blogGrid.querySelector('.admin-add-btn')) {
        var addBlogBtn = document.createElement('div');
        addBlogBtn.className = 'admin-add-btn';
        addBlogBtn.innerHTML = '<span class="admin-add-btn__icon">+</span><span>Nouvel article</span>';
        addBlogBtn.addEventListener('click', function() { openModal('admin-modal-blog'); });
        blogGrid.insertBefore(addBlogBtn, blogGrid.firstChild);
      }

      // Boutique add button - prepend to boutique container
      var prodGrid = document.getElementById('boutique-products-grid');
      if (prodGrid && !prodGrid.parentNode.querySelector('.admin-add-btn--boutique')) {
        var addProdBtn = document.createElement('div');
        addProdBtn.className = 'admin-add-btn admin-add-btn--boutique';
        addProdBtn.innerHTML = '<span class="admin-add-btn__icon">+</span><span>Nouveau produit</span>';
        addProdBtn.addEventListener('click', function() { openModal('admin-modal-boutique'); });
        prodGrid.parentNode.insertBefore(addProdBtn, prodGrid);
      }

      // Coupon management button - add in boutique section
      var boutiqueSection = document.getElementById('boutique');
      if (boutiqueSection && !boutiqueSection.querySelector('.admin-add-btn--coupon')) {
        var addCouponBtn = document.createElement('div');
        addCouponBtn.className = 'admin-add-btn admin-add-btn--coupon';
        addCouponBtn.innerHTML = '<span class="admin-add-btn__icon">🎟</span><span>Gérer les coupons</span>';
        addCouponBtn.addEventListener('click', function() {
          openModal('admin-modal-coupon');
          chargerCouponsAdmin();
        });
        if (prodGrid && prodGrid.parentNode) {
          prodGrid.parentNode.insertBefore(addCouponBtn, prodGrid);
        } else {
          boutiqueSection.appendChild(addCouponBtn);
        }
      }
    }

    // Refresh feed to include dynamic items
    var feedGrid = document.getElementById('nouveautes-grid');
    if (feedGrid) { feedGrid.innerHTML = ''; }
    if (typeof window.__populateNouveautes === 'function') window.__populateNouveautes();
    } finally { _initDynamicRunning = false; }
  }

  // --- Upload image to Supabase Storage ---
  async function uploadImage(file, bucket, path) {
    var { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
    if (error) {
      console.error('[Upload] Erreur:', error.message);
      showSaveError('upload image : ' + error.message);
      throw error;
    }
    var { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return urlData.publicUrl;
  }

  // --- Image preview handlers ---
  var boutiqueFileInput = document.getElementById('admin-boutique-image-file');
  if (boutiqueFileInput) {
    boutiqueFileInput.addEventListener('change', function() {
      var file = this.files[0];
      var preview = document.getElementById('admin-boutique-image-preview');
      var previewImg = document.getElementById('admin-boutique-preview-img');
      if (file && preview && previewImg) {
        var reader = new FileReader();
        reader.onload = function(e) {
          previewImg.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        // Clear the dropdown selection when a file is chosen
        var select = document.querySelector('#admin-boutique-form select[name="image_url"]');
        if (select) select.value = '';
      }
    });
  }

  // --- Extra images preview handler ---
  var extraImagesInput = document.getElementById('admin-boutique-extra-images');
  if (extraImagesInput) {
    extraImagesInput.addEventListener('change', function() {
      var preview = document.getElementById('admin-boutique-extra-preview');
      if (!preview) return;
      preview.innerHTML = '';
      var files = this.files;
      if (files.length === 0) { preview.style.display = 'none'; return; }
      preview.style.display = 'flex';
      for (var i = 0; i < files.length; i++) {
        (function(idx) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var item = document.createElement('div');
            item.className = 'admin-extra-preview__item';
            item.innerHTML = '<img src="' + e.target.result + '" alt="Photo ' + (idx + 1) + '">';
            preview.appendChild(item);
          };
          reader.readAsDataURL(files[idx]);
        })(i);
      }
    });
  }

  var blogFileInput = document.getElementById('admin-blog-image-file');
  if (blogFileInput) {
    blogFileInput.addEventListener('change', function() {
      var file = this.files[0];
      var preview = document.getElementById('admin-blog-image-preview');
      var previewImg = document.getElementById('admin-blog-preview-img');
      if (file && preview && previewImg) {
        var reader = new FileReader();
        reader.onload = function(e) {
          previewImg.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        // Clear the dropdown selection when a file is chosen
        var select = document.querySelector('#admin-blog-form select[name="image_url"]');
        if (select) select.value = '';
      }
    });
  }

  // --- Blog form submit ---
  var blogForm = document.getElementById('admin-blog-form');
  if (blogForm) {
    blogForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var fd = new FormData(blogForm);
      var title = fd.get('title').trim();
      var slug = adminSlugify(title);
      var imageUrl = fd.get('image_url');
      var blogImageFile = document.getElementById('admin-blog-image-file');
      if (blogImageFile && blogImageFile.files[0]) {
        var file = blogImageFile.files[0];
        var ext = file.name.split('.').pop();
        var path = 'blog/' + slug + '-' + Date.now() + '.' + ext;
        try {
          imageUrl = await uploadImage(file, 'images', path);
        } catch(e) {
          console.warn('Upload failed, using dropdown image:', e);
          if (!imageUrl) imageUrl = 'blog-journal.png';
        }
      } else if (!imageUrl) {
        imageUrl = 'blog-journal.png';
      }

      var data = {
        slug: slug,
        category: fd.get('category').trim(),
        title: title,
        excerpt: fd.get('excerpt').trim(),
        content: fd.get('content').trim(),
        image_url: imageUrl,
        date_publication: fd.get('date_publication').trim()
      };

      // Indicateur de sauvegarde en cours
      var submitBtnBlog = blogForm.querySelector('.admin-modal__submit');
      var origBtnBlogText = submitBtnBlog ? submitBtnBlog.textContent : '';
      if (submitBtnBlog) { submitBtnBlog.textContent = 'Sauvegarde en cours\u2026'; submitBtnBlog.disabled = true; }

      var result = await supabase.from('blog_articles').insert([data]);
      if (result.error) {
        showAdminMsg('admin-blog-msg', 'Erreur : ' + result.error.message, true);
        if (submitBtnBlog) { submitBtnBlog.textContent = origBtnBlogText; submitBtnBlog.disabled = false; }
        return;
      }

      // Add to blogArticles JS object
      blogArticles[slug] = {
        category: data.category,
        title: data.title,
        date: data.date_publication,
        content: data.content
      };

      // Add card to grid
      var blogGrid = document.querySelector('.blog-grid');
      if (blogGrid) {
        var card = createBlogCardElement(data, true);
        // Insert after the "+" button (first child)
        var addBtn = blogGrid.querySelector('.admin-add-btn');
        if (addBtn && addBtn.nextSibling) {
          blogGrid.insertBefore(card, addBtn.nextSibling);
        } else {
          blogGrid.appendChild(card);
        }
        card.addEventListener('click', function(ev) {
          if (ev.target.closest('.admin-delete-btn') || ev.target.closest('.blog-card__heart')) return;
          openBlogArticle(slug);
        });
        var delBtn = card.querySelector('.admin-delete-btn');
        if (delBtn) attachDeleteHandler(delBtn);
      }

      // Refresh feed
      var feedGrid = document.getElementById('nouveautes-grid');
      if (feedGrid) { feedGrid.innerHTML = ''; }
      if (typeof window.__populateNouveautes === 'function') window.__populateNouveautes();

      showAdminMsg('admin-blog-msg', '\u2705 Article sauvegard\u00e9 avec succ\u00e8s !', false);
      if (submitBtnBlog) { submitBtnBlog.textContent = origBtnBlogText; submitBtnBlog.disabled = false; }
      // Envoyer newsletter aux abonnes
      envoyerNewsletterAbonnes('blog', data.title);
      setTimeout(function() { closeModal('admin-modal-blog'); }, 1500);
    });
  }

  // --- Product Detail Overlay (fiche produit + paiement) ---
  var _loadedProducts = {}; // Cache: slug -> product data with extra_images

  // --- Utility: parse a long product description into structured sections ---
  function parseProductDescription(rawText) {
    if (!rawText) return { intro: '', sections: [] };
    var text = rawText.trim();
    // Known section headers that appear in product descriptions
    var sectionPatterns = [
      /(?:^|\n)\s*\u2728\s*/,  // ✨ emoji marker
      /(?:^|\n)\s*\ud83d\udd2e\s*/,  // 🔮 emoji marker
      /(?:^|\n)\s*\u2764\ufe0f?\s*/,  // ❤ emoji marker
    ];
    // Common section keywords in lithotherapy/wellness product descriptions
    // Sections principales (deviennent des accordéons)
    var headingKeywords = [
      'Plan physique', 'Plan \u00e9motionnel et mental', 'Plan \u00e9motionnel', 'Plan spirituel', 'Plan mental',
      'Propri\u00e9t\u00e9s', 'Vertus', 'Bienfaits',
      'Associations courantes', 'Associations',
      'Origine', 'Histoire', 'Composition', 'Caract\u00e9ristiques',
      'Utilisation', 'Conseils', 'Mode d\'emploi', 'Comment utiliser',
      'Avertissement', 'Disclaimer', 'Remarque', 'Note importante', 'Important'
    ];
    // Sous-items qui doivent rester dans la section parente (pas de section séparée)
    var subItemKeywords = [
      'Syst\u00e8me musculaire', 'Syst\u00e8me immunitaire', 'Syst\u00e8me digestif', 'Syst\u00e8me nerveux',
      'Syst\u00e8me circulatoire', 'Syst\u00e8me reproducteur',
      'Circulation', 'Circulation sanguine', 'D\u00e9toxification', 'Peau', 'Sommeil',
      'Diffuseur naturel', 'Vitalit\u00e9', 'Ancrage corporel', 'Maux de t\u00eate',
      'Chakra', 'Chakras', 'Signes astrologiques', 'Signe astrologique', 'Astrologie',
      'Entretien', 'Rechargement', 'Purification', 'Nettoyage',
      'Pierres compl\u00e9mentaires', 'Pierres associ\u00e9es', 'Combinaisons',
      'Dimensions', 'Taille', 'Mat\u00e9riaux', 'Mati\u00e8re',
      '\u00c9l\u00e9ment', '\u00c9l\u00e9ments'
    ];
    // Build a regex that matches lines starting with known headings
    var escapedKeywords = headingKeywords.map(function(k) {
      return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    var headingRegex = new RegExp(
      '(?:^|\\n)\\s*(?:[\u2728\ud83d\udd2e\u2764\ufe0f\ud83d\udc8e\u2b50\u2734\ufe0f\ud83c\udf1f\u2022\u25cf\u25cb\u2013\u2014\u27a4]\\s*)?(' +
      escapedKeywords.join('|') +
      ')\\s*[:：\u2014\u2013\u2012-]?\\s*',
      'gi'
    );
    // Build a regex for sub-items (these stay inside the current section as bullet points)
    var escapedSubItems = subItemKeywords.map(function(k) {
      return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    var subItemRegex = new RegExp(
      '^\\s*(?:[\u2728\ud83d\udd2e\u2764\ufe0f\ud83d\udc8e\u2b50\u2734\ufe0f\ud83c\udf1f\u2022\u25cf\u25cb\u2013\u2014\u27a4]\\s*)?(' +
      escapedSubItems.join('|') +
      ')\\s*[:：\u2014\u2013\u2012-]?\\s*',
      'i'
    );

    var lines = text.split('\n');
    var intro = '';
    var sections = [];
    var currentSection = null;
    var introDone = false;

    for (var li = 0; li < lines.length; li++) {
      var line = lines[li].trim();
      if (!line) {
        if (currentSection) currentSection.lines.push('');
        continue;
      }
      // Check if this line is a main heading
      var isHeading = false;
      var headingTitle = '';
      headingRegex.lastIndex = 0;
      var match = headingRegex.exec(line);
      if (match && match.index < 5) {
        // Vérifier que ce n'est pas un sub-item déguisé en heading
        var subCheck = subItemRegex.exec(line);
        if (subCheck) {
          // C'est un sous-item : l'ajouter comme contenu de la section courante
          if (currentSection) {
            currentSection.lines.push('- ' + line);
          } else if (!introDone) {
            intro += (intro ? '\n' : '') + line;
          }
        } else {
          isHeading = true;
          headingTitle = match[1].trim();
          var remainder = line.substring(match.index + match[0].length).trim();
          introDone = true;
          currentSection = { title: headingTitle, lines: [] };
          if (remainder) currentSection.lines.push(remainder);
          sections.push(currentSection);
        }
      } else if (!introDone) {
        intro += (intro ? '\n' : '') + line;
        // After 2-3 sentences of intro, switch to collecting
        if (intro.split(/[.!?]/).length > 4) introDone = true;
      } else {
        if (!currentSection) {
          currentSection = { title: 'Description', lines: [] };
          sections.push(currentSection);
        }
        currentSection.lines.push(line);
      }
    }

    // If no sections were detected, put everything after intro into one section
    if (sections.length === 0 && introDone) {
      // All remaining text goes into a "Description d\u00e9taill\u00e9e" section
      var remaining = text.substring(intro.length).trim();
      if (remaining) {
        sections.push({ title: 'Description d\u00e9taill\u00e9e', lines: remaining.split('\n') });
      }
    }

    // If no sections and no intro separation, use first ~2 sentences as intro
    if (sections.length === 0 && !intro) {
      var sentences = text.split(/(?<=[.!?])\s+/);
      intro = sentences.slice(0, 2).join(' ');
      var rest = sentences.slice(2).join(' ').trim();
      if (rest) {
        sections.push({ title: 'Description d\u00e9taill\u00e9e', lines: rest.split('\n') });
      }
    }

    return { intro: intro, sections: sections };
  }

  function buildDescSectionsHTML(sections) {
    var chevronSVG = '<svg class="product-desc-section__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
    var html = '';
    for (var si = 0; si < sections.length; si++) {
      var sec = sections[si];
      var bodyContent = '';
      var inList = false;
      for (var li = 0; li < sec.lines.length; li++) {
        var line = sec.lines[li].trim();
        if (!line) {
          if (inList) { bodyContent += '</ul>'; inList = false; }
          continue;
        }
        // Detect list-like lines (starting with -, ·, •, ▸, ★, etc.)
        var listMatch = line.match(/^[\-\u2022\u2023\u25cf\u25cb\u25b8\u25ba\u25aa\u2013\u2014\u27a4\u2605\u2606\u2734\ufe0f\u2728\*]\s*(.*)/);
        if (listMatch) {
          if (!inList) { bodyContent += '<ul>'; inList = true; }
          bodyContent += '<li>' + sanitizeDescText(listMatch[1]) + '</li>';
        } else {
          if (inList) { bodyContent += '</ul>'; inList = false; }
          bodyContent += '<p>' + sanitizeDescText(line) + '</p>';
        }
      }
      if (inList) bodyContent += '</ul>';
      // First section open by default
      var openClass = si === 0 ? ' product-desc-section--open' : '';
      html += '<div class="product-desc-section' + openClass + '">' +
        '<button class="product-desc-section__toggle" type="button">' +
          '<span class="product-desc-section__title">' + sanitizeForHtml(sec.title) + '</span>' +
          chevronSVG +
        '</button>' +
        '<div class="product-desc-section__body">' + bodyContent + '</div>' +
      '</div>';
    }
    return html;
  }

  function sanitizeDescText(text) {
    // Escape HTML, then bold text between ** or __ and italic between * or _
    var escaped = sanitizeForHtml(text);
    // Bold: **text** or __text__
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/__(.+?)__/g, '<strong>$1</strong>');
    return escaped;
  }

  function initDescAccordion(container) {
    var toggles = container.querySelectorAll('.product-desc-section__toggle');
    toggles.forEach(function(toggle) {
      toggle.addEventListener('click', function() {
        var section = toggle.closest('.product-desc-section');
        if (section) section.classList.toggle('product-desc-section--open');
      });
    });
  }

  function openProductDetail(productData) {
    var overlay = document.getElementById('product-detail-overlay');
    if (!overlay) return;

    // Fill product info
    var nameEl = document.getElementById('product-detail-name');
    var catEl = document.getElementById('product-detail-category');
    var shortDescEl = document.getElementById('product-detail-short-desc');
    var descEl = document.getElementById('product-detail-desc');
    var priceEl = document.getElementById('product-detail-price');
    var galleryEl = document.getElementById('product-detail-gallery');

    if (nameEl) nameEl.textContent = productData.name;
    if (catEl) catEl.textContent = productData.category;

    // Stock status
    var isInStock = productData.status !== 'epuise';
    var stockEl = document.getElementById('product-detail-stock');
    if (stockEl) {
      if (isInStock) {
        stockEl.className = 'product-overlay__stock-badge product-overlay__stock-badge--in';
        stockEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:0.3rem"><polyline points="20 6 9 17 4 12"/></svg>En stock';
      } else {
        stockEl.className = 'product-overlay__stock-badge product-overlay__stock-badge--out';
        stockEl.textContent = '\u00c9puis\u00e9';
      }
    }
    // Disable/enable add-to-cart button
    var addCartBtn = document.getElementById('product-detail-add-cart');
    if (addCartBtn) {
      if (isInStock) {
        addCartBtn.disabled = false;
        addCartBtn.classList.remove('product-overlay__add-cart--disabled');
        addCartBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:0.4rem"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>Ajouter au panier';
      } else {
        addCartBtn.disabled = true;
        addCartBtn.classList.add('product-overlay__add-cart--disabled');
        addCartBtn.innerHTML = '\u00c9puis\u00e9';
      }
    }

    // Parse and structure the description
    var parsed = parseProductDescription(productData.description || '');
    if (shortDescEl) shortDescEl.textContent = parsed.intro;
    if (descEl) {
      if (parsed.sections.length > 0) {
        descEl.innerHTML = buildDescSectionsHTML(parsed.sections);
        initDescAccordion(descEl);
      } else {
        descEl.innerHTML = '<p style="font-size:0.92rem;line-height:1.7;color:var(--color-text-muted)">' + sanitizeForHtml(productData.description || '') + '</p>';
      }
    }

    if (priceEl) priceEl.textContent = parseFloat(productData.price).toFixed(2) + ' \u20ac';

    // Build gallery with all images
    var allImages = [productData.image_url || 'crystals-nature.png'];
    if (productData.extra_images && productData.extra_images.length > 0) {
      for (var i = 0; i < productData.extra_images.length; i++) {
        allImages.push(productData.extra_images[i].image_url);
      }
    }

    if (galleryEl) {
      if (allImages.length > 1) {
        var slidesHTML = '';
        for (var si = 0; si < allImages.length; si++) {
          slidesHTML += '<div class="product-carousel__slide"><img src="' + allImages[si] + '" alt="' + productData.name + ' - photo ' + (si + 1) + '" loading="lazy"></div>';
        }
        var dotsHTML = '<div class="product-carousel__dots">';
        for (var di = 0; di < allImages.length; di++) {
          dotsHTML += '<button class="product-carousel__dot' + (di === 0 ? ' product-carousel__dot--active' : '') + '" data-slide="' + di + '"></button>';
        }
        dotsHTML += '</div>';
        galleryEl.innerHTML =
          '<div class="product-carousel" data-carousel>' +
            '<div class="product-carousel__track">' + slidesHTML + '</div>' +
            '<button class="product-carousel__btn product-carousel__btn--prev" data-carousel-prev>&#10094;</button>' +
            '<button class="product-carousel__btn product-carousel__btn--next" data-carousel-next>&#10095;</button>' +
            dotsHTML +
          '</div>';
        initProductCarousel(galleryEl);
      } else {
        galleryEl.innerHTML = '<img src="' + allImages[0] + '" alt="' + productData.name + '">';
      }
    }

    // Store current product for buy button
    overlay.setAttribute('data-product-slug', productData.slug);
    overlay.setAttribute('data-product-name', productData.name);
    overlay.setAttribute('data-product-price', productData.price);
    overlay.setAttribute('data-product-image', productData.image_url || 'crystals-nature.png');
    overlay.setAttribute('data-product-stripe-link', productData.stripe_link || '');

    // Show overlay and scroll to top
    overlay.hidden = false;
    overlay.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }

  function closeProductDetail() {
    var overlay = document.getElementById('product-detail-overlay');
    if (overlay) {
      overlay.hidden = true;
      document.body.style.overflow = '';
    }
  }

  // Close handlers for product overlay
  (function() {
    var overlay = document.getElementById('product-detail-overlay');
    if (!overlay) return;
    var closeBtn = overlay.querySelector('.product-overlay__close');
    var backdrop = overlay.querySelector('.product-overlay__backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeProductDetail);
    if (backdrop) backdrop.addEventListener('click', closeProductDetail);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !overlay.hidden) closeProductDetail();
    });
  })();

  // ─── PANIER (CART SYSTEM) ───
  var CART_KEY = 'lumiere_cart';
  var _cartSyncTimer = null;

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch(e) { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
    // Synchroniser avec Supabase (débounced, 1.5s après le dernier changement)
    if (_cartSyncTimer) clearTimeout(_cartSyncTimer);
    _cartSyncTimer = setTimeout(function() { syncCartToSupabase(cart); }, 1500);
  }

  // --- Sauvegarder le panier en base Supabase pour les clients connectés ---
  async function syncCartToSupabase(cart) {
    if (!supabase) return;
    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;
      var userId = session.user.id;
      await supabase.from('paniers').upsert({
        user_id: userId,
        contenu: cart,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      console.log('[Panier] Synchronisé avec Supabase (' + cart.length + ' articles)');
    } catch(e) {
      // Table paniers peut ne pas encore exister — fallback silencieux sur localStorage
      console.log('[Panier] Sync Supabase non disponible (localStorage utilisé)');
    }
  }

  // --- Charger le panier depuis Supabase et fusionner avec le local ---
  async function loadAndMergeCartFromSupabase() {
    if (!supabase) return;
    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;
      var userId = session.user.id;
      var result = await supabase.from('paniers').select('contenu').eq('user_id', userId).single();
      if (result.error || !result.data || !result.data.contenu) return;
      var remoteCart = result.data.contenu;
      if (!Array.isArray(remoteCart) || remoteCart.length === 0) return;
      var localCart = getCart();
      // Fusionner : le panier local a priorité, les articles distants absents sont ajoutés
      var localSlugs = {};
      for (var i = 0; i < localCart.length; i++) localSlugs[localCart[i].slug] = true;
      var merged = localCart.slice();
      var added = 0;
      for (var r = 0; r < remoteCart.length; r++) {
        if (!localSlugs[remoteCart[r].slug]) {
          merged.push(remoteCart[r]);
          added++;
        }
      }
      if (added > 0 || localCart.length === 0) {
        localStorage.setItem(CART_KEY, JSON.stringify(merged));
        updateCartUI();
        console.log('[Panier] Fusionné depuis Supabase (+' + added + ' articles distants)');
      }
    } catch(e) {
      console.log('[Panier] Chargement Supabase non disponible');
    }
  }

  // --- Vider le panier Supabase (après paiement) ---
  async function clearCartSupabase() {
    if (!supabase) return;
    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;
      await supabase.from('paniers').delete().eq('user_id', session.user.id);
    } catch(e) { /* silencieux */ }
  }

  function addToCart(product) {
    var cart = getCart();
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === product.slug) { existing = cart[i]; break; }
    }
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        slug: product.slug,
        name: product.name,
        price: parseFloat(product.price),
        image_url: product.image_url || 'crystals-nature.png',
        category: product.category || '',
        stripe_link: product.stripe_link || '',
        qty: 1
      });
    }
    saveCart(cart);
    showCartToast(product.name + ' ajout\u00e9 au panier');
  }

  function removeFromCart(slug) {
    var cart = getCart().filter(function(item) { return item.slug !== slug; });
    saveCart(cart);
  }

  function updateCartQty(slug, delta) {
    var cart = getCart();
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === slug) {
        cart[i].qty += delta;
        if (cart[i].qty <= 0) { cart.splice(i, 1); }
        break;
      }
    }
    saveCart(cart);
  }

  function getCartTotal() {
    var cart = getCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) total += cart[i].price * cart[i].qty;
    return total;
  }

  function getCartCount() {
    var cart = getCart();
    var count = 0;
    for (var i = 0; i < cart.length; i++) count += cart[i].qty;
    return count;
  }

  // Update cart badge + drawer content
  function updateCartUI() {
    var count = getCartCount();
    var countEl = document.getElementById('cart-count');
    if (countEl) {
      countEl.textContent = count;
      countEl.hidden = count === 0;
    }
    // Unified FAB cart badge
    var ufabCartBadge = document.getElementById('ufab-cart-badge');
    if (ufabCartBadge) {
      ufabCartBadge.textContent = count;
      ufabCartBadge.hidden = count === 0;
    }
    // Update main FAB badge (combine all notifications)
    var ufabMainBadge = document.getElementById('ufab-main-badge');
    if (ufabMainBadge) {
      var nlBadge = document.getElementById('ufab-nl-badge');
      var nlCount = nlBadge && !nlBadge.hidden ? parseInt(nlBadge.textContent || '0', 10) : 1;
      var total = nlCount + count;
      ufabMainBadge.textContent = total;
      ufabMainBadge.style.display = total > 0 ? '' : 'none';
    }

    var itemsEl = document.getElementById('cart-items');
    var emptyEl = document.getElementById('cart-empty');
    var footerEl = document.getElementById('cart-footer');
    var totalEl = document.getElementById('cart-total');
    var cart = getCart();

    if (!itemsEl) return;

    // Clear existing items (keep empty msg)
    var oldItems = itemsEl.querySelectorAll('.cart-item');
    for (var o = 0; o < oldItems.length; o++) oldItems[o].remove();

    if (cart.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      if (footerEl) footerEl.hidden = true;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (footerEl) footerEl.hidden = false;

    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var div = document.createElement('div');
      div.className = 'cart-item';
      div.setAttribute('data-cart-slug', item.slug);
      div.innerHTML =
        '<div class="cart-item__img"><img src="' + item.image_url + '" alt="' + item.name + '" loading="lazy"></div>' +
        '<div class="cart-item__info">' +
          '<div class="cart-item__name">' + item.name + '</div>' +
          '<div class="cart-item__price">' + (item.price * item.qty).toFixed(2) + ' \u20ac</div>' +
          '<div class="cart-item__controls">' +
            '<button class="cart-item__qty-btn" data-cart-minus="' + item.slug + '">\u2212</button>' +
            '<span class="cart-item__qty">' + item.qty + '</span>' +
            '<button class="cart-item__qty-btn" data-cart-plus="' + item.slug + '">+</button>' +
          '</div>' +
        '</div>' +
        '<button class="cart-item__remove" data-cart-remove="' + item.slug + '" title="Retirer">\u2715</button>';
      itemsEl.appendChild(div);
    }

    if (totalEl) totalEl.textContent = getCartTotal().toFixed(2) + ' \u20ac';

    // Attach event handlers
    itemsEl.querySelectorAll('[data-cart-minus]').forEach(function(btn) {
      btn.onclick = function() { updateCartQty(btn.getAttribute('data-cart-minus'), -1); };
    });
    itemsEl.querySelectorAll('[data-cart-plus]').forEach(function(btn) {
      btn.onclick = function() { updateCartQty(btn.getAttribute('data-cart-plus'), 1); };
    });
    itemsEl.querySelectorAll('[data-cart-remove]').forEach(function(btn) {
      btn.onclick = function() { removeFromCart(btn.getAttribute('data-cart-remove')); };
    });
  }

  // Cart drawer open/close (exposé sur window pour le FAB unifié)
  function openCartDrawer() {
    var drawer = document.getElementById('cart-drawer');
    if (drawer) { drawer.hidden = false; document.body.style.overflow = 'hidden'; }
    updateCartUI();
  }
  window.openCartDrawer = openCartDrawer;

  function closeCartDrawer() {
    var drawer = document.getElementById('cart-drawer');
    if (drawer) { drawer.hidden = true; document.body.style.overflow = ''; }
  }

  (function initCartDrawerEvents() {
    var toggle = document.getElementById('cart-toggle');
    var closeBtn = document.getElementById('cart-close');
    var backdrop = document.querySelector('.cart-drawer__backdrop');
    if (toggle) toggle.addEventListener('click', openCartDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
    if (backdrop) backdrop.addEventListener('click', closeCartDrawer);
    document.addEventListener('keydown', function(e) {
      var drawer = document.getElementById('cart-drawer');
      if (e.key === 'Escape' && drawer && !drawer.hidden) closeCartDrawer();
    });
  })();

  // Toast notification
  var _toastTimer = null;
  function showCartToast(message) {
    var existing = document.querySelector('.cart-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { toast.classList.add('cart-toast--visible'); });
    });
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function() {
      toast.classList.remove('cart-toast--visible');
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 400);
    }, 2500);
  }

  // Add to cart button (in product overlay)
  var addCartBtn = document.getElementById('product-detail-add-cart');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', function() {
      var overlay = document.getElementById('product-detail-overlay');
      var slug = overlay.getAttribute('data-product-slug');
      var name = overlay.getAttribute('data-product-name');
      var price = overlay.getAttribute('data-product-price');
      var image = overlay.getAttribute('data-product-image');
      var stripeLink = overlay.getAttribute('data-product-stripe-link') || '';
      if (!slug || !name || !price) return;
      addToCart({
        slug: slug,
        name: name,
        price: parseFloat(price),
        image_url: image || 'crystals-nature.png',
        category: '',
        stripe_link: stripeLink
      });
      closeProductDetail();
    });
  }

  // Checkout: redirect to Stripe Payment Links
  var checkoutBtn = document.getElementById('cart-checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async function() {
      var cart = getCart();
      if (cart.length === 0) return;

      // Refresh stripe_link from loaded products (in case it was updated after adding to cart)
      var updated = false;
      for (var r = 0; r < cart.length; r++) {
        var fresh = _loadedProducts[cart[r].slug];
        if (fresh && fresh.stripe_link && !cart[r].stripe_link) {
          cart[r].stripe_link = fresh.stripe_link;
          updated = true;
        }
      }
      if (updated) saveCart(cart);

      // Check all items have a Stripe link
      var missingLinks = cart.filter(function(item) { return !item.stripe_link; });
      if (missingLinks.length > 0) {
        alert('Certains produits ne sont pas encore disponibles \u00e0 l\u2019achat : ' + missingLinks.map(function(i) { return i.name; }).join(', ') + '. Retirez-les du panier et ajoutez-les \u00e0 nouveau.');
        return;
      }

      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Redirection en cours...';

      try {
        if (cart.length === 1) {
          // Single product: use Payment Link directly
          var item = cart[0];
          var paymentUrl = item.stripe_link;

          // Add coupon if available
          try {
            var coupon = await getActiveCouponForServices();
            if (coupon && coupon.applicable_a !== 'services') {
              paymentUrl = buildStripeUrlWithPromo(paymentUrl, coupon.code);
            }
          } catch(ce) {}

          // Add quantity parameter if > 1
          if (item.qty > 1) {
            paymentUrl += (paymentUrl.indexOf('?') === -1 ? '?' : '&') + 'quantity=' + item.qty;
          }

          localStorage.removeItem(CART_KEY);
          updateCartUI();
          window.open(paymentUrl, '_blank', 'noopener,noreferrer');
          closeCartDrawer();
        } else {
          // Multiple products: open each Payment Link in sequence
          // (Stripe Payment Links don't support multi-product in one link)
          // Use Edge Function to create a combined Checkout Session
          var siteUrl = 'https://phm045.github.io/Lumiere-interieure';
          var slugs = cart.map(function(item) { return item.slug; }).join(',');
          var successUrl = siteUrl + '?session_id={CHECKOUT_SESSION_ID}&service=boutique_' + encodeURIComponent(slugs);
          var cancelUrl = siteUrl + '/#boutique';

          var params = {
            'mode': 'payment',
            'success_url': successUrl,
            'cancel_url': cancelUrl
          };
          for (var i = 0; i < cart.length; i++) {
            var ci = cart[i];
            params['line_items[' + i + '][price_data][currency]'] = 'eur';
            params['line_items[' + i + '][price_data][product_data][name]'] = ci.name;
            params['line_items[' + i + '][price_data][unit_amount]'] = Math.round(ci.price * 100);
            params['line_items[' + i + '][quantity]'] = String(ci.qty);
            if (ci.image_url && ci.image_url.indexOf('http') === 0) {
              params['line_items[' + i + '][price_data][product_data][images][0]'] = ci.image_url;
            }
          }

          try {
            var coupon = await getActiveCouponForServices();
            if (coupon && coupon.applicable_a !== 'services') {
              var promoMap = getStripePromoMap ? getStripePromoMap() : {};
              var stripePromoId = promoMap[coupon.code];
              if (stripePromoId) params['discounts[0][promotion_code]'] = stripePromoId;
            }
          } catch(ce) {}

          var session = await stripeApiCall('/checkout/sessions', 'POST', params);
          if (session && session.url) {
            localStorage.removeItem(CART_KEY);
            updateCartUI();
            window.location.href = session.url;
          } else {
            throw new Error('URL de paiement non re\u00e7ue');
          }
        }
      } catch(err) {
        console.error('[Stripe Panier] Erreur:', err);
        alert('Erreur lors de la cr\u00e9ation du paiement : ' + (err.message || 'erreur inconnue') + '. Veuillez r\u00e9essayer.');
      } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:0.4rem"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Valider ma commande';
      }
    });
  }

  // Initialize cart UI on page load
  updateCartUI();

  // --- Boutique form submit ---
  var boutiqueForm = document.getElementById('admin-boutique-form');
  if (boutiqueForm) {
    boutiqueForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var fd = new FormData(boutiqueForm);
      var name = fd.get('name').trim();
      var slug = adminSlugify(name);
      var imageUrl = fd.get('image_url');
      var boutiqueImageFile = document.getElementById('admin-boutique-image-file');
      if (boutiqueImageFile && boutiqueImageFile.files[0]) {
        var file = boutiqueImageFile.files[0];
        var ext = file.name.split('.').pop();
        var path = 'boutique/' + slug + '-' + Date.now() + '.' + ext;
        try {
          imageUrl = await uploadImage(file, 'images', path);
        } catch(e) {
          console.warn('Upload failed, using dropdown image:', e);
          if (!imageUrl) imageUrl = 'crystals-nature.png';
        }
      } else if (!imageUrl) {
        imageUrl = 'crystals-nature.png';
      }

      var isVisible = fd.get('visible') === 'true';
      var stockStatus = fd.get('status') || 'disponible';
      var stripeLink = (fd.get('stripe_link') || '').trim();
      var data = {
        slug: slug,
        name: name,
        description: fd.get('description').trim(),
        price: parseFloat(fd.get('price')),
        category: fd.get('category').trim(),
        image_url: imageUrl,
        visible: isVisible,
        status: stockStatus,
        stripe_link: stripeLink
      };

      // Indicateur de sauvegarde en cours
      var submitBtnProd = boutiqueForm.querySelector('.admin-modal__submit');
      var origBtnProdText = submitBtnProd ? submitBtnProd.textContent : '';
      if (submitBtnProd) { submitBtnProd.textContent = 'Sauvegarde en cours\u2026'; submitBtnProd.disabled = true; }

      var result = await supabase.from('boutique_products').insert([data]);
      if (result.error) {
        showAdminMsg('admin-boutique-msg', 'Erreur : ' + result.error.message, true);
        if (submitBtnProd) { submitBtnProd.textContent = origBtnProdText; submitBtnProd.disabled = false; }
        return;
      }

      // Upload extra images to product_images table
      var extraImagesInput = document.getElementById('admin-boutique-extra-images');
      var extraImages = [];
      if (extraImagesInput && extraImagesInput.files.length > 0) {
        for (var ei = 0; ei < extraImagesInput.files.length; ei++) {
          var extraFile = extraImagesInput.files[ei];
          var extraExt = extraFile.name.split('.').pop();
          var extraPath = 'boutique/' + slug + '-extra-' + ei + '-' + Date.now() + '.' + extraExt;
          try {
            var extraUrl = await uploadImage(extraFile, 'images', extraPath);
            extraImages.push({ product_slug: slug, image_url: extraUrl, position: ei });
          } catch(uploadErr) {
            console.warn('Extra image upload failed:', uploadErr);
          }
        }
        if (extraImages.length > 0) {
          try {
            await supabase.from('product_images').insert(extraImages);
          } catch(imgInsertErr) {
            console.warn('Extra images insert failed:', imgInsertErr);
          }
        }
      }
      data.extra_images = extraImages;
      _loadedProducts[slug] = data; // Cache for overlay

      // Add product card
      var prodGrid = document.getElementById('boutique-products-grid');
      if (prodGrid) {
        var card = createProductCardElement(data, true);
        prodGrid.appendChild(card);
        var delBtn = card.querySelector('.admin-delete-btn');
        if (delBtn) attachDeleteHandler(delBtn);
        card.addEventListener('click', function(e) {
          if (e.target.closest('.admin-delete-btn')) return;
          var pslug = card.getAttribute('data-product-slug');
          if (pslug && _loadedProducts[pslug]) openProductDetail(_loadedProducts[pslug]);
        });
      }

      // Hide "coming soon" placeholder only if product is visible
      if (isVisible) {
        var coming = document.querySelector('.boutique-coming');
        if (coming) coming.style.display = 'none';
      }

      // Refresh feed
      var feedGrid = document.getElementById('nouveautes-grid');
      if (feedGrid) { feedGrid.innerHTML = ''; }
      if (typeof window.__populateNouveautes === 'function') window.__populateNouveautes();

      showAdminMsg('admin-boutique-msg', isVisible ? '\u2705 Produit sauvegard\u00e9 avec succ\u00e8s !' : '\u2705 Produit enregistr\u00e9 (masqu\u00e9)', false);
      if (submitBtnProd) { submitBtnProd.textContent = origBtnProdText; submitBtnProd.disabled = false; }
      // Envoyer newsletter seulement si visible
      if (isVisible) envoyerNewsletterAbonnes('boutique', data.name);
      // Reset extra images input
      if (extraImagesInput) extraImagesInput.value = '';
      var extraPreview = document.getElementById('admin-boutique-extra-preview');
      if (extraPreview) { extraPreview.innerHTML = ''; extraPreview.style.display = 'none'; }
      setTimeout(function() { closeModal('admin-modal-boutique'); }, 1500);
    });
  }


  // ─── Stripe API helpers for coupon sync ───

  // localStorage-based Stripe promo ID mapping (since Supabase coupons table has no stripe columns)
  var STRIPE_PROMO_MAP_KEY = 'stripe_promo_map';

  function getStripePromoMap() {
    try {
      return JSON.parse(localStorage.getItem(STRIPE_PROMO_MAP_KEY)) || {};
    } catch(e) { return {}; }
  }

  function saveStripePromoMapping(code, promoId, couponId) {
    var map = getStripePromoMap();
    map[code] = { promo_id: promoId, coupon_id: couponId };
    localStorage.setItem(STRIPE_PROMO_MAP_KEY, JSON.stringify(map));
  }

  // Pre-populate localStorage with known existing Stripe promo mappings
  (function initStripePromoMap() {
    var map = getStripePromoMap();
    if (!map['BIENVENUE']) {
      saveStripePromoMapping('BIENVENUE', 'promo_1TFNGe2S616qVFR9olKNGNHM', 'IlwJ7Hty');
    }
  })();

  // Stripe API via Supabase Edge Function (no CORS issues)
  var STRIPE_EDGE_FN = EDGE_FN_BASE + '/stripe-checkout';

  async function stripeApiCall(endpoint, method, params) {
    var body = '';
    if (params) {
      var parts = [];
      for (var key in params) {
        if (params.hasOwnProperty(key)) {
          parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }
      }
      body = parts.join('&');
    }

    var resp = await fetch(STRIPE_EDGE_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: '/v1' + endpoint,
        method: method || 'POST',
        body: body
      })
    });

    var json = await resp.json();
    if (!resp.ok || (json.error && json.error.message)) {
      console.error('[Stripe API] Erreur:', json);
      throw new Error(json.error ? json.error.message : 'Stripe API error');
    }
    return json;
  }

  // Create a Stripe coupon + promotion code, returns { coupon_id, promo_id }
  async function stripeCreerCouponEtPromo(code, reductionPourcent) {
    // 1. Create Stripe coupon
    var coupon = await stripeApiCall('/coupons', 'POST', {
      percent_off: reductionPourcent,
      duration: 'once',
      name: code + ' (-' + reductionPourcent + '%)'
    });
    // 2. Create promotion code linked to the coupon
    var promo = await stripeApiCall('/promotion_codes', 'POST', {
      coupon: coupon.id,
      code: code,
      active: 'true'
    });
    return { coupon_id: coupon.id, promo_id: promo.id };
  }

  // Activate or deactivate a Stripe promotion code
  async function stripeTogglePromo(promoId, active) {
    return await stripeApiCall('/promotion_codes/' + promoId, 'POST', {
      active: active ? 'true' : 'false'
    });
  }

  // Find an existing Stripe promo code ID by searching (for coupons that don't have one stored yet)
  async function stripeTrouverPromoParCode(code) {
    try {
      var result = await stripeApiCall('/promotion_codes', 'GET', { code: code, limit: '1' });
      if (result.data && result.data.length > 0) {
        return result.data[0];
      }
    } catch(e) {
      console.warn('[Stripe] Recherche promo échouée pour', code, e);
    }
    return null;
  }

  // Get or create the Stripe promo ID for a given coupon, using localStorage for mapping
  async function obtenirOuCreerStripePromo(coupon) {
    // Check localStorage first
    var map = getStripePromoMap();
    var cached = map[coupon.code];
    if (cached && cached.promo_id) return cached.promo_id;

    // Try to find existing promo on Stripe
    var existant = await stripeTrouverPromoParCode(coupon.code);
    if (existant) {
      saveStripePromoMapping(coupon.code, existant.id, existant.coupon);
      return existant.id;
    }

    // Create new coupon+promo on Stripe and save to localStorage
    var result = await stripeCreerCouponEtPromo(coupon.code, coupon.reduction_pourcent);
    saveStripePromoMapping(coupon.code, result.promo_id, result.coupon_id);
    return result.promo_id;
  }

  // ─── Admin coupon management system ───

  // Load coupons list for admin panel
  async function chargerCouponsAdmin() {
    var container = document.getElementById('admin-coupons-list');
    if (!container) return;

    try {
      var { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('date_creation', { ascending: false });

      if (error || !data || data.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;font-size:0.85rem">Aucun coupon existant.</p>';
        return;
      }

      var scopeLabels = {
        'services_boutique': 'Services + Boutique',
        'services': 'Services',
        'boutique': 'Boutique'
      };

      container.innerHTML = '<h3 style="font-size:1rem;margin-bottom:0.75rem;color:var(--text-primary,#fff)">Coupons existants</h3>' +
        '<div style="display:flex;flex-direction:column;gap:0.5rem">' +
        data.map(function(c) {
          var scope = scopeLabels[c.applicable_a] || 'Services + Boutique';
          var expiry = c.valide_jusqu_au
            ? new Date(c.valide_jusqu_au).toLocaleDateString('fr-FR')
            : 'Illimit\u00e9';
          var isExpired = c.valide_jusqu_au && new Date(c.valide_jusqu_au) < new Date();
          var isMaxed = c.usage_max && c.usage_actuel >= c.usage_max;
          var statusColor = (!c.actif || isExpired || isMaxed) ? '#e74c3c' : '#27ae60';
          var statusText = !c.actif ? 'D\u00e9sactiv\u00e9' : (isExpired ? 'Expir\u00e9' : (isMaxed ? 'Limit reached' : 'Actif'));

          return '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:0.75rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">' +
            '<div>' +
              '<strong style="color:var(--accent,#d4a574);font-size:0.95rem">' + c.code + '</strong>' +
              '<span style="margin-left:0.5rem;color:' + statusColor + ';font-size:0.75rem;font-weight:600">\u25cf ' + statusText + '</span>' +
              '<br><span style="color:#bbb;font-size:0.8rem">' + c.description + '</span>' +
              '<br><span style="color:#999;font-size:0.75rem">-' + c.reduction_pourcent + '% \u2022 ' + scope + ' \u2022 Expire : ' + expiry + ' \u2022 Utilis\u00e9 : ' + (c.usage_actuel || 0) + '/' + (c.usage_max || '\u221e') + '</span>' +
            '</div>' +
            '<div style="display:flex;gap:0.3rem">' +
              (c.actif
                ? '<button class="admin-coupon-toggle" data-coupon-id="' + c.id + '" data-action="deactivate" style="background:#e74c3c;color:#fff;border:none;border-radius:4px;padding:0.3rem 0.6rem;font-size:0.75rem;cursor:pointer" title="D\u00e9sactiver">D\u00e9sactiver</button>'
                : '<button class="admin-coupon-toggle" data-coupon-id="' + c.id + '" data-action="activate" style="background:#27ae60;color:#fff;border:none;border-radius:4px;padding:0.3rem 0.6rem;font-size:0.75rem;cursor:pointer" title="R\u00e9activer">R\u00e9activer</button>'
              ) +
              '<button class="admin-coupon-toggle" data-coupon-id="' + c.id + '" data-action="delete" style="background:#333;color:#e74c3c;border:1px solid #e74c3c;border-radius:4px;padding:0.3rem 0.6rem;font-size:0.75rem;cursor:pointer" title="Supprimer">\ud83d\uddd1\ufe0f</button>' +
            '</div>' +
          '</div>';
        }).join('') +
        '</div>';

      // Build a lookup map for coupon data (needed for Stripe sync)
      var couponMap = {};
      data.forEach(function(c) { couponMap[c.id] = c; });

      // Attach toggle/delete handlers with Stripe sync
      container.querySelectorAll('.admin-coupon-toggle').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          var couponId = this.getAttribute('data-coupon-id');
          var action = this.getAttribute('data-action');
          var coupon = couponMap[couponId];

          if (action === 'delete') {
            if (!confirm('Supprimer ce coupon définitivement ?')) return;
            // Deactivate on Stripe before deleting
            try {
              var promoId = await obtenirOuCreerStripePromo(coupon);
              if (promoId) await stripeTogglePromo(promoId, false);
              showStripeToast('Synchronisé avec Stripe \u2713', false);
            } catch(stripeErr) {
              console.warn('[Stripe] Erreur désactivation lors suppression:', stripeErr);
              showStripeToast('\u26A0 Erreur Stripe : ' + stripeErr.message + '. Le coupon a été supprimé localement mais pas sur Stripe.', true);
            }
            await supabase.from('coupons_utilises').delete().eq('coupon_id', couponId);
            await supabase.from('coupons').delete().eq('id', couponId);
          } else if (action === 'deactivate') {
            await supabase.from('coupons').update({ actif: false }).eq('id', couponId);
            // Deactivate promo on Stripe
            try {
              var promoId = await obtenirOuCreerStripePromo(coupon);
              if (promoId) await stripeTogglePromo(promoId, false);
              showStripeToast('Synchronisé avec Stripe \u2713', false);
            } catch(stripeErr) {
              console.warn('[Stripe] Erreur désactivation promo:', stripeErr);
              showStripeToast('\u26A0 Erreur Stripe : ' + stripeErr.message + '. Le coupon a été mis à jour localement mais pas sur Stripe.', true);
            }
          } else if (action === 'activate') {
            // Activate on Stripe (create if needed)
            try {
              var promoId = await obtenirOuCreerStripePromo(coupon);
              if (promoId) await stripeTogglePromo(promoId, true);
              showStripeToast('Synchronisé avec Stripe \u2713', false);
            } catch(stripeErr) {
              console.warn('[Stripe] Erreur activation promo:', stripeErr);
              showStripeToast('\u26A0 Erreur Stripe : ' + stripeErr.message + '. Le coupon a été mis à jour localement mais pas sur Stripe.', true);
            }
            await supabase.from('coupons').update({ actif: true }).eq('id', couponId);
          }

          chargerCouponsAdmin();
        });
      });
    } catch(e) {
      container.innerHTML = '<p style="color:#e74c3c;font-size:0.85rem">Erreur de chargement des coupons.</p>';
    }
  }

  // --- Coupon creation form submit ---
  var couponForm = document.getElementById('admin-coupon-form');
  if (couponForm) {
    couponForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var fd = new FormData(couponForm);
      var code = fd.get('code').trim().toUpperCase();
      var reduction = parseInt(fd.get('reduction_pourcent'), 10);

      // Validate 10-40%
      if (reduction < 10 || reduction > 40) {
        showAdminMsg('admin-coupon-msg', 'La r\u00e9duction doit \u00eatre entre 10% et 40%.', true);
        return;
      }

      var data = {
        code: code,
        description: fd.get('description').trim(),
        reduction_pourcent: reduction,
        applicable_a: fd.get('applicable_a'),
        usage_max: parseInt(fd.get('usage_max'), 10) || 50,
        actif: true
      };

      var expiryVal = fd.get('valide_jusqu_au');
      if (expiryVal) {
        data.valide_jusqu_au = new Date(expiryVal).toISOString();
      }

      // Create coupon + promo on Stripe first, save mapping to localStorage
      var stripeIds = null;
      try {
        stripeIds = await stripeCreerCouponEtPromo(code, reduction);
        saveStripePromoMapping(code, stripeIds.promo_id, stripeIds.coupon_id);
        showStripeToast('Synchronisé avec Stripe \u2713', false);
      } catch(stripeErr) {
        console.warn('[Stripe] Erreur création coupon Stripe:', stripeErr);
        showStripeToast('\u26A0 Erreur Stripe : ' + stripeErr.message + '. Le coupon a été créé localement mais pas sur Stripe.', true);
        // Continue with Supabase creation even if Stripe fails
      }

      var result = await supabase.from('coupons').insert([data]).select();
      if (result.error) {
        if (result.error.message.indexOf('unique') !== -1 || result.error.message.indexOf('duplicate') !== -1) {
          showAdminMsg('admin-coupon-msg', 'Ce code coupon existe déjà.', true);
        } else {
          showAdminMsg('admin-coupon-msg', 'Erreur : ' + result.error.message, true);
        }
        return;
      }

      var stripeMsg = stripeIds ? ' (+ Stripe synchro ✓)' : ' (Stripe non synchronisé)';
      showAdminMsg('admin-coupon-msg', 'Coupon ' + code + ' créé avec succès !' + stripeMsg, false);
      couponForm.reset();
      chargerCouponsAdmin();
    });
  }


  // ========================================
  // ADMIN DASHBOARD — Full management panel
  // ========================================

  // --- Admin localStorage cache helpers ---
  var ADMIN_CACHE_PREFIX = 'li_admin_cache_';
  var ADMIN_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  function adminCacheSet(key, data) {
    try {
      safeLocal.setItem(ADMIN_CACHE_PREFIX + key, JSON.stringify({
        ts: Date.now(),
        data: data
      }));
    } catch(e) {}
  }

  function adminCacheGet(key) {
    try {
      var raw = safeLocal.getItem(ADMIN_CACHE_PREFIX + key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > ADMIN_CACHE_TTL) {
        safeLocal.removeItem(ADMIN_CACHE_PREFIX + key);
        return null;
      }
      return parsed.data;
    } catch(e) { return null; }
  }

  // Restore cached admin stats immediately into the DOM
  function restaurerAdminStatsCache() {
    var cached = adminCacheGet('stats');
    if (!cached) return;
    var statIds = ['stat-clients', 'stat-commandes', 'stat-ca', 'stat-rdv', 'stat-articles', 'stat-produits', 'stat-coupons', 'stat-newsletter'];
    for (var i = 0; i < statIds.length; i++) {
      var el = document.getElementById(statIds[i]);
      if (el && cached[statIds[i]] != null) el.textContent = cached[statIds[i]];
    }
  }

  // Restore cached CA data immediately into the DOM
  function restaurerAdminCACache() {
    var cached = adminCacheGet('ca');
    if (!cached) return;
    var fields = ['ca-mois-brut', 'ca-mois-urssaf', 'ca-mois-net', 'ca-mois-nb',
      'rev-consult-brut', 'rev-consult-urssaf', 'rev-consult-net', 'rev-consult-nb',
      'rev-boutique-brut', 'rev-boutique-urssaf', 'rev-boutique-net', 'rev-boutique-nb'];
    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById(fields[i]);
      if (el && cached[fields[i]] != null) el.textContent = cached[fields[i]];
    }
    var periodeEl = document.getElementById('admin-ca-period');
    if (periodeEl && cached['admin-ca-period']) periodeEl.textContent = cached['admin-ca-period'];
  }

  // Restore cached admin table data for a specific tab
  function restaurerAdminTabCache(tabKey, containerId) {
    var cached = adminCacheGet('tab_' + tabKey);
    if (!cached) return false;
    var container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = cached;
      return true;
    }
    return false;
  }

  // Save current stat values from the DOM to localStorage
  function sauvegarderAdminStatsCache() {
    var statIds = ['stat-clients', 'stat-commandes', 'stat-ca', 'stat-rdv', 'stat-articles', 'stat-produits', 'stat-coupons', 'stat-newsletter'];
    var cache = {};
    for (var i = 0; i < statIds.length; i++) {
      var el = document.getElementById(statIds[i]);
      if (el) cache[statIds[i]] = el.textContent;
    }
    adminCacheSet('stats', cache);
  }

  // Save current CA values from the DOM to localStorage
  function sauvegarderAdminCACache() {
    var fields = ['ca-mois-brut', 'ca-mois-urssaf', 'ca-mois-net', 'ca-mois-nb',
      'rev-consult-brut', 'rev-consult-urssaf', 'rev-consult-net', 'rev-consult-nb',
      'rev-boutique-brut', 'rev-boutique-urssaf', 'rev-boutique-net', 'rev-boutique-nb'];
    var cache = {};
    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById(fields[i]);
      if (el) cache[fields[i]] = el.textContent;
    }
    var periodeEl = document.getElementById('admin-ca-period');
    if (periodeEl) cache['admin-ca-period'] = periodeEl.textContent;
    adminCacheSet('ca', cache);
  }

  var _adminDashInitialized = false;

  // --- Admin tab switching ---
  (function initAdminTabs() {
    var tabsContainer = document.getElementById('admin-dash-tabs');
    if (!tabsContainer) return;
    tabsContainer.addEventListener('click', function(e) {
      var btn = e.target.closest('.admin-dash-tab');
      if (!btn) return;
      var tabId = btn.getAttribute('data-admin-tab');
      if (!tabId) return;
      // Deactivate all tabs
      var allTabs = tabsContainer.querySelectorAll('.admin-dash-tab');
      for (var i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove('admin-dash-tab--active');
      }
      btn.classList.add('admin-dash-tab--active');
      // Show correct content
      var allContents = document.querySelectorAll('.admin-tab-content');
      for (var j = 0; j < allContents.length; j++) {
        allContents[j].classList.remove('admin-tab-content--active');
      }
      var target = document.getElementById('admin-tab-' + tabId);
      if (target) target.classList.add('admin-tab-content--active');
      // Load data for the tab
      if (tabId === 'dashboard') { chargerAdminStats(); chargerCAMensuel(); }
      if (tabId === 'blog') chargerAdminBlog();
      if (tabId === 'boutique') chargerAdminBoutique();
      if (tabId === 'coupons') chargerAdminCouponsTab();
      if (tabId === 'commandes') chargerAdminCommandes();
      if (tabId === 'rdv') chargerAdminRDV();
      if (tabId === 'clients') chargerAdminClients();
      if (tabId === 'newsletter') chargerAdminNewsletter();
      if (tabId === 'temoignages') chargerAdminTemoignages();
      if (tabId === 'visiteurs') chargerAdminVisiteurs();
    });
  })();

  // --- Admin dashboard buttons ---
  (function initAdminButtons() {
    var btnNewArticle = document.getElementById('admin-btn-new-article');
    if (btnNewArticle) {
      btnNewArticle.addEventListener('click', function() { openModal('admin-modal-blog'); });
    }
    var btnNewProduct = document.getElementById('admin-btn-new-product');
    if (btnNewProduct) {
      btnNewProduct.addEventListener('click', function() { openModal('admin-modal-boutique'); });
    }
    var btnNewCoupon = document.getElementById('admin-btn-new-coupon');
    if (btnNewCoupon) {
      btnNewCoupon.addEventListener('click', function() {
        openModal('admin-modal-coupon');
        chargerCouponsAdmin();
      });
    }
    var btnAdminLogout = document.getElementById('admin-btn-deconnexion');
    if (btnAdminLogout) {
      btnAdminLogout.addEventListener('click', async function() {
        await supabase.auth.signOut();
        window.__isAdmin = false;
        afficherEtatDeconnecte();
        showPage('accueil');
      });
    }
  })();

  // --- Main entry point: load all admin data ---
  function chargerDashboardAdmin() {
    if (!window.__isAdmin) return;
    // Immediately restore cached stats/CA so UI isn't empty while Supabase loads
    restaurerAdminStatsCache();
    restaurerAdminCACache();
    // Then fetch fresh data from Supabase (will overwrite cache values)
    chargerAdminStats();
    chargerCAMensuel();
    verifierArchivageAuto();
    chargerBadgesNotifications();
    // Initialize search listeners once + preload key admin tabs
    if (!_adminDashInitialized) {
      _adminDashInitialized = true;
      initAdminSearchListeners();
      // Pre-load main admin tabs so data is ready when user clicks
      chargerAdminVisiteurs();
      chargerAdminClients();
      chargerAdminRDV();
      chargerAdminCommandes();
      chargerAdminTemoignages();
    }
  }

  // --- Search listeners ---
  function initAdminSearchListeners() {
    var searchFields = [
      { id: 'admin-blog-search', loader: chargerAdminBlog },
      { id: 'admin-boutique-search', loader: chargerAdminBoutique },
      { id: 'admin-commandes-search', loader: chargerAdminCommandes },
      { id: 'admin-rdv-search', loader: chargerAdminRDV },
      { id: 'admin-clients-search', loader: chargerAdminClients }
    ];
    for (var i = 0; i < searchFields.length; i++) {
      (function(field) {
        var el = document.getElementById(field.id);
        if (!el) return;
        var timer = null;
        el.addEventListener('input', function() {
          if (timer) clearTimeout(timer);
          timer = setTimeout(function() { field.loader(el.value.trim().toLowerCase()); }, 300);
        });
      })(searchFields[i]);
    }
  }

  // --- Helper: format date FR ---
  function formatDateFR(dateStr) {
    if (!dateStr) return '—';
    try {
      var d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch(e) { return dateStr; }
  }

  // --- Helper: escape HTML ---
  function escHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ─── 1. DASHBOARD STATS ───
  async function chargerAdminStats() {
    try {
      var result = await supabase.rpc('get_admin_stats');
      if (result.error) throw result.error;
      var s = result.data;
      var el;
      // Clients: use get_admin_clients RPC for accurate count (get_admin_stats may exclude some)
      el = document.getElementById('stat-clients');
      if (el) {
        try {
          var clientsResult = await supabase.rpc('get_admin_clients');
          if (clientsResult.data && clientsResult.data.length != null) {
            el.textContent = clientsResult.data.length;
          } else {
            el.textContent = (s.nb_clients != null) ? s.nb_clients : '0';
          }
        } catch(ec) {
          el.textContent = (s.nb_clients != null) ? s.nb_clients : '0';
        }
      }
      el = document.getElementById('stat-commandes');
      if (el) el.textContent = (s.nb_commandes != null) ? s.nb_commandes : '0';
      el = document.getElementById('stat-ca');
      if (el) el.textContent = (s.chiffre_affaires != null) ? parseFloat(s.chiffre_affaires).toFixed(0) + ' \u20ac' : '0 \u20ac';
      el = document.getElementById('stat-rdv');
      if (el) el.textContent = (s.nb_rdv != null) ? s.nb_rdv : '0';
      el = document.getElementById('stat-articles');
      // Articles = Supabase (dynamiques) + HTML statiques
      var nbStaticArticles = document.querySelectorAll('.blog-card[data-article]:not([data-dynamic])').length;
      var nbDynArticles = (s.nb_articles != null) ? s.nb_articles : 0;
      if (el) el.textContent = nbStaticArticles + nbDynArticles;
      el = document.getElementById('stat-produits');
      if (el) el.textContent = (s.nb_produits != null) ? s.nb_produits : '0';
      el = document.getElementById('stat-coupons');
      if (el) el.textContent = (s.nb_coupons_actifs != null) ? s.nb_coupons_actifs : '0';
      // Newsletter count always from Brevo (not Supabase)
      try {
        var brevoCount = await getBrevoNewsletterCount();
        el = document.getElementById('stat-newsletter');
        if (el) el.textContent = brevoCount;
      } catch(e2) {
        el = document.getElementById('stat-newsletter');
        if (el) el.textContent = (s.nb_newsletter != null) ? s.nb_newsletter : '0';
      }
      // Cache stats to localStorage for instant display on next page load
      sauvegarderAdminStatsCache();
    } catch(e) {
      // Fallback: try individual queries
      chargerAdminStatsFallback();
    }
  }

  async function chargerAdminStatsFallback() {
    // Clients: use get_admin_clients for accurate count
    try {
      var clientsRes = await supabase.rpc('get_admin_clients');
      var elC = document.getElementById('stat-clients');
      if (elC) elC.textContent = (clientsRes.data) ? clientsRes.data.length : '0';
    } catch(e) {}
    try {
      var blogRes = await supabase.from('blog_articles').select('id', { count: 'exact', head: true });
      var el = document.getElementById('stat-articles');
      var nbStaticBlog = document.querySelectorAll('.blog-card[data-article]:not([data-dynamic])').length;
      var nbDynBlog = (blogRes.count != null) ? blogRes.count : 0;
      if (el) el.textContent = nbStaticBlog + nbDynBlog;
    } catch(e) {}
    try {
      var prodRes = await supabase.from('boutique_products').select('id', { count: 'exact', head: true });
      var el2 = document.getElementById('stat-produits');
      if (el2) el2.textContent = (prodRes.count != null) ? prodRes.count : '0';
    } catch(e) {}
    try {
      var coupRes = await supabase.from('coupons').select('id', { count: 'exact', head: true }).eq('actif', true);
      var el3 = document.getElementById('stat-coupons');
      if (el3) el3.textContent = (coupRes.count != null) ? coupRes.count : '0';
    } catch(e) {}
    try {
      var cmdRes = await supabase.from('commandes').select('id, montant');
      var el4 = document.getElementById('stat-commandes');
      if (el4) el4.textContent = (cmdRes.data) ? cmdRes.data.length : '0';
      var el5 = document.getElementById('stat-ca');
      if (el5 && cmdRes.data) {
        var total = 0;
        for (var i = 0; i < cmdRes.data.length; i++) {
          total += parseFloat(cmdRes.data[i].montant) || 0;
        }
        el5.textContent = total.toFixed(0) + ' \u20ac';
      }
    } catch(e) {}
    try {
      var rdvRes = await supabase.from('reservations').select('id', { count: 'exact', head: true });
      var el6 = document.getElementById('stat-rdv');
      if (el6) el6.textContent = (rdvRes.count != null) ? rdvRes.count : '0';
    } catch(e) {}
    // Newsletter count from Brevo
    try {
      var nlCount = await getBrevoNewsletterCount();
      var el7 = document.getElementById('stat-newsletter');
      if (el7) el7.textContent = nlCount;
    } catch(e) {}
    // Cache fallback stats too
    sauvegarderAdminStatsCache();
  }

  // ─── 2. BLOG MANAGEMENT ───
  async function chargerAdminBlog(filter) {
    var container = document.getElementById('admin-blog-table');
    if (!container) return;
    if (!filter) restaurerAdminTabCache('blog', 'admin-blog-table');
    try {
      var result = await supabase.from('blog_articles').select('*').order('created_at', { ascending: false });
      if (result.error) throw result.error;
      var data = result.data || [];
      if (filter) {
        data = data.filter(function(a) {
          return (a.title || '').toLowerCase().indexOf(filter) !== -1 ||
                 (a.category || '').toLowerCase().indexOf(filter) !== -1;
        });
      }
      if (data.length === 0) {
        container.innerHTML = '<p class="admin-dash-empty">Aucun article trouv\u00e9.</p>';
        return;
      }
      var html = '<div class="admin-dash-table--blog">';
      html += '<div class="admin-dash-table__row admin-dash-table__row--header">' +
        '<div class="admin-dash-table__cell">Image</div>' +
        '<div class="admin-dash-table__cell">Titre</div>' +
        '<div class="admin-dash-table__cell">Cat\u00e9gorie</div>' +
        '<div class="admin-dash-table__cell">Date</div>' +
        '<div class="admin-dash-table__cell">Actions</div>' +
        '</div>';
      for (var i = 0; i < data.length; i++) {
        var a = data[i];
        html += '<div class="admin-dash-table__row">' +
          '<div class="admin-dash-table__cell admin-dash-table__cell--img" data-label="Image"><img src="' + escHtml(a.image_url || 'hero-voyance.png') + '" alt="" loading="lazy"></div>' +
          '<div class="admin-dash-table__cell" data-label="Titre">' + escHtml(a.title) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Cat\u00e9gorie"><span class="admin-dash-badge admin-dash-badge--neutral">' + escHtml(a.category) + '</span></div>' +
          '<div class="admin-dash-table__cell" data-label="Date">' + escHtml(a.date_publication || formatDateFR(a.created_at)) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Actions"><div class="admin-dash-btn-group">' +
            '<button class="admin-dash-btn-sm admin-dash-btn-sm--edit" data-edit-blog="' + escHtml(a.slug) + '">Modifier</button>' +
            '<button class="admin-dash-btn-sm admin-dash-btn-sm--delete" data-del-blog="' + escHtml(a.slug) + '">Supprimer</button>' +
          '</div></div>' +
          '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
      if (!filter) adminCacheSet('tab_blog', html);
      // Attach handlers
      var delBtns = container.querySelectorAll('[data-del-blog]');
      for (var d = 0; d < delBtns.length; d++) {
        delBtns[d].addEventListener('click', function() {
          var slug = this.getAttribute('data-del-blog');
          if (!confirm('Supprimer cet article ?')) return;
          supabase.from('blog_articles').delete().eq('slug', slug).then(function(res) {
            if (res.error) { alert('Erreur : ' + res.error.message); return; }
            chargerAdminBlog();
            chargerAdminStats();
          });
        });
      }
      var editBtns = container.querySelectorAll('[data-edit-blog]');
      for (var e = 0; e < editBtns.length; e++) {
        editBtns[e].addEventListener('click', function() {
          var slug = this.getAttribute('data-edit-blog');
          ouvrirEditBlog(slug);
        });
      }
    } catch(e) {
      if (!restaurerAdminTabCache('blog', 'admin-blog-table')) {
        container.innerHTML = '<p class="admin-dash-empty">Erreur de chargement des articles.</p>';
      }
    }
  }

  // Edit blog article using the existing modal
  function ouvrirEditBlog(slug) {
    var form = document.getElementById('admin-blog-form');
    if (!form) return;
    supabase.from('blog_articles').select('*').eq('slug', slug).single().then(function(result) {
      if (result.error || !result.data) { alert('Article introuvable.'); return; }
      var a = result.data;
      var titleEl = document.querySelector('#admin-modal-blog .admin-modal__title');
      if (titleEl) titleEl.textContent = 'Modifier l\u2019article';
      var submitBtn = form.querySelector('.admin-modal__submit');
      if (submitBtn) submitBtn.textContent = 'Mettre \u00e0 jour';
      // Fill form fields
      var fields = { category: a.category, title: a.title, excerpt: a.excerpt, content: a.content, date_publication: a.date_publication };
      for (var key in fields) {
        var input = form.querySelector('[name="' + key + '"]');
        if (input) input.value = fields[key] || '';
      }
      var imgSelect = form.querySelector('[name="image_url"]');
      if (imgSelect) {
        var opts = imgSelect.options;
        var found = false;
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].value === a.image_url) { imgSelect.selectedIndex = i; found = true; break; }
        }
        if (!found) imgSelect.selectedIndex = 0;
      }
      // Set edit mode flag
      form.setAttribute('data-edit-slug', slug);
      openModal('admin-modal-blog');
    });
  }

  // ─── 3. BOUTIQUE MANAGEMENT ───
  async function chargerAdminBoutique(filter) {
    var container = document.getElementById('admin-boutique-table');
    if (!container) return;
    if (!filter) restaurerAdminTabCache('boutique', 'admin-boutique-table');
    try {
      var result = await supabase.from('boutique_products').select('*').order('created_at', { ascending: false });
      if (result.error) throw result.error;
      var data = result.data || [];
      if (filter) {
        data = data.filter(function(p) {
          return (p.name || '').toLowerCase().indexOf(filter) !== -1 ||
                 (p.category || '').toLowerCase().indexOf(filter) !== -1;
        });
      }
      if (data.length === 0) {
        container.innerHTML = '<p class="admin-dash-empty">Aucun produit trouv\u00e9.</p>';
        return;
      }
      var html = '<div class="admin-dash-table--boutique">';
      html += '<div class="admin-dash-table__row admin-dash-table__row--header">' +
        '<div class="admin-dash-table__cell">Image</div>' +
        '<div class="admin-dash-table__cell">Nom</div>' +
        '<div class="admin-dash-table__cell">Cat\u00e9gorie</div>' +
        '<div class="admin-dash-table__cell">Prix</div>' +
        '<div class="admin-dash-table__cell">Statut</div>' +
        '<div class="admin-dash-table__cell">Actions</div>' +
        '</div>';
      for (var i = 0; i < data.length; i++) {
        var p = data[i];
        var statusBadge = p.visible === false
          ? '<span class="admin-dash-badge admin-dash-badge--warning">Masqu\u00e9</span>'
          : '<span class="admin-dash-badge admin-dash-badge--success">Visible</span>';
        html += '<div class="admin-dash-table__row' + (p.visible === false ? ' admin-dash-table__row--muted' : '') + '">' +
          '<div class="admin-dash-table__cell admin-dash-table__cell--img" data-label="Image"><img src="' + escHtml(p.image_url || 'crystals-nature.png') + '" alt="" loading="lazy"></div>' +
          '<div class="admin-dash-table__cell" data-label="Nom">' + escHtml(p.name) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Cat\u00e9gorie"><span class="admin-dash-badge admin-dash-badge--neutral">' + escHtml(p.category) + '</span></div>' +
          '<div class="admin-dash-table__cell" data-label="Prix">' + parseFloat(p.price).toFixed(2) + ' \u20ac</div>' +
          '<div class="admin-dash-table__cell" data-label="Statut">' + statusBadge + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Actions"><div class="admin-dash-btn-group">' +
            '<button class="admin-dash-btn-sm admin-dash-btn-sm--edit" data-edit-prod="' + escHtml(p.slug) + '">Modifier</button>' +
            '<button class="admin-dash-btn-sm admin-dash-btn-sm--delete" data-del-prod="' + escHtml(p.slug) + '">Supprimer</button>' +
          '</div></div>' +
          '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
      if (!filter) adminCacheSet('tab_boutique', html);
      // Attach handlers
      var delBtns = container.querySelectorAll('[data-del-prod]');
      for (var d = 0; d < delBtns.length; d++) {
        delBtns[d].addEventListener('click', function() {
          var slug = this.getAttribute('data-del-prod');
          if (!confirm('Supprimer ce produit ?')) return;
          supabase.from('boutique_products').delete().eq('slug', slug).then(function(res) {
            if (res.error) { alert('Erreur : ' + res.error.message); return; }
            // Also delete associated extra images
            safeSupabase(function() { return supabase.from('product_images').delete().eq('product_slug', slug); }, 'suppression des images produit');
            chargerAdminBoutique();
            chargerAdminStats();
          });
        });
      }
      var editBtns = container.querySelectorAll('[data-edit-prod]');
      for (var e = 0; e < editBtns.length; e++) {
        editBtns[e].addEventListener('click', function() {
          var slug = this.getAttribute('data-edit-prod');
          ouvrirEditProduit(slug);
        });
      }
    } catch(e) {
      if (!restaurerAdminTabCache('boutique', 'admin-boutique-table')) {
        container.innerHTML = '<p class="admin-dash-empty">Erreur de chargement des produits.</p>';
      }
    }
  }

  // Edit product using the existing modal
  function ouvrirEditProduit(slug) {
    var form = document.getElementById('admin-boutique-form');
    if (!form) return;
    supabase.from('boutique_products').select('*').eq('slug', slug).single().then(async function(result) {
      if (result.error || !result.data) { alert('Produit introuvable.'); return; }
      var p = result.data;
      var titleEl = document.querySelector('#admin-modal-boutique .admin-modal__title');
      if (titleEl) titleEl.textContent = 'Modifier le produit';
      var submitBtn = form.querySelector('.admin-modal__submit');
      if (submitBtn) submitBtn.textContent = 'Mettre \u00e0 jour';
      // Fill form fields
      var fields = { name: p.name, description: p.description, price: p.price, category: p.category, stripe_link: p.stripe_link || '' };
      for (var key in fields) {
        var input = form.querySelector('[name="' + key + '"]');
        if (input) input.value = fields[key] || '';
      }
      // Set status toggle
      var stockSelect = form.querySelector('[name="status"]');
      if (stockSelect) stockSelect.value = p.status || 'disponible';
      // Set visible toggle
      var visibleSelect = form.querySelector('[name="visible"]');
      if (visibleSelect) visibleSelect.value = (p.visible !== false) ? 'true' : 'false';
      var imgSelect = form.querySelector('[name="image_url"]');
      if (imgSelect) {
        var opts = imgSelect.options;
        var found = false;
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].value === p.image_url) { imgSelect.selectedIndex = i; found = true; break; }
        }
        if (!found) imgSelect.selectedIndex = 0;
      }

      // Load and display existing extra images
      var existingGallery = document.getElementById('admin-boutique-existing-gallery');
      if (existingGallery) existingGallery.remove();
      try {
        var imgResult = await supabase.from('product_images').select('*').eq('product_slug', slug).order('position', { ascending: true });
        if (!imgResult.error && imgResult.data && imgResult.data.length > 0) {
          var galleryContainer = document.createElement('div');
          galleryContainer.id = 'admin-boutique-existing-gallery';
          galleryContainer.innerHTML = '<label class="admin-modal__label" style="margin-top:0.5rem">Photos existantes de la galerie</label>';
          var galleryItems = document.createElement('div');
          galleryItems.className = 'admin-gallery-existing';
          imgResult.data.forEach(function(img) {
            var item = document.createElement('div');
            item.className = 'admin-gallery-existing__item';
            item.setAttribute('data-image-id', img.id);
            item.innerHTML = '<img src="' + img.image_url + '" alt="Photo galerie">' +
              '<button type="button" class="admin-gallery-existing__remove" title="Supprimer">&times;</button>';
            item.querySelector('.admin-gallery-existing__remove').addEventListener('click', function() {
              supabase.from('product_images').delete().eq('id', img.id).then(function(delRes) {
                if (!delRes.error) item.remove();
              });
            });
            galleryItems.appendChild(item);
          });
          galleryContainer.appendChild(galleryItems);
          var extraGroup = document.getElementById('admin-boutique-extra-images');
          if (extraGroup && extraGroup.closest('.admin-modal__group')) {
            extraGroup.closest('.admin-modal__group').appendChild(galleryContainer);
          }
        }
      } catch(imgErr) { /* product_images table may not exist */ }

      form.setAttribute('data-edit-slug', slug);
      openModal('admin-modal-boutique');
    });
  }

  // ─── 4. COUPONS MANAGEMENT (dashboard tab) ───
  async function chargerAdminCouponsTab() {
    var container = document.getElementById('admin-coupons-table');
    if (!container) return;
    restaurerAdminTabCache('coupons', 'admin-coupons-table');
    try {
      var result = await supabase.from('coupons').select('*').order('date_creation', { ascending: false });
      if (result.error) throw result.error;
      var data = result.data || [];
      if (data.length === 0) {
        container.innerHTML = '<p class="admin-dash-empty">Aucun coupon. Cr\u00e9ez-en un !</p>';
        return;
      }
      var scopeLabels = { 'services_boutique': 'Services + Boutique', 'services': 'Services', 'boutique': 'Boutique' };
      var html = '<div class="admin-dash-table--coupons">';
      html += '<div class="admin-dash-table__row admin-dash-table__row--header">' +
        '<div class="admin-dash-table__cell">Code</div>' +
        '<div class="admin-dash-table__cell">Description</div>' +
        '<div class="admin-dash-table__cell">R\u00e9duction</div>' +
        '<div class="admin-dash-table__cell">Utilisation</div>' +
        '<div class="admin-dash-table__cell">Statut</div>' +
        '<div class="admin-dash-table__cell">Actions</div>' +
        '</div>';
      for (var i = 0; i < data.length; i++) {
        var c = data[i];
        var isExpired = c.valide_jusqu_au && new Date(c.valide_jusqu_au) < new Date();
        var isMaxed = c.usage_max && c.usage_actuel >= c.usage_max;
        var statusClass = (!c.actif || isExpired || isMaxed) ? 'danger' : 'success';
        var statusText = !c.actif ? 'D\u00e9sactiv\u00e9' : (isExpired ? 'Expir\u00e9' : (isMaxed ? 'Plein' : 'Actif'));
        html += '<div class="admin-dash-table__row">' +
          '<div class="admin-dash-table__cell" data-label="Code" style="color:rgba(212,165,116,1);font-weight:600">' + escHtml(c.code) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Description">' + escHtml(c.description) + '<br><span style="font-size:0.72rem;color:#999">' + (scopeLabels[c.applicable_a] || '—') + '</span></div>' +
          '<div class="admin-dash-table__cell" data-label="R\u00e9duction">-' + c.reduction_pourcent + '%</div>' +
          '<div class="admin-dash-table__cell" data-label="Utilisation">' + (c.usage_actuel || 0) + ' / ' + (c.usage_max || '\u221e') + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Statut"><span class="admin-dash-badge admin-dash-badge--' + statusClass + '">' + statusText + '</span></div>' +
          '<div class="admin-dash-table__cell" data-label="Actions"><div class="admin-dash-btn-group">' +
            (c.actif
              ? '<button class="admin-dash-btn-sm admin-dash-btn-sm--delete" data-toggle-coupon="' + c.id + '" data-coupon-action="deactivate">D\u00e9sactiver</button>'
              : '<button class="admin-dash-btn-sm admin-dash-btn-sm--success" data-toggle-coupon="' + c.id + '" data-coupon-action="activate">Activer</button>'
            ) +
            '<button class="admin-dash-btn-sm admin-dash-btn-sm--delete" data-del-coupon="' + c.id + '">Supprimer</button>' +
          '</div></div>' +
          '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
      adminCacheSet('tab_coupons', html);
      // Build coupon lookup map for Stripe sync
      var couponMap = {};
      data.forEach(function(c) { couponMap[c.id] = c; });
      // Attach toggle handlers with Stripe sync
      var toggleBtns = container.querySelectorAll('[data-toggle-coupon]');
      for (var t = 0; t < toggleBtns.length; t++) {
        toggleBtns[t].addEventListener('click', async function() {
          var couponId = this.getAttribute('data-toggle-coupon');
          var action = this.getAttribute('data-coupon-action');
          var newVal = (action === 'activate');
          var coupon = couponMap[couponId];
          if (newVal) {
            // Activate: sync Stripe first (create promo if needed), then update Supabase
            try {
              var promoId = await obtenirOuCreerStripePromo(coupon);
              if (promoId) await stripeTogglePromo(promoId, true);
              showStripeToast('Synchronisé avec Stripe \u2713', false);
            } catch(stripeErr) {
              console.warn('[Stripe] Erreur activation promo:', stripeErr);
              showStripeToast('\u26A0 Erreur Stripe : ' + stripeErr.message + '. Le coupon a été mis à jour localement mais pas sur Stripe.', true);
            }
          } else {
            // Deactivate: update Supabase, then deactivate on Stripe
            try {
              var promoId = await obtenirOuCreerStripePromo(coupon);
              if (promoId) await stripeTogglePromo(promoId, false);
              showStripeToast('Synchronisé avec Stripe \u2713', false);
            } catch(stripeErr) {
              console.warn('[Stripe] Erreur désactivation promo:', stripeErr);
              showStripeToast('\u26A0 Erreur Stripe : ' + stripeErr.message + '. Le coupon a été mis à jour localement mais pas sur Stripe.', true);
            }
          }
          await safeSupabase(function() { return supabase.from('coupons').update({ actif: newVal }).eq('id', couponId); }, 'mise à jour du coupon');
          chargerAdminCouponsTab();
          chargerAdminStats();
        });
      }
      var delBtns = container.querySelectorAll('[data-del-coupon]');
      for (var d = 0; d < delBtns.length; d++) {
        delBtns[d].addEventListener('click', async function() {
          var couponId = this.getAttribute('data-del-coupon');
          if (!confirm('Supprimer ce coupon définitivement ?')) return;
          var coupon = couponMap[couponId];
          // Deactivate on Stripe before deleting
          try {
            var promoId = await obtenirOuCreerStripePromo(coupon);
            if (promoId) await stripeTogglePromo(promoId, false);
            showStripeToast('Synchronisé avec Stripe \u2713', false);
          } catch(stripeErr) {
            console.warn('[Stripe] Erreur désactivation lors suppression:', stripeErr);
            showStripeToast('\u26A0 Erreur Stripe : ' + stripeErr.message + '. Le coupon a été supprimé localement mais pas sur Stripe.', true);
          }
          await supabase.from('coupons_utilises').delete().eq('coupon_id', couponId);
          await supabase.from('coupons').delete().eq('id', couponId);
          chargerAdminCouponsTab();
          chargerAdminStats();
        });
      }
    } catch(e) {
      if (!restaurerAdminTabCache('coupons', 'admin-coupons-table')) {
        container.innerHTML = '<p class="admin-dash-empty">Erreur de chargement des coupons.</p>';
      }
    }
  }

  // ─── 5. COMMANDES MANAGEMENT ───
  async function chargerAdminCommandes(filter) {
    var container = document.getElementById('admin-commandes-table');
    if (!container) return;
    if (!filter) restaurerAdminTabCache('commandes', 'admin-commandes-table');
    try {
      // Try RPC first (includes user emails)
      var result = await supabase.rpc('get_admin_commandes');
      var data;
      if (result.error || !result.data) {
        // Fallback: direct query
        var fallback = await supabase.from('commandes').select('*').order('date_creation', { ascending: false });
        data = fallback.data || [];
      } else {
        data = result.data || [];
      }
      if (filter) {
        data = data.filter(function(c) {
          return (c.user_email || '').toLowerCase().indexOf(filter) !== -1 ||
                 (c.service || '').toLowerCase().indexOf(filter) !== -1 ||
                 (c.statut || '').toLowerCase().indexOf(filter) !== -1;
        });
      }
      if (data.length === 0) {
        container.innerHTML = '<p class="admin-dash-empty">Aucune commande trouv\u00e9e.</p>';
        return;
      }
      var html = '<div class="admin-dash-table--commandes">';
      html += '<div class="admin-dash-table__row admin-dash-table__row--header">' +
        '<div class="admin-dash-table__cell">Client</div>' +
        '<div class="admin-dash-table__cell">Service</div>' +
        '<div class="admin-dash-table__cell">Montant</div>' +
        '<div class="admin-dash-table__cell">Paiement</div>' +
        '<div class="admin-dash-table__cell">Statut</div>' +
        '<div class="admin-dash-table__cell">Actions</div>' +
        '</div>';
      for (var i = 0; i < data.length; i++) {
        var c = data[i];
        var email = c.user_email || '(inconnu)';
        var prenom = c.user_prenom || '';
        var statusClass = (c.statut === 'pay\u00e9' || c.statut === 'paye') ? 'success' : ((c.statut === 'rembours\u00e9') ? 'danger' : 'warning');
        html += '<div class="admin-dash-table__row">' +
          '<div class="admin-dash-table__cell admin-dash-table__cell--email" data-label="Client">' + escHtml(prenom) + '<br><span style="font-size:0.75rem">' + escHtml(email) + '</span></div>' +
          '<div class="admin-dash-table__cell" data-label="Service">' + escHtml(c.service) + '<br><span style="font-size:0.72rem;color:#999">' + formatDateFR(c.date_creation) + '</span></div>' +
          '<div class="admin-dash-table__cell" data-label="Montant" style="font-weight:600">' + parseFloat(c.montant || 0).toFixed(2) + ' \u20ac</div>' +
          '<div class="admin-dash-table__cell" data-label="Paiement">' + escHtml(c.methode_paiement || '—') + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Statut"><span class="admin-dash-badge admin-dash-badge--' + statusClass + '">' + escHtml(c.statut) + '</span></div>' +
          '<div class="admin-dash-table__cell" data-label="Actions"><div class="admin-dash-btn-group">' +
            ((c.statut !== 'rembours\u00e9') ? '<button class="admin-dash-btn-sm admin-dash-btn-sm--delete" data-refund-cmd="' + c.id + '">Rembourser</button>' : '') +
          '</div></div>' +
          '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
      if (!filter) adminCacheSet('tab_commandes', html);
      // Attach refund handlers
      var refundBtns = container.querySelectorAll('[data-refund-cmd]');
      for (var r = 0; r < refundBtns.length; r++) {
        refundBtns[r].addEventListener('click', function() {
          var cmdId = this.getAttribute('data-refund-cmd');
          if (!confirm('Marquer cette commande comme rembours\u00e9e ?')) return;
          supabase.from('commandes').update({ statut: 'rembours\u00e9' }).eq('id', cmdId).then(function(res) {
            if (res.error) { alert('Erreur : ' + res.error.message); return; }
            chargerAdminCommandes();
            chargerAdminStats();
          });
        });
      }
    } catch(e) {
      if (!restaurerAdminTabCache('commandes', 'admin-commandes-table')) {
        container.innerHTML = '<p class="admin-dash-empty">Erreur de chargement des commandes.</p>';
      }
    }
  }

  // ─── 6. RDV / RESERVATIONS MANAGEMENT ───
  // ─── Charger les bookings depuis Cal.eu API v2 ───
  async function fetchCalBookings() {
    var allBookings = [];
    var statuses = ['upcoming', 'past', 'cancelled'];
    for (var si = 0; si < statuses.length; si++) {
      try {
        var resp = await fetch(CAL_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: '/bookings?status=' + statuses[si] + '&take=100', method: 'GET' })
        });
        if (resp.ok) {
          var json = await resp.json();
          if (json.data) allBookings = allBookings.concat(json.data);
        }
      } catch (e) { /* silencieux */ }
    }
    return allBookings;
  }

  // Convertir un booking Cal.eu en format unifié pour l'affichage
  function calBookingToRow(b) {
    var att = b.attendees && b.attendees[0];
    var clientName = att ? att.name : '—';
    var clientEmail = att ? (att.email || '') : '';
    // Nettoyer les emails SMS Cal.com (33xxx@sms.cal.com)
    if (clientEmail.indexOf('@sms.cal.com') !== -1 && att && att.phoneNumber) {
      clientEmail = att.phoneNumber;
    }
    var statut = 'à venir';
    if (b.status === 'cancelled') statut = 'annulé';
    else if (b.status === 'accepted' && new Date(b.end) < new Date()) statut = 'terminé';
    else if (b.status === 'accepted') statut = 'à venir';
    else if (b.status === 'pending') statut = 'en attente';

    return {
      id: 'cal_' + b.uid,
      uid: b.uid,
      user_prenom: clientName,
      user_email: clientEmail,
      service: b.title || 'Consultation',
      date_rdv: b.start,
      statut: statut,
      source: 'cal'
    };
  }

  async function chargerAdminRDV(filter) {
    var container = document.getElementById('admin-rdv-table');
    if (!container) return;
    if (!filter && !restaurerAdminTabCache('rdv', 'admin-rdv-table')) {
      container.innerHTML = '<p class="admin-dash-loading">Chargement des rendez-vous Cal.eu\u2026</p>';
    }

    try {
      // Source principale : Cal.eu API
      var calBookings = await fetchCalBookings();
      var data = calBookings.map(calBookingToRow);

      // Trier par date (les plus récents en premier)
      data.sort(function(a, b) {
        return new Date(b.date_rdv) - new Date(a.date_rdv);
      });

      // Filtre recherche
      if (filter) {
        var f = filter.toLowerCase();
        data = data.filter(function(r) {
          return (r.user_email || '').toLowerCase().indexOf(f) !== -1 ||
                 (r.user_prenom || '').toLowerCase().indexOf(f) !== -1 ||
                 (r.service || '').toLowerCase().indexOf(f) !== -1 ||
                 (r.statut || '').toLowerCase().indexOf(f) !== -1;
        });
      }

      // Mettre à jour le compteur stat RDV
      var statRdv = document.getElementById('stat-rdv');
      if (statRdv) statRdv.textContent = data.filter(function(r) { return r.statut !== 'annulé'; }).length;

      if (data.length === 0) {
        container.innerHTML = '<p class="admin-dash-empty">Aucun rendez-vous trouvé.</p>';
        return;
      }

      var html = '<div class="admin-dash-table--rdv">';
      html += '<div class="admin-dash-table__row admin-dash-table__row--header">' +
        '<div class="admin-dash-table__cell">Client</div>' +
        '<div class="admin-dash-table__cell">Service</div>' +
        '<div class="admin-dash-table__cell">Date RDV</div>' +
        '<div class="admin-dash-table__cell">Statut</div>' +
        '<div class="admin-dash-table__cell">Actions</div>' +
        '</div>';

      for (var i = 0; i < data.length; i++) {
        var r = data[i];
        var statusClass = (r.statut === 'terminé') ? 'success' : ((r.statut === 'annulé') ? 'danger' : 'warning');

        // Formater la date avec heure
        var dateDisplay = formatDateFR(r.date_rdv);
        try {
          var dt = new Date(r.date_rdv);
          dateDisplay = dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
            + ' à ' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } catch(e) {}

        // Simplifier le titre du service
        var serviceDisplay = r.service || '—';
        if (serviceDisplay.indexOf('entre ') !== -1) {
          serviceDisplay = serviceDisplay.substring(0, serviceDisplay.indexOf('entre ')).trim();
        }
        serviceDisplay = serviceDisplay.replace(/^(SERVICES?\s+)?LUMIERE\s+INTERIEUR\s*\/?\s*/i, '').trim() || serviceDisplay;

        html += '<div class="admin-dash-table__row">' +
          '<div class="admin-dash-table__cell admin-dash-table__cell--email" data-label="Client">' + escHtml(r.user_prenom) + '<br><span style="font-size:0.75rem">' + escHtml(r.user_email) + '</span></div>' +
          '<div class="admin-dash-table__cell" data-label="Service">' + escHtml(serviceDisplay) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Date RDV">' + dateDisplay + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Statut"><span class="admin-dash-badge admin-dash-badge--' + statusClass + '">' + escHtml(r.statut) + '</span></div>' +
          '<div class="admin-dash-table__cell" data-label="Actions"><div class="admin-dash-btn-group">' +
            (r.statut !== 'terminé' && r.statut !== 'annulé' ?
              '<button class="admin-dash-btn-sm admin-dash-btn-sm--success" data-rdv-action="termine" data-cal-uid="' + escHtml(r.uid) + '">Terminé</button>' +
              '<button class="admin-dash-btn-sm admin-dash-btn-sm--delete" data-rdv-action="annule" data-cal-uid="' + escHtml(r.uid) + '">Annulé</button>'
            : '<span style="font-size:0.75rem;opacity:0.5">' + escHtml(r.statut) + '</span>') +
          '</div></div>' +
          '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
      if (!filter) adminCacheSet('tab_rdv', html);
      initResizableColumns(container.querySelector('.admin-dash-table--rdv'));

      // Attach status change handlers (synced with Cal.eu)
      var actionBtns = container.querySelectorAll('[data-rdv-action]');
      for (var s = 0; s < actionBtns.length; s++) {
        actionBtns[s].addEventListener('click', async function() {
          var btn = this;
          var action = btn.getAttribute('data-rdv-action');
          var calUid = btn.getAttribute('data-cal-uid');

          // Désactiver les boutons pendant le traitement
          var btnGroup = btn.closest('.admin-dash-btn-group');
          if (btnGroup) btnGroup.querySelectorAll('button').forEach(function(b) { b.disabled = true; });
          btn.textContent = '\u2026';

          try {
            if (action === 'annule' && calUid) {
              // Annuler le booking sur Cal.eu
              var calResp = await fetch(CAL_PROXY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  endpoint: '/bookings/' + calUid + '/cancel',
                  method: 'POST',
                  body: { cancellationReason: 'Annulé depuis le panneau admin' }
                })
              });
              var calData = await calResp.json();
              if (calData.status === 'error' && calData.error && calData.error.message && calData.error.message.indexOf('cancelled already') === -1) {
                alert('Erreur Cal.eu : ' + calData.error.message);
              }
            }

            // Aussi mettre à jour Supabase si le booking y existe
            if (calUid) {
              var newStatut = action === 'annule' ? 'annulé' : 'terminé';
              await supabase.from('reservations').update({ statut: newStatut }).eq('notes', 'cal:' + calUid);
            }

            chargerAdminRDV();
          } catch (err) {
            alert('Erreur : ' + (err.message || err));
            chargerAdminRDV();
          }
        });
      }
    } catch(e) {
      if (!restaurerAdminTabCache('rdv', 'admin-rdv-table')) {
        container.innerHTML = '<p class="admin-dash-empty">Erreur de chargement des RDV. Vérifiez la connexion Cal.eu.</p>';
      }
    }
  }


  // ─── 7. CLIENTS MANAGEMENT ───
  async function chargerAdminClients(filter) {
    var container = document.getElementById('admin-clients-table');
    if (!container) return;
    if (!filter) restaurerAdminTabCache('clients', 'admin-clients-table');
    try {
      var result = await supabase.rpc('get_admin_clients');
      var data;
      if (result.error || !result.data) {
        // Fallback: get unique users from commandes
        var cmdRes = await supabase.from('commandes').select('user_id');
        data = [];
        if (cmdRes.data) {
          var seen = {};
          for (var k = 0; k < cmdRes.data.length; k++) {
            var uid = cmdRes.data[k].user_id;
            if (!seen[uid]) {
              seen[uid] = true;
              data.push({ id: uid, email: uid, prenom: '', nom: '', nb_commandes: 0, total_depense: 0 });
            }
          }
        }
      } else {
        data = result.data || [];
      }
      if (filter) {
        data = data.filter(function(c) {
          return (c.email || '').toLowerCase().indexOf(filter) !== -1 ||
                 (c.prenom || '').toLowerCase().indexOf(filter) !== -1 ||
                 (c.nom || '').toLowerCase().indexOf(filter) !== -1;
        });
      }
      if (data.length === 0) {
        container.innerHTML = '<p class="admin-dash-empty">Aucun client trouv\u00e9.</p>';
        return;
      }
      var html = '<div class="admin-dash-table--clients">';
      html += '<div class="admin-dash-table__row admin-dash-table__row--header">' +
        '<div class="admin-dash-table__cell">Client</div>' +
        '<div class="admin-dash-table__cell">Email</div>' +
        '<div class="admin-dash-table__cell">Inscrit le</div>' +
        '<div class="admin-dash-table__cell">Commandes</div>' +
        '<div class="admin-dash-table__cell">Total</div>' +
        '</div>';
      for (var i = 0; i < data.length; i++) {
        var c = data[i];
        var fullName = ((c.prenom || '') + ' ' + (c.nom || '')).trim() || '—';
        html += '<div class="admin-dash-table__row">' +
          '<div class="admin-dash-table__cell" data-label="Client">' + escHtml(fullName) + '</div>' +
          '<div class="admin-dash-table__cell admin-dash-table__cell--email" data-label="Email">' + escHtml(c.email || '—') + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Inscrit le">' + formatDateFR(c.date_inscription) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Commandes">' + (c.nb_commandes || 0) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Total" style="font-weight:600">' + parseFloat(c.total_depense || 0).toFixed(2) + ' \u20ac</div>' +
          '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
      if (!filter) adminCacheSet('tab_clients', html);
      initResizableColumns(container.querySelector('.admin-dash-table--clients'));
    } catch(e) {
      if (!restaurerAdminTabCache('clients', 'admin-clients-table')) {
        container.innerHTML = '<p class="admin-dash-empty">Erreur de chargement des clients.</p>';
      }
    }
  }

  // ─── 8. NEWSLETTER MANAGEMENT (via Brevo API) ───

  // Fetch total contacts count from Brevo list
  async function getBrevoNewsletterCount() {
    try {
      var response = await fetch(BREVO_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: '/v3/contacts/lists/3',
          method: 'GET'
        })
      });
      if (!response.ok) return 0;
      var info = await response.json();
      return info.totalSubscribers || info.uniqueSubscribers || 0;
    } catch(e) { return 0; }
  }

  async function chargerAdminNewsletter() {
    var container = document.getElementById('admin-newsletter-table');
    if (!container) return;
    if (!restaurerAdminTabCache('newsletter', 'admin-newsletter-table')) {
      container.innerHTML = '<p class="admin-dash-empty" style="opacity:0.6">Chargement depuis Brevo\u2026</p>';
    }

    try {
      // Fetch contacts from Brevo list 3 (newsletter)
      var allContacts = [];
      var offset = 0;
      var limit = 50;
      var hasMore = true;

      while (hasMore) {
        var response = await fetch(BREVO_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: '/v3/contacts/lists/3/contacts?limit=' + limit + '&offset=' + offset + '&sort=desc',
            method: 'GET'
          })
        });
        if (!response.ok) throw new Error('Brevo API error: ' + response.status);
        var result = await response.json();
        var contacts = result.contacts || [];
        allContacts = allContacts.concat(contacts);
        if (contacts.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
        if (allContacts.length >= 500) hasMore = false;
      }

      // Update stat counter
      var statEl = document.getElementById('stat-newsletter');
      if (statEl) statEl.textContent = allContacts.length;

      if (allContacts.length === 0) {
        container.innerHTML = '<p class="admin-dash-empty">Aucun abonn\u00e9 \u00e0 la newsletter Brevo pour le moment.</p>';
        return;
      }

      var html = '<div style="margin-bottom:0.75rem;color:#bbb;font-size:0.85rem">' +
        '<strong style="color:var(--accent,#d4a574)">' + allContacts.length + ' abonn\u00e9(s)</strong> sur la liste Brevo' +
        '</div>';
      html += '<div class="admin-dash-table--newsletter">';
      html += '<div class="admin-dash-table__row admin-dash-table__row--header">' +
        '<div class="admin-dash-table__cell">Pr\u00e9nom</div>' +
        '<div class="admin-dash-table__cell">Email</div>' +
        '<div class="admin-dash-table__cell">Date inscription</div>' +
        '<div class="admin-dash-table__cell">Statut</div>' +
        '</div>';

      for (var i = 0; i < allContacts.length; i++) {
        var c = allContacts[i];
        var prenom = (c.attributes && c.attributes.PRENOM) || (c.attributes && c.attributes.FIRSTNAME) || '\u2014';
        var email = c.email || '\u2014';
        var dateStr = '\u2014';
        if (c.createdAt) {
          dateStr = formatDateFR(c.createdAt);
        } else if (c.attributes && c.attributes.ADDED_AT) {
          dateStr = formatDateFR(c.attributes.ADDED_AT);
        }
        var isBlacklisted = c.emailBlacklisted || false;
        var statusClass = isBlacklisted ? 'danger' : 'success';
        var statusText = isBlacklisted ? 'D\u00e9sinscrit' : 'Actif';

        html += '<div class="admin-dash-table__row">' +
          '<div class="admin-dash-table__cell" data-label="Pr\u00e9nom">' + escHtml(prenom) + '</div>' +
          '<div class="admin-dash-table__cell admin-dash-table__cell--email" data-label="Email">' + escHtml(email) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Inscrit le">' + dateStr + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Statut"><span class="admin-dash-badge admin-dash-badge--' + statusClass + '">' + statusText + '</span></div>' +
          '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
      adminCacheSet('tab_newsletter', html);
      initResizableColumns(container.querySelector('.admin-dash-table--newsletter'));
    } catch(e) {
      if (!restaurerAdminTabCache('newsletter', 'admin-newsletter-table')) {
        container.innerHTML = '<p class="admin-dash-empty">Impossible de charger les contacts Brevo. V\u00e9rifiez la cl\u00e9 API.</p>';
      }
    }
  }

  // ========================================
  // ADMIN — Modération des témoignages
  // ========================================
  async function chargerAdminTemoignages() {
    var container = document.getElementById('admin-temoignages-table');
    if (!container) return;
    if (!restaurerAdminTabCache('temoignages', 'admin-temoignages-table')) {
      container.innerHTML = '<p class="admin-dash-loading">Chargement des t\u00e9moignages\u2026</p>';
    }

    try {
      var { data, error } = await supabase
        .from('temoignages')
        .select('*')
        .order('date_creation', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        container.innerHTML = '<p class="admin-dash-empty">Aucun t\u00e9moignage pour le moment.</p>';
        return;
      }

      var pendingCount = data.filter(function(t) { return !t.approuve; }).length;
      var html = '';
      if (pendingCount > 0) {
        html += '<div style="margin-bottom:0.75rem;"><span class="moderation-badge moderation-badge--pending">\u23f3 ' + pendingCount + ' en attente de mod\u00e9ration</span></div>';
      }

      html += '<div class="admin-dash-table--temoignages">';
      html += '<div class="admin-dash-table__row admin-dash-table__row--header">' +
        '<div class="admin-dash-table__cell">Statut</div>' +
        '<div class="admin-dash-table__cell">Nom</div>' +
        '<div class="admin-dash-table__cell">Note</div>' +
        '<div class="admin-dash-table__cell">T\u00e9moignage</div>' +
        '<div class="admin-dash-table__cell">Date</div>' +
        '<div class="admin-dash-table__cell">Actions</div>' +
        '</div>';

      for (var i = 0; i < data.length; i++) {
        var t = data[i];
        var starsStr = '';
        for (var s = 0; s < (t.note || 0); s++) starsStr += '\u2605';
        for (var e = (t.note || 0); e < 5; e++) starsStr += '\u2606';
        var dateStr = t.date_creation ? new Date(t.date_creation).toLocaleDateString('fr-FR') : '\u2014';
        var statusBadge = t.approuve
          ? '<span class="moderation-badge moderation-badge--approved">\u2714 Approuv\u00e9</span>'
          : '<span class="moderation-badge moderation-badge--pending">\u23f3 En attente</span>';
        var safeId = sanitizeForHtml(t.id);
        var actions = '';
        if (!t.approuve) {
          actions += '<button class="btn btn--outline" style="font-size:0.75rem;padding:0.25rem 0.6rem;" data-action-temoignage="approuver" data-temoignage-id="' + safeId + '" title="Approuver">\u2714 Approuver</button> ';
        } else {
          actions += '<button class="btn btn--outline" style="font-size:0.75rem;padding:0.25rem 0.6rem;opacity:0.5;" data-action-temoignage="revoquer" data-temoignage-id="' + safeId + '" title="R\u00e9voquer">\u21a9 R\u00e9voquer</button> ';
        }
        actions += '<button class="btn btn--outline" style="font-size:0.75rem;padding:0.25rem 0.6rem;color:#e74c3c;border-color:#e74c3c;" data-action-temoignage="supprimer" data-temoignage-id="' + safeId + '" title="Supprimer">\u2716</button>';

        html += '<div class="admin-dash-table__row' + (!t.approuve ? ' admin-dash-table__row--highlight' : '') + '">' +
          '<div class="admin-dash-table__cell">' + statusBadge + '</div>' +
          '<div class="admin-dash-table__cell">' + (t.nom || 'Anonyme').replace(/</g, '&lt;') + '</div>' +
          '<div class="admin-dash-table__cell" style="color:#d4a574;">' + starsStr + '</div>' +
          '<div class="admin-dash-table__cell" style="max-width:300px;white-space:normal;word-break:break-word;">' + (t.texte || '').replace(/</g, '&lt;').substring(0, 120) + (t.texte && t.texte.length > 120 ? '\u2026' : '') + '</div>' +
          '<div class="admin-dash-table__cell">' + dateStr + '</div>' +
          '<div class="admin-dash-table__cell">' + actions + '</div>' +
          '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
      // Event delegation for testimonial action buttons (instead of inline onclick)
      container.addEventListener('click', function(ev) {
        var btn = ev.target.closest('[data-action-temoignage]');
        if (!btn) return;
        var action = btn.getAttribute('data-action-temoignage');
        var id = btn.getAttribute('data-temoignage-id');
        if (!id) return;
        if (action === 'approuver' && window.__approuverTemoignage) window.__approuverTemoignage(id);
        else if (action === 'revoquer' && window.__revoquerTemoignage) window.__revoquerTemoignage(id);
        else if (action === 'supprimer' && window.__supprimerTemoignage) window.__supprimerTemoignage(id);
      });
      adminCacheSet('tab_temoignages', html);
      initResizableColumns(container.querySelector('.admin-dash-table--temoignages'));
    } catch(err) {
      if (!restaurerAdminTabCache('temoignages', 'admin-temoignages-table')) {
        container.innerHTML = '<p class="admin-dash-empty">Erreur lors du chargement des t\u00e9moignages.</p>';
      }
    }
  }

  // Actions globales pour la modération
  window.__approuverTemoignage = async function(id) {
    try {
      await supabase.from('temoignages').update({ approuve: true }).eq('id', id);
      showAdminMsg('admin-temoignages-msg', 'T\u00e9moignage approuv\u00e9 avec succ\u00e8s.');
      chargerAdminTemoignages();
    } catch(e) {
      showAdminMsg('admin-temoignages-msg', 'Erreur lors de l\u2019approbation.', true);
    }
  };

  window.__revoquerTemoignage = async function(id) {
    try {
      await supabase.from('temoignages').update({ approuve: false }).eq('id', id);
      showAdminMsg('admin-temoignages-msg', 'T\u00e9moignage r\u00e9voqu\u00e9.');
      chargerAdminTemoignages();
    } catch(e) {
      showAdminMsg('admin-temoignages-msg', 'Erreur lors de la r\u00e9vocation.', true);
    }
  };

  window.__supprimerTemoignage = async function(id) {
    if (!confirm('Supprimer d\u00e9finitivement ce t\u00e9moignage\u00a0?')) return;
    try {
      await supabase.from('temoignages').delete().eq('id', id);
      showAdminMsg('admin-temoignages-msg', 'T\u00e9moignage supprim\u00e9.');
      chargerAdminTemoignages();
    } catch(e) {
      showAdminMsg('admin-temoignages-msg', 'Erreur lors de la suppression.', true);
    }
  };

  // ─── Override blog form submit to handle edit mode ───
  var origBlogForm = document.getElementById('admin-blog-form');
  if (origBlogForm) {
    // Intercept submit to check for edit mode
    var origSubmitHandlers = origBlogForm.onsubmit;
    origBlogForm.addEventListener('submit', function(e) {
      var editSlug = origBlogForm.getAttribute('data-edit-slug');
      if (editSlug) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var fd = new FormData(origBlogForm);
        var imageUrl = fd.get('image_url');
        var blogImageFile = document.getElementById('admin-blog-image-file');

        (async function() {
          if (blogImageFile && blogImageFile.files[0]) {
            var file = blogImageFile.files[0];
            var ext = file.name.split('.').pop();
            var path = 'blog/' + editSlug + '-' + Date.now() + '.' + ext;
            try {
              imageUrl = await uploadImage(file, 'images', path);
            } catch(err) {
              if (!imageUrl) imageUrl = 'blog-journal.png';
            }
          }

          var updateData = {
            category: fd.get('category').trim(),
            title: fd.get('title').trim(),
            excerpt: fd.get('excerpt').trim(),
            content: fd.get('content').trim(),
            image_url: imageUrl || 'blog-journal.png',
            date_publication: fd.get('date_publication').trim()
          };

          // Indicateur de sauvegarde en cours
          var submitBtn = origBlogForm.querySelector('.admin-modal__submit');
          var origBtnText = submitBtn ? submitBtn.textContent : '';
          if (submitBtn) { submitBtn.textContent = 'Sauvegarde en cours\u2026'; submitBtn.disabled = true; }

          var res = await supabase.from('blog_articles').update(updateData).eq('slug', editSlug);
          if (res.error) {
            showAdminMsg('admin-blog-msg', 'Erreur : ' + res.error.message, true);
            if (submitBtn) { submitBtn.textContent = origBtnText; submitBtn.disabled = false; }
            return;
          }
          // Mettre \u00e0 jour le cache JS pour l'overlay article
          if (typeof blogArticles !== 'undefined') {
            blogArticles[editSlug] = {
              category: updateData.category,
              title: updateData.title,
              date: updateData.date_publication,
              content: updateData.content
            };
          }
          showAdminMsg('admin-blog-msg', '\u2705 Article sauvegard\u00e9 avec succ\u00e8s !', false);
          origBlogForm.removeAttribute('data-edit-slug');
          setTimeout(function() {
            closeModal('admin-modal-blog');
            chargerAdminBlog();
            // Rafra\u00eechir aussi les cartes blog publiques
            if (typeof initDynamicContent === 'function') initDynamicContent(true);
            // Reset modal title
            var titleEl = document.querySelector('#admin-modal-blog .admin-modal__title');
            if (titleEl) titleEl.textContent = 'Nouvel article';
            if (submitBtn) { submitBtn.textContent = 'Publier l\u2019article'; submitBtn.disabled = false; }
          }, 1200);
        })();
      }
    }, true); // capture phase to intercept before existing handler
  }

  // ─── Override boutique form submit to handle edit mode ───
  var origBoutiqueForm = document.getElementById('admin-boutique-form');
  if (origBoutiqueForm) {
    origBoutiqueForm.addEventListener('submit', function(e) {
      var editSlug = origBoutiqueForm.getAttribute('data-edit-slug');
      if (editSlug) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var fd = new FormData(origBoutiqueForm);
        var imageUrl = fd.get('image_url');
        var boutiqueImageFile = document.getElementById('admin-boutique-image-file');

        (async function() {
          if (boutiqueImageFile && boutiqueImageFile.files[0]) {
            var file = boutiqueImageFile.files[0];
            var ext = file.name.split('.').pop();
            var path = 'boutique/' + editSlug + '-' + Date.now() + '.' + ext;
            try {
              imageUrl = await uploadImage(file, 'images', path);
            } catch(err) {
              if (!imageUrl) imageUrl = 'crystals-nature.png';
            }
          }

          var updateData = {
            name: fd.get('name').trim(),
            description: fd.get('description').trim(),
            price: parseFloat(fd.get('price')),
            category: fd.get('category').trim(),
            image_url: imageUrl || 'crystals-nature.png',
            visible: fd.get('visible') === 'true',
            status: fd.get('status') || 'disponible',
            stripe_link: (fd.get('stripe_link') || '').trim()
          };

          // Indicateur de sauvegarde en cours
          var submitBtn = origBoutiqueForm.querySelector('.admin-modal__submit');
          var origBtnText = submitBtn ? submitBtn.textContent : '';
          if (submitBtn) { submitBtn.textContent = 'Sauvegarde en cours\u2026'; submitBtn.disabled = true; }

          var res = await supabase.from('boutique_products').update(updateData).eq('slug', editSlug);
          if (res.error) {
            showAdminMsg('admin-boutique-msg', 'Erreur : ' + res.error.message, true);
            if (submitBtn) { submitBtn.textContent = origBtnText; submitBtn.disabled = false; }
            return;
          }

          // Upload new extra images if any
          var editExtraInput = document.getElementById('admin-boutique-extra-images');
          if (editExtraInput && editExtraInput.files.length > 0) {
            // Get current max position
            var maxPos = 0;
            try {
              var posResult = await supabase.from('product_images').select('position').eq('product_slug', editSlug).order('position', { ascending: false }).limit(1);
              if (!posResult.error && posResult.data && posResult.data.length > 0) maxPos = posResult.data[0].position + 1;
            } catch(pe) {}
            var newExtraImages = [];
            for (var nei = 0; nei < editExtraInput.files.length; nei++) {
              var nFile = editExtraInput.files[nei];
              var nExt = nFile.name.split('.').pop();
              var nPath = 'boutique/' + editSlug + '-extra-' + (maxPos + nei) + '-' + Date.now() + '.' + nExt;
              try {
                var nUrl = await uploadImage(nFile, 'images', nPath);
                newExtraImages.push({ product_slug: editSlug, image_url: nUrl, position: maxPos + nei });
              } catch(ue) { console.warn('Extra image upload failed:', ue); }
            }
            if (newExtraImages.length > 0) {
              await safeSupabase(function() { return supabase.from('product_images').insert(newExtraImages); }, 'ajout des images produit');
            }
          }

          // Mettre \u00e0 jour le cache JS pour l'overlay produit
          if (typeof _loadedProducts !== 'undefined' && _loadedProducts[editSlug]) {
            for (var uk in updateData) { _loadedProducts[editSlug][uk] = updateData[uk]; }
          }
          showAdminMsg('admin-boutique-msg', '\u2705 Produit sauvegard\u00e9 avec succ\u00e8s !', false);
          origBoutiqueForm.removeAttribute('data-edit-slug');
          // Reset extra images input and gallery
          var editExtraPreview = document.getElementById('admin-boutique-extra-preview');
          if (editExtraPreview) { editExtraPreview.innerHTML = ''; editExtraPreview.style.display = 'none'; }
          if (editExtraInput) editExtraInput.value = '';
          var existingGallery = document.getElementById('admin-boutique-existing-gallery');
          if (existingGallery) existingGallery.remove();
          setTimeout(function() {
            closeModal('admin-modal-boutique');
            chargerAdminBoutique();
            // Refresh product cards in boutique page (cleanup handled inside initDynamicContent)
            if (typeof initDynamicContent === 'function') initDynamicContent(true);
            // Reset modal title
            var titleEl = document.querySelector('#admin-modal-boutique .admin-modal__title');
            if (titleEl) titleEl.textContent = 'Nouveau produit';
            if (submitBtn) { submitBtn.textContent = 'Publier le produit'; submitBtn.disabled = false; }
          }, 1200);
        })();
      }
    }, true);
  }

  // ─── Reset modal titles when closing ───
  (function resetModalTitlesOnClose() {
    var blogModal = document.getElementById('admin-modal-blog');
    if (blogModal) {
      var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].attributeName === 'hidden' && blogModal.hidden) {
            var form = document.getElementById('admin-blog-form');
            if (form) form.removeAttribute('data-edit-slug');
            var titleEl = blogModal.querySelector('.admin-modal__title');
            if (titleEl) titleEl.textContent = 'Nouvel article';
            var submitBtn = blogModal.querySelector('.admin-modal__submit');
            if (submitBtn) submitBtn.textContent = 'Publier l\u2019article';
          }
        }
      });
      observer.observe(blogModal, { attributes: true });
    }
    var boutiqueModal = document.getElementById('admin-modal-boutique');
    if (boutiqueModal) {
      var observer2 = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].attributeName === 'hidden' && boutiqueModal.hidden) {
            var form = document.getElementById('admin-boutique-form');
            if (form) form.removeAttribute('data-edit-slug');
            var titleEl = boutiqueModal.querySelector('.admin-modal__title');
            if (titleEl) titleEl.textContent = 'Nouveau produit';
            var submitBtn = boutiqueModal.querySelector('.admin-modal__submit');
            if (submitBtn) submitBtn.textContent = 'Publier le produit';
            // Reset extra images
            var extraInput = document.getElementById('admin-boutique-extra-images');
            if (extraInput) extraInput.value = '';
            var extraPreview = document.getElementById('admin-boutique-extra-preview');
            if (extraPreview) { extraPreview.innerHTML = ''; extraPreview.style.display = 'none'; }
            var existingGallery = document.getElementById('admin-boutique-existing-gallery');
            if (existingGallery) existingGallery.remove();
          }
        }
      });
      observer2.observe(boutiqueModal, { attributes: true });
    }
  })();



  // ─── CA MENSUEL + PDF + ARCHIVAGE + URSSAF ───

  var TAUX_URSSAF_SERVICES = 0.261; // 26,10% — prestations de services BNC (voyance, thérapie) 2026
  var TAUX_URSSAF_BOUTIQUE = 0.123; // 12,30% — vente de marchandises BIC (boutique) 2026
  var TAUX_URSSAF = TAUX_URSSAF_SERVICES; // fallback général
  var MOIS_FR = ['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];

  function getMoisCourant() {
    var now = new Date();
    return { mois: now.getMonth(), annee: now.getFullYear() };
  }

  function getMoisLabel(mois, annee) {
    return MOIS_FR[mois] + ' ' + annee;
  }

  function getDebutFinMois(mois, annee) {
    var debut = new Date(annee, mois, 1);
    var fin = new Date(annee, mois + 1, 0, 23, 59, 59, 999);
    return { debut: debut.toISOString(), fin: fin.toISOString() };
  }

  // Charger le CA du mois courant et afficher dans le dashboard
  async function chargerCAMensuel() {
    var mc = getMoisCourant();
    var periode = getDebutFinMois(mc.mois, mc.annee);
    var labelPeriode = getMoisLabel(mc.mois, mc.annee);

    var periodeEl = document.getElementById('admin-ca-period');
    if (periodeEl) periodeEl.textContent = 'P\u00e9riode : 1er au 30 ' + labelPeriode;

    try {
      // Fetch commandes du mois courant via RPC (admin voit tout)
      var result = await supabase.rpc('get_admin_commandes');
      var allCommandes = [];
      if (!result.error && result.data) {
        allCommandes = result.data;
      } else {
        // Fallback: direct query
        var fallback = await supabase.from('commandes').select('*').gte('date_creation', periode.debut).lte('date_creation', periode.fin);
        allCommandes = (fallback.data || []);
      }

      // Filtrer les commandes du mois courant
      var commandesMois = allCommandes.filter(function(c) {
        var d = new Date(c.date_creation);
        return d.getMonth() === mc.mois && d.getFullYear() === mc.annee && c.statut === 'pay\u00e9';
      });

      var caBrut = 0;
      for (var i = 0; i < commandesMois.length; i++) {
        caBrut += parseFloat(commandesMois[i].montant) || 0;
      }

      var urssaf = caBrut * TAUX_URSSAF; // fallback, recalculé après ventilation
      var caNet = caBrut - urssaf;

      var elBrut = document.getElementById('ca-mois-brut');
      if (elBrut) elBrut.textContent = caBrut.toFixed(2) + ' \u20ac';
      var elUrssaf = document.getElementById('ca-mois-urssaf');
      if (elUrssaf) elUrssaf.textContent = '-' + urssaf.toFixed(2) + ' \u20ac';
      var elNet = document.getElementById('ca-mois-net');
      if (elNet) elNet.textContent = caNet.toFixed(2) + ' \u20ac';
      var elNb = document.getElementById('ca-mois-nb');
      if (elNb) elNb.textContent = commandesMois.length;

      // --- Ventilation consultations vs boutique ---
      var SERVICES_CONSULTATION = ['Focus Intuitif', 'R\u00e9v\u00e9lations Intuitives', 'Panorama Intuitif', 'Voyance par mail', 'Voyance par mail \u2014 1 question'];
      var caConsult = 0, caBoutique = 0, nbConsult = 0, nbBoutique = 0;
      for (var j = 0; j < commandesMois.length; j++) {
        var cmd = commandesMois[j];
        var montant = parseFloat(cmd.montant) || 0;
        var isConsult = false;
        for (var k = 0; k < SERVICES_CONSULTATION.length; k++) {
          if ((cmd.service || '').indexOf(SERVICES_CONSULTATION[k]) !== -1) { isConsult = true; break; }
        }
        if (isConsult) { caConsult += montant; nbConsult++; }
        else { caBoutique += montant; nbBoutique++; }
      }

      var urssafConsult = caConsult * TAUX_URSSAF_SERVICES;
      var urssafBoutique = caBoutique * TAUX_URSSAF_BOUTIQUE;
      urssaf = urssafConsult + urssafBoutique;
      caNet = caBrut - urssaf;
      if (elBrut) elBrut.textContent = caBrut.toFixed(2) + ' \u20ac';
      if (elUrssaf) elUrssaf.textContent = '-' + urssaf.toFixed(2) + ' \u20ac';
      if (elNet) elNet.textContent = caNet.toFixed(2) + ' \u20ac';
      var netConsult = caConsult - urssafConsult;
      var netBoutique = caBoutique - urssafBoutique;

      // Afficher ventilation
      var setVal = function(id, txt) { var e = document.getElementById(id); if (e) e.textContent = txt; };
      setVal('rev-consult-brut', caConsult.toFixed(2) + ' \u20ac');
      setVal('rev-consult-urssaf', '-' + urssafConsult.toFixed(2) + ' \u20ac');
      setVal('rev-consult-net', netConsult.toFixed(2) + ' \u20ac');
      setVal('rev-consult-nb', nbConsult);
      setVal('rev-boutique-brut', caBoutique.toFixed(2) + ' \u20ac');
      setVal('rev-boutique-urssaf', '-' + urssafBoutique.toFixed(2) + ' \u20ac');
      setVal('rev-boutique-net', netBoutique.toFixed(2) + ' \u20ac');
      setVal('rev-boutique-nb', nbBoutique);

      // Stocker pour la generation PDF
      window.__caData = {
        mois: mc.mois,
        annee: mc.annee,
        label: labelPeriode,
        commandes: commandesMois,
        caBrut: caBrut,
        urssaf: urssaf,
        caNet: caNet,
        caConsult: caConsult,
        caBoutique: caBoutique,
        netConsult: netConsult,
        netBoutique: netBoutique,
        nbConsult: nbConsult,
        nbBoutique: nbBoutique
      };

      // Cache CA data to localStorage for instant display on next page load
      sauvegarderAdminCACache();

    } catch(e) {
      console.warn('Erreur chargement CA:', e);
    }

    // Charger les archives et depenses
    chargerArchivesCA();
    chargerDepensesMois();
    calculerBenefices();
  }

  // Generer le PDF du rapport CA
  function genererPDFRapport(data) {
    if (!data) data = window.__caData;
    if (!data) { alert('Aucune donn\u00e9e de CA disponible.'); return; }

    if (!window.jspdf || !window.jspdf.jsPDF) { alert('La bibliothèque PDF n\'est pas chargée. Veuillez réessayer.'); return; }
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF();

    var pageWidth = doc.internal.pageSize.getWidth();

    // En-tete
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Lumi\u00e8re Int\u00e9rieure', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport de chiffre d\'affaires', pageWidth / 2, 33, { align: 'center' });

    // Periode
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    var moisCapitalized = data.label.charAt(0).toUpperCase() + data.label.slice(1);
    doc.text('P\u00e9riode : ' + moisCapitalized, pageWidth / 2, 45, { align: 'center' });

    // Date de generation
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text('G\u00e9n\u00e9r\u00e9 le ' + new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), pageWidth / 2, 52, { align: 'center' });
    doc.setTextColor(0);

    // Ligne separatrice
    doc.setDrawColor(200);
    doc.line(20, 56, pageWidth - 20, 56);

    // Resume financier
    var y = 66;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('R\u00e9sum\u00e9 financier', 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // CA Brut
    doc.text('Chiffre d\'affaires brut :', 25, y);
    doc.setFont('helvetica', 'bold');
    doc.text(data.caBrut.toFixed(2) + ' \u20ac', pageWidth - 25, y, { align: 'right' });
    y += 8;

    // URSSAF
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 50, 50);
    doc.text('Cotisations URSSAF (25,60%) :', 25, y);
    doc.setFont('helvetica', 'bold');
    doc.text('-' + data.urssaf.toFixed(2) + ' \u20ac', pageWidth - 25, y, { align: 'right' });
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(25, y + 3, pageWidth - 25, y + 3);
    y += 10;

    // CA Net
    doc.setTextColor(39, 174, 96);
    doc.setFontSize(12);
    doc.text('Revenu net apr\u00e8s URSSAF :', 25, y);
    doc.text(data.caNet.toFixed(2) + ' \u20ac', pageWidth - 25, y, { align: 'right' });
    doc.setTextColor(0);
    y += 6;
    doc.setDrawColor(200);
    doc.line(20, y + 3, pageWidth - 20, y + 3);
    y += 14;

    // Nombre de commandes
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Nombre de commandes : ' + data.commandes.length, 25, y);
    y += 12;

    // Tableau des commandes
    if (data.commandes.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('D\u00e9tail des commandes', 20, y);
      y += 4;

      var tableData = [];
      for (var i = 0; i < data.commandes.length; i++) {
        var c = data.commandes[i];
        var dateStr = new Date(c.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        var clientInfo = (c.user_email || c.user_prenom || 'Client');
        tableData.push([
          (i + 1).toString(),
          dateStr,
          clientInfo,
          c.service || '---',
          c.methode_paiement || 'stripe',
          (parseFloat(c.montant) || 0).toFixed(2) + ' \u20ac'
        ]);
      }

      doc.autoTable({
        startY: y,
        head: [['#', 'Date', 'Client', 'Service', 'Paiement', 'Montant']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 10 },
          5: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });

      y = doc.lastAutoTable.finalY + 10;
    }

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Lumi\u00e8re Int\u00e9rieure \u2014 Micro-entreprise \u2014 TVA non applicable, article 293 B du CGI', pageWidth / 2, 285, { align: 'center' });

    // Telecharger
    var filename = 'CA-Lumiere-Interieure-' + (data.mois + 1).toString().padStart(2, '0') + '-' + data.annee + '.pdf';
    doc.save(filename);
  }

  // Archiver le CA du mois dans Supabase (table ca_archives)
  async function archiverCAMois(data) {
    if (!data) return;
    try {
      await supabase.from('ca_archives').upsert({
        mois: data.mois + 1,
        annee: data.annee,
        label: data.label,
        ca_brut: data.caBrut,
        urssaf: data.urssaf,
        ca_net: data.caNet,
        nb_commandes: data.commandes.length,
        archived_at: new Date().toISOString()
      }, { onConflict: 'mois,annee' });
    } catch(e) {
      console.warn('Archivage CA:', e);
    }
  }

  // Charger les archives precedentes
  async function chargerArchivesCA() {
    var container = document.getElementById('admin-ca-archives');
    if (!container) return;
    try {
      var result = await supabase.from('ca_archives').select('*').order('annee', { ascending: false }).order('mois', { ascending: false });
      if (result.error || !result.data || result.data.length === 0) {
        container.innerHTML = '';
        return;
      }
      var html = '<p style="font-size:0.85rem;color:#999;margin-bottom:0.5rem;font-weight:600">Archives pr\u00e9c\u00e9dentes</p>';
      for (var i = 0; i < result.data.length; i++) {
        var a = result.data[i];
        var labelArchive = MOIS_FR[a.mois - 1] + ' ' + a.annee;
        labelArchive = labelArchive.charAt(0).toUpperCase() + labelArchive.slice(1);
        html += '<div class="admin-ca-archive-item">' +
          '<span class="admin-ca-archive-item__info">' + labelArchive + ' \u2014 CA brut : ' + parseFloat(a.ca_brut).toFixed(2) + ' \u20ac | Net : ' + parseFloat(a.ca_net).toFixed(2) + ' \u20ac | ' + a.nb_commandes + ' commandes</span>' +
          '<button class="admin-ca-archive-item__btn" data-archive-mois="' + a.mois + '" data-archive-annee="' + a.annee + '">T\u00e9l\u00e9charger PDF</button>' +
          '</div>';
      }
      container.innerHTML = html;

      // Attach download handlers
      container.querySelectorAll('.admin-ca-archive-item__btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var m = parseInt(this.getAttribute('data-archive-mois'), 10);
          var y = parseInt(this.getAttribute('data-archive-annee'), 10);
          telechargerArchivePDF(m, y);
        });
      });
    } catch(e) {
      // Table might not exist yet
      container.innerHTML = '';
    }
  }

  // Telecharger un PDF d'archive (mois passe)
  async function telechargerArchivePDF(mois, annee) {
    try {
      // Fetch archive data
      var archResult = await supabase.from('ca_archives').select('*').eq('mois', mois).eq('annee', annee).maybeSingle();
      if (!archResult.data) { alert('Archive non trouv\u00e9e.'); return; }
      var arch = archResult.data;

      // Fetch commandes de ce mois
      var periode = getDebutFinMois(mois - 1, annee);
      var cmdResult = await supabase.rpc('get_admin_commandes');
      var commandes = [];
      if (!cmdResult.error && cmdResult.data) {
        commandes = cmdResult.data.filter(function(c) {
          var d = new Date(c.date_creation);
          return (d.getMonth() + 1) === mois && d.getFullYear() === annee && c.statut === 'pay\u00e9';
        });
      }

      genererPDFRapport({
        mois: mois - 1,
        annee: annee,
        label: MOIS_FR[mois - 1] + ' ' + annee,
        commandes: commandes,
        caBrut: parseFloat(arch.ca_brut) || 0,
        urssaf: parseFloat(arch.urssaf) || 0,
        caNet: parseFloat(arch.ca_net) || 0
      });
    } catch(e) {
      alert('Erreur lors du t\u00e9l\u00e9chargement de l\'archive.');
    }
  }

  // Verifier si on doit archiver (le 30 du mois ou apres)
  async function verifierArchivageAuto() {
    var now = new Date();
    var jour = now.getDate();
    var mois = now.getMonth();
    var annee = now.getFullYear();

    // Si on est le 30 ou apres, verifier si le mois courant est deja archive
    if (jour >= 30) {
      try {
        var existResult = await supabase.from('ca_archives').select('id').eq('mois', mois + 1).eq('annee', annee).maybeSingle();
        if (!existResult.data) {
          // Pas encore archive -> archiver
          if (window.__caData && window.__caData.mois === mois && window.__caData.annee === annee) {
            await archiverCAMois(window.__caData);
          }
        }
      } catch(e) {}
    }
  }

  // Bouton telecharger PDF
  var btnCA = document.getElementById('btn-telecharger-ca');
  if (btnCA) {
    btnCA.addEventListener('click', function() {
      genererPDFRapport(window.__caData);
      // Archiver aussi au passage
      if (window.__caData) archiverCAMois(window.__caData);
    });
  }



  // ─── DEPENSES + BENEFICES ───

  var _depensesMois = [];

  // Toggle formulaire depense
  var btnAjouterDep = document.getElementById('btn-ajouter-depense');
  if (btnAjouterDep) {
    btnAjouterDep.addEventListener('click', function() {
      var form = document.getElementById('form-depense');
      if (form) form.hidden = !form.hidden;
    });
  }

  // Valider une depense
  var btnValiderDep = document.getElementById('btn-valider-depense');
  if (btnValiderDep) {
    btnValiderDep.addEventListener('click', async function() {
      var libelle = document.getElementById('depense-libelle');
      var categorie = document.getElementById('depense-categorie');
      var montant = document.getElementById('depense-montant');
      if (!libelle || !categorie || !montant) return;
      if (!libelle.value.trim() || !montant.value) return;

      var mc = getMoisCourant();
      var data = {
        libelle: libelle.value.trim(),
        categorie: categorie.value,
        montant: parseFloat(montant.value),
        mois: mc.mois + 1,
        annee: mc.annee
      };

      try {
        var result = await supabase.from('depenses').insert([data]);
        if (result.error) {
          alert('Erreur : ' + result.error.message);
          return;
        }
        libelle.value = '';
        montant.value = '';
        document.getElementById('form-depense').hidden = true;
        chargerDepensesMois();
        calculerBenefices();
      } catch(e) {
        alert('Erreur de connexion.');
      }
    });
  }

  // Charger les depenses du mois
  async function chargerDepensesMois() {
    var container = document.getElementById('admin-depenses-liste');
    if (!container) return;

    var mc = getMoisCourant();
    try {
      var result = await supabase.from('depenses').select('*')
        .eq('mois', mc.mois + 1).eq('annee', mc.annee)
        .order('created_at', { ascending: false });

      _depensesMois = (result.error || !result.data) ? [] : result.data;

      if (_depensesMois.length === 0) {
        container.innerHTML = '<p style="color:#666;font-size:0.82rem;text-align:center;padding:0.5rem">Aucune d\u00e9pense enregistr\u00e9e ce mois-ci.</p>';
      } else {
        var catLabels = { 'site': 'Site / Outils', 'boutique': 'Boutique / Stock', 'marketing': 'Marketing', 'autre': 'Autre' };
        var html = '';
        for (var i = 0; i < _depensesMois.length; i++) {
          var d = _depensesMois[i];
          html += '<div class="admin-depense-item">' +
            '<span class="admin-depense-item__info">' + escHtml(d.libelle) +
            '<span class="admin-depense-item__cat">' + (catLabels[d.categorie] || d.categorie) + '</span>' +
            '<strong>' + parseFloat(d.montant).toFixed(2) + ' \u20ac</strong></span>' +
            '<button class="admin-depense-item__del" data-depense-id="' + d.id + '" title="Supprimer">\u2715</button>' +
            '</div>';
        }
        container.innerHTML = html;

        // Delete handlers
        container.querySelectorAll('.admin-depense-item__del').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            if (!confirm('Supprimer cette d\u00e9pense ?')) return;
            var depId = this.getAttribute('data-depense-id');
            await safeSupabase(function() { return supabase.from('depenses').delete().eq('id', depId); }, 'suppression de la dépense');
            chargerDepensesMois();
            calculerBenefices();
          });
        });
      }

      // Calculer totaux par categorie
      var totSite = 0, totBoutique = 0, totAutre = 0;
      for (var j = 0; j < _depensesMois.length; j++) {
        var dep = _depensesMois[j];
        var m = parseFloat(dep.montant) || 0;
        if (dep.categorie === 'site' || dep.categorie === 'marketing') totSite += m;
        else if (dep.categorie === 'boutique') totBoutique += m;
        else totAutre += m;
      }
      // Site/outils inclut marketing et autre (depenses generales)
      totSite += totAutre;

      var setVal = function(id, txt) { var e = document.getElementById(id); if (e) e.textContent = txt; };
      setVal('dep-total-site', totSite.toFixed(2) + ' \u20ac');
      setVal('dep-total-boutique', totBoutique.toFixed(2) + ' \u20ac');
      setVal('dep-total-global', (totSite + totBoutique).toFixed(2) + ' \u20ac');

      // Stocker pour benefices
      window.__depensesData = {
        site: totSite,
        boutique: totBoutique,
        total: totSite + totBoutique
      };

    } catch(e) {
      container.innerHTML = '<p style="color:#666;font-size:0.82rem;text-align:center">Table d\u00e9penses non disponible. Ex\u00e9cutez la migration SQL.</p>';
      window.__depensesData = { site: 0, boutique: 0, total: 0 };
    }
  }

  // Calculer et afficher les benefices
  function calculerBenefices() {
    var ca = window.__caData || {};
    var dep = window.__depensesData || { site: 0, boutique: 0, total: 0 };

    var netConsult = ca.netConsult || 0;
    var netBoutique = ca.netBoutique || 0;

    var benefConsult = netConsult - dep.site;
    var benefBoutique = netBoutique - dep.boutique;
    var benefTotal = benefConsult + benefBoutique;

    var setVal = function(id, txt) { var e = document.getElementById(id); if (e) e.textContent = txt; };
    var setColor = function(id, val) {
      var e = document.getElementById(id);
      if (e) e.style.color = val >= 0 ? '#27ae60' : '#e74c3c';
    };

    setVal('benef-consult', benefConsult.toFixed(2) + ' \u20ac');
    setColor('benef-consult', benefConsult);
    setVal('benef-boutique', benefBoutique.toFixed(2) + ' \u20ac');
    setColor('benef-boutique', benefBoutique);
    setVal('benef-total', benefTotal.toFixed(2) + ' \u20ac');
    setColor('benef-total', benefTotal);
  }

  // ─── RESIZABLE TABLE COLUMNS (RDV / Clients / Newsletter) ───
  function initResizableColumns(tableEl) {
    if (!tableEl || tableEl.dataset.resizable === 'true') return;
    tableEl.dataset.resizable = 'true';

    // Disable column resizing on mobile/tablet — use stacked card layout instead
    if (window.innerWidth <= 900) return;

    var headerRow = tableEl.querySelector('.admin-dash-table__row--header');
    if (!headerRow) return;

    var cells = headerRow.querySelectorAll('.admin-dash-table__cell');
    var colCount = cells.length;
    if (colCount < 2) return;

    // Get current computed widths for each column
    var tableWidth = tableEl.offsetWidth;
    var colWidths = [];
    for (var i = 0; i < colCount; i++) {
      var w = cells[i].offsetWidth;
      // Fallback: if width is 0 (hidden header), distribute evenly
      colWidths.push(w > 0 ? w : Math.floor(tableWidth / colCount));
    }

    // Switch from CSS grid-template-columns to explicit pixel widths
    function applyWidths() {
      var template = colWidths.map(function(w) { return w + 'px'; }).join(' ');
      var rows = tableEl.querySelectorAll('.admin-dash-table__row');
      for (var r = 0; r < rows.length; r++) {
        rows[r].style.gridTemplateColumns = template;
      }
    }
    applyWidths();

    // Make header cells position:relative for handles
    for (var c = 0; c < colCount; c++) {
      cells[c].style.position = 'relative';
      cells[c].style.overflow = 'visible';
    }

    // Create drag handles between columns (on each cell except the last)
    for (var h = 0; h < colCount - 1; h++) {
      (function(colIndex) {
        var handle = document.createElement('div');
        handle.className = 'col-resize-handle';
        handle.setAttribute('aria-hidden', 'true');
        cells[colIndex].appendChild(handle);

        var startX = 0;
        var startWidthLeft = 0;
        var startWidthRight = 0;

        function onPointerDown(e) {
          e.preventDefault();
          e.stopPropagation();
          startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
          startWidthLeft = colWidths[colIndex];
          startWidthRight = colWidths[colIndex + 1];
          handle.classList.add('col-resize-handle--active');
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
          document.addEventListener('mousemove', onPointerMove);
          document.addEventListener('mouseup', onPointerUp);
          document.addEventListener('touchmove', onPointerMove, { passive: false });
          document.addEventListener('touchend', onPointerUp);
        }

        function onPointerMove(e) {
          var clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
          var delta = clientX - startX;
          var minW = 50;
          var newLeft = Math.max(minW, startWidthLeft + delta);
          var newRight = Math.max(minW, startWidthRight - delta);

          // Ensure total stays constant
          if (newLeft < minW) { newLeft = minW; newRight = startWidthLeft + startWidthRight - minW; }
          if (newRight < minW) { newRight = minW; newLeft = startWidthLeft + startWidthRight - minW; }

          colWidths[colIndex] = newLeft;
          colWidths[colIndex + 1] = newRight;
          applyWidths();
          if (e.cancelable) e.preventDefault();
        }

        function onPointerUp() {
          handle.classList.remove('col-resize-handle--active');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', onPointerMove);
          document.removeEventListener('mouseup', onPointerUp);
          document.removeEventListener('touchmove', onPointerMove);
          document.removeEventListener('touchend', onPointerUp);
        }

        handle.addEventListener('mousedown', onPointerDown);
        handle.addEventListener('touchstart', onPointerDown, { passive: false });
      })(h);
    }
  }


  // ========================================
  // COMPTEUR DE VISITEURS + TRACKING
  // ========================================
  (async function initCompteurVisiteurs() {
    var el = document.getElementById('compteur-visiteurs');
    if (!window.supabase) return;

    try {
      var sb = supabase;
      var sessionKey = 'li_visite_comptee';
      var dejaCompte = false;
      try { dejaCompte = !!safeSession.getItem(sessionKey); } catch(e) {}

      if (!dejaCompte) {
        // Incrémenter le compteur global
        await sb.rpc('incrementer_visiteurs');
        try { safeSession.setItem(sessionKey, '1'); } catch(e) {}

        // Logger la visite avec IP et géolocalisation
        try {
          var geo = await fetch('https://ipapi.co/json/').then(function(r) { return r.json(); });
          await sb.from('visites_log').insert({
            ip: geo.ip || null,
            ville: geo.city || null,
            pays: geo.country_name || null,
            region: geo.region || null,
            navigateur: navigator.userAgent.substring(0, 200),
            page: window.location.hash || '#accueil'
          });
        } catch(geoErr) {
          // Fallback sans géolocalisation
          try {
            await sb.from('visites_log').insert({
              ip: null,
              ville: null,
              pays: null,
              region: null,
              navigateur: navigator.userAgent.substring(0, 200),
              page: window.location.hash || '#accueil'
            });
          } catch(e2) {}
        }
      }

      // Lire le total
      if (el) {
        var result = await sb.from('visiteurs').select('total').eq('id', 1).maybeSingle();
        if (result.data && result.data.total != null) {
          el.textContent = result.data.total.toLocaleString('fr-FR');
        }
      }
    } catch(e) {
      // Fallback silencieux
    }
  })();

  // ========================================
  // ADMIN — Onglet Visiteurs
  // ========================================
  async function chargerAdminVisiteurs(filter) {
    var container = document.getElementById('admin-visiteurs-table');
    if (!container) return;
    if (!restaurerAdminTabCache('visiteurs', 'admin-visiteurs-table')) {
      container.innerHTML = '<p class="admin-dash-loading">Chargement des visiteurs\u2026</p>';
    }

    filter = filter || '50';

    try {
      var query = supabase.from('visites_log').select('*').order('created_at', { ascending: false });

      if (filter === 'today') {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (filter === 'week') {
        var week = new Date();
        week.setDate(week.getDate() - 7);
        query = query.gte('created_at', week.toISOString());
      } else {
        query = query.limit(parseInt(filter) || 50);
      }

      var result = await query;
      if (result.error) throw result.error;
      var data = result.data || [];

      // Stats résumées
      var statsEl = document.getElementById('admin-visiteurs-stats');
      if (statsEl) {
        var villes = {};
        var pays = {};
        data.forEach(function(v) {
          if (v.ville) villes[v.ville] = (villes[v.ville] || 0) + 1;
          if (v.pays) pays[v.pays] = (pays[v.pays] || 0) + 1;
        });
        var topVille = Object.entries(villes).sort(function(a, b) { return b[1] - a[1]; })[0];
        statsEl.innerHTML = '<div style="font-size:0.85rem;"><strong style="color:var(--accent,#d4a574);font-size:1.2rem;">' + data.length + '</strong> <span style="color:var(--color-text-muted);">visites</span></div>' +
          '<div style="font-size:0.85rem;"><strong style="color:var(--accent,#d4a574);font-size:1.2rem;">' + Object.keys(villes).length + '</strong> <span style="color:var(--color-text-muted);">villes</span></div>' +
          '<div style="font-size:0.85rem;"><strong style="color:var(--accent,#d4a574);font-size:1.2rem;">' + Object.keys(pays).length + '</strong> <span style="color:var(--color-text-muted);">pays</span></div>' +
          (topVille ? '<div style="font-size:0.85rem;"><span style="color:var(--color-text-muted);">Top : </span><strong style="color:var(--accent,#d4a574);">' + topVille[0] + '</strong> <span style="color:var(--color-text-muted);">(' + topVille[1] + ')</span></div>' : '');
      }

      if (data.length === 0) {
        container.innerHTML = '<p class="admin-dash-empty">Aucune visite enregistr\u00e9e.</p>';
        return;
      }

      var html = '<div class="admin-dash-table--visiteurs">';
      html += '<div class="admin-dash-table__row admin-dash-table__row--header">' +
        '<div class="admin-dash-table__cell">Date</div>' +
        '<div class="admin-dash-table__cell">IP</div>' +
        '<div class="admin-dash-table__cell">Ville</div>' +
        '<div class="admin-dash-table__cell">R\u00e9gion</div>' +
        '<div class="admin-dash-table__cell">Pays</div>' +
        '<div class="admin-dash-table__cell">Page</div>' +
        '</div>';

      for (var i = 0; i < data.length; i++) {
        var v = data[i];
        var d = v.created_at ? new Date(v.created_at) : null;
        var dateStr = d ? d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '\u2014';
        var ipDisplay = v.ip || '\u2014';
        var villeDisplay = v.ville || '\u2014';
        var regionDisplay = v.region || '\u2014';
        var paysDisplay = v.pays || '\u2014';
        var pageDisplay = (v.page || '#accueil').replace('#', '');

        html += '<div class="admin-dash-table__row">' +
          '<div class="admin-dash-table__cell" data-label="Date">' + dateStr + '</div>' +
          '<div class="admin-dash-table__cell" data-label="IP" style="font-family:monospace;font-size:0.78rem;">' + escHtml(ipDisplay) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Ville" style="font-weight:600;">' + escHtml(villeDisplay) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="R\u00e9gion">' + escHtml(regionDisplay) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Pays">' + escHtml(paysDisplay) + '</div>' +
          '<div class="admin-dash-table__cell" data-label="Page" style="opacity:0.7;">' + escHtml(pageDisplay) + '</div>' +
          '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
      adminCacheSet('tab_visiteurs', html);
      initResizableColumns(container.querySelector('.admin-dash-table--visiteurs'));
    } catch(e) {
      if (!restaurerAdminTabCache('visiteurs', 'admin-visiteurs-table')) {
        container.innerHTML = '<p class="admin-dash-empty">Erreur lors du chargement des visiteurs.</p>';
      }
    }
  }

  // Filtre visiteurs
  var visiteurFilter = document.getElementById('admin-visiteurs-filter');
  if (visiteurFilter) {
    visiteurFilter.addEventListener('change', function() {
      chargerAdminVisiteurs(this.value);
    });
  }

  // ═══════════════════════════════════════════════════
  // BADGES NOTIFICATIONS — Onglets Admin
  // ═══════════════════════════════════════════════════

  function setBadge(tabName, count) {
    var badge = document.getElementById('badge-' + tabName);
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function getLastSeen(tabName) {
    try {
      var data = JSON.parse(localStorage.getItem('li_admin_seen') || '{}');
      return data[tabName] || 0;
    } catch(e) { return 0; }
  }

  function setLastSeen(tabName, count) {
    try {
      var data = JSON.parse(localStorage.getItem('li_admin_seen') || '{}');
      data[tabName] = count;
      localStorage.setItem('li_admin_seen', JSON.stringify(data));
    } catch(e) {}
  }

  // Masquer le badge quand on clique sur un onglet et mémoriser le compteur actuel
  var allAdminTabs = document.querySelectorAll('.admin-dash-tab[data-admin-tab]');
  allAdminTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var tabName = tab.getAttribute('data-admin-tab');
      var badge = document.getElementById('badge-' + tabName);
      if (badge) badge.hidden = true;
      // Sauver le compteur actuel comme "vu" avec un petit délai pour laisser les données se charger
      setTimeout(function() {
        var currentCount = _badgeCurrentCounts[tabName];
        if (currentCount != null) setLastSeen(tabName, currentCount);
      }, 2000);
    });
  });

  var _badgeCurrentCounts = {};

  // Helper: get new count vs last seen, auto-init lastSeen on first visit
  function getNewCount(tabName, total) {
    var seen = getLastSeen(tabName);
    // If lastSeen was never set (first visit), initialize it to current total
    // so badges start at 0 instead of showing the entire existing count
    if (seen === 0) {
      var data = {};
      try { data = JSON.parse(localStorage.getItem('li_admin_seen') || '{}'); } catch(e) {}
      if (!(tabName in data)) {
        setLastSeen(tabName, total);
        return 0;
      }
    }
    return Math.max(0, total - seen);
  }

  async function chargerBadgesNotifications() {
    try {
      // --- Blog ---
      try {
        var blogRes = await supabase.from('blog_articles').select('id', { count: 'exact', head: true });
        var nbStaticBlog = document.querySelectorAll('.blog-card[data-article]:not([data-dynamic])').length;
        var totalBlog = (blogRes.count || 0) + nbStaticBlog;
        _badgeCurrentCounts.blog = totalBlog;
        var newBlog = getNewCount('blog', totalBlog);
        if (newBlog > 0) setBadge('blog', newBlog);
      } catch(e) {}

      // --- Boutique ---
      try {
        var prodRes = await supabase.from('boutique_products').select('id', { count: 'exact', head: true });
        var totalProd = prodRes.count || 0;
        _badgeCurrentCounts.boutique = totalProd;
        var newProd = getNewCount('boutique', totalProd);
        if (newProd > 0) setBadge('boutique', newProd);
      } catch(e) {}

      // --- Coupons ---
      try {
        var coupRes = await supabase.from('coupons').select('id', { count: 'exact', head: true }).eq('actif', true);
        var totalCoup = coupRes.count || 0;
        _badgeCurrentCounts.coupons = totalCoup;
        var newCoup = getNewCount('coupons', totalCoup);
        if (newCoup > 0) setBadge('coupons', newCoup);
      } catch(e) {}

      // --- Commandes ---
      try {
        var cmdRes = await supabase.from('commandes').select('id', { count: 'exact', head: true });
        var totalCmd = cmdRes.count || 0;
        _badgeCurrentCounts.commandes = totalCmd;
        var newCmd = getNewCount('commandes', totalCmd);
        if (newCmd > 0) setBadge('commandes', newCmd);
      } catch(e) {}

      // --- RDV (Cal.eu) ---
      try {
        var calBookings = await fetchCalBookings();
        var upcomingRdv = calBookings.filter(function(b) { return b.status !== 'cancelled'; }).length;
        _badgeCurrentCounts.rdv = upcomingRdv;
        var newRdv = getNewCount('rdv', upcomingRdv);
        if (newRdv > 0) setBadge('rdv', newRdv);
      } catch(e) {}

      // --- Clients (use get_admin_clients for accurate count) ---
      try {
        var clientsListRes = await supabase.rpc('get_admin_clients');
        var totalClients = (clientsListRes.data) ? clientsListRes.data.length : 0;
        _badgeCurrentCounts.clients = totalClients;
        var newClients = getNewCount('clients', totalClients);
        if (newClients > 0) setBadge('clients', newClients);
      } catch(e) {}

      // --- Newsletter (Brevo) ---
      try {
        var totalNl = await getBrevoNewsletterCount();
        _badgeCurrentCounts.newsletter = totalNl;
        var newNl = getNewCount('newsletter', totalNl);
        if (newNl > 0) setBadge('newsletter', newNl);
      } catch(e) {}

      // --- Témoignages (en attente de modération) ---
      try {
        var temoRes = await supabase.from('temoignages').select('id', { count: 'exact', head: true }).eq('approuve', false);
        var pendingTemo = temoRes.count || 0;
        _badgeCurrentCounts.temoignages = pendingTemo;
        // Toujours afficher les témoignages en attente (pas de "last seen")
        if (pendingTemo > 0) setBadge('temoignages', pendingTemo);
      } catch(e) {}

      // --- Visiteurs (aujourd'hui) ---
      try {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var visitRes = await supabase.from('visites_log').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString());
        var todayVisits = visitRes.count || 0;
        _badgeCurrentCounts.visiteurs = todayVisits;
        var newVisits = getNewCount('visiteurs', todayVisits);
        if (newVisits > 0) setBadge('visiteurs', newVisits);
      } catch(e) {}

      // --- Disponibilités (absences actives) ---
      try {
        var now = new Date();
        var absences = [];
        if (_dispoUseLocal) {
          absences = dispoLocalGet('absence');
        } else {
          var absRes = await supabase.from('disponibilites').select('*').eq('type', 'absence');
          absences = absRes.data || [];
        }
        var activeAbs = absences.filter(function(a) {
          var d = a.data || {};
          if (!d.debut || !d.fin) return false;
          return now >= new Date(d.debut + 'T00:00:00') && now <= new Date(d.fin + 'T23:59:59');
        }).length;
        _badgeCurrentCounts.disponibilites = activeAbs;
        if (activeAbs > 0) setBadge('disponibilites', activeAbs);
      } catch(e) {}

    } catch(e) {
      console.warn('Erreur chargement badges:', e);
    }
  }

  // Les badges sont chargés via chargerDashboardAdmin() quand l'admin se connecte

  // ═══════════════════════════════════════════════════
  // DISPONIBILITÉS — Gestion horaires, absences, dates
  // Stockage hybride : Supabase si table existe, sinon localStorage
  // ═══════════════════════════════════════════════════

  var _dispoUseLocal = false; // bascule sur localStorage si Supabase indisponible

  // --- Vérifier si la table disponibilites existe (avec timeout) ---
  var _dispoChecked = false;
  async function dispoCheckTable() {
    if (_dispoChecked) return;
    try {
      // Timeout de 3 secondes pour ne pas bloquer l'affichage
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timeoutId = null;
      if (controller) {
        timeoutId = setTimeout(function() { controller.abort(); }, 3000);
      }
      var r = await supabase.from('disponibilites').select('id').limit(1);
      if (timeoutId) clearTimeout(timeoutId);
      if (r.error && (r.error.code === 'PGRST205' || r.error.code === '42P01' || r.status === 404)) {
        _dispoUseLocal = true;
        console.warn('Table disponibilites absente dans Supabase \u2014 utilisation de localStorage.');
      } else {
        _dispoUseLocal = false;
      }
    } catch(e) {
      _dispoUseLocal = true;
    }
    _dispoChecked = true;
  }

  // --- Helpers localStorage ---
  function dispoLocalGet(type) {
    try {
      var all = JSON.parse(localStorage.getItem('li_disponibilites') || '[]');
      if (type) return all.filter(function(d) { return d.type === type; });
      return all;
    } catch(e) { return []; }
  }
  function dispoLocalSet(data) {
    try { localStorage.setItem('li_disponibilites', JSON.stringify(data)); } catch(e) {}
  }
  function dispoLocalAdd(item) {
    var all = dispoLocalGet();
    item.id = item.id || ('local_' + Date.now() + '_' + Math.random().toString(36).substr(2,5));
    item.created_at = item.created_at || new Date().toISOString();
    all.push(item);
    dispoLocalSet(all);
    return item;
  }
  function dispoLocalDelete(id) {
    var all = dispoLocalGet();
    dispoLocalSet(all.filter(function(d) { return d.id !== id; }));
  }
  function dispoLocalUpdate(id, updates) {
    var all = dispoLocalGet();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        for (var k in updates) all[i][k] = updates[k];
        break;
      }
    }
    dispoLocalSet(all);
  }
  function dispoLocalFindOne(type) {
    var items = dispoLocalGet(type);
    return items.length > 0 ? items[0] : null;
  }

  // --- Sous-onglets disponibilités ---
  var dispoSubtabs = document.querySelectorAll('.dispo-subtab');
  dispoSubtabs.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tabId = btn.getAttribute('data-dispo-tab');
      dispoSubtabs.forEach(function(b) { b.classList.remove('dispo-subtab--active'); });
      btn.classList.add('dispo-subtab--active');
      document.querySelectorAll('.dispo-panel').forEach(function(p) { p.classList.remove('dispo-panel--active'); });
      var target = document.getElementById('dispo-panel-' + tabId);
      if (target) target.classList.add('dispo-panel--active');
    });
  });

  // --- Toggle jours actifs/inactifs ---
  document.querySelectorAll('[data-jour-toggle]').forEach(function(toggle) {
    function updateJour() {
      var jour = toggle.getAttribute('data-jour-toggle');
      var creneaux = document.getElementById('creneaux-' + jour);
      if (!creneaux) return;
      if (toggle.checked) {
        creneaux.classList.remove('dispo-jour__creneaux--off');
      } else {
        creneaux.classList.add('dispo-jour__creneaux--off');
      }
    }
    toggle.addEventListener('change', updateJour);
    updateJour();
  });

  // --- Supprimer un créneau horaire ---
  var dispoSemaine = document.getElementById('dispo-semaine');
  if (dispoSemaine) dispoSemaine.addEventListener('click', function(e) {
    var supprBtn = e.target.closest('.dispo-creneau__suppr');
    if (!supprBtn) return;
    var creneau = supprBtn.closest('.dispo-creneau');
    if (creneau) creneau.remove();
  });

  // --- Ajouter un créneau horaire ---
  document.querySelectorAll('[data-jour-add]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var jour = btn.getAttribute('data-jour-add');
      var container = document.getElementById('creneaux-' + jour);
      if (!container) return;
      var div = document.createElement('div');
      div.className = 'dispo-creneau';
      div.innerHTML = '<input type="time" class="dispo-time" value="09:00" data-role="debut">' +
        '<span class="dispo-sep">\u2192</span>' +
        '<input type="time" class="dispo-time" value="12:00" data-role="fin">' +
        '<button class="dispo-creneau__suppr" title="Supprimer">&times;</button>';
      container.appendChild(div);
    });
  });

  // --- Collecter les horaires du formulaire ---
  function collecterHoraires() {
    var jours = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
    var horaires = {};
    jours.forEach(function(jour) {
      var toggle = document.querySelector('[data-jour-toggle="' + jour + '"]');
      var actif = toggle ? toggle.checked : false;
      var creneaux = [];
      var container = document.getElementById('creneaux-' + jour);
      if (container) {
        container.querySelectorAll('.dispo-creneau').forEach(function(c) {
          var debut = c.querySelector('[data-role="debut"]');
          var fin = c.querySelector('[data-role="fin"]');
          if (debut && fin && debut.value && fin.value) {
            creneaux.push({ debut: debut.value, fin: fin.value });
          }
        });
      }
      horaires[jour] = { actif: actif, creneaux: creneaux };
    });
    return horaires;
  }

  // --- Charger les horaires (hybride Supabase / localStorage) ---
  async function chargerHoraires() {
    try {
      var record = null;
      if (_dispoUseLocal) {
        record = dispoLocalFindOne('horaires');
      } else {
        var result = await supabase.from('disponibilites').select('*').eq('type', 'horaires').single();
        record = result.data;
      }
      if (record && record.data) {
        var horaires = record.data;
        var jours = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
        jours.forEach(function(jour) {
          if (!horaires[jour]) return;
          var toggle = document.querySelector('[data-jour-toggle="' + jour + '"]');
          if (toggle) {
            toggle.checked = horaires[jour].actif;
            toggle.dispatchEvent(new Event('change'));
          }
          var container = document.getElementById('creneaux-' + jour);
          if (container && horaires[jour].creneaux) {
            container.innerHTML = '';
            horaires[jour].creneaux.forEach(function(c) {
              var div = document.createElement('div');
              div.className = 'dispo-creneau';
              div.innerHTML = '<input type="time" class="dispo-time" value="' + (c.debut || '09:00') + '" data-role="debut">' +
                '<span class="dispo-sep">\u2192</span>' +
                '<input type="time" class="dispo-time" value="' + (c.fin || '18:00') + '" data-role="fin">' +
                '<button class="dispo-creneau__suppr" title="Supprimer">&times;</button>';
              container.appendChild(div);
            });
          }
        });
      }
    } catch(e) { console.warn('Horaires non charg\u00e9s:', e); }
  }

  // --- Sauvegarder les horaires ---
  var btnSauverHoraires = document.getElementById('btn-sauver-horaires');
  if (btnSauverHoraires) {
    btnSauverHoraires.addEventListener('click', async function() {
      var msg = document.getElementById('msg-horaires');
      btnSauverHoraires.disabled = true;
      btnSauverHoraires.textContent = 'Enregistrement\u2026';
      try {
        var horaires = collecterHoraires();
        if (_dispoUseLocal) {
          var ex = dispoLocalFindOne('horaires');
          if (ex) {
            dispoLocalUpdate(ex.id, { data: horaires, updated_at: new Date().toISOString() });
          } else {
            dispoLocalAdd({ type: 'horaires', data: horaires });
          }
        } else {
          // Upsert : on cherche d'abord si un enregistrement existe
          var existing = await supabase.from('disponibilites').select('id').eq('type', 'horaires').single();
          if (existing.data) {
            await supabase.from('disponibilites').update({ data: horaires, updated_at: new Date().toISOString() }).eq('id', existing.data.id);
          } else {
            await supabase.from('disponibilites').insert({ type: 'horaires', data: horaires });
          }
        }
        msg.hidden = false;
        msg.className = 'dispo-message dispo-message--success';
        msg.textContent = '\u2713 Horaires enregistr\u00e9s avec succ\u00e8s';
        setTimeout(function() { msg.hidden = true; }, 3000);
      } catch(e) {
        msg.hidden = false;
        msg.className = 'dispo-message dispo-message--error';
        msg.textContent = 'Erreur : ' + (e.message || e);
      }
      btnSauverHoraires.disabled = false;
      btnSauverHoraires.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Enregistrer les horaires';
    });
  }

  // --- Charger les absences (hybride) ---
  async function chargerAbsences() {
    var liste = document.getElementById('absences-liste');
    if (!liste) return;
    try {
      var data = [];
      if (_dispoUseLocal) {
        data = dispoLocalGet('absence');
        data.sort(function(a,b) { return (b.created_at||'').localeCompare(a.created_at||''); });
      } else {
        var result = await supabase.from('disponibilites').select('*').eq('type', 'absence').order('created_at', { ascending: false });
        data = result.data || [];
      }
      if (data.length === 0) {
        liste.innerHTML = '<p class="dispo-liste__vide">Aucune absence enregistr\u00e9e.</p>';
        return;
      }
      var html = '';
      var now = new Date();
      data.forEach(function(a) {
        var d = a.data || {};
        var debut = new Date(d.debut);
        var fin = new Date(d.fin);
        var badge = '';
        if (now >= debut && now <= fin) badge = '<span class="dispo-liste__badge dispo-liste__badge--actif">En cours</span>';
        else if (now < debut) badge = '<span class="dispo-liste__badge dispo-liste__badge--futur">\u00c0 venir</span>';
        else badge = '<span class="dispo-liste__badge dispo-liste__badge--passe">Pass\u00e9</span>';
        var debutStr = debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        var finStr = fin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        html += '<div class="dispo-liste__item">' +
          '<div class="dispo-liste__info">' +
            '<span class="dispo-liste__dates">' + debutStr + ' \u2192 ' + finStr + ' ' + badge + '</span>' +
            (d.motif ? '<span class="dispo-liste__motif">' + escHtml(d.motif) + '</span>' : '') +
          '</div>' +
          '<button class="dispo-liste__suppr" data-suppr-id="' + a.id + '" title="Supprimer">&times;</button>' +
          '</div>';
      });
      liste.innerHTML = html;

      // Attach delete handlers
      liste.querySelectorAll('[data-suppr-id]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          if (!confirm('Supprimer cette absence ?')) return;
          var delId = btn.getAttribute('data-suppr-id');
          if (_dispoUseLocal) {
            dispoLocalDelete(delId);
          } else {
            await supabase.from('disponibilites').delete().eq('id', delId);
          }
          chargerAbsences();
        });
      });
    } catch(e) {
      liste.innerHTML = '<p class="dispo-liste__vide">Erreur de chargement.</p>';
    }
  }

  // --- Ajouter une absence ---
  var btnAjouterAbsence = document.getElementById('btn-ajouter-absence');
  if (btnAjouterAbsence) {
    btnAjouterAbsence.addEventListener('click', async function() {
      var debut = document.getElementById('absence-debut').value;
      var fin = document.getElementById('absence-fin').value;
      var motif = document.getElementById('absence-motif').value.trim();
      var msg = document.getElementById('msg-absence');

      if (!debut || !fin) {
        msg.hidden = false;
        msg.className = 'dispo-message dispo-message--error';
        msg.textContent = 'Veuillez renseigner les dates de d\u00e9but et de fin.';
        return;
      }
      if (new Date(fin) < new Date(debut)) {
        msg.hidden = false;
        msg.className = 'dispo-message dispo-message--error';
        msg.textContent = 'La date de fin doit \u00eatre apr\u00e8s la date de d\u00e9but.';
        return;
      }

      btnAjouterAbsence.disabled = true;
      try {
        if (_dispoUseLocal) {
          dispoLocalAdd({ type: 'absence', data: { debut: debut, fin: fin, motif: motif } });
        } else {
          await safeSupabase(function() { return supabase.from('disponibilites').insert({
            type: 'absence',
            data: { debut: debut, fin: fin, motif: motif }
          }); }, 'enregistrement de la disponibilité');
        }
        document.getElementById('absence-debut').value = '';
        document.getElementById('absence-fin').value = '';
        document.getElementById('absence-motif').value = '';
        msg.hidden = false;
        msg.className = 'dispo-message dispo-message--success';
        msg.textContent = '\u2713 Absence ajout\u00e9e';
        setTimeout(function() { msg.hidden = true; }, 3000);
        chargerAbsences();
      } catch(e) {
        msg.hidden = false;
        msg.className = 'dispo-message dispo-message--error';
        msg.textContent = 'Erreur : ' + (e.message || e);
      }
      btnAjouterAbsence.disabled = false;
    });
  }

  // --- Charger les dates spéciales (hybride) ---
  async function chargerDatesSpeciales() {
    var liste = document.getElementById('dates-speciales-liste');
    if (!liste) return;
    try {
      var data = [];
      if (_dispoUseLocal) {
        data = dispoLocalGet('date_speciale');
        data.sort(function(a,b) { return (b.created_at||'').localeCompare(a.created_at||''); });
      } else {
        var result = await supabase.from('disponibilites').select('*').eq('type', 'date_speciale').order('created_at', { ascending: false });
        data = result.data || [];
      }
      if (data.length === 0) {
        liste.innerHTML = '<p class="dispo-liste__vide">Aucune date sp\u00e9ciale enregistr\u00e9e.</p>';
        return;
      }
      var html = '';
      var now = new Date();
      data.forEach(function(ds) {
        var d = ds.data || {};
        var dateObj = new Date(d.date);
        var badge = now.toDateString() === dateObj.toDateString() ?
          '<span class="dispo-liste__badge dispo-liste__badge--actif">Aujourd\'hui</span>' :
          (dateObj > now ? '<span class="dispo-liste__badge dispo-liste__badge--futur">\u00c0 venir</span>' :
          '<span class="dispo-liste__badge dispo-liste__badge--passe">Pass\u00e9</span>');
        var dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        html += '<div class="dispo-liste__item">' +
          '<div class="dispo-liste__info">' +
            '<span class="dispo-liste__dates">' + dateStr + ' ' + badge + '</span>' +
            '<span class="dispo-liste__motif">' + (d.debut || '') + ' \u2192 ' + (d.fin || '') +
              (d.label ? ' \u2014 ' + escHtml(d.label) : '') + '</span>' +
          '</div>' +
          '<button class="dispo-liste__suppr" data-suppr-ds-id="' + ds.id + '" title="Supprimer">&times;</button>' +
          '</div>';
      });
      liste.innerHTML = html;

      liste.querySelectorAll('[data-suppr-ds-id]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          if (!confirm('Supprimer cette date sp\u00e9ciale ?')) return;
          var dsId = btn.getAttribute('data-suppr-ds-id');
          if (_dispoUseLocal) {
            dispoLocalDelete(dsId);
          } else {
            await supabase.from('disponibilites').delete().eq('id', dsId);
          }
          chargerDatesSpeciales();
        });
      });
    } catch(e) {
      liste.innerHTML = '<p class="dispo-liste__vide">Erreur de chargement.</p>';
    }
  }

  // --- Ajouter une date spéciale ---
  var btnAjouterDateSpeciale = document.getElementById('btn-ajouter-date-speciale');
  if (btnAjouterDateSpeciale) {
    btnAjouterDateSpeciale.addEventListener('click', async function() {
      var jour = document.getElementById('date-speciale-jour').value;
      var debut = document.getElementById('date-speciale-debut').value;
      var fin = document.getElementById('date-speciale-fin').value;
      var label = document.getElementById('date-speciale-label').value.trim();
      var msg = document.getElementById('msg-date-speciale');

      if (!jour) {
        msg.hidden = false;
        msg.className = 'dispo-message dispo-message--error';
        msg.textContent = 'Veuillez s\u00e9lectionner une date.';
        return;
      }

      btnAjouterDateSpeciale.disabled = true;
      try {
        if (_dispoUseLocal) {
          dispoLocalAdd({ type: 'date_speciale', data: { date: jour, debut: debut, fin: fin, label: label } });
        } else {
          await safeSupabase(function() { return supabase.from('disponibilites').insert({
            type: 'date_speciale',
            data: { date: jour, debut: debut, fin: fin, label: label }
          }); }, 'enregistrement de la disponibilité');
        }
        document.getElementById('date-speciale-jour').value = '';
        document.getElementById('date-speciale-debut').value = '09:00';
        document.getElementById('date-speciale-fin').value = '18:00';
        document.getElementById('date-speciale-label').value = '';
        msg.hidden = false;
        msg.className = 'dispo-message dispo-message--success';
        msg.textContent = '\u2713 Date sp\u00e9ciale ajout\u00e9e';
        setTimeout(function() { msg.hidden = true; }, 3000);
        chargerDatesSpeciales();
      } catch(e) {
        msg.hidden = false;
        msg.className = 'dispo-message dispo-message--error';
        msg.textContent = 'Erreur : ' + (e.message || e);
      }
      btnAjouterDateSpeciale.disabled = false;
    });
  }

  // --- Charger les données dispo au clic sur l'onglet ---
  var dispoTabBtn = document.querySelector('[data-admin-tab="disponibilites"]');
  if (dispoTabBtn) {
    dispoTabBtn.addEventListener('click', async function() {
      await dispoCheckTable();
      chargerHoraires();
      chargerAbsences();
      chargerDatesSpeciales();
    });
  }

  // ═══════════════════════════════════════════════════
  // BANNIÈRE D'ABSENCE — Accueil (visible par tous)
  // ═══════════════════════════════════════════════════
  // --- Afficher la bannière si une absence est active ---
  function afficherBanniereAbsence(absences) {
    var banner = document.getElementById('absence-banner');
    if (!banner) return;
    var now = new Date();
    var absenceActive = null;
    for (var i = 0; i < absences.length; i++) {
      var d = absences[i].data || {};
      if (!d.debut || !d.fin) continue;
      var debut = new Date(d.debut + 'T00:00:00');
      var fin = new Date(d.fin + 'T23:59:59');
      if (now >= debut && now <= fin) {
        absenceActive = absences[i];
        break;
      }
    }
    if (!absenceActive) {
      banner.hidden = true;
      return;
    }
    var d = absenceActive.data;
    var finDate = new Date(d.fin);
    var options = { day: 'numeric', month: 'long', year: 'numeric' };
    var finStr = finDate.toLocaleDateString('fr-FR', options);
    var title = document.getElementById('absence-banner-title');
    var detail = document.getElementById('absence-banner-detail');
    if (title) {
      title.textContent = d.motif ? d.motif : 'Actuellement indisponible';
    }
    if (detail) {
      var msg = 'Je suis absent(e) jusqu\u2019au ' + finStr + '. Les consultations reprendront \u00e0 mon retour.';
      var diffJours = Math.ceil((finDate - now) / (1000*60*60*24));
      if (diffJours <= 0) {
        msg = 'Derni\u00e8re journ\u00e9e d\u2019absence. Les consultations reprennent d\u00e8s demain\u00a0!';
      } else if (diffJours === 1) {
        msg = 'De retour d\u00e8s demain\u00a0! Les consultations reprendront tr\u00e8s bient\u00f4t.';
      }
      detail.textContent = msg;
    }
    banner.setAttribute('data-absence-id', absenceActive.id);
    if (sessionStorage.getItem('absence-banner-closed') === String(absenceActive.id)) {
      banner.hidden = true;
    } else {
      banner.hidden = false;
    }
  }

  async function verifierAbsenceEnCours() {
    var banner = document.getElementById('absence-banner');
    if (!banner) return;
    try {
      // Étape 1 : Vérifier immédiatement avec localStorage (instantané)
      var localAbsences = dispoLocalGet('absence');
      if (localAbsences.length > 0) {
        afficherBanniereAbsence(localAbsences);
      }
      // Étape 2 : Vérifier aussi via Supabase (en arrière-plan)
      await dispoCheckTable();
      if (!_dispoUseLocal) {
        var result = await supabase.from('disponibilites').select('*').eq('type', 'absence');
        var sbAbsences = result.data || [];
        if (sbAbsences.length > 0) {
          afficherBanniereAbsence(sbAbsences);
        }
      }
    } catch(e) {
      console.warn('V\u00e9rification absence:', e);
    }
  }

  // Bouton fermer la bannière
  var closeBannerBtn = document.getElementById('absence-banner-close');
  if (closeBannerBtn) {
    closeBannerBtn.addEventListener('click', function() {
      var banner = document.getElementById('absence-banner');
      if (banner) {
        banner.style.animation = 'none';
        banner.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        banner.style.transform = 'translateY(-100%)';
        banner.style.opacity = '0';
        setTimeout(function() { banner.hidden = true; }, 300);
        // Retenir l'id pour ne pas réafficher dans cette session
        try {
          var id = banner.getAttribute('data-absence-id');
          if (id) sessionStorage.setItem('absence-banner-closed', id);
        } catch(e) {}
      }
    });
  }

  // Vérifier au chargement de la page
  verifierAbsenceEnCours();

})();
