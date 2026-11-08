/* Portefeuille obligataire : l'achat simulé d'un titre, lu avant et après sur le portefeuille.
   Titres, courbe et volatilité d'illustration. */
function obligation(coupon, y, n) {
  let prix = 0;
  let duree = 0;
  for (let t = 1; t <= n; t++) {
    const flux = t === n ? 100 + coupon : coupon;
    const actualise = flux / Math.pow(1 + y, t);
    prix += actualise;
    duree += t * actualise;
  }
  return { prix, dmod: duree / prix / (1 + y) };
}
const TITRES = [
  { n: 2, coupon: 5.9, nominal: 25 },
  { n: 3, coupon: 6.0, nominal: 40 },
  { n: 5, coupon: 6.5, nominal: 60 },
  { n: 7, coupon: 6.75, nominal: 35 },
];
const rendementDe = (n) => (5.8 + 0.18 * n) / 100;
const Z_99 = 2.326;
const SIGMA_JOUR = 0.0007;

function agreger(titres) {
  const lignes = titres.filter((t) => t.nominal > 0).map((t) => {
    const y = rendementDe(t.n);
    const o = obligation(t.coupon, y, t.n);
    return { ...t, y, ...o, valeur: t.nominal * o.prix / 100 };
  });
  const valeur = lignes.reduce((s, l) => s + l.valeur, 0);
  const moyenne = (cle) => lignes.reduce((s, l) => s + l.valeur * l[cle], 0) / valeur;
  const dmod = moyenne('dmod');
  const var99 = Z_99 * SIGMA_JOUR * Math.sqrt(10) * dmod * valeur;
  return { valeur, y: moyenne('y') * 100, dmod, dv01: dmod * valeur * 0.0001 * 1000, var99 };
}

DEMOS.gpo = {
  init() {
    ['#gpoMat', '#gpoCoupon', '#gpoMontant'].forEach((id) => curseur($(id), () => this.calculer()));
    $$('#gpoMat, #gpoCoupon, #gpoMontant').forEach((c) => c.dispatchEvent(new Event('input')));
  },
  calculer() {
    const achat = { n: Number($('#gpoMat').value), coupon: Number($('#gpoCoupon').value), nominal: Number($('#gpoMontant').value) };
    $('#gpoMatVal').textContent = `${achat.n} an${achat.n > 1 ? 's' : ''}`;
    $('#gpoCouponVal').textContent = `${nombre(achat.coupon, 2)} %`;
    $('#gpoMontantVal').textContent = `${achat.nominal} Md`;
    const avant = agreger(TITRES);
    const apres = agreger([...TITRES, achat]);
    const rangs = [
      ['Valeur actualisée', 'valeur', 1, 'Md'], ['Rendement moyen', 'y', 2, '%'], ['Duration modifiée', 'dmod', 2, ''],
      ['DV01', 'dv01', 1, 'M'], ['VaR 99 % à 10 jours', 'var99', 2, 'Md'],
    ];
    $('#gpoKpi').innerHTML = '<div class="avap-l tete-r"><span></span><span>Avant</span><span>Après l’achat</span><span>Écart</span></div>'
      + rangs.map(([nom, cle, d, u]) => `<div class="avap-l"><span>${nom}${u ? ` <small>${u}</small>` : ''}</span><b>${nombre(avant[cle], d)}</b><b class="apres">${nombre(apres[cle], d)}</b><span class="ecart">${signe(apres[cle] - avant[cle], d)}</span></div>`).join('');
  },
};
