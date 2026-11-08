// Assemble src/ en un seul fichier : styles, scènes, script, polices et médias intégrés.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const racine = dirname(fileURLToPath(import.meta.url))
const lire = (chemin) => readFile(resolve(racine, chemin), 'utf8')
const fichiers = async (dossier, extension) => (await readdir(resolve(racine, dossier)))
  .filter((nom) => nom.endsWith(extension)).sort()

async function policesIntegrees() {
  const morceaux = (await lire('src/polices.css')).split(/(url\("\.\.\/polices\/[^"]+"\))/)
  const integres = await Promise.all(morceaux.map(async (morceau) => {
    const fichier = morceau.match(/^url\("\.\.\/(polices\/[^"]+)"\)$/)?.[1]
    if (!fichier) return morceau
    const octets = await readFile(resolve(racine, fichier))
    return `url("data:font/woff2;base64,${octets.toString('base64')}")`
  }))
  return integres.join('')
}

/* Chaque `src="medias/..."` de la coquille devient une adresse data:, comme les polices : la vidéo
   d'ouverture voyage dans le fichier livré. Remplacer src/medias/ouverture.mp4 suffit à la changer. */
const TYPES_MEDIAS = { mp4: 'video/mp4', webm: 'video/webm' }
async function mediasIntegres(html) {
  let resultat = html
  for (const chemin of new Set(html.match(/(?<=src=")medias\/[^"]+/g) || [])) {
    const type = TYPES_MEDIAS[chemin.split('.').pop().toLowerCase()]
    if (!type) throw new Error(`Type de média non pris en charge : ${chemin}`)
    const octets = await readFile(resolve(racine, 'src', chemin))
    resultat = resultat.replaceAll(`src="${chemin}"`, `src="data:${type};base64,${octets.toString('base64')}"`)
  }
  return resultat
}

/* La présentation ne montre que ce qui calcule sur les données de l'établissement : le fichier
   livré ne nomme les modules écartés nulle part, code source compris, sinon la construction échoue.
   L'ILAAP y entre depuis qu'il lit les calculs des modules (04/11/2026). */
const NOMS_ECARTES = /(?<!\p{L})(RAF|intraday)(?!\p{L})/iu

const scenes = (await Promise.all((await fichiers('src/scenes', '.html'))
  .map((nom) => lire(`src/scenes/${nom}`)))).join('\n')
const scripts = (await Promise.all((await fichiers('src/js', '.js'))
  .map((nom) => lire(`src/js/${nom}`)))).join('\n')
const [gabarit, polices, css] = await Promise.all([
  lire('src/index.html'), policesIntegrees(), lire('src/style.css'),
])

// Un seul périmètre pour tous les scripts ; `$` du contenu ne doit pas se lire comme un motif.
const script = `(function () {\n'use strict';\n${scripts}\n})();\n`
// Les polices restent hors du contrôle : leur base64 peut former ces lettres par hasard.
const nomme = [gabarit, scenes, css, script].map((t) => t.match(NOMS_ECARTES)?.[0]).find(Boolean)
if (nomme) throw new Error(`Le fichier livré nommerait un module écarté : « ${nomme} ».`)
const page = (await mediasIntegres(gabarit))
  .replace('<!--SCENES-->', () => scenes)
  .replace('<link rel="stylesheet" href="polices.css">', () => `<style>${polices}</style>`)
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${css}</style>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${script}</script>`)

// Un chemin en argument construit ailleurs que dans dist/, pour un essai.
const sortie = process.argv[2] ? resolve(process.argv[2]) : resolve(racine, 'dist/ALCO_One_Presentation.html')
await mkdir(dirname(sortie), { recursive: true })
await writeFile(sortie, page)
const nombre = (page.match(/<section class="scene/g) || []).length
console.log(`${sortie} : ${nombre} scènes, ${Math.round(Buffer.byteLength(page) / 1024)} ko`)
