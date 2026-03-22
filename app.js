// ========================================
// LUMIÈRE INTÉRIEURE — App Logic
// ========================================

(function () {
  'use strict';

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

  window.addEventListener('scroll', function () {
    var currentScroll = window.scrollY;
    if (currentScroll > 60) {
      header.style.boxShadow = 'var(--shadow-sm)';
    } else {
      header.style.boxShadow = 'none';
    }
    lastScroll = currentScroll;
  }, { passive: true });

  // --- Blog Article Content ---
  var blogArticles = {
    belline: {
      category: 'Oracle Belline',
      title: 'Comprendre l\u2019Oracle Belline : guide pour d\u00e9butants',
      date: '12 mars 2026',
      content: '<h2>Un h\u00e9ritage de la voyance fran\u00e7aise</h2>' +
        '<p>L\u2019Oracle Belline est n\u00e9 de la collaboration entre deux figures majeures de la voyance : <strong>Edmond</strong>, c\u00e9l\u00e8bre voyant du XIXe si\u00e8cle, et <strong>Marcel Belline</strong>, qui a red\u00e9couvert et popularis\u00e9 ce jeu dans les ann\u00e9es 1960. Compos\u00e9 de 52 cartes et une carte suppl\u00e9mentaire (la Clef), cet oracle est consid\u00e9r\u00e9 comme l\u2019un des plus pr\u00e9cis de la tradition divinatoire europ\u00e9enne.</p>' +
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
      date: '5 mars 2026',
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
      date: '28 f\u00e9vrier 2026',
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
      date: '20 f\u00e9vrier 2026',
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
      date: '16 mars 2026',
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
      date: '28 mars 2026',
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
      date: '20 mars 2026',
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
      date: '28 mars 2026',
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
      date: '22 mars 2026',
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
      date: '22 mars 2026',
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
      date: '22 mars 2026',
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
    }
  };

  // --- Blog Overlay Logic ---
  var overlay = document.getElementById('blog-article-overlay');
  var articleBody = document.getElementById('blog-article-body');
  var closeBtn = overlay ? overlay.querySelector('.blog-overlay__close') : null;
  var backdrop = overlay ? overlay.querySelector('.blog-overlay__backdrop') : null;

  // --- Likes, Views & Comments helpers (safe storage) ---
  function getLikes(articleId) {
    try { return JSON.parse(safeLocal.getItem('blog_likes_' + articleId)) || { count: 0, liked: false }; }
    catch(e) { return { count: 0, liked: false }; }
  }
  function saveLikes(articleId, data) {
    try { safeLocal.setItem('blog_likes_' + articleId, JSON.stringify(data)); } catch(e) {}
  }
  // --- Views: shared counter via countapi (visible by everyone) ---
  var viewsCache = {};
  var COUNTAPI_BASE = 'https://countapi.mileshilliard.com/api/v1';
  var COUNTAPI_PREFIX = 'lumiere-interieure-';
  function fetchViews(articleId, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', COUNTAPI_BASE + '/get/' + COUNTAPI_PREFIX + articleId);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var val = 0;
      if (xhr.response && xhr.response.value !== undefined) val = parseInt(xhr.response.value, 10) || 0;
      viewsCache[articleId] = val;
      if (callback) callback(val);
    };
    xhr.onerror = function() { if (callback) callback(viewsCache[articleId] || 0); };
    xhr.send();
  }
  function addView(articleId, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', COUNTAPI_BASE + '/hit/' + COUNTAPI_PREFIX + articleId);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var val = 0;
      if (xhr.response && xhr.response.value !== undefined) val = parseInt(xhr.response.value, 10) || 0;
      viewsCache[articleId] = val;
      if (callback) callback(val);
    };
    xhr.onerror = function() { if (callback) callback(viewsCache[articleId] || 0); };
    xhr.send();
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
  function getComments(articleId) {
    try { return JSON.parse(safeLocal.getItem('blog_comments_' + articleId)) || []; }
    catch(e) { return []; }
  }
  function saveComments(articleId, comments) {
    try { safeLocal.setItem('blog_comments_' + articleId, JSON.stringify(comments)); } catch(e) {}
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
            '<span class="blog-comment__name">' + c.name + '</span>' +
            '<span class="blog-comment__date">' + c.date + '</span>' +
          '</div>' +
          '<p class="blog-comment__text">' + c.text + '</p>' +
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

    articleBody.innerHTML =
      '<p class="blog-article__category">' + article.category + '</p>' +
      '<h1 class="blog-article__title">' + article.title + '</h1>' +
      '<p class="blog-article__meta">' + article.date + '</p>' +
      article.content +
      buildInteractionsHTML(articleId);

    // Render existing comments
    var listEl = document.getElementById('comments-list-' + articleId);
    if (listEl) renderComments(articleId, listEl);

    // Like button handler
    var likeBtn = articleBody.querySelector('[data-like-article="' + articleId + '"]');
    if (likeBtn) {
      likeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var data = getLikes(articleId);
        if (data.liked) {
          data.count = Math.max(0, data.count - 1);
          data.liked = false;
        } else {
          data.count += 1;
          data.liked = true;
        }
        saveLikes(articleId, data);
        this.classList.toggle('liked');
        var svg = this.querySelector('svg');
        svg.setAttribute('fill', data.liked ? 'var(--color-terracotta)' : 'none');
        svg.classList.remove('like-anim');
        void svg.offsetWidth;
        svg.classList.add('like-anim');
        this.querySelector('.like-count').textContent = data.count;
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
        if (!name || !text) return;
        var comments = getComments(articleId);
        comments.unshift({ name: name, text: text, date: formatDate(new Date()) });
        saveComments(articleId, comments);
        nameInput.value = '';
        textInput.value = '';
        if (listEl) renderComments(articleId, listEl);
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
    // Init likes display (local)
    updateCardStats(articleId);
    // Heart click on card
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var data = getLikes(articleId);
      if (data.liked) {
        data.count = Math.max(0, data.count - 1);
        data.liked = false;
      } else {
        data.count += 1;
        data.liked = true;
      }
      saveLikes(articleId, data);
      updateCardStats(articleId);
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

  // --- Newsletter Forms (Brevo API) ---
  var _bk = ['xkeysib', 'b85ac7388973b4a7f6d54ddee9929c16b1a21f4c92618ba8562cfdd9bd6355c8', 'iuFk4LnhmnZNaq8V'].join('-');

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

      fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': _bk
        },
        body: JSON.stringify({
          email: email,
          attributes: { PRENOM: prenom },
          listIds: [3],
          updateEnabled: true
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
      .catch(function() {
        clearTimeout(safetyTimer);
        showSuccess('Merci ' + prenom + '\u00a0! Inscription enregistr\u00e9e.');
      });
    });
  });

  // ========================================
  // AUTHENTIFICATION — Supabase Auth
  // ========================================

  var SUPABASE_URL = 'https://dhbbwzpfwtdtdiuixrmq.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYmJ3enBmd3RkdGRpdWl4cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTY4MTQsImV4cCI6MjA4OTY3MjgxNH0.ysMB2mgIV83NjTI_63WNlkHVul20zu34us-W-wzdyfg';
  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  var navConnexion = document.getElementById('nav-connexion');
  var navCompte = document.getElementById('nav-compte');

  // --- Vérifier l'état de connexion au chargement ---
  async function verifierStatutAuth() {
    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        var meta = session.user.user_metadata || {};
        afficherEtatConnecte({ prenom: meta.prenom || '', nom: meta.nom || '', email: session.user.email });
      } else {
        afficherEtatDeconnecte();
      }
    } catch (e) {
      afficherEtatDeconnecte();
    }
  }

  // Écouter les changements d'état d'auth
  supabase.auth.onAuthStateChange(function (event, session) {
    if (session && session.user) {
      var meta = session.user.user_metadata || {};
      afficherEtatConnecte({ prenom: meta.prenom || '', nom: meta.nom || '', email: session.user.email });
    } else {
      afficherEtatDeconnecte();
    }
  });

  function afficherEtatConnecte(client) {
    if (navConnexion) navConnexion.hidden = true;
    if (navCompte) {
      navCompte.hidden = false;
      navCompte.textContent = client.prenom || 'Mon compte';
    }
  }

  function afficherEtatDeconnecte() {
    if (navConnexion) navConnexion.hidden = false;
    if (navCompte) navCompte.hidden = true;
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
          var msg = error.message;
          if (msg.includes('already registered')) msg = 'Un compte existe déjà avec cette adresse email.';
          afficherMessage('insc-message', msg, 'erreur');
        } else {
          afficherMessage('insc-message', 'Inscription réussie ! Bienvenue, ' + prenom + '.', 'succes');
          afficherEtatConnecte({ prenom: prenom, nom: nom, email: email });
          formInscription.reset();
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
          var msg = error.message;
          if (msg.includes('Invalid login')) msg = 'Email ou mot de passe incorrect.';
          afficherMessage('conn-message', msg, 'erreur');
        } else {
          var meta = data.user.user_metadata || {};
          afficherMessage('conn-message', 'Connexion réussie ! Bonjour, ' + (meta.prenom || '') + '.', 'succes');
          afficherEtatConnecte({ prenom: meta.prenom || '', nom: meta.nom || '', email: data.user.email });
          formConnexion.reset();
          setTimeout(function () {
            history.pushState(null, '', '#mon-compte');
            showPage('mon-compte');
            chargerProfil();
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
        el = document.getElementById('compte-date');
        if (el) el.textContent = new Date(u.created_at).toLocaleDateString('fr-FR', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      }
    } catch (e) {}
  }

  // --- Déconnexion ---
  var btnDeconnexion = document.getElementById('btn-deconnexion');
  if (btnDeconnexion) {
    btnDeconnexion.addEventListener('click', async function () {
      await supabase.auth.signOut();
      afficherEtatDeconnecte();
      history.pushState(null, '', '#accueil');
      showPage('accueil');
    });
  }

  // --- Suppression du compte (avec confirmation mot de passe) ---
 // --- Suppression du compte — Modale de confirmation ---
var btnSupprimer = document.getElementById('btn-supprimer-compte');

// Créer et injecter la modale dans le DOM
var modalHTML = `
<div id="modal-suppression" class="modal-overlay" hidden>
  <div class="modal-card">
    <div class="modal-card__icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
    </div>
    <h2 class="modal-card__title">Supprimer mon compte ?</h2>
    <p class="modal-card__desc">
      Cette action est <strong>irréversible</strong>. Toutes vos données (profil, rendez-vous, commandes) seront définitivement supprimées.
    </p>
    <div class="modal-card__group">
      <label for="modal-mdp" class="auth-form__label">Confirmez votre mot de passe</label>
      <div class="auth-form__password-wrapper">
        <input type="password" id="modal-mdp" class="auth-form__input" placeholder="Votre mot de passe" autocomplete="current-password">
        <button type="button" class="auth-form__toggle-pwd" data-toggle-pwd="modal-mdp" aria-label="Afficher le mot de passe">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
      <div class="auth-form__message auth-form__message--erreur" id="modal-mdp-erreur" hidden></div>
    </div>
    <div class="modal-card__actions">
      <button class="btn btn--outline" id="btn-modal-annuler">Annuler</button>
      <button class="btn btn--danger" id="btn-modal-confirmer">Supprimer définitivement</button>
    </div>
  </div>
</div>`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

var modal = document.getElementById('modal-suppression');
var btnModalAnnuler = document.getElementById('btn-modal-annuler');
var btnModalConfirmer = document.getElementById('btn-modal-confirmer');
var modalMdp = document.getElementById('modal-mdp');
var modalMdpErreur = document.getElementById('modal-mdp-erreur');

// Ouvrir la modale
if (btnSupprimer) {
  btnSupprimer.addEventListener('click', function () {
    modalMdp.value = '';
    modalMdpErreur.hidden = true;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(function () { modalMdp.focus(); }, 100);
  });
}

// Fermer la modale
function fermerModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
  modalMdp.value = '';
  modalMdpErreur.hidden = true;
  btnModalConfirmer.disabled = false;
  btnModalConfirmer.textContent = 'Supprimer définitivement';
}

if (btnModalAnnuler) {
  btnModalAnnuler.addEventListener('click', fermerModal);
}

// Fermer en cliquant sur l'overlay
if (modal) {
  modal.addEventListener('click', function (e) {
    if (e.target === modal) fermerModal();
  });
}

// Fermer avec Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && modal && !modal.hidden) fermerModal();
});

// Afficher/masquer le mot de passe dans la modale
var toggleModalPwd = modal.querySelector('[data-toggle-pwd="modal-mdp"]');
if (toggleModalPwd) {
  toggleModalPwd.addEventListener('click', function () {
    var estVisible = modalMdp.type === 'text';
    modalMdp.type = estVisible ? 'password' : 'text';
    this.setAttribute('aria-label', estVisible ? 'Afficher le mot de passe' : 'Masquer le mot de passe');
  });
}

// Confirmer la suppression
if (btnModalConfirmer) {
  btnModalConfirmer.addEventListener('click', async function () {
    var mdp = modalMdp.value.trim();
    if (!mdp) {
      modalMdpErreur.textContent = 'Veuillez saisir votre mot de passe.';
      modalMdpErreur.hidden = false;
      modalMdp.focus();
      return;
    }

    modalMdpErreur.hidden = true;
    btnModalConfirmer.disabled = true;
    btnModalConfirmer.textContent = 'Suppression en cours…';

    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        modalMdpErreur.textContent = 'Session expirée. Veuillez vous reconnecter.';
        modalMdpErreur.hidden = false;
        btnModalConfirmer.disabled = false;
        btnModalConfirmer.textContent = 'Supprimer définitivement';
        return;
      }

      // Vérifier le mot de passe
      var { error: authError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: mdp
      });

      if (authError) {
        modalMdpErreur.textContent = 'Mot de passe incorrect.';
        modalMdpErreur.hidden = false;
        modalMdp.value = '';
        modalMdp.focus();
        btnModalConfirmer.disabled = false;
        btnModalConfirmer.textContent = 'Supprimer définitivement';
        return;
      }

      // Supprimer les données
      var userId = session.user.id;
      await supabase.from('rendez_vous').delete().eq('user_id', userId);
      await supabase.from('commandes').delete().eq('user_id', userId);
      await supabase.from('paiements').delete().eq('user_id', userId);
      await supabase.from('coupons_utilises').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);

      var { error: rpcError } = await supabase.rpc('delete_own_account');
      if (rpcError) console.warn('RPC delete_own_account:', rpcError.message);

      await supabase.auth.signOut();
      fermerModal();
      afficherEtatDeconnecte();
      history.pushState(null, '', '#accueil');
      showPage('accueil');
      alert('Votre compte a été supprimé. Merci d\'avoir fait partie de Lumière Intérieure.');

    } catch (err) {
      console.error('Erreur suppression:', err);
      modalMdpErreur.textContent = 'Une erreur est survenue. Veuillez réessayer.';
      modalMdpErreur.hidden = false;
      btnModalConfirmer.disabled = false;
      btnModalConfirmer.textContent = 'Supprimer définitivement';
    }
  });
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
      chargerProfil();
      chargerRDV();
      chargerCommandes();
      chargerPaiements();
      chargerCoupons();
    }
  };

  // Vérifier le statut auth au chargement
  verifierStatutAuth();

  // ========================================
  // COMMANDES / PAIEMENTS / COUPONS — Supabase
  // ========================================

  // Map des liens Stripe vers les noms de services
  var STRIPE_SERVICES = {
    'aFaaEP1PSgzRh2U7IP8so02': { service: 'Focus Intuitif', montant: 40 },
    'fZu5kv7ac3N5h2Ufbh8so03': { service: 'R\u00e9v\u00e9lations Intuitives', montant: 55 },
    'fZu00bfGIgzRh2U0gn8so04': { service: 'Panorama Intuitif', montant: 75 },
    '00wbITdyAabtdQI8MT8so05': { service: 'Voyance par mail — 1 question', montant: 9 }
  };

  // --- V\u00e9rifier si retour de Stripe (success) ---
  async function verifierRetourStripe() {
    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get('session_id');
    var serviceKey = params.get('service');
    if (!sessionId || !serviceKey) return;

    // Nettoyer l'URL
    history.replaceState(null, '', window.location.pathname + '#mon-compte');

    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      var infos = STRIPE_SERVICES[serviceKey];
      if (!infos) return;

      // V\u00e9rifier que cette session n'a pas d\u00e9j\u00e0 \u00e9t\u00e9 enregistr\u00e9e
      var { data: existe } = await supabase
        .from('commandes')
        .select('id')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (existe) return; // D\u00e9j\u00e0 enregistr\u00e9e

      // Enregistrer la commande
      await supabase.from('commandes').insert({
        user_id: session.user.id,
        service: infos.service,
        montant: infos.montant,
        methode_paiement: 'stripe',
        statut: 'pay\u00e9',
        stripe_session_id: sessionId
      });

      // Naviguer vers Mon compte > Commandes
      showPage('mon-compte');
      setTimeout(function () {
        var btnCommandes = document.querySelector('[data-tab="commandes"]');
        if (btnCommandes) btnCommandes.click();
      }, 500);
    } catch (e) {
      console.error('Erreur retour Stripe:', e);
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
        return '<div class="compte-liste__item">' +
          '<div class="compte-liste__info">' +
            '<span class="compte-liste__coupon-code">' + c.code + '</span>' +
            '<span class="compte-liste__coupon-desc">' + c.description + '</span>' +
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
          afficherMessage('coupon-message', 'Code coupon invalide ou expir\u00e9.', 'erreur');
        } else if (coupon.valide_jusqu_au && new Date(coupon.valide_jusqu_au) < new Date()) {
          afficherMessage('coupon-message', 'Ce coupon a expir\u00e9.', 'erreur');
        } else if (coupon.usage_max && coupon.usage_actuel >= coupon.usage_max) {
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
              afficherMessage('coupon-message', 'Erreur lors de l\u2019application du coupon.', 'erreur');
            } else {
              var red = coupon.reduction_pourcent
                ? '-' + coupon.reduction_pourcent + '%'
                : '-' + Number(coupon.reduction_montant).toFixed(2) + ' \u20ac';
              afficherMessage('coupon-message', 'Coupon appliqu\u00e9 ! ' + red + ' sur votre prochaine consultation.', 'succes');
              input.value = '';
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

          await supabase.from('reservations').insert({
            user_id: session.user.id,
            service: serviceName,
            date_rdv: startTime || new Date().toISOString(),
            statut: '\u00e0 venir',
            notes: 'cal:' + uid
          });

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

      await supabase.from('reservations').insert({
        user_id: session.user.id,
        service: decodeURIComponent(serviceName),
        date_rdv: dateRdv,
        statut: '\u00e0 venir',
        notes: 'cal:' + bookingId
      });

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

})();
