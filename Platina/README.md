# Platina

Application web React, TypeScript et Tailwind CSS avec page de presentation,
suivi de jeux et trophees, statistiques, profils locaux et fichiers PWA.

## Demarrer

Node.js 22 est recommande.

```sh
npm install
npm run dev
```

Pour construire et previsualiser le site :

```sh
npm run build
npm run preview
```

Ne pas ouvrir `index.html` directement depuis le gestionnaire de fichiers :
il s'agit du point d'entree Vite, pas d'un site deja compile.

## Publier Sur GitHub Pages

Le workflow `.github/workflows/pages.yml` publie la branche par defaut sur
https://batmanmiyuki.github.io/platina/.

La procedure complete, y compris la preservation de l'historique du depot,
est dans `GITHUB.md`. Aucun jeton GitHub personnel ne doit etre ajoute au projet.

## Recuperer Le Code En ZIP

Sur la page d'accueil, descendre a la section "Recuperer le projet", ou ouvrir
Parametres > Projet ZIP. Preparer l'archive, puis cliquer sur son bouton de
telechargement. Sur un appareil compatible, le bouton de partage permet
egalement d'enregistrer le fichier dans l'application Fichiers.

Le ZIP comprend `src`, `public`, les fichiers de configuration, le lockfile
npm, la documentation et le workflow GitHub. Il est verifie par une extraction
de controle avant d'etre propose. Ses fichiers sont regroupes dans `platina/`.

`node_modules`, `dist`, `.git`, les fichiers `.env` et les donnees privees du
navigateur ne sont pas inclus. Si un fichier public est inaccessible, l'export
echoue explicitement plutot que de proposer une archive incomplete.

## Confidentialite Et Limites

Les comptes et les progres sont conserves dans le navigateur. Il ne s'agit pas
d'une authentification serveur, ni d'une sauvegarde cloud multi-appareils.

L'integration PSN actuelle repose sur une API communautaire non officielle et
des relais CORS tiers. Elle n'est pas une integration serveur securisee et peut
echouer selon les restrictions Sony ou les relais. Ne pas partager de NPSSO
ou de jetons personnels. Les sauvegardes de donnees peuvent contenir des
jetons PSN : elles ne doivent pas etre publiees dans GitHub.

PlayStation et les marques associees appartiennent a Sony Interactive
Entertainment. Platina est un projet independant sans affiliation a Sony.