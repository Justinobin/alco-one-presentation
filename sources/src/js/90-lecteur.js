/* Lecteur : une scène à la fois, au clavier, au bouton, au balayage ou par la progression du haut.
   Chaque scène a son adresse (#12) : un lien ou un rechargement reste sur la même scène. */
const scenes = $$('.scene');
const chapitres = [];
scenes.forEach((s, i) => {
  const nom = s.dataset.chapitre;
  let ch = chapitres.find((c) => c.nom === nom);
  if (!ch) { ch = { nom, scenes: [] }; chapitres.push(ch); }
  ch.scenes.push(i);
});

const ouverture = $('#ouverture');
const btnPrec = $('#btnPrec');
const btnSuiv = $('#btnSuiv');
let courante = 0;
let segments = [];

/* Un segment par chapitre, aussi large que le chapitre a d'écrans : il se remplit à mesure que
   ses scènes passent, et un clic ouvre le chapitre. */
function construireChapitres() {
  const hote = $('#chapitres');
  segments = chapitres.map((ch) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg-ch';
    b.title = ch.nom;
    b.style.setProperty('--poids', ch.scenes.length);
    b.setAttribute('aria-label', `Chapitre ${ch.nom}`);
    b.innerHTML = '<i></i>';
    b.addEventListener('click', () => activer(ch.scenes[0]));
    hote.append(b);
    return b;
  });
}

function majCommandes() {
  $('#compteur').innerHTML = `<b>${String(courante + 1).padStart(2, '0')}</b> / ${scenes.length}`;
  btnPrec.disabled = courante === 0;
  btnSuiv.disabled = courante === scenes.length - 1;
  chapitres.forEach((ch, k) => {
    const faites = ch.scenes.filter((i) => i <= courante).length;
    segments[k].style.setProperty('--rempli', `${faites / ch.scenes.length * 100}%`);
  });
  const nom = chapitres.find((c) => c.scenes.includes(courante)).nom;
  $('#hudChapitre').textContent = nom === 'Fin' ? '' : nom;
}

const ECHELLE_MINI = 0.82;

/* Une scène trop haute se réduit légèrement ; au-delà, elle défile à l'intérieur d'elle-même
   plutôt que d'afficher un texte illisible. La mesure se fait sans réduction, chaque fois. */
function ajuster(scene) {
  const page = $('.page', scene);
  scene.classList.remove('ajustee', 'defilante');
  scene.style.removeProperty('--echelle');
  const style = getComputedStyle(scene);
  const disponible = scene.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  // La hauteur de mise en page, et non la hauteur défilable : l'apparition décale les blocs.
  const hauteur = page.offsetHeight;
  if (hauteur <= disponible + 1) return;
  const echelle = disponible / hauteur;
  if (echelle >= ECHELLE_MINI && innerWidth > 860) {
    scene.style.setProperty('--echelle', echelle.toFixed(3));
    scene.classList.add('ajustee');
  } else {
    scene.classList.add('defilante');
  }
}
const ajusterCourante = () => ajuster(scenes[courante]);

function entrer(scene) {
  const demo = DEMOS[scene.dataset.demo];
  if (demo && demo.entrer) demo.entrer();
}

function activer(i) {
  const avant = scenes[courante];
  const focusPerdu = avant !== scenes[i] && avant.contains(document.activeElement);
  scenes.forEach((s, j) => {
    s.classList.toggle('active', j === i);
    if (j !== i) s.classList.remove('revelee');
  });
  courante = i;
  const scene = scenes[i];
  $$('[data-e]', scene).forEach((e, k) => e.style.setProperty('--i', k));
  scene.classList.remove('revelee');
  void scene.offsetWidth; // relance les apparitions au retour sur une scène
  scene.classList.add('revelee');
  scene.scrollTop = 0;
  majCommandes();
  entrer(scene);
  ajuster(scene);
  requestAnimationFrame(() => ajuster(scene));
  setTimeout(() => { if (scenes[courante] === scene) ajuster(scene); }, 350);
  if (focusPerdu) btnSuiv.focus({ preventScroll: true });
  const titre = $('.titre, h1, h2', scene);
  $('#annonce').textContent = `Écran ${i + 1} sur ${scenes.length}. ${titre ? titre.textContent.trim().replace(/\s+/g, ' ') : ''}`;
  try { history.replaceState(null, '', `#${i + 1}`); } catch (e) { /* adresse de fichier refusée */ }
}

const pas = (d) => {
  const n = courante + d;
  if (n >= 0 && n < scenes.length) activer(n);
};

function allerAuChapitre(nom) {
  const ch = chapitres.find((c) => c.nom === nom);
  if (ch) activer(ch.scenes[0]);
}
function allerALaScene(nom) {
  const i = scenes.findIndex((s) => s.dataset.nom === nom);
  if (i >= 0) activer(i);
}

/* L'ouverture lit la vidéo du logo une fois, muette, et la laisse sur sa dernière image avant de
   montrer la phrase et le bouton. Une vidéo illisible ou une lecture refusée laissent la
   composition fixe dessous ; avec le mouvement réduit, la vidéo se pose sur sa dernière image. */
function lancerOuverture() {
  const video = $('#ouvVideo');
  const finir = () => ouverture.classList.add('finie');
  const derniereImage = () => {
    const poser = () => { video.currentTime = Math.max(0, video.duration - 0.05); finir(); };
    if (video.readyState >= 1) poser(); else video.addEventListener('loadedmetadata', poser, { once: true });
  };
  const illisible = () => { ouverture.classList.remove('video'); video.remove(); finir(); };
  // La vidéo charge dès la lecture de la page : son image ou son erreur peuvent précéder ce script.
  if (video.error) { illisible(); return; }
  if (video.readyState >= 2) ouverture.classList.add('video');
  else video.addEventListener('loadeddata', () => ouverture.classList.add('video'), { once: true });
  video.addEventListener('ended', finir);
  video.addEventListener('error', illisible);
  if (mouvementReduit()) { derniereImage(); return; }
  const lecture = video.play();
  if (lecture && lecture.catch) lecture.catch(derniereImage);
}

const ouvertureVisible = () => ouverture.style.display !== 'none' && !ouverture.classList.contains('partie');
function commencer() {
  if (!ouvertureVisible()) return;
  const video = $('#ouvVideo');
  if (video) video.pause();
  ouverture.classList.add('partie');
  activer(courante);
  btnSuiv.focus({ preventScroll: true });
}

function basculerPleinEcran() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
}

function brancher() {
  btnPrec.addEventListener('click', () => pas(-1));
  btnSuiv.addEventListener('click', () => pas(1));
  $('#ouvCommencer').addEventListener('click', commencer);
  $('#ouvPasser').addEventListener('click', commencer);
  $$('[data-aller]').forEach((b) => b.addEventListener('click', () => allerAuChapitre(b.dataset.aller)));
  $$('[data-scene]').forEach((b) => b.addEventListener('click', () => allerALaScene(b.dataset.scene)));

  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (ouvertureVisible()) {
      if (['ArrowRight', 'Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); commencer(); }
      return;
    }
    const cible = e.target instanceof Element ? e.target : document.body;
    if (cible.closest('input, select, textarea')) return;
    if (e.key === 'f' || e.key === 'F') { basculerPleinEcran(); return; }
    const avancer = e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !cible.closest('button, a'));
    if (avancer) { e.preventDefault(); pas(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); pas(-1); }
    else if (e.key === 'Home') { e.preventDefault(); activer(0); }
    else if (e.key === 'End') { e.preventDefault(); activer(scenes.length - 1); }
  });

  let toucher = null;
  addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    toucher = e.touches.length === 1 && !e.target.closest('input, textarea, select') ? { x: t.clientX, y: t.clientY } : null;
  }, { passive: true });
  addEventListener('touchend', (e) => {
    if (!toucher || ouvertureVisible()) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - toucher.x;
    const dy = t.clientY - toucher.y;
    toucher = null;
    if (Math.abs(dx) > 56 && Math.abs(dx) > 1.6 * Math.abs(dy)) pas(dx < 0 ? 1 : -1);
  }, { passive: true });

  let attente;
  const redessiner = () => Object.values(DEMOS).forEach((d) => { if (d.dessiner) d.dessiner(); });
  addEventListener('resize', () => {
    clearTimeout(attente);
    attente = setTimeout(() => { redessiner(); ajusterCourante(); }, 150);
  });
  addEventListener('beforeprint', redessiner);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajusterCourante);

  const deLAdresse = () => {
    const n = parseInt(location.hash.slice(1), 10);
    return n >= 1 && n <= scenes.length ? n - 1 : null;
  };
  addEventListener('hashchange', () => {
    const i = deLAdresse();
    if (i !== null && i !== courante) activer(i);
  });
  return deLAdresse();
}

function demarrer() {
  construireChapitres();
  Object.values(DEMOS).forEach((d) => { if (d.init) d.init(); });
  const depart = brancher();
  if (depart !== null) {
    ouverture.style.display = 'none';
    $('#ouvVideo').remove();
  } else lancerOuverture();
  activer(depart === null ? 0 : depart);
}

demarrer();
