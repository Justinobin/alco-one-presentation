/* L'essentiel : la comparaison avec des classeurs, et les métiers réunis sous le toit d'ALCO One. */
DEMOS.avant = {
  init() {
    const hote = $('#cmp');
    groupe($('#segAvant'), (i) => {
      hote.classList.toggle('avant', i === 0);
      $$('p[data-avant]', hote).forEach((p) => { p.textContent = i === 0 ? p.dataset.avant : p.dataset.apres; });
    });
  },
};

/* Le toit, puis les trois piliers : chaque élément dit ce qu'il apporte et mène à son module. */
const METIERS = [
  { texte: 'Le dossier du comité et les états réglementaires, produits sur les chiffres des modules.', scene: 'Reporting' },
  { texte: 'La structure, les gaps, la liquidité et les taux du bilan, et chaque écart expliqué.', scene: 'Pilotage du bilan' },
  { texte: 'Des scénarios de stress, un plan de remédiation, la solvabilité jusqu’à l’ICAAP, la liquidité jusqu’à l’ILAAP.', scene: 'Gestion des risques' },
  { texte: 'Les titres valorisés et leur risque mesuré, un achat simulé avant d’être décidé.', scene: 'Portefeuille obligataire' },
];

DEMOS.toit = {
  init() {
    const boutons = $$('#maison button');
    const afficher = (i) => {
      boutons.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
      const m = METIERS[i];
      $('#toitChoix').innerHTML = `<span class="choix-d fondu">${m.texte}</span><button type="button" class="btn">Voir<svg class="ic"><use href="#i-suiv"/></svg></button>`;
      $('#toitChoix button').addEventListener('click', () => allerALaScene(m.scene));
    };
    boutons.forEach((b, i) => b.addEventListener('click', () => afficher(i)));
    afficher(1);
  },
};
