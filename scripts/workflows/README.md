# Workflows à installer

Ces trois fichiers sont les workflows GitHub Actions de Platina :

| Fichier | Rôle |
| --- | --- |
| `update-psn.yml` | Importe les trophées/temps de jeu avec le secret `PSN_NPSSO` et publie `platina/psn-data.json` |
| `update-pstat-accounts.yml` | Publie `platina/pstat-accounts.json` pour les deux comptes PSN |
| `build-platina.yml` | Reconstruit la page publiée (`platina/index.html`, images, PWA) à chaque modification de `platina/app/` |

Ils sont stockés ici parce que la session qui a produit cette modification n'avait pas la permission GitHub `workflows` : ils ne pouvaient pas être écrits directement dans `.github/workflows/`.

## Installation (2 minutes)

### Option A — depuis GitHub dans le navigateur

1. Ouvre le dépôt → **Add file** → **Create new file**.
2. Nomme le fichier `.github/workflows/update-psn.yml` et colle le contenu de `scripts/workflows/update-psn.yml`, puis **Commit changes**.
3. Répète l'opération pour `update-pstat-accounts.yml` et `build-platina.yml`.

### Option B — en local

```sh
git mv scripts/workflows/build-platina.yml .github/workflows/
git checkout scripts/workflows/update-psn.yml scripts/workflows/update-pstat-accounts.yml
mv scripts/workflows/update-psn.yml scripts/workflows/update-pstat-accounts.yml .github/workflows/
git rm -r scripts/workflows   # ce dossier n'a plus d'utilité
```

Une fois les fichiers en place, supprime ce dossier `scripts/workflows/`.
