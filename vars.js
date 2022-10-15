const mapboxToken = 'pk.eyJ1IjoiZnJhbmNvaXNidXJkeSIsImEiOiJjbDkzcWI0aTkxcGRtM25tdHRnOWUyd3d2In0.---5NR_DpITqvEiEZY-odw'

const apiAdresseUrl = 'https://api-adresse.data.gouv.fr/search/?limit=6&type=municipality'

const dataFiles = {
  zoneMapping: 'data/Zonage_abc_communes_2022-index.json',
  original: 'data/communes-simplified-geojson.json',
  dest: 'data/communes-with-zones.geojson',
  destLight: 'data/communes-with-zones-light.geojson',
}

const mapConfig = {
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [2.87, 46.7],
  zoom: 5.2,
  projection: 'globe',
  language: 'fr',
  attributionControl: false,
}

const itemsColors = {
  Abis: {
    text: 'Zone A bis',
    color: '#9800e7',
    hoverColor: '#8300c4',
  },
  A: {
    text: 'Zone A',
    color: '#f10000',
    hoverColor: '#d00000',
  },
  B1: {
    text: 'Zone B1',
    color: '#ffa600',
    hoverColor: '#d48b00',
  },
  B2: {
    text: 'Zone B2',
    color: '#abe300',
    hoverColor: '#96c700',
  },
  C: {
    text: 'Zone C',
    color: 'transparent',
    hoverColor: '#ccc',
  },
}

export {
  mapboxToken,
  apiAdresseUrl,
  dataFiles,
  mapConfig,
  itemsColors,
}
