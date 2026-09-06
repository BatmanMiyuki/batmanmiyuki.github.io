# Chess Photo Solver

Prototype d'entraînement mobile-friendly pour analyser un problème d'échecs à partir d'une capture d'écran ou d'une photo.

## Ce que fait la version actuelle
- upload d'une image ou capture mobile
- rotation / zoom de l'aperçu
- détection automatique du plateau sur screenshot SimpleChess
- tentative de détection automatique du camp au trait
- auto-remplissage de la position
- cases incertaines surlignées en orange
- génération FEN
- analyse locale avec Stockfish dans le navigateur
- mise en évidence du meilleur coup directement sur l'échiquier
- PWA installable

## État du mode auto
Avec les captures fournies, le prototype reconnaît maintenant les **12 types de pièces** du thème SimpleChess :
- blancs : roi, dame, tour, fou, cavalier, pion
- noirs : roi, dame, tour, fou, cavalier, pion

Le système reste optimisé pour les **screenshots SimpleChess**. Si le jeu change fortement de thème, d'échelle ou de mise en page, il faudra enrichir les templates.

## Lancer localement
Depuis le dossier du projet :

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Puis ouvrir `http://localhost:8000`.
