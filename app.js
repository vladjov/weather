// Declaring variables and selecting elements in the DOM
const containerElement = document.querySelector(".container");
const notificationElement = document.querySelector(".notification");
const inputElement = document.getElementById("#cityName");

const weatherContainer = document.querySelector(".weatherContainer");
const weatherMain = document.querySelector(".weatherMain");
const iconElement = document.querySelector(".weatherIcon");
const tempElement = document.querySelector(".temperatureValue p");
const descElement = document.querySelector(".temperatureDescription p");
const locationElement = document.querySelector(".location p");
const timeAndDateElement = document.querySelector(".timeAndDate p");

const feelsLikeElement = document.querySelector(".feelsLike p");
const pressureElement = document.querySelector(".pressure p");
const windElement = document.querySelector(".wind p");
const humidityElement = document.querySelector(".humidity p");

const forecastDiv = document.querySelector(".forecastDiv"); 

const currentBtn = document.querySelector(".currentBtn");
const cityInput = document.getElementById("cityName");
const citySearch = document.querySelector(".citySearchBtn");

const date = new Date();
const KELVIN = 273;

// API key
const key = "1ed067bdf9ea7c86246b9926f08eb3ae";

// Objects and arrays to store the APP DATA
const weather = {
	temperature : {
		unit : "celsius"
	},

	wind : {},
};

let forecast = [];

let forecastHourly = {
	temperature : { 
	unit : "celsius"
	}
};

const weatherDataObject = {};
const weatherDataObjects = [];

let list = document.createElement("ul");

// CONTROLS FOR THE BUTTONs AND INPUT
// Listenngi to click and enter on the currentBtn, citySearchBtn and cityInput
currentBtn.addEventListener("click", getGeolocation);
citySearch.addEventListener("click", getCityName);
cityInput.addEventListener("keyup", function(e) {
	if(e.keyCode === 13) {
		e.preventDefault();
		document.querySelector(".citySearchBtn").click();
	}
});
tempElement.addEventListener("click", toggleUnit);

// Getting city name from input field to use in API call and reseting input value and forecast array
function getCityName() {
	notificationElement.innerHTML = ``;
	let city = cityInput.value;
	// If the user tries to send request without entering the city name in the input field
	if (city === "") {
		notificationElement.style.display = "block";
		notificationElement.innerHTML = `Please enter city name`;
		weatherContainer.style.display = "none";
		return;
	} 
	getWeatherAndForecastByCityName(city);
	cityInput.value = "";
	forecast = [];
};

// Getting longitude and latitude to use in API call
function getGeolocation() {
	if("geolocation" in navigator) {
		notificationElement.innerHTML = ``;
		navigator.geolocation.getCurrentPosition(setPosition, showError);
	} else {
		notificationElement.style.display = "block";
		notificationElement.innerHTML = "<p>Browser doesn't Support Geolocation</p>";
	};	
};

function setPosition(position) {
	let latitude = position.coords.latitude;
	let longitude = position.coords.longitude;
	getWeatherAndForecastByGeolocation(latitude, longitude);
};

function showError(error) {
	notificationElement.style.display = "block";
	notificationElement.innerHTML = `<p>${error.message}</p>`;
	weatherContainer.style.display = "none";
};

// Getting the CURRENT weather and FORECAST data from the API using COORDINATES
function getWeatherAndForecastByGeolocation(latitude, longitude) {
	let apiWeather = fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${key}`);
	let apiForecast = fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${key}`);
	resolvePromises(apiWeather, apiForecast);
};

// Getting the CURRENT weather and FORECAST data from the API using CITY
function getWeatherAndForecastByCityName(city) {
	let apiWeather = fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}`);
	let apiForecast = fetch(`http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${key}`);
	resolvePromises(apiWeather, apiForecast);
};

function resolvePromises(apiWeather, apiForecast) {
	Promise.all([apiWeather,apiForecast])
		.then(function(responses) {
			return Promise.all(responses.map(function(response) {
				/*console.log(response);
				console.log(response.status);*/
				if (response.status !== 200) {
					notificationElement.style.display = "block";
					notificationElement.innerHTML = `<p>${response.statusText}</p>`;
					weatherContainer.style.display = "none";
				}
				/*console.log(response.statusText);*/
				return response.json();
			}));
		})
		.then(function(data) {
			let weatherData = data[0];
			let forecastData = data[1];
			updateWeatherData(weatherData);
			forecast24Hours(forecastData);
		})
		.then(() => {displayWeather(), dayOrNightColors()})
		.catch(function(error) {
			console.log(error);
		});
};
// Updating weather object with properties and values from the API
function updateWeatherData(weatherData) {
	weather.temperature.value = Math.floor(weatherData.main.temp - KELVIN);
	weather.city = weatherData.name;
	weather.country = weatherData.sys.country;
	weather.description = weatherData.weather[0].description;
	weather.iconId = weatherData.weather[0].icon;
	weather.pressure = weatherData.main.pressure;
	weather.humidity = weatherData.main.humidity;
	weather.feelsLike = Math.floor(weatherData.main.feels_like - KELVIN);
	weather.sunrise = weatherData.sys.sunrise;
	weather.sunset = weatherData.sys.sunset;
	weather.wind.speed = weatherData.wind.speed;
	weather.wind.degrees = weatherData.wind.deg;
};

// Displaying data on the page by updating the DOM
function displayWeather() {
	weatherContainer.style.display = "block";
	iconElement.innerHTML = `<img src="icons/png/256x256/${weather.iconId}.png">`;
	tempElement.innerHTML = `${weather.temperature.value}&deg<span>C</span>`;
	descElement.innerHTML = `${weather.description}`;
	locationElement.innerHTML = `${weather.city}, ${weather.country}`;
	timeAndDateElement.innerHTML = `${date.toDateString()}`;
	feelsLikeElement.innerHTML = `Feels like: <span>${weather.feelsLike} &deg <span>C</span></span>`;
	pressureElement.innerHTML = `Pressure: <span>${weather.pressure} mb</span>`;
	humidityElement.innerHTML = `Humidity: <span>${weather.humidity} %</span>`;
	windElement.innerHTML = `Wind: <span>${weather.wind.speed} m/s ${windDirection()}</span>`;
};

// Determining 8 directions from wind data given in degrees
function windDirection() {
	const directions = ["↓ N", "↙ NE", "← E", "↖ SE", "↑ S", "↗ SW", "→ W", "↘ NW"];
	return(directions[Math.round(weather.wind.degrees / 45) % 8]);
};

// Adjusting current time format to match sunrise and sunset time from the API, which is in s
function dayOrNight() {
	let timeInSeconds = Math.floor(date.getTime() / 1000);
	return ((timeInSeconds > weather.sunset || timeInSeconds < weather.sunrise) ? "night" : "day");
};

// Changing styles depending of the time of the day
function dayOrNightColors() {
	// Making a list of elements whose styles are changing
	let toChange = [containerElement, currentBtn, citySearch, forecastDiv, feelsLikeElement, pressureElement, windElement, humidityElement];
	if (dayOrNight() === "night") {
		toChange.forEach(e => e.classList.remove("day"));
		toChange.forEach(e => e.classList.add("night"));
	} else if (dayOrNight() === "day"){
		toChange.forEach(e => e.classList.remove("night"));
		toChange.forEach(e => e.classList.add("day"));
	}
};

function updateForecastData(forecastData) {
	// Transforming date from string to object
	var dateTxt = forecastData.list[i].dt_txt;
	var dateObject = new Date(dateTxt);
	var hourUTC = dateObject.getUTCHours();
	var hour = hourUTC + (forecastData.city.timezone) / 3600;

	// Getting and formatting the time from the API
	function forecastTime() {
		// Getting CITY hours from LOCAL hours

		if (hour > 24) {
			hour = hour - 24;
		} else if (hour < 0) {
			hour = 24 - Math.abs(hour);
		} else if (hour === 24) {
			hour = 0;
		}
		// Formating hours from integer to string (13 to 13:00) 
		return ((hour < 10) ? hour = "0" + hour + ":00" : hour = hour + ":00");
	};

	// Adding properties and values to forecastHourly Object
	forecastHourly.icon = forecastData.list[i].weather[0].icon;
	forecastHourly.city = forecastData.city.name;
	forecastHourly.time = forecastTime(forecastData);
	forecastHourly.description = forecastData.list[i].weather[0].description;
	forecastHourly.temperature.value = Math.floor(forecastData.list[i].main.temp - KELVIN);

	// Adding forecastHourly OBJECTS to forecast ARRAY
	forecast.push(forecastHourly);
}

function forecastDetailsDisplay(forecastData) {
	updateForecastData(forecastData);
	// Prevents adding multiple lists
	if (list.childElementCount === 8) {
		list.removeChild(list.firstChild);
	};
	let li = document.createElement("li");

	let hourlyTemperature = document.createElement("div");
	let hourlyIcon = document.createElement("div");
	let hourlyTime = document.createElement("div");
	let hourlyDescription = document.createElement("div");

	hourlyTemperature.innerHTML = `${forecastHourly.temperature.value} &deg`;
	hourlyIcon.innerHTML = `<img src="icons/png/64x64/${forecastHourly.icon}.png">`;
	hourlyTime.innerHTML = `${forecastHourly.time}`;
	hourlyDescription.innerHTML = `${forecastHourly.description}`;

	li.appendChild(hourlyTemperature);
	li.appendChild(hourlyIcon);
	li.appendChild(hourlyTime);
	li.appendChild(hourlyDescription);
	list.appendChild(li);
	forecastDiv.appendChild(list);
};

// Display forecast every 3h for the next 24h
function forecast24Hours(forecastData){
	for (i=0; i<8; i++) forecastDetailsDisplay(forecastData);
};

// Display forecast every 3h for the next 5 days
function forecastFiveDays(forecastData) {
	for (i in forecastData.list) forecastDetailsDisplay(forecastData);		
};

// Swithching from C to F onclick (PROBLEM: Forecast unit doesn't change)
function celsiusToFahrenheit(temperature) {
	return (temperature * 9/5) + 32;
};

function toggleUnit() {
	if(weather.temperature.value === undefined) return;
	if(weather.temperature.unit === "celsius") {
		let fahrenheitTemp = Math.floor(celsiusToFahrenheit(weather.temperature.value));
		let fahrenheitFeelsLike = Math.floor(celsiusToFahrenheit(weather.feelsLike));

		tempElement.innerHTML = `${fahrenheitTemp} &deg <span>F</span>`;
		feelsLikeElement.innerHTML = `Feels like: ${fahrenheitFeelsLike} &deg <span>F</span>`;
		weather.temperature.unit = "fahrenheit";
	} else {
		tempElement.innerHTML = `${weather.temperature.value} &deg <span>C</span>`;
		feelsLikeElement.innerHTML = `Feels like: ${weather.feelsLike} &deg <span>C</span>`;
		weather.temperature.unit = "celsius";
	}
}
