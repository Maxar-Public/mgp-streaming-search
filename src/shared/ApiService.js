import errorStore from '../stores/errorStore'

//const baseUrl = "https://api.maxar.com/discovery/v1"
const baseUrl = "https://api.maxar.com"
const apiKey = import.meta.env.VITE_API_KEY;




//-----------------Endpoints-----------------------------------------------------------------//


//Sensor Titles
export const fetchSensors = () => {
    return [
        'WV01',
        'WV02',
        'WV03',
        'WV03_VNIR',
        'WV03_SWIR',
        'GE01',
        'QB02',
        'LG01',
        'LG02'
    ];
  };

// Fetch BBOX Results
export const fetchFeatures = async (filter) => {
    try {
        
        //Using GetFeature endpoint istead of Discovery Search endpoint
        const response = await fetch(`${baseUrl}/streaming/v1/ogc/wfs?service=WFS&request=GetFeature&version=2.0.0&srsName=EPSG:4326&typeNames=Maxar:FinishedFeature&outputFormat=application/json${filter}&maxar_api_key=${apiKey}&count=1000`, {
            method: 'GET'
        });

        if (!response.ok){           
            
            if(response.status === 408) throw new Error('Api call timeout, bbox area is too large');
            if(response.status === 401) throw new Error('Unauthorized, please insert a valid Api key in config'); //Currently not working due to CORS Issue
            if(response.status === 500) throw new Error('Internal API Error');
            else throw new Error('Bad Request');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        errorStore.addError({ 
            error: error.message,
            info: "Error fetching Features: ",  
            timestamp: new Date().toISOString()
        });
    }
};