// ========================================
// LUMIÈRE INTÉRIEURE — App Logic
// ========================================

(function () {
  'use strict';

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
}
  };

  // --- Blog Overlay Logic ---
  var overlay = document.getElementById('blog-article-overlay');
  var articleBody = document.getElementById('blog-article-body');
  var closeBtn = overlay ? overlay.querySelector('.blog-overlay__close') : null;
  var backdrop = overlay ? overlay.querySelector('.blog-overlay__backdrop') : null;

  // --- Likes, Views & Comments helpers (localStorage) ---
  function getLikes(articleId) {
    try { return JSON.parse(localStorage.getItem('blog_likes_' + articleId)) || { count: 0, liked: false }; }
    catch(e) { return { count: 0, liked: false }; }
  }
  function saveLikes(articleId, data) {
    try { localStorage.setItem('blog_likes_' + articleId, JSON.stringify(data)); } catch(e) {}
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
    try { return JSON.parse(localStorage.getItem('blog_comments_' + articleId)) || []; }
    catch(e) { return []; }
  }
  function saveComments(articleId, comments) {
    try { localStorage.setItem('blog_comments_' + articleId, JSON.stringify(comments)); } catch(e) {}
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

  // --- Newsletter Forms ---
  function getSubscribers() {
    try { return JSON.parse(localStorage.getItem('newsletter_subscribers')) || []; }
    catch(e) { return []; }
  }
  function saveSubscriber(data) {
    var subs = getSubscribers();
    // Avoid duplicates by email
    var exists = subs.some(function(s) { return s.email === data.email; });
    if (!exists) {
      subs.push(data);
      try { localStorage.setItem('newsletter_subscribers', JSON.stringify(subs)); } catch(e) {}
    }
    return !exists;
  }

  document.querySelectorAll('[data-newsletter]').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var prenomInput = form.querySelector('input[name="prenom"]');
      var emailInput = form.querySelector('input[name="email"]');
      var prenom = prenomInput.value.trim();
      var email = emailInput.value.trim();

      if (!prenom || !email) return;

      // Save locally
      var isNew = saveSubscriber({
        prenom: prenom,
        email: email,
        date: new Date().toISOString()
      });

      var successEl = form.parentElement.querySelector('.newsletter-success');

      if (!isNew) {
        // Already subscribed
        if (successEl) {
          successEl.querySelector('p').textContent = 'Vous \u00eates d\u00e9j\u00e0 inscrit(e) avec cet email.';
          form.hidden = true;
          successEl.hidden = false;
        }
        return;
      }

      // Send notification email via Web3Forms (no mailto, no redirect)
      var submitBtn = form.querySelector('button[type="submit"]');
      var btnOriginalHTML = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours\u2026';
      }

      function resetBtn() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = btnOriginalHTML;
        }
      }

      function showSuccess() {
        if (successEl) {
          form.hidden = true;
          successEl.hidden = false;
        } else {
          form.innerHTML = '<p style="color:var(--color-primary);font-weight:500;text-align:center;">Merci ' + prenom + ', inscription enregistr\u00e9e !</p>';
        }
      }

      // Safety timeout: unblock button after 10s no matter what
      var safetyTimer = setTimeout(function() {
        showSuccess();
      }, 10000);

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: '3e79fe0a-60ca-4686-82ff-19204a3ca85b',
          subject: 'Nouvelle inscription newsletter \u2014 Lumi\u00e8re Int\u00e9rieure',
          from_name: 'Lumi\u00e8re Int\u00e9rieure - Newsletter',
          prenom: prenom,
          email: email,
          date: new Date().toLocaleDateString('fr-FR'),
          message: 'Nouvelle inscription \u00e0 la newsletter.\nPr\u00e9nom : ' + prenom + '\nEmail : ' + email
        })
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        clearTimeout(safetyTimer);
        if (data.success) {
          showSuccess();
        } else {
          resetBtn();
          alert('Une erreur est survenue. Veuillez r\u00e9essayer.');
        }
      })
      .catch(function() {
        clearTimeout(safetyTimer);
        showSuccess();
      });
    });
  });

})();
