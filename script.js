// --- Configuration ---
const API_KEY = 'e9735fb5da6ec9c52acb1e5e18c7e3ad'; // Replace with your actual API key
const BASE_URL_CURRENT = 'https://api.openweathermap.org/data/2.5/weather';
const BASE_URL_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast';

// --- DOM Elements ---
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const locationButton = document.getElementById('location-button');
const cityNameElem = document.getElementById('city-name');
const dateElem = document.getElementById('date');
const weatherIconElem = document.getElementById('weather-icon');
const temperatureElem = document.getElementById('temperature');
const descriptionElem = document.getElementById('description');
const humidityElem = document.getElementById('humidity');
const windSpeedElem = document.getElementById('wind-speed');
const pressureElem = document = document.getElementById('pressure');
const forecastContainer = document.querySelector('.forecast-cards-container');
const errorMessageElem = document.getElementById('error-message');
const loadingSpinnerElem = document.getElementById('loading-spinner');
// Removed reference to tempUnitRadios as there's no toggle needed
// const tempUnitRadios = document.querySelectorAll('input[name="temp-unit"]');

// Removed currentUnit variable as it's now fixed
// let currentUnit = 'metric'; // 'metric' for Celsius, 'imperial' for Fahrenheit
const currentUnit = 'metric'; // Fixed to Celsius

let currentWeatherData = null; // To store the fetched current weather data
let forecastWeatherData = null; // To store the fetched forecast data

// --- Helper Functions ---
const showElement = (element) => element.classList.remove('hidden');
const hideElement = (element) => element.classList.add('hidden');

const displayError = (message) => {
    errorMessageElem.textContent = message;
    showElement(errorMessageElem);
    hideElement(loadingSpinnerElem);
    // Optionally clear weather display
    cityNameElem.textContent = '';
    temperatureElem.textContent = '';
    descriptionElem.textContent = '';
    humidityElem.textContent = '';
    windSpeedElem.textContent = '';
    pressureElem.textContent = '';
    weatherIconElem.src = '';
    forecastContainer.innerHTML = '';
};

const clearError = () => hideElement(errorMessageElem);

const showLoading = () => showElement(loadingSpinnerElem);
const hideLoading = () => hideElement(loadingSpinnerElem);

const getIconUrl = (iconCode) => `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

// Simplified formatTemperature to only return Celsius
const formatTemperature = (temp) => {
    return `${Math.round(temp)}°C`;
};

// --- Fetching Weather Data ---

async function fetchWeatherData(query) {
    showLoading();
    clearError();

    try {
        const [currentResponse, forecastResponse] = await Promise.all([
            // Units parameter is now always 'metric'
            fetch(`${BASE_URL_CURRENT}?${query}&appid=${API_KEY}&units=metric`),
            fetch(`${BASE_URL_FORECAST}?${query}&appid=${API_KEY}&units=metric`)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            if (currentResponse.status === 404 || forecastResponse.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            }
            throw new Error('Failed to fetch weather data. Please try again later.');
        }

        currentWeatherData = await currentResponse.json();
        forecastWeatherData = await forecastResponse.json();

        displayCurrentWeather(currentWeatherData);
        displayForecast(forecastWeatherData);

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
    // Call formatTemperature without the 'unit' parameter
    temperatureElem.textContent = formatTemperature(main.temp);
    descriptionElem.textContent = weather[0].description;
    humidityElem.textContent = `${main.humidity}%`;
    // Wind speed fixed to m/s (metric unit)
    windSpeedElem.textContent = `${wind.speed} m/s`;
    pressureElem.textContent = `${main.pressure} hPa`;
}

function displayForecast(data) {
    forecastContainer.innerHTML = ''; // Clear previous forecast
    const dailyForecasts = {};

    // Filter out one forecast per day (around noon for consistency)
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!dailyForecasts[date] || new Date(item.dt_txt).getHours() >= 12 && new Date(item.dt_txt).getHours() <= 15) {
            dailyForecasts[date] = item;
        }
    });

    // Convert object to array and sort by date
    const sortedForecasts = Object.values(dailyForecasts).sort((a, b) => a.dt - b.dt);

    // Take the next 5 days (excluding today if the first item is today)
    const startIndex = sortedForecasts.length > 0 && new Date(sortedForecasts[0].dt * 1000).toDateString() === new Date().toDateString() ? 1 : 0;
    const relevantForecasts = sortedForecasts.slice(startIndex, startIndex + 5);


    relevantForecasts.forEach(item => {
        const forecastDate = new Date(item.dt * 1000);
        const dayName = forecastDate.toLocaleDateString('en-US', { weekday: 'short' });
        const icon = getIconUrl(item.weather[0].icon);
        // Call formatTemperature without the 'unit' parameter
        const temp = formatTemperature(item.main.temp);
        const description = item.weather[0].description;

        const forecastCard = `
            <div class="forecast-card">
                <p>${dayName}</p>
                <img src="${icon}" alt="${description}">
                <p>${temp}</p>
                <p>${description}</p>
            </div>
        `;
        forecastContainer.innerHTML += forecastCard;
    });
}

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

locationButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading();
        clearError();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherData(`lat=${lat}&lon=${lon}`);
            },
            (error) => {
                hideLoading();
                console.error('Geolocation error:', error);
                displayError('Unable to retrieve your location. Please allow location access or enter a city manually.');
            }
        );
    } else {
        displayError('Geolocation is not supported by your browser.');
    }
});

// Removed the temperature unit toggle event listener as it's no longer needed
/*
tempUnitRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        currentUnit = event.target.value;
        // Re-display current and forecast data with new unit if available
        if (currentWeatherData) {
            displayCurrentWeather(currentWeatherData);
        }
        if (forecastWeatherData) {
            displayForecast(forecastWeatherData);
        }
    });
});
*/

// --- Initial Load (Optional) ---
// You could fetch weather for a default city on page load
// fetchWeatherData('q=London');
