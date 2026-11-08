/* Pilotage du bilan : les vues de l'analyse du bilan, l'écoulement, la cascade des variations, les
   ratios de liquidité de la zone, les six chocs, le TCI et la projection. Chiffres d'illustration,
   cohérents entre eux. */
const LECTURES_BILAN = [
  { nom: 'Synthèse', texte: 'L’état de l’arrêté en un écran.', tuiles: [['Total du bilan', '690', 'Md'], ['Équilibre', 'Écart nul', '', 'ok'], ['Contrôles', '1 en échec', '', 'bad']] },
  { nom: 'Structure', texte: 'Emplois et ressources par grande masse.', tuiles: [['Crédits à la clientèle', '61 %', 'de l’actif'], ['Dépôts de la clientèle', '86 %', 'du passif'], ['Fonds propres', '14,5 %', 'du passif']] },
  { nom: 'Indicateurs', texte: 'Chaque valeur dit son statut : conforme, alerte ou limite dépassée.', tuiles: [['ROE', '11,8 %', '', 'ok'], ['Crédits sur dépôts', '71 %', '', 'ok'], ['Créances en souffrance', '6,2 %', '', 'bad']] },
  { nom: 'Réserves', texte: 'Les réserves obligatoires et leur couverture.', tuiles: [['Exigence', '17', 'Md'], ['Couverture', '112 %', '', 'ok'], ['Seuil d’alerte', '105 %']] },
  { nom: 'Évolution', texte: 'D’un arrêté au suivant, poste par poste.', tuiles: [['Total du bilan', '+4,1 %'], ['Crédits', '+6,3 %'], ['Dépôts', '+2,8 %']] },
  { nom: 'Concentration', texte: 'Les plus grandes contreparties, par segment de clientèle.', tuiles: [['Dix premiers déposants', '18 %'], ['Vingt premiers emprunteurs', '27 %'], ['Indice HHI', '0,04']] },
  { nom: 'Maturités', texte: 'Les maturités contractuelles des crédits et des dépôts à terme.', tuiles: [['Durée moyenne des crédits', '3,4', 'ans'], ['Durée moyenne des DAT', '11', 'mois'], ['Échéances dépassées', '0,8 %']] },
  { nom: 'Ratios stressés', texte: 'Les ratios recalculés sur le bilan stressé.', tuiles: [['Liquidité stressée', '78 %', '', 'warn'], ['Solvabilité stressée', '12,1 %', '', 'ok'], ['Scénario', 'Sévère']] },
  { nom: 'Contrôles', texte: 'Les 26 contrôles de cohérence, gouvernés dans le catalogue des règles.', tuiles: [['En échec', '1', '', 'bad'], ['À examiner', '2', '', 'warn'], ['Conformes', '23', '', 'ok']] },
  { nom: 'Bilan projeté', texte: 'Le bilan à une date future, sur un calcul de projection.', tuiles: [['Horizon', '31/12/2027'], ['Total projeté', '747', 'Md'], ['Croissance', '+8,3 %']] },
];

const grandChiffre = ([l, v, u = '', classe = ''], k) => `<div class="kpi-g ${classe}" style="animation:monter .6s ${(k * 0.06).toFixed(2)}s var(--ease) both"><span class="cle-l">${l}</span><span class="kpi-v">${v}${u ? `<small>${u}</small>` : ''}</span></div>`;

DEMOS.bilan = {
  init() {
    const onglets = $('#bilanOnglets');
    onglets.innerHTML = LECTURES_BILAN.map((o) => `<button type="button" aria-pressed="false">${o.nom}</button>`).join('');
    const afficher = (i) => {
      const o = LECTURES_BILAN[i];
      $('#bilanVue').innerHTML = `<p class="choix-d fondu">${o.texte}</p><div class="kpis">${o.tuiles.map(grandChiffre).join('')}</div>`;
    };
    groupe(onglets, afficher)(0, true);
    afficher(0);
  },
};

const GAPS = { libelles: ['≤ 1 mois', '1 à 3 mois', '3 à 12 mois', '1 à 5 ans', '> 5 ans'], gap: [15, -15, 5, 60, -65], cumul: [15, 0, 5, 65, 0] };

/* Des barres positionnées en HTML : leur hauteur et leur position glissent d'une mesure à l'autre. */
DEMOS.ecoulement = {
  mesure: 'gap',
  init() {
    $('#ecoBarres').innerHTML = GAPS.libelles.map((l) => `<div class="colonne"><i></i><b></b><span>${l}</span></div>`).join('') + '<span class="zero"></span>';
    groupe($('#ecoMesure'), (i) => { this.mesure = i ? 'cumul' : 'gap'; this.dessiner(); });
  },
  entrer() { this.dessiner(); },
  dessiner() {
    const hote = $('#ecoBarres');
    const H = hote.clientHeight || 360;
    const haut = 34;
    const bas = 34;
    const zero = haut + (H - haut - bas) * 80 / 160;
    const echelle = (H - haut - bas) / 160;
    hote.style.setProperty('--zero', `${zero}px`);
    $$('.colonne', hote).forEach((c, i) => {
      const v = GAPS[this.mesure][i];
      const h = Math.max(Math.abs(v) * echelle, v === 0 ? 2 : 0);
      const top = v >= 0 ? zero - h : zero;
      const barre = $('i', c);
      barre.style.top = `${top}px`;
      barre.style.height = `${h}px`;
      barre.className = v > 0 ? 'p' : v < 0 ? 'n' : 'z';
      const val = $('b', c);
      val.textContent = signe(v);
      val.className = v < 0 ? 'n' : '';
      val.style.top = `${v >= 0 ? top - 26 : top + h + 8}px`;
    });
  },
};

/* La cascade d'un arrêté à l'autre : chaque marche porte sa famille (ce qui nous est arrivé, ce qui
   relève de nos décisions, ce qui vient du calcul), et leur somme redonne l'écart exact. */
const FAMILLES_CASCADE = {
  subi: { nom: 'Ce qui nous est arrivé', couleur: 'var(--s-subi)' },
  decide: { nom: 'Ce qui relève de nos décisions', couleur: 'var(--s-decide)' },
  calcul: { nom: 'Ce qui vient du calcul', couleur: 'var(--faint)' },
};
const CASCADE = {
  depart: 43, arrivee: 60, maximum: 70,
  composantes: [
    { nom: 'Vieillissement', valeur: -9, famille: 'subi', question: 'Qu’est-ce que le temps seul a fait ?', dit: 'Le stock existant s’est amorti d’une période.' },
    { nom: 'Volume', valeur: 25, famille: 'decide', question: 'De combien les encours ont-ils bougé ?', dit: 'Production nouvelle, remboursements et retraits confondus.' },
    { nom: 'Structure', valeur: 2, famille: 'decide', question: 'A-t-on prêté plus long ou plus court ?', dit: 'À volume égal, ce que les maturités ont changé.' },
    { nom: 'Résidus', valeur: -1, famille: 'calcul', question: 'Le chiffre a-t-il bougé à cause du calcul ?', dit: 'Conventions modifiées et revalorisation des devises.' },
  ],
  effets: [
    { nom: 'Référentiel', valeur: -2, famille: 'calcul', question: 'Qu’est-ce qui vient de nos conventions ?', dit: 'Le bilan de départ, rejoué avec les conventions d’arrivée.' },
    { nom: 'Vieillissement', valeur: -9, famille: 'subi', question: 'Qu’est-ce que le temps seul a fait ?', dit: 'Le stock existant s’est amorti d’une période.' },
    { nom: 'Change', valeur: 1, famille: 'subi', question: 'Qu’est-ce qui vient du cours, sans aucun flux ?', dit: 'Les positions en devises, revalorisées au cours d’arrivée.' },
    { nom: 'Comportement', valeur: 6, famille: 'subi', question: 'Nos lois d’écoulement disent-elles vrai ?', dit: 'L’écart entre le stock réel et celui que les lois annonçaient.' },
    { nom: 'Volume', valeur: 19, famille: 'decide', question: 'Avons-nous fait plus d’affaires ?', dit: 'Les encours nouveaux, au profil du stock existant.' },
    { nom: 'Structure', valeur: 2, famille: 'decide', question: 'Les avons-nous faites plus longues ou plus courtes ?', dit: 'La déformation du profil de maturités.' },
  ],
};

DEMOS.cascade = {
  lecture: 'composantes',
  choix: { composantes: 1, effets: 4 },
  init() { groupe($('#segLecture'), (i) => { this.lecture = i ? 'effets' : 'composantes'; this.rendre(); }); this.rendre(); },
  rendre() {
    const pct = (v) => `${(v / CASCADE.maximum * 100).toFixed(2)}%`;
    const liste = CASCADE[this.lecture];
    const borne = (nom, v) => `<div class="marche borne"><span class="nom">${nom}</span><span class="piste"><span class="barre" style="--d:0%;--l:${pct(v)}"></span></span><span class="val">${nombre(v)}</span></div>`;
    let cumul = CASCADE.depart;
    let html = borne('Gap au premier arrêté', CASCADE.depart);
    liste.forEach((m, i) => {
      const debut = cumul;
      cumul += m.valeur;
      html += `<button type="button" class="marche" data-i="${i}" style="--c:${FAMILLES_CASCADE[m.famille].couleur}"><span class="nom">${m.nom}</span><span class="piste"><span class="barre" style="--d:${pct(Math.min(debut, cumul))};--l:${pct(Math.abs(m.valeur))}"></span></span><span class="val">${signe(m.valeur)}</span></button>`;
    });
    html += borne('Gap au second arrêté', CASCADE.arrivee);
    $('#marches').innerHTML = html;
    $$('#marches button.marche').forEach((b) => b.addEventListener('click', () => this.choisir(Number(b.dataset.i))));
    // La somme par famille, puis l'écart et ce qui reste inexpliqué : la somme des marches.
    const somme = (f) => liste.filter((m) => m.famille === f).reduce((s, m) => s + m.valeur, 0);
    const reste = CASCADE.arrivee - CASCADE.depart - liste.reduce((s, m) => s + m.valeur, 0);
    $('#bilanCascade').innerHTML = Object.entries(FAMILLES_CASCADE).map(([f, x]) => `<span class="pastille" style="--c:${x.couleur}"><i></i>${x.nom} <b>${signe(somme(f))}</b></span>`).join('')
      + `<span class="pastille resultat"><svg class="ic"><use href="#i-check"/></svg>Écart ${signe(CASCADE.arrivee - CASCADE.depart)}, inexpliqué <b>${nombre(reste)}</b></span>`;
    this.choisir(this.choix[this.lecture]);
  },
  choisir(i) {
    this.choix[this.lecture] = i;
    const m = CASCADE[this.lecture][i];
    $$('#marches button.marche').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    $('#effet').innerHTML = `<span class="choix-f" style="--c:${FAMILLES_CASCADE[m.famille].couleur}">${m.nom} ${signe(m.valeur)}</span><span class="choix-t fondu">« ${m.question} »</span><span class="choix-d fondu">${m.dit}</span>`;
  },
};

const RATIOS = {
  UMOA: [
    { nom: 'Coefficient de liquidité', valeur: 92, norme: 75, etat: 'DEC 2063', num: ['actifs disponibles et réalisables à un mois', 322], den: ['passifs exigibles à un mois', 350] },
    { nom: 'Couverture des emplois à moyen et long terme', valeur: 57, norme: 50, etat: 'DEC 2062', num: ['ressources stables', 194], den: ['emplois à moyen et long terme', 340] },
    { nom: 'LCR', valeur: 131, norme: 100, etat: null, num: ['actifs liquides de haute qualité', 220], den: ['sorties nettes à 30 jours', 168] },
    { nom: 'NSFR', valeur: 108, norme: 100, etat: null, num: ['financement stable disponible', 540], den: ['financement stable exigé', 500] },
    { nom: 'Actifs admissibles BCEAO', valeur: 145, norme: null, etat: null, num: ['actifs admissibles au refinancement', 244], den: ['sorties nettes à 30 jours', 168] },
    { nom: 'Couverture des réserves obligatoires', valeur: 112, norme: 100, etat: null, num: ['avoirs à la banque centrale', 19], den: ['réserves exigées', 17] },
  ],
  CEMAC: [
    { nom: 'Rapport de liquidité à un mois', valeur: 118, norme: 100, etat: 'DEC 1506', num: ['disponible et réalisable à un mois', 413], den: ['exigible à un mois', 350] },
    { nom: 'Coefficient de transformation à long terme', valeur: 64, norme: 50, etat: 'DEC 1507', num: ['ressources permanentes', 54], den: ['emplois à plus de cinq ans', 85] },
  ],
};

DEMOS.liquidite = {
  zone: 'UMOA',
  i: 0,
  init() {
    groupe($('#zoneLiq'), (i) => { this.zone = i ? 'CEMAC' : 'UMOA'; this.rendre(); });
    this.rendre();
  },
  rendre() {
    const liste = RATIOS[this.zone];
    this.i = Math.min(this.i, liste.length - 1);
    $('#ratios').innerHTML = liste.map((r) => `<button type="button" class="ratio" aria-pressed="false"><span class="ratio-n">${r.nom}</span><span class="ratio-v${r.norme ? '' : ' neutre'}">${nombre(r.valeur)} %</span><span class="ratio-s">${r.norme ? `norme ${r.norme} %` : 'ratio de gestion'}</span></button>`).join('');
    const choisir = groupe($('#ratios'), (i) => this.afficher(i));
    choisir(this.i, true);
    this.afficher(this.i);
  },
  afficher(i) {
    this.i = i;
    const r = RATIOS[this.zone][i];
    const de = (x) => (/^[aeéèêiîoôuy]/i.test(x) ? `d’${x}` : `de ${x}`);
    $('#ratioChoix').innerHTML = `<span class="choix-d fondu"><b class="mono">${nombre(r.num[1])}</b> Md ${de(r.num[0])}, sur <b class="mono">${nombre(r.den[1])}</b> Md ${de(r.den[0])}.</span>`
      + `<span class="pill${r.etat ? ' acc' : ''}">${r.etat ? `Publié dans le ${r.etat}` : 'Suivi sans état réglementaire'}</span>`;
  },
};

/* IRRBB : formes des chocs BCBS d368, sur des tailles et une courbe d'illustration. */
const TAILLES = { parallele: 200, court: 250, long: 100, decroissance: 4 };
const tauxCourt = (t) => TAILLES.court * Math.exp(-t / TAILLES.decroissance);
const tauxLong = (t) => TAILLES.long * (1 - Math.exp(-t / TAILLES.decroissance));
const CHOCS = [
  { eve: -11.2, mni: -2.4, forme: () => TAILLES.parallele },
  { eve: 7.9, mni: 1.9, forme: () => -TAILLES.parallele },
  { eve: -5.0, mni: 0.8, forme: (t) => -0.65 * tauxCourt(t) + 0.9 * tauxLong(t) },
  { eve: 3.2, mni: -0.6, forme: (t) => 0.8 * tauxCourt(t) - 0.6 * tauxLong(t) },
  { eve: -4.0, mni: -1.6, forme: (t) => tauxCourt(t) },
  { eve: 2.8, mni: 1.2, forme: (t) => -tauxCourt(t) },
];
const MATURITES = Array.from({ length: 61 }, (_, i) => i / 3);
const courbeBase = (t) => 4.4 + 2.4 * (1 - Math.exp(-t / 6));
const deltasDu = (i) => MATURITES.map((t) => CHOCS[i].forme(t) / 100);

DEMOS.chocs = {
  i: 0,
  deltas: deltasDu(0),
  init() { $$('#chocs button').forEach((b, i) => b.addEventListener('click', () => this.choisir(i))); this.afficher(); },
  entrer() { this.dessiner(); },
  dessiner() {
    const svg = $('#grapheChoc');
    const { W, H } = tailleDe(svg);
    const m = { g: 34, d: 10, h: 10, b: 24 };
    const X = (t) => m.g + t / 20 * (W - m.g - m.d);
    const Y = (v) => H - m.b - (v - 1) / 8.5 * (H - m.h - m.b);
    const points = (f) => MATURITES.map((t, i) => `${X(t).toFixed(1)},${Y(f(t, i)).toFixed(1)}`);
    const base = points((t) => courbeBase(t));
    const apres = points((t, i) => courbeBase(t) + this.deltas[i]);
    let s = '';
    [2, 4, 6, 8].forEach((v) => { s += `<line class="tr" x1="${m.g}" x2="${W - m.d}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.g - 6}" y="${Y(v) + 4}" text-anchor="end">${v} %</text>`; });
    [0, 5, 10, 15, 20].forEach((t) => { s += `<text x="${X(t)}" y="${H - 6}" text-anchor="${t === 20 ? 'end' : t === 0 ? 'start' : 'middle'}">${t === 0 ? 'Court terme' : `${t} ans`}</text>`; });
    svg.innerHTML = `${s}<polygon class="aire" points="${base.concat(apres.slice().reverse()).join(' ')}"/><polyline class="base" points="${base.join(' ')}"/><polyline class="tracee" points="${apres.join(' ')}"/>`;
  },
  afficher() {
    const { eve, mni } = CHOCS[this.i];
    const perte = Math.max(0, -eve);
    $('#kpiChoc').textContent = `${signe(eve, 1)} %`;
    $('#kpiMni').textContent = `ΔMNI à un an : ${signe(mni, 1)} %`;
    const etat = $('#etatChoc');
    etat.classList.toggle('bad', perte > 15);
    $('span', etat).textContent = perte > 15 ? 'Au-delà du seuil de 15 % de l’outlier test.' : eve < 0 ? 'Sous le seuil de 15 % de l’outlier test.' : 'Gain de valeur économique.';
    $$('#chocs button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === this.i)));
  },
  choisir(i) {
    const depart = this.deltas;
    const cible = deltasDu(i);
    this.i = i;
    this.afficher();
    cancelAnimationFrame(this.image);
    if (mouvementReduit()) { this.deltas = cible; this.dessiner(); return; }
    const debut = performance.now();
    const avancer = (t) => {
      const u = Math.min((t - debut) / 420, 1);
      const lisse = 1 - Math.pow(1 - u, 3);
      this.deltas = depart.map((d, k) => d + (cible[k] - d) * lisse);
      this.dessiner();
      if (u < 1) this.image = requestAnimationFrame(avancer);
    };
    this.image = requestAnimationFrame(avancer);
  },
};

/* TCI : le taux de cession interne d'une opération, ses composantes, et le RAROC que le taux client
   laisse face au seuil. Hypothèses d'illustration. */
const PRODUITS_TCI = [
  { risque: 1.2, ponderation: 1 },
  { risque: 0.6, ponderation: 0.5 },
  { risque: 1.8, ponderation: 1 },
];
const RATIO_FONDS_PROPRES = 11.5;
const SEUIL_RAROC = 15;
const COUTS_OPERATOIRES = 1.0;

DEMOS.tci = {
  produit: 0,
  init() {
    groupe($('#tciProduit'), (i) => { this.produit = i; this.calculer(); });
    ['#tciDuree', '#tciMontant', '#tciTaux'].forEach((id) => curseur($(id), () => this.calculer()));
    $$('#tciDuree, #tciMontant, #tciTaux').forEach((c) => c.dispatchEvent(new Event('input')));
  },
  calculer() {
    const p = PRODUITS_TCI[this.produit];
    const d = Number($('#tciDuree').value);
    const montant = Number($('#tciMontant').value);
    const taux = Number($('#tciTaux').value);
    const pivot = 4.0 + 2.2 * (1 - Math.exp(-d / 4));
    const liquidite = 0.25 + 0.08 * d;
    const reserves = 0.15;
    const tci = pivot + liquidite + reserves;
    const fondsPropres = RATIO_FONDS_PROPRES * p.ponderation;
    const plancher = tci + p.risque + COUTS_OPERATOIRES;
    const requis = plancher + SEUIL_RAROC / 100 * fondsPropres;
    const raroc = (taux - plancher) / fondsPropres * 100;
    $('#tciDureeVal').textContent = `${d} an${d > 1 ? 's' : ''}`;
    $('#tciMontantVal').textContent = `${nombre(montant)} M FCFA`;
    $('#tciTauxVal').textContent = `${nombre(taux, 2)} %`;
    $('#tciCompo').innerHTML = [['Composante taux', pivot, 'var(--acc-hi)'], ['Composante liquidité', liquidite, 'var(--s-decide)'], ['Réserves obligatoires', reserves, 'var(--faint)']]
      .map(([nom, v, c]) => `<div class="compo-l"><span>${nom}</span><i style="--l:${v / 8 * 100}%;--c:${c}"></i><b>${nombre(v, 2)} %</b></div>`).join('');
    const atteint = raroc >= SEUIL_RAROC;
    const valeur = $('#tciRaroc');
    valeur.textContent = `${nombre(raroc, 1)} %`;
    valeur.style.color = atteint ? 'var(--ok)' : 'var(--bad)';
    $('#tciSeuil').textContent = atteint ? `au-dessus du seuil de ${SEUIL_RAROC} %` : `sous le seuil de ${SEUIL_RAROC} %`;
    $('#tciTaux3').innerHTML = [['TCI', tci], ['Taux plancher', plancher], ['Taux requis', requis]]
      .map(([l, v]) => `<div><dt>${l}</dt><dd>${nombre(v, 2)} %</dd></div>`).join('');
  },
};

/* Projection : le stock écoulé et les générations de production nouvelle, sur douze trimestres. */
const STOCK_INITIAL = 420;
const AMORTISSEMENT = 0.06;

DEMOS.projection = {
  init() { curseur($('#projProd'), () => this.dessiner())(); },
  entrer() { this.dessiner(); },
  serie(production) {
    return Array.from({ length: 13 }, (_, t) => {
      const stock = STOCK_INITIAL * Math.pow(1 - AMORTISSEMENT, t);
      let nouvelle = 0;
      for (let g = 1; g <= t; g++) nouvelle += production * Math.pow(1 - AMORTISSEMENT, t - g);
      return { stock, nouvelle };
    });
  },
  dessiner() {
    const production = Number($('#projProd').value);
    $('#projProdVal').textContent = `${production} Md FCFA`;
    const serie = this.serie(production);
    const svg = $('#projGraphe');
    const { W, H } = tailleDe(svg);
    const m = { g: 38, d: 8, h: 10, b: 22 };
    const X = (t) => m.g + t / 12 * (W - m.g - m.d);
    const Y = (v) => H - m.b - v / 800 * (H - m.h - m.b);
    let s = '';
    [0, 200, 400, 600, 800].forEach((v) => { s += `<line class="tr" x1="${m.g}" x2="${W - m.d}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.g - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`; });
    [0, 4, 8, 12].forEach((t) => { s += `<text x="${X(t)}" y="${H - 5}" text-anchor="${t === 0 ? 'start' : t === 12 ? 'end' : 'middle'}">${t === 0 ? 'Arrêté' : `${t / 4} an${t > 4 ? 's' : ''}`}</text>`; });
    const haut = serie.map((p, t) => `${X(t).toFixed(1)},${Y(p.stock + p.nouvelle).toFixed(1)}`);
    const milieu = serie.map((p, t) => `${X(t).toFixed(1)},${Y(p.stock).toFixed(1)}`);
    const bas = [`${X(12)},${Y(0)}`, `${X(0)},${Y(0)}`];
    s += `<polygon class="aire-stock" points="${milieu.concat(bas).join(' ')}"/>`;
    s += `<polygon class="aire-prod" points="${haut.concat(milieu.slice().reverse()).join(' ')}"/>`;
    s += `<polyline class="tracee" points="${haut.join(' ')}"/>`;
    svg.innerHTML = s;
    const fin = serie[12];
    const total = fin.stock + fin.nouvelle;
    $('#projTotal').innerHTML = `${nombre(total)}<small>Md FCFA</small>`;
    $('#projEvol').textContent = `${signe((total / STOCK_INITIAL - 1) * 100, 1)} % depuis l’arrêté`;
    $('#projPart').textContent = `La production nouvelle porte ${nombre(fin.nouvelle / total * 100)} % de l’encours à trois ans.`;
  },
};
