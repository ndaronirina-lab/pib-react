import raw from './pibData.json'

export const ROW_DEFS = [
  { key: 'secteur_primaire', label: 'Secteur Primaire', indent: 1, checkable: true },
  { key: 'secteur_secondaire', label: 'Secteur Secondaire', indent: 1, checkable: true },
  { key: 'secteur_tertiaire', label: 'Secteur Tertiaire', indent: 1, checkable: true },
  { key: 'sifim', label: 'SIFIM', indent: 0, checkable: true, spacerBefore: true },
  { key: 'pib_prix_base', label: 'PIB aux prix de base', indent: 0, checkable: true, bold: true, spacerBefore: true },
  { key: 'impots_produits', label: 'Impôts sur les produits', indent: 0, checkable: true, spacerBefore: true },
  { key: 'pib_prix_acquisition', label: "PIB aux prix d'acquisition", indent: 0, checkable: true, bold: true, spacerBefore: true },
  { key: 'importations_nettes', label: 'Importations nettes de biens et services', indent: 0, checkable: true, spacerBefore: true, derived: true },
  { key: 'importations', label: 'Importations', indent: 1, checkable: true },
  { key: 'exportations', label: 'Exportations', indent: 1, checkable: true },
  { key: 'ressources_disponibles', label: 'Ressources disponibles totales', indent: 0, checkable: true, bold: true, spacerBefore: true, derived: true },
  { key: 'dep_conso_finale', label: 'Dépenses de consommation finale', indent: 0, checkable: true, bold: true, spacerBefore: true, derived: true },
  { key: 'dep_conso_admin', label: 'Dépenses de consommation finale des Administrations Publiques et des ISBLSM', indent: 1, checkable: true },
  { key: 'dep_conso_menages', label: 'Dépenses de consommation finale des Ménages', indent: 1, checkable: true },
  { key: 'formation_brute_capital', label: 'Formation brute de capital', indent: 0, checkable: true, bold: true, spacerBefore: true },
  { key: 'fbcf', label: 'Formation brute de capital fixe', indent: 1, checkable: true, unavailable: true },
  { key: 'variation_stocks', label: 'Variation des stocks', indent: 1, checkable: true, unavailable: true },
]

export const MODES = [
  { key: 'prix_constants', label: "Origines et emplois des ressources aux prix constants (En milliard d'Ariary)", unit: 'mds', percent: false },
  { key: 'prix_courants', label: "Origines et emplois des ressources aux prix courants (En milliard d'Ariary)", unit: 'mds', percent: false },
  { key: 'taux_croissance', label: 'Taux de croissance annuel', unit: '%', percent: true },
  { key: 'inflation', label: 'Inflation annuelle', unit: '%', percent: true },
]

function computeDerived(block) {
  const years = block.years
  const s = block.series
  const n = years.length
  const importations_nettes = []
  const ressources_disponibles = []
  const dep_conso_finale = []
  for (let i = 0; i < n; i++) {
    const imp = s.importations[i]
    const exp = s.exportations[i]
    const pibAcq = s.pib_prix_acquisition[i]
    const admin = s.dep_conso_admin[i]
    const menages = s.dep_conso_menages[i]
    const net = imp != null && exp != null ? imp - exp : null
    importations_nettes.push(net)
    ressources_disponibles.push(pibAcq != null && net != null ? pibAcq + net : null)
    dep_conso_finale.push(admin != null && menages != null ? admin + menages : null)
  }
  return {
    years,
    series: {
      ...s,
      importations_nettes,
      ressources_disponibles,
      dep_conso_finale,
    },
  }
}

export const PIB_DATA = Object.fromEntries(
  Object.entries(raw).map(([mode, block]) => [mode, computeDerived(block)])
)

export function getYearRange(mode) {
  const years = PIB_DATA[mode].years
  return { min: years[0], max: years[years.length - 1] }
}

export function sliceByYears(mode, from, to) {
  const block = PIB_DATA[mode]
  const idxFrom = block.years.indexOf(from)
  const idxTo = block.years.indexOf(to)
  const years = block.years.slice(idxFrom, idxTo + 1)
  const series = {}
  Object.entries(block.series).forEach(([k, arr]) => {
    series[k] = arr.slice(idxFrom, idxTo + 1)
  })
  return { years, series }
}
