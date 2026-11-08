# Présentation ALCO One

Trente scènes en neuf chapitres, une scène plein écran à la fois, sur un fond bleu profond quadrillé.
L'ouverture est la vidéo du logo, `src/medias/ouverture.mp4`, intégrée au fichier : muette, lue une
fois, elle s'arrête sur sa dernière image, puis la phrase et le bouton paraissent. Avec le mouvement
réduit du système, elle se pose d'emblée sur sa dernière image ; si elle ne se lit pas, une
composition fixe du logo et des repères la remplace. La présentation
montre les avantages d'un outil presque tout en un, un module après l'autre, et finit sur un
questionnaire de qualification. Le fichier à ouvrir ou à transmettre est
`dist/ALCO_One_Presentation.html` : il contient ses styles, son script et ses polices, et ne fait
aucune requête externe.

| Chapitre | Scènes |
|---|---|
| ALCO One | La promesse et les quatre familles de modules |
| L'essentiel | Avec des classeurs ou avec ALCO One, 13 modules, le toit et ses trois piliers |
| Pilotage du bilan | Ouverture, six modules, puis une scène par module : analyse du bilan (dix vues), écoulement (gaps), variations des gaps (cascade et inexpliqué), liquidité de la zone, chocs IRRBB, TCI d'une opération, projection dynamique |
| Gestion des risques | Ouverture, quatre modules, stress test, plan de remédiation, Risk Management (familles, puis un prêt face aux seuils), risque de change, ILAAP |
| Portefeuille obligataire | Ouverture, achat simulé |
| Reporting | Ouverture, cinq niveaux de restitution, règles UMOA et CEMAC |
| Confiance | Sécurité, preuve et installation, mise en route en six étapes |
| Votre projet | Questionnaire de qualification |
| Fin | Logo, chiffres clés, retour au questionnaire |

## Utilisation

| Geste | Effet |
|---|---|
| Entrée, Espace, flèche droite, Échap | Ferme l'ouverture |
| Flèches, Espace, Page suivante, boutons | Scène suivante ou précédente |
| Début, Fin | Première ou dernière scène |
| F | Plein écran |
| Balayage | Scène suivante ou précédente, sur téléphone |
| Segments en haut | Saut au début d'un chapitre |
| `#13` à la fin de l'adresse | Ouverture directe de la scène 13, sans l'ouverture animée |

La composition est celle d'une diapositive de 1440 × 900 et suit la taille de l'écran. Une scène trop
haute se réduit jusqu'à 82 %, puis défile ; sous 860 px de large, chaque scène passe en une colonne
et défile. Avec le mouvement réduit du système, l'ouverture s'affiche directement complète.

Pour un PDF, imprimer depuis Chrome ou Edge, destination « Enregistrer au format PDF », graphiques
d'arrière-plan cochés : chaque scène donne une page 16:9, sur fond bleu comme à l'écran.

## Questionnaire

Trois étapes : l'établissement (nom, pays, zone, type, total du bilan), les besoins (modules,
outil actuel du comité, échéance, hébergement facultatif), le contact (nom, fonction, e-mail,
téléphone et message facultatifs, accord pour être recontacté). Chaque étape se valide avant la
suivante ; une erreur s'affiche sous son champ et s'efface à la saisie. Aucune réponse n'est gardée
dans le navigateur.

L'envoi se branche dans `src/js/70-questionnaire.js` : `ENVOI_QUALIFICATION` reçoit l'objet des
réponses et rend une promesse. Tant qu'il vaut `null`, l'écran final récapitule les réponses et dit
que rien n'a été transmis. Une promesse rejetée affiche un message d'échec et laisse renvoyer.

```js
{ etablissement, pays, zone, type, bilan, modules: [...], outil, echeance, hebergement,
  nom, fonction, email, telephone, message, accord: true }
```

## Modification

| Fichier | Contenu |
|---|---|
| `src/index.html` | La coquille : logo, ouverture animée, progression, navigation, icônes |
| `src/scenes/NN-*.html` | Les scènes d'un chapitre, dans l'ordre des numéros |
| `src/js/NN-*.js` | Les démonstrations ; `00-outils.js` en premier, `90-lecteur.js` en dernier |
| `src/style.css`, `src/polices.css` | Jetons, mise en page, ouverture, écrans étroits, impression |
| `src/medias/ouverture.mp4` | La vidéo d'ouverture ; la remplacer par un autre MP4 du même nom, puis reconstruire |
| `polices/` | Les fichiers des polices et leurs licences |

Les captures, la vidéo du logo telle que reçue et les versions archivées restent sur le poste ;
`LOCAL.md` les décrit.

Les titres disent ce que la scène montre, d'une seule couleur et sans point final ; le surtitre ne
nomme que le module montré. Ni tuile d'icône, ni halo, ni chiffre géant isolé.

Le logo est le symbole `#logo` de `src/index.html` : ALCO ONE en Montserrat 800, en relief par
couches décalées, et le toit en deux facettes. La page et la fin le réutilisent. Le fichier livré se
reconstruit par `node construire.mjs`, avec Node 18 ou plus, sans installation ; un chemin en argument
écrit ailleurs que dans `dist/`.

## Chiffres

Les chocs de taux, le stress test et l'achat simulé sont d'illustration et calculent en direct sur
un même bilan. Les formes des six chocs suivent BCBS d368, avec des tailles d'illustration. Le reste
décrit le produit tel que relevé le 02/11/2026 : treize modules avec l'ILAAP, dix vues et 26 contrôles de l'analyse
du bilan, 61 analyses à composer, cinq niveaux de restitution, états et ratios de chaque zone,
33 rôles, plus de 9 400 tests automatisés, étapes de mise en route.

RAF et Liquidité intraday sont écartés, faute de calcul sur les données de l'établissement ; l'ILAAP
est entré le 04/11/2026, quand il a lu les calculs des modules. Le fichier livré ne les nomme nulle part, code source compris : sinon, la construction
échoue.

## Publication

`publication/` est le dépôt git de la page en ligne, servie par GitHub Pages : la v6 à la racine,
la v7 sous `v7/`, et sous `sources/` une copie de `src/`, `polices/`, `construire.mjs`,
`package.json` et de ce fichier. Avant un commit et un push :

```sh
node construire.mjs publication/v7/index.html
rsync -a --delete --exclude .DS_Store src polices construire.mjs package.json README.md publication/sources/
```

La page demande aux moteurs de recherche de ne pas la référencer ; toute personne qui a le lien la
voit, et le dépôt, sources comprises, est public.

## Polices

Montserrat pour les titres, les chiffres et le logo, Inter pour le texte, JetBrains Mono pour les
repères, toutes sous licence SIL Open Font License 1.1. Les licences sont dans `polices/`.
