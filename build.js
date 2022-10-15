import { mkdir, readFile, writeFile } from 'fs/promises'
import { dataFiles } from './vars.js'

const log = console.log

const roundCoordinates = (latLng, precision = 1e3) => {
  latLng[0] = Math.round((latLng[0] + Number.EPSILON) * precision) / precision
  latLng[1] = Math.round((latLng[1] + Number.EPSILON) * precision) / precision
}

const featureCollection = JSON.parse(await readFile(dataFiles.original, 'utf8'))
log(`Commune Geojson file ${dataFiles.original} loaded`)

const parsedZones = JSON.parse(await readFile(dataFiles.zoneMapping, 'utf8'))
log(`Zone mapping file ${dataFiles.zoneMapping} loaded`)

let countFound = 0

const originalFilesize = JSON.stringify(featureCollection).length

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

  // reduce coordinates precision to a maximum of 10^-3
  if (feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates && feature.geometry.coordinates.length && feature.geometry.coordinates[0].length) {
    for (const point of feature.geometry.coordinates[0]) {
      roundCoordinates(point, 1e3)
    }
  } else if (feature.geometry && feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates && feature.geometry.coordinates.length) {
    for (const polygon of feature.geometry.coordinates) {
      for (const point of polygon[0]) {
        roundCoordinates(point, 1e3)
      }
    }
  }
}

log(countFound, 'features enriched\t', featureCollection.features.length - countFound, 'not found')

const filteredFeatureCollection = JSON.parse(JSON.stringify(featureCollection))
filteredFeatureCollection.features = filteredFeatureCollection.features.filter(function(feature) {
  return feature.properties.z !== 'C'
})

await mkdir('./dist/data', { recursive: true })
await writeFile(`./dist/${dataFiles.dest}`, JSON.stringify(featureCollection), 'utf8')
await writeFile(`./dist/${dataFiles.destLight}`, JSON.stringify(filteredFeatureCollection), 'utf8')

log(`\nOriginal file:\t${originalFilesize / 1e6} Mo\t${dataFiles.original}`)
log(`Optimized file:\t${JSON.stringify(featureCollection).length / 1e6} Mo\tdist/${dataFiles.dest}`)
log(`Filtered file:\t${JSON.stringify(filteredFeatureCollection).length / 1e6} Mo\tdist/${dataFiles.destLight}`)

log('\nDone!')
