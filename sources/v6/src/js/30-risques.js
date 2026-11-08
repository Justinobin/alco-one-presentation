/* Stress test : plusieurs familles de chocs sur la position de liquidité et la solvabilité.
   Hypothèses d'illustration. */
const LIQ = { coussin: 150, depots: 590, duree: 18, sorties: 0.25, vue: 120, plafond: 365 };
const positionLiquidite = (t, fuite, coussin = LIQ.coussin) => coussin - fuite / 100 * LIQ.depots * (1 - Math.exp(-t / LIQ.duree)) - LIQ.sorties * t;

/* Le premier jour où la position passe sous zéro, par dichotomie ; au-delà d'un an, l'horizon tient. */
function horizonDeSurvie(fuite, coussin = LIQ.coussin) {
  if (positionLiquidite(LIQ.plafond, fuite, coussin) > 0) return Infinity;
  let bas = 0;
  let haut = LIQ.plafond;
  for (let k = 0; k < 50; k++) {
    const milieu = (bas + haut) / 2;
    if (positionLiquidite(milieu, fuite, coussin) > 0) bas = milieu; else haut = milieu;
  }
  return haut;
}
const libelleHorizon = (h) => (Number.isFinite(h) ? `${nombre(Math.round(h))}<small>jours</small>` : 'Plus d’un an');

const FAMILLES_STRESS = [
  { nom: 'Liquidité', actif: true },
  { nom: 'Taux d’intérêt' },
  { nom: 'Spread de crédit', coussin: -7.5 },
  { nom: 'Notation', coussin: -10, solva: -0.2 },
  { nom: 'Macroéconomie', solva: -0.7 },
  { nom: 'ESG et climat', solva: -0.35 },
  { nom: 'Change', solva: -0.25 },
];
const SOLVABILITE_BASE = 13.0;

DEMOS.stress = {
  init() {
    $('#familles').innerHTML = FAMILLES_STRESS.map((f, i) => `<label class="interrupteur long"><span>${f.nom}</span><input type="checkbox" data-i="${i}"${f.actif ? ' checked' : ''}></label>`).join('');
    $$('#familles input').forEach((c) => c.addEventListener('change', () => this.dessiner()));
    curseur($('#fuite'), () => this.dessiner())();
  },
  entrer() { this.dessiner(); },
  etat() {
    const choisies = $$('#familles input').filter((c) => c.checked).map((c) => FAMILLES_STRESS[Number(c.dataset.i)]);
    const liquiditeActive = choisies.some((f) => f.actif);
    return {
      fuite: liquiditeActive ? Number($('#fuite').value) : 0,
      coussin: LIQ.coussin + choisies.reduce((s, f) => s + (f.coussin || 0), 0),
      solva: SOLVABILITE_BASE + choisies.reduce((s, f) => s + (f.solva || 0), 0),
      liquiditeActive,
    };
  },
  dessiner() {
    const e = this.etat();
    $('#fuiteVal').textContent = e.liquiditeActive ? `${e.fuite} %` : 'hors scénario';
    const h = horizonDeSurvie(e.fuite, e.coussin);
    const svg = $('#grapheSurvie');
    const { W, H } = tailleDe(svg);
    const m = { g: 38, d: 8, h: 10, b: 22 };
    const [bas, haut] = [-125, 165];
    const X = (t) => m.g + t / LIQ.vue * (W - m.g - m.d);
    const Y = (v) => H - m.b - (v - bas) / (haut - bas) * (H - m.h - m.b);
    const temps = Array.from({ length: 121 }, (_, i) => i / 120 * LIQ.vue);
    let s = '';
    [-100, -50, 50, 100, 150].forEach((v) => { s += `<line class="tr" x1="${m.g}" x2="${W - m.d}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.g - 6}" y="${Y(v) + 4}" text-anchor="end">${signe(v)}</text>`; });
    s += `<line class="zero" x1="${m.g}" x2="${W - m.d}" y1="${Y(0)}" y2="${Y(0)}"/><text x="${m.g - 6}" y="${Y(0) + 4}" text-anchor="end">0</text>`;
    [0, 30, 60, 90, 120].forEach((t) => { s += `<text x="${X(t)}" y="${H - 5}" text-anchor="${t === 120 ? 'end' : t === 0 ? 'start' : 'middle'}">${t === 0 ? 'Arrêté' : `${t} j`}</text>`; });
    if (h <= LIQ.vue) {
      const sous = temps.filter((t) => t > h).map((t) => `${X(t).toFixed(1)},${Y(positionLiquidite(t, e.fuite, e.coussin)).toFixed(1)}`);
      s += `<polygon class="sous" points="${X(h).toFixed(1)},${Y(0)} ${sous.join(' ')} ${X(LIQ.vue).toFixed(1)},${Y(0)}"/><circle class="point neg" cx="${X(h).toFixed(1)}" cy="${Y(0)}" r="5"/>`;
    }
    s += `<polyline class="tracee" points="${temps.map((t) => `${X(t).toFixed(1)},${Y(positionLiquidite(t, e.fuite, e.coussin)).toFixed(1)}`).join(' ')}"/>`;
    svg.innerHTML = s;
    const v = $('#stressHorizon');
    v.innerHTML = libelleHorizon(h);
    v.style.color = h >= 90 ? 'var(--ok)' : 'var(--bad)';
    $('#stressSolva').textContent = `Solvabilité stressée : ${nombre(e.solva, 1)} %`;
  },
};

/* Remédiation : sous une fuite de 30 % des dépôts, les actions qui couvrent le besoin, la moins
   chère d'abord, jusqu'à l'objectif d'horizon de survie. */
const texteHorizon = (h) => (Number.isFinite(h) ? `${nombre(Math.round(h))} jours` : 'plus d’un an');
const FUITE_REMEDIATION = 30;
const ACTIONS_REMEDIATION = [
  { nom: 'Refinancement auprès de la banque centrale', capacite: 60, cout: 300 },
  { nom: 'Mise en pension de titres', capacite: 45, cout: 380 },
  { nom: 'Ligne interbancaire confirmée', capacite: 30, cout: 520 },
  { nom: 'Cession de titres', capacite: 40, cout: 610 },
  { nom: 'Ralentissement de la production nouvelle', capacite: 25, cout: 750 },
];

DEMOS.remediation = {
  init() {
    $('#actions').innerHTML = ACTIONS_REMEDIATION.map((a, i) => `<label class="action"><input type="checkbox" data-i="${i}" checked><span>${a.nom}</span><small>${a.capacite} Md, ${a.cout} pb</small><b class="mobilise"></b></label>`).join('');
    $$('#actions input').forEach((c) => c.addEventListener('change', () => this.resoudre()));
    curseur($('#objectif'), () => this.resoudre())();
  },
  resoudre() {
    const objectif = Number($('#objectif').value);
    $('#objectifVal').textContent = `${objectif} jours`;
    const besoin = Math.max(0, FUITE_REMEDIATION / 100 * LIQ.depots * (1 - Math.exp(-objectif / LIQ.duree)) + LIQ.sorties * objectif - LIQ.coussin);
    const lignes = $$('#actions .action');
    const ordre = lignes.map((l, i) => i).filter((i) => $('input', lignes[i]).checked).sort((a, b) => ACTIONS_REMEDIATION[a].cout - ACTIONS_REMEDIATION[b].cout);
    let reste = besoin;
    let mobilise = 0;
    let cout = 0;
    lignes.forEach((l) => { $('.mobilise', l).textContent = ''; l.classList.remove('retenue'); });
    for (const i of ordre) {
      if (reste <= 0) break;
      const a = ACTIONS_REMEDIATION[i];
      const montant = Math.min(a.capacite, reste);
      mobilise += montant;
      cout += montant * a.cout / 10000 * 1000;
      reste -= montant;
      $('.mobilise', lignes[i]).textContent = `${nombre(montant, 1)} Md`;
      lignes[i].classList.add('retenue');
    }
    const h = horizonDeSurvie(FUITE_REMEDIATION, LIQ.coussin + mobilise);
    const atteint = reste <= 1e-9;
    const v = $('#planHorizon');
    v.innerHTML = libelleHorizon(h);
    v.style.color = atteint ? 'var(--ok)' : 'var(--bad)';
    $('#planSans').textContent = `sans plan : ${texteHorizon(horizonDeSurvie(FUITE_REMEDIATION))}`;
    $('#planKpi').innerHTML = [['Besoin à couvrir', `${nombre(besoin, 1)} Md`], ['Mobilisé', `${nombre(mobilise, 1)} Md`], ['Coût par an', `${nombre(cout)} M`], ['Objectif', atteint ? 'atteint' : 'hors d’atteinte']]
      .map(([l, x]) => `<div><dt>${l}</dt><dd>${x}</dd></div>`).join('');
  },
};

/* Solvabilité : un nouveau prêt ajoute ses actifs pondérés, et les ratios se lisent face aux seuils
   du dispositif de l'UMOA (minimum et coussin de conservation). Bilan d'illustration. */
const FONDS_PROPRES = { cet1: 92, t1: 96, total: 104, rwa: 800 };
const SEUILS_SOLVA = [['CET1', 'cet1', 7.5], ['Tier 1', 't1', 8.5], ['Solvabilité', 'total', 11.5]];

DEMOS.solvabilite = {
  ponderation: 1,
  init() {
    groupe($('#pretPonderation'), (i) => { this.ponderation = [0.2, 0.5, 1, 1.5][i]; this.calculer(); });
    curseur($('#pretMontant'), () => this.calculer())();
  },
  calculer() {
    const montant = Number($('#pretMontant').value);
    $('#pretMontantVal').textContent = `${montant} Md FCFA`;
    const rwa = FONDS_PROPRES.rwa + montant * this.ponderation;
    $('#pretRatios').innerHTML = SEUILS_SOLVA.map(([nom, cle, seuil]) => {
      const ratio = FONDS_PROPRES[cle] / rwa * 100;
      const ok = ratio >= seuil;
      return `<div class="seuil-l"><span>${nom}</span><span class="rail-s"><i style="--l:${Math.min(ratio / 20, 1) * 100}%;--c:${ok ? 'var(--ok)' : 'var(--bad)'}"></i><b style="--s:${seuil / 20 * 100}%"></b></span><strong>${nombre(ratio, 1)} %</strong><small>seuil ${nombre(seuil, 1)} %</small></div>`;
    }).join('');
    const part = montant / FONDS_PROPRES.t1 * 100;
    const [couleur, texte] = part > 25 ? ['var(--bad)', 'au-delà de la division des risques, 25 %'] : part >= 10 ? ['var(--warn)', 'grand risque, au-delà de 10 %'] : ['var(--ok)', 'sous le seuil de grand risque, 10 %'];
    const v = $('#pretPart');
    v.textContent = `${nombre(part)} %`;
    v.style.color = couleur;
    $('#pretRisque').textContent = texte;
    $('#pretRwa').textContent = `Actifs pondérés : ${nombre(rwa)} Md, dont ${nombre(montant * this.ponderation)} pour ce prêt.`;
  },
};

/* Risque de change : la position nette par devise, et l'effet d'une variation du dollar sur le
   résultat. Positions d'illustration. */
const POSITIONS = [
  { devise: 'Euro', position: 18 },
  { devise: 'Dollar américain', position: 12 },
  { devise: 'Yuan', position: -3 },
  { devise: 'Autres devises', position: 2 },
];
const DOLLAR = 1;

DEMOS.change = {
  init() { curseur($('#chocDollar'), () => this.calculer())(); },
  calculer() {
    const choc = Number($('#chocDollar').value);
    $('#chocDollarVal').textContent = `${signe(choc)} %`;
    const plus = Math.max(...POSITIONS.map((p) => Math.abs(p.position)));
    $('#positions').innerHTML = POSITIONS.map((p, i) => `<div class="barre-h${i === DOLLAR ? ' choque' : ''}"><span>${p.devise}</span><span class="piste-h"><i class="${p.position < 0 ? 'n' : ''}" style="--l:${Math.abs(p.position) / plus * 100}%"></i></span><b>${signe(p.position)}<small>Md</small></b></div>`).join('');
    const effet = POSITIONS[DOLLAR].position * choc / 100;
    const v = $('#changeEffet');
    v.innerHTML = `${signe(effet, 1)}<small>Md FCFA</small>`;
    v.style.color = effet < 0 ? 'var(--bad)' : 'var(--ok)';
  },
};
