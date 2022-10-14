import { mkdir, readFile, writeFile } from 'fs/promises';
import { dataFiles } from './vars.js'


let featureCollection = JSON.parse(await readFile(dataFiles.original, "utf8"))
console.log(`Commune Geojson file ${dataFiles.original} loaded`)

let parsedZones = JSON.parse(await readFile(dataFiles.zoneMapping, "utf8"))
console.log(`Zone mapping file ${dataFiles.zoneMapping} loaded`)

let countFound = 0

const originalFilesize = JSON.stringify(featureCollection).length;

for (const feature of featureCollection.features) {
  const zone = parsedZones[feature.properties.com_code]
  if (zone) {
    feature.properties.zone = zone.zone
    countFound++
  }

  // keep only useful properties to reduce file size
  feature.properties = {
    z: feature.properties.zone,
    dn: feature.properties.dep_name,
    dc: feature.properties.dep_code,
    cc: feature.properties.com_code,
    cn: feature.properties.com_name,
  }

  // reduce coordinates precision to a maximum of 6 decimals
  const precision = 1e3;
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

console.log(countFound, `features enriched\t`, featureCollection.features.length - countFound, `not found`)

const filteredFeatureCollection = JSON.parse(JSON.stringify(featureCollection));
filteredFeatureCollection.features = filteredFeatureCollection.features.filter(function(feature) {
  return feature.properties.z !== 'C'
});

const finalFilesize = JSON.stringify(featureCollection).length;
const filteredFileSize = JSON.stringify(filteredFeatureCollection).length;

await mkdir('./dist/data', { recursive: true })
await writeFile(`./dist/${dataFiles.dest}`, JSON.stringify(featureCollection), 'utf8')
await writeFile(`./dist/${dataFiles.destLight}`, JSON.stringify(filteredFeatureCollection), 'utf8')

console.log(`\nOriginal file:\t${originalFilesize / 1e6} Mo\t${dataFiles.original}`)
console.log(`Optimized file:\t${finalFilesize / 1e6} Mo\tdist/${dataFiles.dest}`)
console.log(`Filtered file:\t${filteredFileSize / 1e6} Mo\tdist/${dataFiles.destLight}`)

console.log('\nBye!')
