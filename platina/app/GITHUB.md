# Publier et installer Platina

L'archive contient déjà le workflow GitHub Pages. Pour publier Platina comme une application installable, il faut un dépôt dédié dont la racine contient `package.json`, `src/`, `public/` et `.github/`.

## Étapes simples avec GitHub Desktop

1. Télécharge `platina-source-*.zip` et décompresse-le sur ton ordinateur.
2. Sur GitHub, crée un dépôt public nommé `platina` (laisse les options README, licence et `.gitignore` décochées pour le créer vide).
3. Ouvre GitHub Desktop et connecte-toi avec le bouton de connexion au navigateur. **Ne crée pas et ne partage pas de jeton personnel.**
4. Dans GitHub Desktop, clone `https://github.com/BatmanMiyuki/platina.git`.
5. Depuis le dossier extrait `platina/`, copie **tout son contenu** dans le dossier local cloné. Le `package.json` doit se trouver directement à la racine du dépôt cloné, pas dans un sous-dossier `platina/platina/`.
6. Dans GitHub Desktop, écris un résumé comme `Publish Platina`, clique sur **Commit to main**, puis **Push origin**.
7. Sur GitHub, ouvre le dépôt → **Settings → Pages** → choisis **GitHub Actions** comme source. Dans l'onglet **Actions**, attends que **Deploy Platina to GitHub Pages** soit terminé avec succès.

Le site sera disponible à l'adresse `https://batmanmiyuki.github.io/platina/`. GitHub Pages fournit le HTTPS nécessaire à l'installation PWA.

## Installer sur le téléphone

- **Android / Chrome :** ouvre le site, menu ⋮, puis **Installer l'application** (ou **Ajouter à l'écran d'accueil**).
- **iPhone / Safari :** ouvre le site, touche **Partager**, puis **Sur l'écran d'accueil**.

## Synchroniser tes trophées PlayStation

1. Récupère ton NPSSO sur `ca.account.sony.com/api/v1/ssocookie` (connecté à playstation.com dans le même navigateur).
2. Dans le dépôt, va dans **Settings → Secrets and variables → Actions → New repository secret** et crée `PSN_NPSSO` avec cette valeur. Ne colle jamais ce jeton dans un fichier du dépôt.
3. Onglet **Actions** → **Update PlayStation data** → **Run workflow**. Le workflow écrit `psn-data.json` à la racine du dépôt.
4. Ouvre Platina : les données sont importées automatiquement au premier lancement, et à tout moment depuis **Paramètres → PlayStation Network → Importer depuis GitHub**.

Le workflow se relance chaque dimanche à 4 h 30. Si Platina est dans un sous-dossier de ton dépôt, ajoute `OUT_DIR: <dossier>` aux variables d'environnement du workflow.

## Important pour le dépôt existant

Ne remplace pas la racine de `batmanmiyuki.github.io` par cette archive : ce dépôt héberge déjà d'autres projets et sa page Platina vit dans `platina/`, avec ses sources dans `platina/app/`. Un workflow y reconstruit automatiquement la page publiée (voir `.github/workflows/build-platina.yml`).

Ne publie jamais de NPSSO, mot de passe, fichier `.env`, access token ou refresh token. Le fichier `psn-data.json` publié par le workflow est, lui, public par nature : il contient ton online ID, tes trophées et ton temps de jeu.
