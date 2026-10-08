# batmanmiyuki.github.io

Site personnel publié par GitHub Pages depuis la branche `main`. Chaque dossier est un projet accessible à `https://batmanmiyuki.github.io/<dossier>/`.

## Platina

Suivi de trophées PlayStation (niveau, platinés, temps de jeu, dépenses PS Store).

| Élément | Emplacement |
| --- | --- |
| Page publiée | `platina/index.html` (générée, ne pas modifier à la main) |
| Sources | `platina/app/` (React + TypeScript + Vite + Tailwind) |
| Images et PWA | `platina/app/public/` → recopiées dans `platina/` au build |
| Données PSN | `platina/psn-data.json` (écrit par le workflow, lu par l'application) |
| Statistiques PStat | `platina/pstat-accounts.json` |
| Scripts d'import | `scripts/fetch-psn-data.mjs`, `scripts/fetch-pstat-account.mjs` |

### Modifier l'application

```sh
cd platina/app
npm ci
npm run dev      # aperçu local
npm run build    # type check + build + publication dans platina/
```

Le workflow **Build Platina** (`.github/workflows/build-platina.yml`) refait ce build automatiquement à chaque modification dans `platina/app/` et committe la page publiée : aucune étape manuelle n'est nécessaire après un push.

### Récupérer les données PlayStation

Le NPSSO ne circule jamais dans le navigateur : il est stocké dans les secrets GitHub et utilisé uniquement par GitHub Actions.

1. **Settings → Secrets and variables → Actions** : créer les secrets
   - `PSN_NPSSO` — compte principal (`BATMAN_Miyukii`)
   - `PSN_NPSSO_FRERE` — second compte, facultatif
2. Lancer le workflow **Update PlayStation data** (ou attendre le cron du dimanche 4 h 30). Il publie `platina/psn-data.json`.
3. Dans l'application : **Paramètres → PlayStation Network → Importer depuis GitHub**. Un compte vide importe aussi ces données automatiquement au premier lancement.

`psn-data.json` est public, comme le site : il contient l'online ID, les trophées et le temps de jeu. C'est le prix d'une page statique sans serveur ; si ces informations doivent rester privées, n'utilise pas cette synchronisation.

### Outils

- `scripts/extract-platina-source.mjs` : reconstruit l'arborescence du projet (`src/`, `public/`, fichiers racine) à partir des sources embarquées dans une page Platina construite. Utile pour récupérer une version donnée :
  `node scripts/extract-platina-source.mjs platina/index.html /tmp/platina-app`

## Autres projets

`Meinkraft`, `Privara`, `forge`, `gympulse`, `kioku`, `miyukichess`, `mtvitrine`, `polycode`, `pps`, `screenpulse`, `simplechess-solver`, ainsi que la page d'accueil `index.html` et `sp-rescue.html`.
