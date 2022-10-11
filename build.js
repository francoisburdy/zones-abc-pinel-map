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

for (const feature of featureCollection.features) {
  const zone = parsedZones[feature.properties.com_code]
  if (zone) {
    feature.properties.zonePinel = zone.zone
    countFound++
  }
}

console.log(`${countFound} features enriched; ${featureCollection.features.length - countFound} not found;`)

fs.writeFileSync(destFile, JSON.stringify(featureCollection), 'utf8')

console.log(`Persisted to destination file: ${destFile}\nBye!`)
