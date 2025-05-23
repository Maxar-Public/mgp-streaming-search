<template>
  <div>
    <v-card class="sidebar">
      <v-card-title class="text-black title-bar">Streaming search
        <v-spacer></v-spacer> 
        <v-switch class="freeModeSwitch"
          v-model="paymentStatus"
          inset
          dense 
          color="success"
        >
            <template v-slot:label>
              <div class="switch-label" :style="{ color: paymentStatus ? 'green' : 'grey'}">
                Free
              </div>
            </template>
        </v-switch>     
      </v-card-title>      
      <v-card-text class="text-black">
        <!-- Buttons -->
        <v-card-actions class="action-buttons-top">
          <v-card-text style="padding: 0px; flex: none;">Area</v-card-text>
          <UploadGeojson @geojson-loaded="onGeoJsonLoaded" :disableButton="loading" />
          <v-btn size="small" variant="tonal"
            @click="startDrawingBbox"
            :disabled="loading">
            DRAW
          </v-btn>
        </v-card-actions>    

        <!-- Date range from -->
        <v-text-field
          v-model="dateRangeFrom"
          label="Date from"
          type="date"
          :max="dateRangeTo || maxDate"
          variant="underlined"
          :disabled="loading"
        ></v-text-field>

        <!-- Date range to -->
        <v-text-field
          v-model="dateRangeTo"
          label="Date to"
          type="date"
          :min="dateRangeFrom"
          :max="maxDate"
          variant="underlined"
          :disabled="loading"
        ></v-text-field>

        <!-- Sun Angle -->
        <v-text-field
          v-model="sunElevation"
          label="Sun Angle"
          variant="underlined"
          placeholder="Value must be between 0 and 90"
          :disabled="loading"
          type="number"
          :rules="[v => validateSunAngle(v)]"
          :step="0.01"
          @keypress="restrictInput"
        ></v-text-field>
        

        <!-- Image cloud coverage -->
        <v-text-field
          v-model="imageCloudCoverage"
          label="Image cloud coverage"
          variant="underlined"
          placeholder="Enter a value between 0 and 100"
          :disabled="loading"
          type="number"
          :rules="[v => validateCloudCoverage(v)]"
          :step="0.01"
          @keypress="restrictInput"
        ></v-text-field>

        <!-- Off nadir angle -->
        <v-text-field
          v-model="offNadirAngle"
          label="Off nadir angle"
          variant="underlined"
          placeholder="Enter a value between 0 and 90"
          :disabled="loading"
          type="number"
          :rules="[v => validateOffNadirAngle(v)]"
          :step="0.01"
          @keypress="restrictInput"
        ></v-text-field>

        <!-- Sensor -->
        <v-label 
          style="font-size: 16px; font-weight: 400;  height: 20px; display: block;">
          Sensor
        </v-label>
        <v-container fluid class="sensor-container">
          <v-row class="tight-row">
            <v-col
              cols="4"
              v-for="(sensorItem, index) in sensorItems"
              :key="sensorItem.key"
              class="tight-col"
            >
              <v-checkbox
                v-model="sensor"
                :value="sensorItem"
                :disabled="loading"
                hide-details
                dense
                class="tight-spacing"
              >
                <template v-slot:label>
                  <span
                    :style="{ color: sensor.includes(sensorItem) ? '#000000' : '#9e9e9e' }"
                    class="sensor-text"
                  >
                    {{ sensorItem }}
                  </span>
                </template>
              </v-checkbox>
            </v-col>
          </v-row>
        </v-container>

      </v-card-text>

      <!-- Action buttons -->
      <v-card-actions class="action-buttons-bottom">
        <v-btn size="small" 
          @click="clearAll" 
          :disabled="loading || isBboxEmpty"
          :style="clearAllButtonStyle"
        >
          CLEAR ALL
        </v-btn>
        <v-btn size="small" variant="flat" 
          @click="runFilter" 
          :disabled="loading || isBboxEmpty"
          :style="runButtonStyle"
        >
          <v-progress-circular
            v-if="loading"
            indeterminate
            color="white"
            :size="20"
          ></v-progress-circular>
          <span v-else>RUN</span>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- No Features Popup -->
    <v-dialog v-model="showPopup" max-width="600px">
      <v-card>
        <v-card-text>
          <div class="centered-box">
            {{ popupMessage }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="black darken-1" text size="small" @click="showPopup = false; popupMessage=''">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import UploadGeoJson from './UploadGeojson';
import { fetchFeatures, fetchSensors } from "@/shared/ApiService.js";
import { saveData, getData, clearAllData, removeData } from '@/stores/dataStore';
import DownloadLogs from '../banner/DownloadLogs.vue';
import errorStore from '../../stores/errorStore';
import infoStore from '@/stores/infoStore';

export default {
  components: {
    UploadGeoJson,
    DownloadLogs,
  },
  props: {
    bbox: {
      type: Array,
      default: () => null,
    },
  },
  setup(props, { emit }) {
    const today = new Date().toISOString().split('T')[0];
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoString = oneYearAgo.toISOString().split('T')[0];
    const dateRangeFrom = ref(getData('dateRangeFrom', oneYearAgoString));
    const dateRangeTo = ref(getData('dateRangeTo', today));
    const imageCloudCoverage = ref(getData('imageCloudCoverage', ""));
    const offNadirAngle = ref(getData('offNadirAngle', ""));
    const sunElevation = ref(getData('sunElevation', ""))
    const sensor = ref(getData('sensor', []));
    const sensorItems = ref([]);
    const featureList = ref([]);
    const showPopup = ref(false);
    const popupMessage = ref("");
    const loading = ref(false);
    const isBboxEmpty = ref(true);
    const paymentStatus = ref(getData('paymentStatus', true));

    const setBbox = (newBbox) => {
      if (newBbox && newBbox.length > 0) {
        isBboxEmpty.value = false; // Bbox has been set
      } else {
        isBboxEmpty.value = true; // Bbox is empty
      }
    };

    // Fetching sensors and setting default selection to all
    onMounted(async () => {
      try {
        const sensorTitles = fetchSensors();
        sensorItems.value = sensorTitles;

        // Set all sensors as selected by default
        const savedSensorData = getData('sensor', []);
        if (savedSensorData === null || savedSensorData.length === 0) {
          sensor.value = sensorItems.value;
        } else {
          sensor.value = savedSensorData;
        }
      } catch (error) {
        errorStore.addError({
            error: error.message,
            info: "Error fetching Sensors: ",  
            timestamp: new Date().toISOString()
        });
      }

        if (!dateRangeFrom.value) {
          dateRangeFrom.value = oneYearAgoString;
        }
        if (!dateRangeTo.value) {
          dateRangeTo.value = today;
        }

        watch(dateRangeFrom, (newValue) => {
          saveData('dateRangeFrom', newValue);
        });

        watch(dateRangeTo, (newValue) => {
          saveData('dateRangeTo', newValue);
        });

        watch(imageCloudCoverage, (newValue) => {
          saveData('imageCloudCoverage', newValue);
        });

        watch(offNadirAngle, (newValue) => {
          saveData('offNadirAngle', newValue);
        });

        watch(sunElevation, (newValue) => {
          saveData('sunElevation', newValue);
        });

        watch(sensor, (newValue) => {
          saveData('sensor', newValue);
        });

        watch(() => props.bbox, (newBbox) => {
          setBbox(newBbox);
        }, { immediate: true });

        watch(paymentStatus, (newValue) => {
          saveData('paymentStatus', newValue);
          emit('payment-status', newValue);
        });
    });

    const validateSunAngle = (value) => {
      if (value === null || value === '') return true;
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (num < 0 || num > 90) return 'Value must be between 0 and 90';
      return true;
    }

    const validateCloudCoverage = (value) => {
      if (value === null || value === '') return true;
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (num < 0 || num > 90) return 'Value must be between 0 and 90';
      return true;
    }

    const validateOffNadirAngle = (value) => {
      if (value === null || value === '') return true; // Not required
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (num < 0 || num > 90) return 'Value must be between 0 and 90';
      return true;
    }

    const restrictInput = (event) => {
      if (!/[0-9.]|\b/.test(event.key) || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
      }
    }

    const onGeoJsonLoaded = (bbox) => {
      emit("clear-map");
      emit('send-Feature-Data', []);
      clearAllData();
      emit('show-results', false);
      emit('geojson-loaded', bbox); // Re-emit the event to the parent (Main component)
      infoStore.clearRecentInfo(); 
    };

    const clearAll = () => {
      dateRangeFrom.value = oneYearAgoString;
      dateRangeTo.value = today;
      imageCloudCoverage.value = "";
      offNadirAngle.value = "";
      sunElevation.value = "";
      sensor.value = sensorItems.value;
      featureList.value = [];
      setBbox([]);
      clearAllData();
      emit("clear-map");
      emit('send-Feature-Data', []);
      emit('show-results', false);
    };

   

    const runFilter = () => {
      if (!dateRangeFrom.value || !dateRangeTo.value) {
        showPopup.value = true;
        popupMessage.value = "Please select both Date From and Date To";
        return;
      }

      if (!props.bbox || !props.bbox.length) {
        showPopup.value = true;
        popupMessage.value = "Draw bbox or upload geojson";
        return;
      }

      if (!sensor.value || sensor.value.length === 0) {
        showPopup.value = true;
        popupMessage.value = "Please select sensors.";
        return;
      }

      const sunElevationValidation = validateSunAngle(sunElevation.value);
      if (sunElevationValidation !== true) {
        showPopup.value = true;
        popupMessage.value = `Sun Angle: ${sunElevationValidation}`;
        return;
      }

      const imageCloudValidation = validateCloudCoverage(imageCloudCoverage.value);
      if (imageCloudValidation !== true) {
        showPopup.value = true;
        popupMessage.value = `Image Cloud Coverage: ${imageCloudValidation}`;
        return;
      }

      const offNadirValidation = validateOffNadirAngle(offNadirAngle.value);
      if (offNadirValidation !== true) {
        showPopup.value = true;
        popupMessage.value = `Off Nadir Angle: ${offNadirValidation}`;
        return;
      }
      const selectedSensorsString = `source in (${sensor.value.map(item => `'${item}'`).join(', ')})`;

      let filter = `bbox(featureGeometry,${props.bbox[1]},${props.bbox[0]},${props.bbox[3]},${props.bbox[2]}) AND (acquisitionDate>=${dateRangeFrom.value})AND(acquisitionDate<=${dateRangeTo.value}) AND (${selectedSensorsString})`;
      
      if (sunElevation.value) {
        filter += `AND sunElevation <= ${sunElevation.value}`;
      }

      if (imageCloudCoverage.value) {
        if (filter) filter += ' AND ';
        filter += `cloudCover <= ${imageCloudCoverage.value}`;
      }
      
      if (offNadirAngle.value) {
        if (filter) filter += ' AND ';
        filter += `offNadirAngle <= ${offNadirAngle.value}`;
      }

      let filterQuery = filter ? `&cql_filter=${filter}` : '';
      const dateFromFormatted = `${dateRangeFrom.value}T00:00:00Z`;
      const dateToFormatted = `${dateRangeTo.value}T00:00:00Z`;
      const datetimeRange = `${dateFromFormatted}/${dateToFormatted}`;
      
      featureList.value = [];
      emit('clear-polygons');
      emit('show-results', false);
      loading.value = true;

      fetchFeatures(filterQuery).then(data => {
        featureList.value = [];
        try {
          data.features.forEach(feature => {
            featureList.value.push({
              id: feature.id,
              sunElevation: feature.properties.sunElevation,
              cloudCover: feature.properties.cloudCover, 
              metadata: feature,  
            });
          });
          saveData('metadata', data);

          if (!data.features.length) {
            showPopup.value = true;
            popupMessage.value = "No result found";
          } else {
            emit('send-Feature-Data', featureList.value);
            emit('show-results', true);
          }
          loading.value = false;
        } catch (error) {
          loading.value = false;
          errorStore.addError({ 
            error: error.message,
            info: "Error: An issue occurred while fetching data.",
            timestamp: new Date().toISOString()
          });
        }
      });
    };

    const runButtonStyle = computed(() => {
      return isBboxEmpty.value ? {} : { backgroundColor: '#424242', color: 'white' };
    });

    const clearAllButtonStyle = computed(() => {
      return isBboxEmpty.value ? {} : { color: '#424242' };
    });
    
    return {
      today,
      oneYearAgoString, 
      dateRangeFrom,
      dateRangeTo,
      imageCloudCoverage,
      offNadirAngle,
      sunElevation,
      sensor,
      sensorItems,
      maxDate: today,
      clearAll,
      runFilter,
      showPopup,
      popupMessage,
      loading,
      onGeoJsonLoaded,
      errorState: errorStore.errorState,
      isBboxEmpty,
      paymentStatus,
      runButtonStyle,
      clearAllButtonStyle,
      validateSunAngle,
      validateOffNadirAngle,
      validateCloudCoverage,
      restrictInput,
      infoState: infoStore.infoState,
    };
  },
  methods:{
    startDrawingBbox() {
      this.$emit('bbox-status', true);
      this.$emit('send-Feature-Data', []);
      this.$emit('show-results', false);
      removeData('metadata');
      removeData('bbox');
      removeData('featureTablePage');
      removeData('featuresPerPage');
    }
  }
};
</script>

<style scoped>
.sidebar {
  width: 350px;
  height: 100vh;
  overflow: auto;
  background-color: #EEF2EC;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #cfcfcf;
}

.action-buttons-top {
  display: flex;
  justify-content: start;
  padding: 0px;
}

.action-buttons-bottom {
  justify-content: space-between;
  display: flex;
  margin: 0px 10px;
}

.title-bar {
  display: flex;
  align-items: left;
  justify-content: space-between;
}

.tight-row {
  margin: 0;
  padding: 0;
}

.tight-col {
  margin: 0;
  padding: 0;
}

.sensor-text {
  font-weight: 500;
  font-size: 11.5px; 
}

.sensor-container {
    width: 100%;
    padding: 0px;
    margin-right: auto;
    margin-left: auto;
}

.freeModeSwitch {
  align-items: left;
  margin-top: -15px;
}
</style>
