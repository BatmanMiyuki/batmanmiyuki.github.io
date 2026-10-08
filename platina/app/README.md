# Platina

Application web React, TypeScript et Vite pour suivre les jeux, trophées, statistiques, sessions et dépenses PlayStation.

## Démarrer en local

Node.js 22 est recommandé.

```sh
npm ci
npm run dev
```

Créer et tester la version de production :

```sh
npm run build
npm run preview
```

Dans le dépôt `batmanmiyuki.github.io`, `npm run build` recopie automatiquement le résultat dans `platina/` (page publiée). Dans un dépôt Platina autonome, le build reste dans `dist/` et le workflow `.github/workflows/pages.yml` s'occupe du déploiement.

Ne pas ouvrir `index.html` directement depuis le gestionnaire de fichiers : il s'agit du point d'entrée Vite.

## Structure

- `src/components/` : composants d'interface
- `src/lib/` : état, données, navigation et intégrations (`psn.ts`, `psn-repo.ts`, `project-export.ts`)
- `src/pages/`, `src/screens/`, `src/sheets/` : écrans et panneaux
- `public/` : icône, manifeste PWA, service worker et images (`public/images/`)
- `.github/workflows/pages.yml` : déploiement GitHub Pages lorsque Platina est la racine de son dépôt

Le code utilise des chemins d'assets relatifs afin de fonctionner à la racine ou sous un chemin de projet GitHub Pages.

## Synchronisation PlayStation (recommandée)

Aucun NPSSO ne circule dans le navigateur :

1. Dans GitHub, ajoute le secret **`PSN_NPSSO`** (Settings → Secrets and variables → Actions). Il s'obtient sur `ca.account.sony.com/api/v1/ssocookie`.
2. Lance le workflow **Update PlayStation data** (onglet Actions, ou tous les dimanches à 4 h 30).
3. Le workflow échange le NPSSO contre des jetons PSN côté serveur, importe les trophées puis publie `psn-data.json`.
4. Platina lit ce fichier (Paramètres → PlayStation Network → « Importer depuis GitHub ») et l'importe au premier lancement d'un compte vide.

Le fichier `psn-data.json` est public, comme le site : il contient ton online ID, tes trophées et ton temps de jeu. Ne le publie pas si tu préfères garder ces informations privées.

## Méthode directe (déconseillée)

Paramètres → PlayStation Network → « Méthode directe dans le navigateur » permet encore de coller un NPSSO. Cette méthode passe par des relais CORS publics (le navigateur interdit l'en-tête `Cookie` exigé par Sony) et conserve un jeton PSN dans le stockage local. À réserver aux cas où GitHub Actions n'est pas utilisable.

## Confidentialité

Les comptes et progrès Platina sont enregistrés dans le stockage local du navigateur ; ce n'est pas une authentification serveur ni une sauvegarde cloud. Le mot de passe d'un compte local est haché en SHA-256 dans le navigateur : il protège des regards, pas d'un attaquant déterminé.

Ne publie jamais de NPSSO, mot de passe, fichier `.env`, access token ou refresh token dans le dépôt.

PlayStation et les marques associées appartiennent à Sony Interactive Entertainment. Platina est un projet indépendant sans affiliation à Sony.
