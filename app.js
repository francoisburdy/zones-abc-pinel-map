mapboxgl.accessToken = 'pk.eyJ1IjoiZnJhbmNvaXNidXJkeSIsImEiOiJjbDkzcWI0aTkxcGRtM25tdHRnOWUyd3d2In0.---5NR_DpITqvEiEZY-odw';

const { createApp } = Vue

createApp({
  data() {
    return {
      legendItems: {
        'Abis': { 'text': 'Zone A bis', 'color': '#cd00b2' },
        'A': { 'text': 'Zone A', 'color': '#f10000' },
        'B1': { 'text': 'Zone B1', 'color': '#ff9900' },
        'B2': { 'text': 'Zone B2', 'color': '#b2ec00' },
        'C': { 'text': 'Zone C', 'color': 'transparent' },
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
          this.map.addSource('communes', {
            type: 'geojson',
            data: './data/dist/georef-communes-with-zones.geojson',
            buffer: 0,
            tolerance: 0.5,
          });
          this.map.addLayer(this.communeLayer);
        })
        .on('click', 'communes-layer', (e) => {
          this.showMarker(e.lngLat, e.features[0]);
        })
        .on('mouseenter', 'communes-layer', () => {
          this.map.getCanvas().style.cursor = 'pointer';
        })
        .on('mouseleave', 'communes-layer', () => {
          this.map.getCanvas().style.cursor = '';
        })
        .on('idle', () => {
          this.showLoader = false;
          console.log('idle in ', (performance.now() - this.timing) + 'ms');
        });
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
      }, 400)
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
        zoom: 10,
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
        'paint': {
          'fill-color': [
            'match', ['get', 'zone'],
            'Abis', this.legendItems.Abis.color,
            'A', this.legendItems.A.color,
            'B1', this.legendItems.B1.color,
            'B2', this.legendItems.B2.color,
            this.legendItems.C.color
          ],
          'fill-opacity': 0.7,
          'fill-outline-color':
            [
              'match', ['get', 'zone'],
              'C', "rgba(0, 0, 0, 10%)",
              "rgba(0, 0, 0, 20%)"
            ],

        }
      }
    },
  }

}).mount('#app')

