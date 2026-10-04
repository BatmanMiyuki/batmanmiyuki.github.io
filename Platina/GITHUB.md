# Publier Platina Sur GitHub

Le projet contient la page de presentation et l'application universelle Platina.

- Site indique : https://batmanmiyuki.github.io/platina/
- Depot correspondant attendu : https://github.com/batmanmiyuki/platina

L'adresse du site ne garantit pas le nom du depot. Verifier que ce depot est
bien celui qui publie le site avant de remplacer ses fichiers. Son acces n'a
pas pu etre confirme depuis cet environnement, et aucun push n'a ete effectue.

## Authentification

Revoquer tout jeton GitHub partage dans une conversation. Ne pas mettre de jeton
dans les fichiers, dans une URL de depot, ou dans une commande `git push`.

Sur votre ordinateur, installer Git et GitHub CLI, puis utiliser la connexion
securisee dans le navigateur :

```sh
gh auth login --web --git-protocol https
gh auth setup-git
```

## Remplacer Le Projet Sans Perdre L'Historique

1. Dans l'apercu, cliquer sur Projet ZIP en bas de la page ou dans Parametres.
   Cliquer sur Preparer le projet en ZIP, puis Telecharger le ZIP complet.
   Decompresser l'archive sur votre ordinateur : les sources sont dans `platina/`.
2. Cloner le depot existant apres avoir confirme son adresse :

```sh
git clone https://github.com/batmanmiyuki/platina.git
cd platina
git switch -c update/platina
```

3. Copier le projet exporte dans le dossier clone et remplacer les fichiers
   correspondants. Conserver le dossier `.git`. Ne pas copier `node_modules`,
   `dist`, des fichiers `.env`, des jetons ou des exports de comptes.
4. Verifier les anciens fichiers du depot. S'ils ne font plus partie du projet,
   les retirer explicitement avec `git rm CHEMIN-DU-FICHIER`.
5. Installer les dependances, verifier le build, puis examiner les changements :

```sh
npm install
npm run build
git status
git diff
```

6. Creer un commit et publier la branche :

```sh
git add .
git diff --cached
git commit -m "Replace Platina with the universal app and landing page"
git push -u origin update/platina
gh pr create --fill
```

Relire puis fusionner la pull request pour remplacer la version actuelle.
Cette methode conserve l'historique et permet de revenir en arriere. Elle ne
necessite ni `git push --force`, ni suppression du depot.

## Activer GitHub Pages

Le workflow `.github/workflows/pages.yml` construit le site pour `/platina/`
et publie le dossier `dist`. Aucun jeton personnel n'est necessaire : le
workflow utilise les permissions temporaires de GitHub Actions.

1. Dans le depot, ouvrir Settings > Pages.
2. Dans Build and deployment > Source, choisir GitHub Actions.
3. Fusionner la pull request dans la branche par defaut (`main` ou `master`).
4. Dans Actions, verifier que Deploy Platina to GitHub Pages se termine sans
   erreur. Le workflow peut aussi etre lance avec Run workflow sur la branche
   par defaut.
5. Ouvrir https://batmanmiyuki.github.io/platina/.

Une pull request construit le projet mais ne remplace pas le site en ligne.
Seule la branche par defaut est publiee. Si cette branche porte un autre nom
que `main` ou `master`, adapter les filtres de branches du workflow.

Conserver l'ancien historique et eviter un second workflow qui deploierait
simultanement une autre version sur GitHub Pages.

## Verifier La Publication

- Les images et le manifeste doivent etre charges depuis `/platina/`.
- Le bouton d'ouverture doit mener a `/platina/#/app`.
- Le service worker doit avoir pour scope `/platina/`, sans controler les
  autres sites GitHub Pages du compte.
- Tester l'installation PWA et le rechargement hors ligne dans un navigateur.

Le build local a ete verifie. Le workflow distant, la publication et
l'installation PWA sur le domaine cible restent a verifier apres le push.

## Donnees Privees

Les comptes Platina sont actuellement sauvegardes dans le navigateur, et non
dans GitHub. Les sauvegardes JSON peuvent contenir des jetons PlayStation : ne
pas les ajouter au depot. Le client PSN actuel utilise des relais CORS tiers ;
il ne doit pas etre presente comme une integration serveur securisee.

Le dossier `public` contient le manifeste, le service worker, l'icone et les
images de l'application. Il doit etre inclus dans le depot. Les fichiers du
build dans `dist` sont generes et exclus par `.gitignore`.