// --- Configuration ---
const API_KEY = 'e9735fb5da6ec9c52acb1e5e18c7e3ad'; // Replace with your actual API key
const BASE_URL_CURRENT = 'https://api.openweathermap.org/data/2.5/weather';
// BASE_URL_FORECAST is removed as forecast is no longer used

// --- DOM Elements ---
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const cityNameElem = document.getElementById('city-name');
const dateElem = document.getElementById('date');
const weatherIconElem = document.getElementById('weather-icon');
const temperatureElem = document.getElementById('temperature');
const descriptionElem = document.getElementById('description');
const humidityElem = document.getElementById('humidity');
const windSpeedElem = document.getElementById('wind-speed');
const pressureElem = document.getElementById('pressure'); 
const errorMessageElem = document.getElementById('error-message');
const loadingSpinnerElem = document.getElementById('loading-spinner');

// currentUnit variable is fixed to Celsius
const currentUnit = 'metric';

let currentWeatherData = null; // To store the fetched current weather data

// --- Helper Functions ---
const showElement = (element) => element.classList.remove('hidden');
const hideElement = (element) => element.classList.add('hidden');

const displayError = (message) => {
    errorMessageElem.textContent = message;
    showElement(errorMessageElem);
    hideElement(loadingSpinnerElem);
    // Clear weather display on error
    cityNameElem.textContent = '';
    temperatureElem.textContent = '';
    descriptionElem.textContent = '';
    humidityElem.textContent = '';
    windSpeedElem.textContent = '';
    pressureElem.textContent = '';
    weatherIconElem.src = '';
    // No longer clearing forecastContainer here
};

const clearError = () => hideElement(errorMessageElem);

const showLoading = () => showElement(loadingSpinnerElem);
const hideLoading = () => hideElement(loadingSpinnerElem);

const getIconUrl = (iconCode) => `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

// formatTemperature is simplified to only return Celsius
const formatTemperature = (temp) => {
    return `${Math.round(temp)}°C`;
};

// --- Fetching Weather Data ---

async function fetchWeatherData(query) {
    showLoading();
    clearError();

    try {
        // Only fetch current weather data
        const currentResponse = await fetch(`${BASE_URL_CURRENT}?${query}&appid=${API_KEY}&units=metric`);

        if (!currentResponse.ok) {
            if (currentResponse.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            }
            throw new Error('Failed to fetch weather data. Please try again later.');
        }

        currentWeatherData = await currentResponse.json();
        displayCurrentWeather(currentWeatherData);

    } catch (error) {
        console.error('Error fetching weather data:', error);
        displayError(error.message);
    } finally {
        hideLoading();
    }
}

// --- Displaying Weather Data ---

function displayCurrentWeather(data) {
    const { name, dt, main, weather, wind, sys } = data;
    const currentDate = new Date(dt * 1000); // Convert Unix timestamp to milliseconds

    cityNameElem.textContent = `${name}, ${sys.country}`;
    dateElem.textContent = currentDate.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    weatherIconElem.src = getIconUrl(weather[0].icon);
    weatherIconElem.alt = weather[0].description;
    temperatureElem.textContent = formatTemperature(main.temp);
    descriptionElem.textContent = weather[0].description;
    humidityElem.textContent = `${main.humidity}%`;
    windSpeedElem.textContent = `${wind.speed} m/s`; // Wind speed fixed to m/s (metric unit)
    pressureElem.textContent = `${main.pressure} hPa`;
}

// displayForecast function is entirely removed

// --- Event Listeners ---

searchButton.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(`q=${city}`);
    } else {
        displayError('Please enter a city name.');
    }
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

