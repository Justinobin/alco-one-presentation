/* Outils communs aux démonstrations et au lecteur. */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const mouvementReduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const nombre = (n, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const signe = (n, d = 0) => (n > 0 ? '+' : n < 0 ? '−' : '') + nombre(Math.abs(n), d);

/* Démonstrations déclarées par nom : `init` au chargement, `entrer` à l'arrivée sur la scène,
   `dessiner` après un changement de taille. */
const DEMOS = {};

/* Un groupe de boutons exclusifs : `aria-pressed` suit le choix, le rappel reçoit l'indice. */
function groupe(hote, rappel) {
  const boutons = $$('button', hote);
  const choisir = (i, silencieux) => {
    boutons.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    if (!silencieux) rappel(i, boutons[i]);
  };
  boutons.forEach((b, i) => b.addEventListener('click', () => choisir(i)));
  return choisir;
}

function curseur(input, rappel) {
  const maj = () => {
    input.style.setProperty('--avance', `${(input.value - input.min) / (input.max - input.min) * 100}%`);
    rappel(Number(input.value));
  };
  input.addEventListener('input', maj);
  return maj;
}

function tailleDe(svg, largeur = 640, hauteur = 280) {
  const W = svg.clientWidth || largeur;
  const H = svg.clientHeight || hauteur;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  return { W, H };
}
