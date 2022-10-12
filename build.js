var fs = require('fs')

const zoneMapFile = './data/Zonage_abc_communes_2022-index.json'
const sourceFile = './data/georef-france-commune-simplified-geojson.json'
const destFile = './data/dist/georef-communes-with-zones.geojson'

let featureCollection = require(sourceFile)
console.log(`Commune Geojson file ${sourceFile} loaded`)
console.log(featureCollection.features.length, 'features to be enriched')

let parsedZones = require(zoneMapFile)
console.log(`Zone mapping file ${zoneMapFile} loaded`)

let countFound = 0

const originalFilesize = JSON.stringify(featureCollection).length;

for (const feature of featureCollection.features) {
  const zone = parsedZones[feature.properties.com_code]
  if (zone) {
    feature.properties.zonePinel = zone.zone
    countFound++
  }

  // keep only useful properties to reduce file size
  feature.properties = {
    zonePinel: feature.properties.zonePinel,
    dep_name: feature.properties.dep_name,
    dep_code: feature.properties.dep_code,
    com_code: feature.properties.com_code,
    com_name: feature.properties.com_name,
  }

  // reduce coordinates precision to a maximum of 6 decimals
  const precision = 1e5;
  if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates.length && feature.geometry.coordinates[0].length) {
    for (const coordinatesPair of feature.geometry.coordinates[0]) {
      coordinatesPair[0] = Math.round((coordinatesPair[0] + Number.EPSILON) * precision) / precision;
      coordinatesPair[1] = Math.round((coordinatesPair[1] + Number.EPSILON) * precision) / precision;
    }
  } else if (feature.geometry && feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates && feature.geometry.coordinates.length) {
    for (const polygon of feature.geometry.coordinates) {
      for (const coordinatesPair of polygon[0]) {
        coordinatesPair[0] = Math.round((coordinatesPair[0] + Number.EPSILON) * precision) / precision;
        coordinatesPair[1] = Math.round((coordinatesPair[1] + Number.EPSILON) * precision) / precision;
      }
    }
  }

}

console.log(`${countFound} features enriched; ${featureCollection.features.length - countFound} not found;`)

const finalFilesize = JSON.stringify(featureCollection).length;
console.log('Original file size: ', originalFilesize / 1e6, 'Optimized file size:', finalFilesize / 1e6);

fs.writeFileSync(destFile, JSON.stringify(featureCollection), 'utf8')

console.log(`Persisted to destination file: ${destFile}\nBye!`)
