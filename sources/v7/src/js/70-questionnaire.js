/* Questionnaire de qualification : trois étapes validées l'une après l'autre, puis les réponses
   rassemblées en un objet. ENVOI_QUALIFICATION reçoit cet objet et rend une promesse : c'est là que
   se branche l'envoi vers la boîte de contact de Heymann's. Tant qu'il vaut null, l'écran final
   montre les réponses et dit que rien n'est parti. Aucune réponse n'est gardée dans le navigateur. */
const ENVOI_QUALIFICATION = null;
const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEPHONE = /^[+\d][\d\s().-]{5,}$/;
const echapper = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

DEMOS.questionnaire = {
  etape: 1,
  init() {
    this.form = $('#questionnaire');
    this.etapes = $$('.etape-q', this.form);
    $$('.champ', this.form).forEach((c, k) => {
      const e = $('.erreur', c);
      if (!e) return;
      e.id = `qErreur${k}`;
      $$('input, textarea', c).forEach((i) => i.setAttribute('aria-describedby', e.id));
    });
    $('#qPrec').addEventListener('click', () => this.aller(this.etape - 1));
    this.form.addEventListener('submit', (e) => { e.preventDefault(); this.suivant(); });
    const effacer = (e) => { const c = e.target.closest('.champ'); if (c) this.signaler(c, ''); };
    this.form.addEventListener('input', effacer);
    this.form.addEventListener('change', effacer);
    this.aller(1);
  },
  aller(n) {
    this.etape = Math.min(Math.max(n, 1), this.etapes.length);
    this.etapes.forEach((f, i) => { f.hidden = i + 1 !== this.etape; });
    $$('#qPas li').forEach((li, i) => { li.classList.toggle('fait', i + 1 < this.etape); li.classList.toggle('actif', i + 1 === this.etape); });
    $('#qPrec').disabled = this.etape === 1;
    const derniere = this.etape === this.etapes.length;
    $('#qSuiv').innerHTML = derniere ? 'Envoyer<svg class="ic"><use href="#i-send"/></svg>' : 'Continuer<svg class="ic"><use href="#i-suiv"/></svg>';
    const etat = $('#qEtat');
    etat.classList.remove('bad-t');
    etat.textContent = `Étape ${this.etape} sur ${this.etapes.length}`;
    ajusterCourante();
  },
  /* Le message d'erreur d'un champ, ou une chaîne vide s'il est bon. */
  verifier(champ) {
    const saisie = $('input[type="text"], input:not([type]), input[type="email"], input[type="tel"]', champ);
    if (saisie) {
      const v = saisie.value.trim();
      if (!v) return saisie.required ? 'À renseigner.' : '';
      if (saisie.type === 'email' && !COURRIEL.test(v)) return 'Adresse e-mail à vérifier.';
      if (saisie.type === 'tel' && !TELEPHONE.test(v)) return 'Numéro à vérifier.';
      return '';
    }
    if (!champ.hasAttribute('data-requis')) return '';
    const cases = $$('input[type="radio"], input[type="checkbox"]', champ);
    if (cases.some((c) => c.checked)) return '';
    if (cases[0].name === 'accord') return 'Votre accord est nécessaire pour être recontacté.';
    return cases[0].type === 'checkbox' ? 'Choisissez au moins un module.' : 'Choisissez une réponse.';
  },
  signaler(champ, message) {
    const e = $('.erreur', champ);
    if (e) e.textContent = message;
    champ.classList.toggle('invalide', Boolean(message));
    $$('input, textarea', champ).forEach((i) => i.setAttribute('aria-invalid', String(Boolean(message))));
  },
  suivant() {
    const champs = $$('.champ', this.etapes[this.etape - 1]);
    const fautifs = champs.filter((c) => { const m = this.verifier(c); this.signaler(c, m); return m; });
    if (fautifs.length) {
      $('input, textarea', fautifs[0]).focus({ preventScroll: true });
      ajusterCourante();
      return;
    }
    if (this.etape < this.etapes.length) {
      this.aller(this.etape + 1);
      $('input, textarea', this.etapes[this.etape - 1]).focus({ preventScroll: true });
    } else this.envoyer();
  },
  reponses() {
    const d = new FormData(this.form);
    const r = {};
    ['etablissement', 'pays', 'zone', 'type', 'bilan', 'outil', 'echeance', 'hebergement', 'nom', 'fonction', 'email', 'telephone', 'message']
      .forEach((cle) => { r[cle] = String(d.get(cle) || '').trim(); });
    r.modules = d.getAll('modules');
    r.accord = d.get('accord') === 'oui';
    return r;
  },
  async envoyer() {
    const r = this.reponses();
    if (!ENVOI_QUALIFICATION) { this.merci(r, false); return; }
    const bouton = $('#qSuiv');
    bouton.disabled = true;
    try {
      await ENVOI_QUALIFICATION(r);
      this.merci(r, true);
    } catch (e) {
      const etat = $('#qEtat');
      etat.classList.add('bad-t');
      etat.textContent = 'L’envoi n’a pas abouti. Vérifiez la connexion, puis réessayez.';
    } finally {
      bouton.disabled = false;
    }
  },
  merci(r, envoye) {
    const lignes = [
      ['Établissement', `${r.etablissement}, ${r.pays}${r.zone ? `, ${r.zone}` : ''}`],
      ['Profil', `${r.type}, bilan ${r.bilan.charAt(0).toLowerCase()}${r.bilan.slice(1)}`],
      ['Modules', r.modules.join(', ')],
      ['Comité préparé avec', r.outil],
      ['Échéance', r.echeance],
      ['Hébergement', r.hebergement || 'Non précisé'],
      ['Contact', [r.nom, r.fonction, r.email, r.telephone].filter(Boolean).join(', ')],
    ];
    const merci = $('#qMerci');
    merci.innerHTML = `<div class="verdict ${envoye ? 'ok' : 'warn'} gauche"><b>Merci, ${echapper(r.nom)}.</b><span>${envoye
      ? 'Vos réponses sont parties chez Heymann’s, qui vous recontacte pour préparer la démonstration.'
      : 'Aperçu : l’envoi vers Heymann’s n’est pas encore branché, rien n’a été transmis.'}</span></div>`
      + `<dl class="recap">${lignes.map(([l, v]) => `<div><dt>${l}</dt><dd>${echapper(v)}</dd></div>`).join('')}</dl>`
      + '<div class="boutons gauche"><button type="button" class="btn" id="qModifier">Modifier mes réponses</button></div>';
    this.form.hidden = true;
    $('#qPas').hidden = true;
    merci.hidden = false;
    $('#qModifier').addEventListener('click', () => {
      merci.hidden = true;
      this.form.hidden = false;
      $('#qPas').hidden = false;
      this.aller(1);
    });
    ajusterCourante();
  },
};
