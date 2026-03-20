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
        '<p>La Bio-Logique des \u00c9motions est une approche d\u2019accompagnement d\u00e9velopp\u00e9e par <strong>Christophe Duval</strong>, th\u00e9rapeute et formateur bas\u00e9 \u00e0 Aix-les-Bains. Elle s\u2019int\u00e9resse aux liens profonds entre les \u00e9motions v\u00e9cues, l\u2019histoire personnelle et les manifestations physiques. Son principe fondamental\u202f: certains d\u00e9s\u00e9quilibres corporels, douleurs ou troubles fonctionnels peuvent \u00eatre l\u2019expression d\u2019un stress \u00e9motionnel non r\u00e9solu, conscient ou inconscient.</p>' +
        '<h2>Le corps comme m\u00e9moire vivante</h2>' +
        '<p>Nous portons en nous l\u2019empreinte de nos exp\u00e9riences. Lorsqu\u2019une \u00e9motion intense n\u2019a pas pu \u00eatre exprim\u00e9e ou trait\u00e9e au moment o\u00f9 elle a \u00e9t\u00e9 v\u00e9cue, elle ne dispara\u00eet pas pour autant. Elle se loge dans le corps, parfois pendant des ann\u00e9es, avant de se manifester sous forme de tensions, de douleurs chroniques ou de d\u00e9s\u00e9quilibres r\u00e9currents.</p>' +
        '<p>La Bio-Logique des \u00c9motions propose une <strong>lecture compr\u00e9hensive</strong> de ces manifestations. Plut\u00f4t que de se limiter au sympt\u00f4me, elle cherche \u00e0 comprendre le message que le corps essaie de transmettre, en remontant \u00e0 la source \u00e9motionnelle.</p>' +
        '<h2>Le r\u00f4le du cerveau inconscient</h2>' +
        '<p>L\u2019un des piliers de cette approche est le r\u00f4le central du <strong>cerveau inconscient</strong>. Selon Christophe Duval, le v\u00e9ritable acteur de la maladie \u2014 et de la gu\u00e9rison \u2014 est ce cerveau inconscient qui met en place des \u00ab programmes \u00bb biologiques en r\u00e9ponse aux chocs \u00e9motionnels.</p>' +
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
      content: '<h2>Quand la spiritualit\u00e9 devient un produit</h2>' +
        '<p>Il suffit de quelques minutes sur les r\u00e9seaux sociaux pour \u00eatre submerg\u00e9 de contenus dits \u00ab spirituels \u00bb\u00a0: mantras en stories, tirages de tarot en direct, promesses d\u2019\u00e9veil en 7 jours, formules magiques pour attirer l\u2019abondance. La spiritualit\u00e9 est devenue un march\u00e9. Elle se vend, se consomme et se scroll comme n\u2019importe quel autre contenu.</p>' +
        '<p>Ce n\u2019est pas le propos ici de juger quiconque. Mais il est l\u00e9gitime de se demander\u00a0: <strong>o\u00f9 est pass\u00e9e la profondeur\u00a0?</strong> O\u00f9 est pass\u00e9 le silence, l\u2019introspection, la lenteur n\u00e9cessaire \u00e0 toute transformation v\u00e9ritable\u00a0?</p>' +
        '<h2>Le pi\u00e8ge de l\u2019imm\u00e9diatet\u00e9</h2>' +
        '<p>Nous vivons dans une \u00e9poque d\u2019imm\u00e9diatet\u00e9. Tout doit aller vite\u00a0: les r\u00e9ponses, les gu\u00e9risons, les prises de conscience. Mais la vie int\u00e9rieure ne fonctionne pas comme \u00e7a. Elle demande du <strong>temps</strong>, de la patience et surtout de l\u2019honn\u00eatet\u00e9 envers soi-m\u00eame.</p>' +
        '<p>Un vrai cheminement spirituel n\u2019est pas toujours confortable. Il implique de regarder ses ombres, d\u2019accepter ses blessures et de traverser des p\u00e9riodes de doute. Ce n\u2019est pas ce que les algorithmes mettent en avant, parce que \u00e7a ne fait pas de likes.</p>' +
        '<h2>Les nouveaux gourous du web</h2>' +
        '<p>Derri\u00e8re certains comptes \u00e0 milliers d\u2019abonn\u00e9s se cachent parfois des personnes sans formation, sans exp\u00e9rience et sans \u00e9thique. Ils exploitent la vuln\u00e9rabilit\u00e9 de ceux qui cherchent des r\u00e9ponses, en proposant des \u00ab soins \u00e9nerg\u00e9tiques \u00bb miracles ou des \u00ab nettoyages karmiques \u00bb \u00e0 prix d\u2019or.</p>' +
        '<p>Les autorit\u00e9s fran\u00e7aises alertent r\u00e9guli\u00e8rement sur la mont\u00e9e des d\u00e9rives sectaires li\u00e9es au bien-\u00eatre et au d\u00e9veloppement personnel en ligne. Ce ph\u00e9nom\u00e8ne s\u2019est amplifi\u00e9 depuis la crise sanitaire, port\u00e9 par des \u00ab coachs de vie \u00bb et des \u00ab influenceurs spirituels \u00bb dont les comp\u00e9tences sont, au mieux, al\u00e9atoires.</p>' +
        '<h2>Alors, c\u2019est quoi la vraie spiritualit\u00e9\u00a0?</h2>' +
        '<p>La v\u00e9ritable spiritualit\u00e9 est <strong>silencieuse</strong>. Elle ne cherche pas \u00e0 convaincre, \u00e0 briller ni \u00e0 vendre. Elle se vit de l\u2019int\u00e9rieur, dans la simplicit\u00e9 du quotidien.</p>' +
        '<ul>' +
        '<li>C\u2019est <strong>\u00e9couter</strong> avant de parler</li>' +
        '<li>C\u2019est <strong>douter</strong> plut\u00f4t que de tout savoir</li>' +
        '<li>C\u2019est <strong>accueillir</strong> ce qui vient sans chercher \u00e0 tout contr\u00f4ler</li>' +
        '<li>C\u2019est respecter le <strong>libre arbitre</strong> de chacun, toujours</li>' +
        '</ul>' +
        '<p>La spiritualit\u00e9 authentique ne promet rien. Elle accompagne. Elle \u00e9claire. Elle offre un espace de recul pour mieux se comprendre et avancer \u00e0 son propre rythme.</p>' +
        '<h2>Comment reconna\u00eetre un accompagnement sinc\u00e8re\u00a0?</h2>' +
        '<p>Quelques rep\u00e8res simples\u00a0:</p>' +
        '<ul>' +
        '<li>Un praticien honn\u00eate ne vous rendra <strong>jamais d\u00e9pendant</strong> de lui</li>' +
        '<li>Il ne vous fera <strong>jamais peur</strong> pour vous pousser \u00e0 payer</li>' +
        '<li>Il reconna\u00eetra <strong>les limites</strong> de sa pratique et ne se substituera pas \u00e0 un m\u00e9decin ou un psychologue</li>' +
        '<li>Il respectera votre <strong>rythme</strong> et vos choix, m\u00eame s\u2019ils diff\u00e8rent de ses conseils</li>' +
        '</ul>' +
        '<h2>Mon engagement sur Lumi\u00e8re Int\u00e9rieure</h2>' +
        '<p>C\u2019est cette vision de la spiritualit\u00e9 que je d\u00e9fends au quotidien. Mes consultations ne sont pas l\u00e0 pour vous dire quoi faire, mais pour vous aider \u00e0 <strong>voir plus clair</strong>. Les cartes sont un support, pas une v\u00e9rit\u00e9 absolue. Et votre libre arbitre reste sacr\u00e9, toujours.</p>' +
        '<p>Dans un monde o\u00f9 tout va vite, je crois profond\u00e9ment que la vraie lumi\u00e8re vient de l\u2019int\u00e9rieur. Pas d\u2019un \u00e9cran, pas d\u2019un gourou, pas d\u2019une tendance. De vous. De votre capacit\u00e9 \u00e0 vous arr\u00eater, \u00e0 respirer et \u00e0 \u00e9couter ce qui vibre en vous.</p>' +
        '<div class="blog-article__cta"><p>Envie d\u2019un espace d\u2019\u00e9coute sinc\u00e8re et bienveillant\u00a0? N\u2019h\u00e9sitez pas \u00e0 me contacter.</p></div>'
    }
  };

  // --- Blog Overlay Logic ---
  var overlay = document.getElementById('blog-article-overlay');
  var articleBody = document.getElementById('blog-article-body');
  var closeBtn = overlay ? overlay.querySelector('.blog-overlay__close') : null;
  var backdrop = overlay ? overlay.querySelector('.blog-overlay__backdrop') : null;

  function openBlogArticle(articleId) {
    var article = blogArticles[articleId];
    if (!article || !overlay || !articleBody) return;

    articleBody.innerHTML =
      '<p class="blog-article__category">' + article.category + '</p>' +
      '<h1 class="blog-article__title">' + article.title + '</h1>' +
      '<p class="blog-article__meta">' + article.date + '</p>' +
      article.content;

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
    card.addEventListener('click', function () {
      var articleId = this.getAttribute('data-article');
      openBlogArticle(articleId);
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

})();
