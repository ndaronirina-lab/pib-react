# pib-react

Reproduction en React (Vite) de la page **"Comptes Nationaux Rebasés (année de base 2007)"**
du portail Statistiques de l'INSTAT Madagascar, telle que décrite dans
`Comptes_Nationaux_20-07-2026_Final.pdf` et illustrée par les captures d'écran fournies.

Les deux blocs du PDF sont regroupés sur **une seule page** (comme sur le portail réel), l'un
sous l'autre, pour la période **1984 à 2006** :

1. **Graphique dynamique** : histogramme du *PIB aux prix d'acquisition en prix courants*
   (milliards d'Ariary — c'est bien l'échelle nominale 0 à ~16 000 visible sur la capture du
   PDF) combiné à la courbe du *Taux de croissance annuel réel du PIB* (%, calculé sur les prix
   constants), avec sélecteur de période ("Choisir la période de … à …") et boutons
   **Exporter en Excel** / **Exporter en JPG**.
2. **Tableau détaillé** : les 4 vues radio du portail —
   - Origines et emplois des ressources aux prix constants (Mds Ariary)
   - Origines et emplois des ressources aux prix courants (Mds Ariary)
   - Taux de croissance annuel
   - Inflation annuelle

   avec les cases à cocher par ligne ("Cocher les libellés"), le sélecteur de période, et le
   bouton **Exporter en Excel**.

### Correction apportée (v2)

- Les deux sections étaient auparavant présentées comme deux onglets séparés : elles sont
  maintenant **regroupées sur une seule page**, dans l'ordre du PDF.
- Le graphique dynamique affichait par erreur le PIB **aux prix constants** (courbe presque
  plate, de 8 373 à 15 008 Mds Ariary). En comparant avec l'échelle et la forme du graphique du
  PDF (barre 1984 proche de 0, barre 2006 proche de 14 000), les barres correspondent en réalité
  au PIB **aux prix courants** (370 à 13 933 Mds Ariary) — c'est ce qui est corrigé ici.

## Source des données

Les valeurs sont extraites du fichier fourni `PIB_retropolés_1984_2006.xlsx` (feuille `Feuil1`,
les 4 tableaux 1984-2006), converti en `src/data/pibData.json`. C'est le même fichier que celui
exporté par le bouton "Exporter en Excel" du portail INSTAT pour cette période.

Source officielle : **Institut National de la Statistique / Direction des Synthèses Economiques**.

> Les lignes "Importations nettes de biens et services", "Ressources disponibles totales" et
> "Dépenses de consommation finale" (quand non renseignées directement dans le classeur source)
> sont recalculées dans `src/data/pibData.js` à partir des identités comptables usuelles :
> `Importations nettes = Importations − Exportations`,
> `Ressources disponibles = PIB aux prix d'acquisition + Importations nettes`,
> `Dépenses de conso. finale = Conso. Administrations + Conso. Ménages`.

### Vérification du fichier `pibData.json`

Le fichier a été ré-audité ligne par ligne (23 années × 14 postes × 4 tableaux) : toutes les
séries sont complètes, sauf deux cas **volontairement vides, car absents du classeur source
lui-même** (vérifié cellule par cellule dans `PIB_retropolés_1984_2006.xlsx`) :
- `Formation brute de capital fixe` et `Variation des stocks` : seul le total
  "Formation brute de capital" est publié pour 1984-2006 ; ses deux composantes ne le sont pas.
- La première année (1984) des tableaux "Taux de croissance" et "Inflation" n'a pas de valeur,
  faute d'année 1983 de référence.

Le fichier JSON est maintenant indenté (au lieu d'une seule ligne compacte) pour être facilement
lisible et vérifiable à l'œil nu.

## Structure du projet

```
pib-react/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── style.css
    └── data/
        ├── pibData.json   (données brutes extraites du xlsx)
        └── pibData.js     (mise en forme + calculs dérivés)
```

## Installation et lancement

```bash
npm install
npm run dev
```

Puis ouvrir <http://localhost:5173>.

Pour générer une version de production :

```bash
npm run build
npm run preview
```

## Bibliothèques utilisées

- **react / react-dom** — UI
- **recharts** — graphique combiné barres + courbe (page 1)
- **xlsx (SheetJS)** — export Excel (.xlsx) des deux pages
- **file-saver** — déclenchement du téléchargement du fichier Excel
- **html-to-image** — export du graphique en JPG (page 1)
- **vite** — bundler / serveur de développement
