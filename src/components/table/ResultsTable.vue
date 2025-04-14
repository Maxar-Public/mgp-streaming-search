<template>
  <v-container 
    v-if="showResults && featureList && featureList.length > 0"
    class="table-container"
  >

  <!-- Data Table -->
   
    <v-data-table
      height="100%"
      v-model:page="pagination.page"
      v-model:items-per-page="pagination.itemsPerPage"
      :items-per-page-options="itemsPerPageOptions"
      :headers="headers"
      :items="featureList"
      fixed-header
      item-value="id"
      disable-sort
      class="table"
    >
      
      <!-- Toolbar at the top -->
      <template v-slot:top>
        <v-card-title class="header">Results</v-card-title>
      </template>

      <!-- Custom row template -->
      <template #item="{ item }">
        <tr :class="{
              'selected-row': selectedFeature && selectedFeature.id === item.id,
              'hovered-row': hoveredFeature && hoveredFeature.id === item.id
            }"
            @click=" openPopup(item)"
            @mouseover="highlightImage(item)" 
            @mouseleave="unhighlightImage" 
            style="cursor: pointer" 
            :style="{ borderbottom: 'white' }"
        >
          <td>{{ item.id }}</td>
          <td>{{ item.sunElevation != null ? (Math.round(item.sunElevation * 100) / 100) + '°' : 'N/A' }}</td>
          <td>{{ item.cloudCover != null  ? (item.cloudCover * 100).toFixed(2) + '%' : 'N/A' }}</td>
        </tr>
      </template>
    </v-data-table>
    <ExportGeojson />
  </v-container>

  <!-- Metadata Popup Component -->
  <MetadataPopup 
    :selectedFeature="selectedFeature" 
    @popup-closed="unhighlightSelectedImage"
  />
</template>

<script>
import { reactive, watch, ref} from 'vue';
import MetadataPopup from './MetadataPopup.vue';
import ExportGeojson from './ExportGeojson.vue';
import { getData, saveData, removeData } from '@/stores/dataStore';

export default {
  components: {
    MetadataPopup,
    ExportGeojson
  },
  props: {
    featureList: {
      type: Array, // Changed to array since it is what v-data-table expects
      default: () => [],
    },
    showResults: {
      type: Boolean,
      default: () => false,
    },
    selectedImage: {
      type: Object,
      default: () => null,
    },
    highlightedImage: {
      type: Object,
      default: () => null,
    },
  },
  emits: ['feature-table-page', 'feature-table-items-per-page', 'highlight-image', 'unhighlight-image', 'highlight-selected-image', 'unhighlight-selected-image'],
  setup(props, {emit}) {
    const headers = ref([
      { title: 'Image ID', key: 'id' },
      { title: 'Sun Angle', key: 'sunElevation' },
      { title: 'Image CC', key: 'cloudCover' },
      
    ]);
    const pagination = reactive({
      page: getData('featureTablePage', 1),          // current page
      itemsPerPage: getData('featuresPerPage', 25), // items per page
    });
    const selectedFeature = ref(getData('selectedFeature'));
    const hoveredFeature = ref(null);
    const itemsPerPageOptions = ref([25, 50, 75, 100]);


    watch(() => pagination.page, (newPage) => {
      emit('feature-table-page', newPage);
    }, { immediate: true });

    watch(() => pagination.itemsPerPage, (newItemsPerPage) => {
      emit('feature-table-items-per-page', newItemsPerPage);
    }, { immediate: true });

    watch(() => props.showResults, () => {
      if(!props.showResults && selectedFeature) {
        selectedFeature.value = null;
      }
      if(!props.showResults){
        pagination.page = 1;
      }
    });

    watch(() => selectedFeature.value, (newFeature)=> {
        emit('highlight-selected-image', newFeature);
    }, { immediate: true });

    watch(() => props.selectedImage, (newFeature)=> {
        selectedFeature.value = newFeature;
        if(selectedFeature.value){
          saveData('selectedFeature', newFeature);
        }
        else {
          removeData('selectedFeature');
        }
    });

    //When image is highlighted by map interaction
    watch(() => props.highlightedImage, (newFeature)=> {
        hoveredFeature.value = newFeature;
    });
    
    const openPopup = (feature) => {
      if(selectedFeature.value != feature) {
        selectedFeature.value = feature;
        saveData('selectedFeature', feature);
      }
      else {
        unhighlightSelectedImage();
      }
    };

    const highlightImage = (feature) => {
      hoveredFeature.value = feature;
      emit('highlight-image', feature);
    }

    const unhighlightImage = () => {
      hoveredFeature.value = null;
      emit('unhighlight-image');
    }

    const unhighlightSelectedImage = () => {
      selectedFeature.value = null;
      removeData('selectedFeature');
      emit('unhighlight-selected-image');
    }
    
    return{
        pagination,
        headers,
        selectedFeature,
        hoveredFeature,
        itemsPerPageOptions,
        openPopup,
        unhighlightImage,
        highlightImage,
        unhighlightSelectedImage,
    }
  },
};
</script>

<style>
.table-container {
 display: flex;
 flex-direction: column;
 width: 600px;
 height: 100vh;
 justify-content: space-between;
 margin: 0;
 padding: 0;
}

.table {
  overflow: auto;
  background-color: #EEF2EC;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #cfcfcf;
  flex-grow: 1;
}

.table .v-data-table__wrapper {
  flex-grow: 1;
}

.table .v-data-footer {
  margin-top: auto;
}

.table tr {
  border-bottom: none !important;
}
.table td {
  border-bottom: none !important;
}

/* Custom hover color for table rows in Vuetify 3
.table tbody tr:hover {
  background-color:#BD00FF33 !important; 
} */

/* Highlighted row */
.selected-row {
  background-color: #BD00FF66 !important; 
}

.hovered-row {
  background-color:#BD00FF33 !important; 
}

/* Ensure hover does not override the selected row's style */
.selected-row:hover {
  background-color: #BD00FF66 !important; 
}

</style>