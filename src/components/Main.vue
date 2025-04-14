<template>
  <v-app>
      <v-container fluid>
        <div class="container">          
          <FilterPanel 
            @geojson-loaded="updateBBox" 
            @bbox-status="drawingBboxStatus" 
            @send-Feature-Data="updateFeatureList"
            :bbox="bbox"
            @show-results="showResultsUpdate"
            @clear-map="handleClearMap"
            @clear-polygons="handleClearPolygons"
            @payment-status="updatePaymentStatus"
          />
          <ResultsTable 
            :featureList="featureList"
            :showResults="showResults"
            :selectedImage="selectedFeature" 
            :highlightedImage="highlightedImage"
            @feature-table-page="updatePage"
            @feature-table-items-per-page="updateItemsPerPage"
            @highlight-image="highlightImage"
            @unhighlight-image="unhighlightImage"
            @highlight-selected-image="highlightSelectedImage"
            @unhighlight-selected-image="unhighlightSelectedImage"
          />
          <Map 
            :bbox="bbox" 
            :isDrawingBBOX="isDrawingBbox" 
            :featureTablePage="featureTablePage"
            :featuresPerPage="featuresPerPage"
            :featureList="featureList"
            :isHighlighted="isHighlighted"
            :highlightedFeature="highlightedFeature"
            :isSelectedHighlighted="isSelectedHighlighted"
            :selectedHighlightedFeature="selectedHighlightedFeature"
            :paymentStatus="paymentStatus"
            @bbox-status="drawingBboxStatus"
            @update-bbox="updateBBox"
            @selected-feature="updateSelectedFeature"
            @highlight-feature="highlightFeature"
            @unhighlight-feature="unhighlightFeature"
            ref="mapComponent"
          />            
         
        </div>
      </v-container>
  </v-app>
</template>

<script>
import { ref } from 'vue';
import ErrorBanner from './banner/ErrorBanner.vue';
import { getData, saveData } from '@/stores/dataStore';

export default {
  data() {
    return {
      isDrawingBbox: false,
      bbox: ref(getData('bbox', [])),
      paymentStatus: ref(getData('paymentStatus', true)),
      showResults: ref(getData('showResults', false)),
      featureList: ref([]),
      featureTablePage: ref(getData('featureTablePage', null)),
      featuresPerPage: ref(getData('featuresPerPage', null)),
      isHighlighted: ref(getData('isHighlighted', false)),
      highlightedFeature: ref(getData('highlightedFeature', null)),
      highlightedImage: ref(getData('highlightedImage', null)),
      isSelectedHighlighted: ref(getData('isSelectedHighlighted', false)),
      selectedHighlightedFeature: ref(getData('selectedHighlightedFeature', null)),
      selectedFeature: ref(getData('selectedFeature')),
    };
  },
  methods: {
    drawingBboxStatus(newStatus) {
      this.isDrawingBbox = newStatus;
    },
    updatePaymentStatus(newStatus) {
      this.paymentStatus = newStatus;
    },
    updateFreeMode(newFreeMode) {
      this.paymentStatus = newFreeMode;
    },// check if needed
    updateBBox(newBbox) {
      this.bbox = newBbox;
      saveData('bbox', newBbox);
    },
    updateFeatureList(newFeatureList) {
      this.featureList = newFeatureList;
    },
    updatePage(newPage){
      this.featureTablePage = newPage;
      saveData('featureTablePage', newPage);
    },
    updateItemsPerPage(newItemsPerPage){
      this.featuresPerPage = newItemsPerPage;
      saveData('featuresPerPage', newItemsPerPage);
    },
    highlightImage(feature){
      this.isHighlighted = true;
      this.highlightedFeature = feature;
      saveData('highlightedFeature', feature);
      saveData('isHighlighted', true);
    },
    unhighlightImage(){
      this.isHighlighted = false;
      saveData('isHighlighted', false);
    },
    highlightFeature(feature){
      this.highlightedImage = feature;
      saveData('highlightedImage', feature);
      saveData('isHighlighted', true);
    },
    unhighlightFeature(){
      this.highlightedImage = null;
      saveData('highlightedImage', null);
      saveData('isHighlighted', false);
    },
    showResultsUpdate(newResults) {
      this.showResults = newResults;
      saveData('showResults', newResults);
    },
    handleClearMap(){
      const mapComponent = this.$refs.mapComponent;
      if (mapComponent && mapComponent.clearMap) {
        mapComponent.clearMap();
      }
    },
    highlightSelectedImage(feature) {
      this.isSelectedHighlighted = true;
      this.selectedHighlightedFeature = feature;
    }
    ,
    unhighlightSelectedImage() {
      this.isSelectedHighlighted = false;
    },
    updateSelectedFeature(feature) {
      this.selectedFeature = feature;
    },
    handleClearPolygons() {
      const mapComponent = this.$refs.mapComponent;
      if (mapComponent && mapComponent.clearPolygons) {
        mapComponent.clearPolygons();
      }
    },
    fetchMetadata() {
      const metadata = getData('metadata', []);

      if (!Array.isArray(this.featureList.value)) {
        this.featureList.value = [];
      }
      
      if (metadata && metadata.features) {
        metadata.features.forEach(feature => {
          this.featureList.value.push({
            id: feature.id,
            sunElevation: feature.properties.sunElevation,
            cloudCover: feature.properties.cloudCover, 
            metadata: feature,
          });
        });
        this.updateFeatureList(this.featureList.value);
      } else {
        this.showResultsUpdate(false);
      }
    },
  },
  watch: {
    // Watch for changes to paymentStatus and save to session storage
    paymentStatus: {
      handler(newValue) {
        saveData('paymentStatus', newValue); // Persist changes
      },
      immediate: true, // Trigger on initialization
    },
  },
  mounted() {
    this.fetchMetadata();
  },
}
</script>

<style scoped>
.v-application, .v-application--wrap, .v-container, .v-row, .v-col {
  margin: 0;
  padding: 0;   
}

.container {
  display: flex;
  flex-direction: row;
}
</style>