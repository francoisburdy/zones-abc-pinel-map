import { apiAdresseUrl, dataFiles, itemsColors, mapboxToken, mapConfig } from "../vars.js"
import mapboxgl from 'mapbox-gl'
import { createApp } from 'vue'
import axios from 'axios'

import '../favicon.png'

mapboxgl.accessToken = mapboxToken;

const layerId = 'communes-layer'
const sourceId = 'communes'

createApp({
  data() {
    return {
      legendItems: itemsColors,
      searchQuery: "",
      isTyping: false,
      searchResults: [],
      hasResults: false,
      isLoading: false,
      intervalSearch: null,
      chosenAddress: null,
      showAboutBox: true,
      timing: 0,
      showLoader: true,
      hoveredCommuneId: null,
      lightMode: true,
    }
  },
  mounted() {
    this.timing = performance.now();
    this.initMap();
  },
  methods: {
    initMap() {
      this.map = new mapboxgl.Map(mapConfig);
      this.map
        .addControl(new mapboxgl.AttributionControl({
          customAttribution: `par François Burdy &bull; 
          <a href="https://github.com/francoisburdy/zones-abc-pinel-map" target="_blank" rel="noreferrer">GitHub</a>`,
        }))
        .addControl(new mapboxgl.NavigationControl(), 'bottom-right')
        .addControl(new mapboxgl.FullscreenControl({
          container: document.querySelector('body')
        }), 'bottom-right')
      ;
      this.map
        .on('style.load', () => {
          this.map.setFog({});
        })
        .on('load', this.loadFeatures)
        .on('click', 'communes-layer', (e) => {
          this.showMarker(e.lngLat, e.features[0]);
        })
        .on('mousemove', 'communes-layer', (e) => {
          if (e.features.length > 0) {
            if (this.hoveredCommuneId !== null) {
              this.map.setFeatureState(
                { source: 'communes', id: this.hoveredCommuneId },
                { hover: false }
              );
            }
            this.hoveredCommuneId = e.features[0].id;
            this.map.setFeatureState(
              { source: 'communes', id: this.hoveredCommuneId },
              { hover: true }
            );
          }
        })
        .on('mouseenter', 'communes-layer', () => {
          this.map.getCanvas().style.cursor = 'pointer';
        })
        .on('mouseleave', 'communes-layer', () => {
          this.map.getCanvas().style.cursor = '';
          if (this.hoveredCommuneId !== null) {
            this.map.setFeatureState(
              { source: 'communes', id: this.hoveredCommuneId },
              { hover: false }
            );
          }
          this.hoveredCommuneId = null;
        })
        .on('idle', () => {
          if (this.showLoader) {
            console.log('idle in ', (performance.now() - this.timing) + 'ms');
            this.showLoader = false;
          }
        });
    },

    loadFeatures() {
      console.log('load in ', (performance.now() - this.timing) + 'ms');
      if (this.map.getLayer('communes-layer')) {
        this.map.removeLayer('communes-layer')
      }
      if (this.map.getSource('communes')) {
        this.map.removeSource('communes')
      }
      this.map.addSource('communes', {
        type: 'geojson',
        data: this.lightMode ? dataFiles.destLight : dataFiles.dest,
        buffer: 0,
        tolerance: 0.45,
        generateId: true,
      });
      this.map.addLayer(this.communeLayer);
    },

    showMarker(lnglat, feature) {
      const props = feature.properties;
      new mapboxgl.Popup()
        .setLngLat(lnglat)
        .setHTML(
          `<strong>${props.cn}</strong><br/>
           ${props.dn} (${props.dc})<br/>
           <span class="zone-badge zone-${props.z.toLowerCase()}">Zone ${props.z}</span><br/>
           Code INSEE ${props.cc}`
        )
        .addTo(this.map);
    },

    switchMode() {
      this.showLoader = true
      this.lightMode = !this.lightMode
      this.loadFeatures()
    },

    setTyping() {
      this.showAboutBox = false
      this.isTyping = true;
      clearInterval(this.intervalSearch);
      this.intervalSearch = setTimeout(() => {
        this.search();
      }, 350)
    },

    search() {
      console.log('search...', this.searchQuery)
      this.isTyping = false
      if (this.searchQuery.length >= 3) {
        this.isLoading = true;
        axios.get(`${apiAdresseUrl}&q=${this.searchQuery}`)
          .then(response => {
            this.isLoading = false;
            this.searchResults = response.data.features;
            this.hasSearchResults();
          })
          .catch(thrown => {
            this.isLoading = false;
            console.error(thrown);
          });
      } else {
        this.searchResults = [];
        this.hasSearchResults();
      }
    },

    hasSearchResults() {
      this.hasResults = this.searchResults && this.searchResults.length;
    },

    addressChange() {
      this.moveToAddress();
      this.clearSearch();
      this.searchQuery = this.chosenAddress.properties.label;
    },

    clearSearch() {
      this.searchQuery = '';
      this.searchResults = null;
    },

    moveToAddress() {
      let coordinates = this.chosenAddress.geometry.coordinates;
      this.map.flyTo({
        center: [coordinates[0], coordinates[1]],
        zoom: 9.7,
        essential: true,
      });
      this.map.once('moveend', () => {
        let center = this.map.getCenter();
        this.map.fire('click', { lngLat: center, point: this.map.project(center) })
      })
    },
  },
  computed: {
    communeLayer() {
      return {
        'id': 'communes-layer',
        'type': 'fill',
        'source': 'communes',
        'layout': {},
        'paint': {
          'fill-color': [
            'match', ['get', 'z'],
            'Abis', [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              this.legendItems.Abis.hoverColor,
              this.legendItems.Abis.color,
            ],
            'A', [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              this.legendItems.A.hoverColor,
              this.legendItems.A.color,
            ],
            'B1', [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              this.legendItems.B1.hoverColor,
              this.legendItems.B1.color,
            ],
            'B2', [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              this.legendItems.B2.hoverColor,
              this.legendItems.B2.color,
            ],
            [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              this.legendItems.C.hoverColor,
              this.legendItems.C.color,
            ]
          ],
          'fill-opacity': 0.68,
          'fill-outline-color':
            [
              'match', ['get', 'z'],
              'C',
              "rgba(0, 0, 0, 10%)",
              "rgba(0, 0, 0, 20%)"
            ],

        }
      }
    },
  }

}).mount('#app')

