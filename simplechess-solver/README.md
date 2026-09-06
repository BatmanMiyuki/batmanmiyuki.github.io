# Chess Photo Solver

Prototype d'entraînement mobile-friendly pour analyser un problème d'échecs à partir d'une capture d'écran ou d'une photo.

## Ce que fait la version actuelle
- upload d'une image
- rotation / zoom de l'aperçu
- éditeur d'échiquier rapide
- génération FEN
- analyse locale avec Stockfish dans le navigateur
- **auto-remplissage expérimental pour screenshots SimpleChess**

## État du mode auto
Avec les captures fournies, le prototype reconnaît déjà correctement plusieurs pièces du thème SimpleChess :
- blancs : roi, tour, fou, pion
- noirs : roi, tour, cavalier, pion

Pour couvrir aussi les **dames**, le **cavalier blanc**, le **fou noir** et la **dame noire**, il faut encore enrichir les templates avec d'autres captures.

## Lancer localement
Depuis le dossier du projet :

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Puis ouvrir `http://localhost:8000`.
