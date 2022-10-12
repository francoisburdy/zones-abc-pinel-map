mapboxgl.accessToken = 'pk.eyJ1IjoiZnJhbmNvaXNidXJkeSIsImEiOiJjbDkzcWI0aTkxcGRtM25tdHRnOWUyd3d2In0.---5NR_DpITqvEiEZY-odw';

const { createApp } = Vue

createApp({
  data() {
    return {
      legendItems: {
        'Abis': { 'text': 'Zone A bis', 'color': '#9800e7', 'hoverColor': '#8300c4' },
        'A': { 'text': 'Zone A', 'color': '#f10000', 'hoverColor': '#d00000' },
        'B1': { 'text': 'Zone B1', 'color': '#ffa600', 'hoverColor': '#d48b00' },
        'B2': { 'text': 'Zone B2', 'color': '#abe300', 'hoverColor': '#96c700' },
        'C': { 'text': 'Zone C', 'color': 'transparent', 'hoverColor': '#ccc' },
      },
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
    }
  },
  mounted() {
    this.timing = performance.now();
    this.initMap();
  },
  methods: {
    initMap() {
      this.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [2.87, 46.7],
        zoom: 5.2,
        projection: 'globe',
        language: 'fr',
        attributionControl: false,
      });
      this.map
        .addControl(new mapboxgl.AttributionControl({
          customAttribution: 'par François Burdy &bull; <a href="https://github.com/francoisburdy/zones-abc-pinel-map" target="_blank" rel="noreferrer">GitHub</a>',
        }))
        .addControl(new mapboxgl.FullscreenControl({
          container: document.querySelector('body')
        }))
        .addControl(new mapboxgl.NavigationControl(), 'bottom-right')
      ;
      this.map
        .on('style.load', () => {
          this.map.setFog({});
        })
        .on('load', () => {
          console.log('load in ', (performance.now() - this.timing) + 'ms');
          this.makeLegend();
          this.map.addSource('communes', {
            type: 'geojson',
            data: './data/dist/georef-communes-with-zones.geojson',
            buffer: 0,
            tolerance: 0.45,
            generateId: true,
          });
          this.map.addLayer(this.communeLayer);
        })
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

    makeLegend() {
      const legend = document.getElementById('legend');
      for (key in this.legendItems) {
        const item = document.createElement('div');
        const round = document.createElement('span');
        round.className = 'legend-key';
        round.style.backgroundColor = this.legendItems[key].color;

        const value = document.createElement('span');
        value.innerHTML = `${this.legendItems[key].text}`;
        item.appendChild(round);
        item.appendChild(value);
        legend.appendChild(item);
      }
    },

    showMarker(lnglat, feature) {
      const props = feature.properties;
      new mapboxgl.Popup()
        .setLngLat(lnglat)
        .setHTML(
          `<strong>${props.com_name}</strong><br/>
           ${props.dep_name} (${props.dep_code})<br/>
           <span class="zone-badge zone-${props.zone.toLowerCase()}">Zone ${props.zone}</span><br/>
           Code INSEE ${props.com_code}`
        )
        .addTo(this.map);
    },

    setTyping() {
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
        axios.get(`https://api-adresse.data.gouv.fr/search/?limit=6&type=municipality&q=${this.searchQuery}`)
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
            'match', ['get', 'zone'],
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
              'match', ['get', 'zone'],
              'C',
              "rgba(0, 0, 0, 10%)",
              "rgba(0, 0, 0, 20%)"
            ],

        }
      }
    },
  }

}).mount('#app')

