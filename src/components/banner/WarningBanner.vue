<template>
    <div v-if="warningState.recentWarning" class="warning-banner"> 
        <div class="warning-content">
            <v-icon color="#FFC107" class="warning-icon">mdi-alert</v-icon>
            <p class="warning-text">{{warningState.recentWarning.info}}</p>
        </div>
        <v-card-actions>
            <v-btn text @click="clearRecentWarning" class="close-btn">
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </v-card-actions>
    </div>
</template>

<script setup>
    import warningStore from '@/stores/warningStore';
    const { warningState, clearRecentWarning } = warningStore;
</script>

<style scoped>
.warning-banner {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background-color: #FFFBE6; /* Light yellow background for warning */
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 50%;
  max-width: 80%;
  min-width: 300px;
  border-left: 4px solid #FFC107; /* Yellow border for emphasis */
}

.warning-content {
  display: flex;
  align-items: center;
}

.warning-text {
  font-size: 14px;
  font-weight: 400;
  color: black; /* Orange text for warning */
}

.warning-icon {
  margin-right: 20px;
  margin-left: 5px;
}

.close-btn {
  width: 30px;
  height: 28px; 
  min-width: 30px;
}

.v-card-actions {
  height: 30px; 
  min-height: auto;
}
</style>
