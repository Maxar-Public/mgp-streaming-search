import { reactive } from "vue";

const warningState = reactive({
    recentWarning: null,
});

const addWarning = (warning) => {
    warningState.recentWarning = warning;
};

const clearRecentWarning = () => {
    warningState.recentWarning = null;
};

export default {
    warningState,
    addWarning,
    clearRecentWarning,
};
