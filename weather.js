const splash = document.querySelector(".splash");
const containerElement = document.querySelector(".container");
const weatherLocation = document.querySelector(".weatherLocation");
const currentBtn = document.querySelector(".currentBtn");
const cityInput = document.getElementById("cityName");
const citySearch = document.querySelector(".citySearchBtn");
const notificationElement = document.querySelector(".notification");
const weatherContainer = document.querySelector(".weatherContainer");
const weatherMain = document.querySelector(".weatherMain");
const weatherIcon = document.querySelector(".weatherIcon");
const iconElement = document.querySelector(".weatherIconInner");
const tempElement = document.querySelector(".temperatureValue p");
const descElement = document.querySelector(".temperatureDescription p");
const locationElement = document.querySelector(".location p");
const timeAndDateElement = document.querySelector(".timeAndDate p");
const sunriseElement = document.querySelector(".sunrise p");
const sunsetElement = document.querySelector(".sunset p");
const toggleUnitBtn = document.querySelector(".indicatorToggle");
const showDetailsBtn = document.querySelector(".showDetailsBtn");
const details = document.querySelector(".details");
const feelsLikeElement = document.querySelector(".feelsLike");
const pressureElement = document.querySelector(".pressure");
const windElement = document.querySelector(".wind");
const humidityElement = document.querySelector(".humidity");
const next24hBtn = document.querySelector(".next24hBtn");
const forecastDiv = document.querySelector(".forecastDiv");
const forecastList = document.getElementById("forecastList");
const favoritesBtn = document.querySelector(".favoritesBtn");
const citiesAdded = document.querySelector(".citiesAdded");
const listOfCities = document.getElementById("listOfCities");
const deleteCityBtn = document.querySelector(".citiesAdded img");
const frequencyBtn = document.querySelector(".frequencyBtn");
const updateFrequency = document.querySelector(".updateFrequency");
const addCityBtn = document.querySelector(".addCityBtn");
const refreshBtn = document.querySelector(".refreshBtn");
const dateOptions = {weekday: "long", month: "short", day: "numeric"};
const timeOptions = {hour: "2-digit", minute: "2-digit" };
const ONEHOUR = 3600;
const ONEDAY = 86400000;
const NOW = (new Date()).getTime();
const localTimeInSeconds = Math.floor(NOW / 1000);
const WINDDIRECTIONS = ["↓ N", "↙ NE", "← E", "↖ SE", "↑ S", "↗ SW", "→ W", "↘ NW"];
const KELVIN = 273;
const APILOCATION = "https://api.openweathermap.org/data/2.5/";
const APIKEY = "1ed067bdf9ea7c86246b9926f08eb3ae";
const POSITIONINLIST = "beforeend";
const noFavoritesMessage = "No favorite cities!";

document.addEventListener("DOMContentLoaded", (e) => {
	setTimeout(() => {
		splash.classList.add("displayNone");
	}, 4000);
});

let weatherData = {};
let weather = {
	temperature : {
		unit : "celsius"
	},
	wind : {},
	
	forecast : [],
	forecastForEveryHour : {
		temperature : { 
		unit : "celsius"
		}
	}
};

let forecastNumberOfDays = 1;
let forecastElementsNumber = (24 / 3) * forecastNumberOfDays;
let cities = [];
let cityId = 0;

let refreshRateFromStorage;

let clearNotificationElement = () => notificationElement.innerHTML = ``;
let renderError = (error) => notificationElement.innerHTML = `<img src="icons/svg/alert-octagon.svg" width="30em"><p>${error}</p>`;
let addToLocalStorage = (key, value) => localStorage.setItem(key, value);
let show = (element) => element.style.display === "none" ? element.style.display = "block" : element.style.display = "none";
showDetailsBtn.addEventListener("click", () => show(details));
next24hBtn.addEventListener("click", () => show(forecastDiv));
favoritesBtn.addEventListener("click", () => show(citiesAdded));
frequencyBtn.addEventListener("click", () => show(updateFrequency));

let updateWeatherObjectFromAPIData = (weatherData) => {
	weather.temperature.value = Math.floor(weatherData[0].main.temp - KELVIN);
	weather.name = weatherData[0].name;
	weather.country = weatherData[0].sys.country;
	weather.description = weatherData[0].weather[0].description;
	weather.iconId = weatherData[0].weather[0].icon;
	weather.pressure = weatherData[0].main.pressure;
	weather.humidity = weatherData[0].main.humidity;
	weather.feelsLike = Math.floor(weatherData[0].main.feels_like - KELVIN);
	weather.sunrise = weatherData[0].sys.sunrise;
	weather.sunset = weatherData[0].sys.sunset;
	weather.wind.speed = weatherData[0].wind.speed;
	weather.wind.degrees = weatherData[0].wind.deg;
	weather.time = weatherData[0].dt;
	weather.timezone = weatherData[0].timezone;
};

let updateForecastObjectFromAPIData = (weatherData) => {
	weather.forecastForEveryHour.name = weatherData[1].city.name;
	weather.forecastForEveryHour.icon = weatherData[1].list[i].weather[0].icon;
	weather.forecastForEveryHour.hours = forecastTimeFormat(weatherData[1]);
	weather.forecastForEveryHour.description = weatherData[1].list[i].weather[0].description;
	weather.forecastForEveryHour.temperature.value = Math.floor(weatherData[1].list[i].main.temp - KELVIN);
};

let forecastTimeFormat = () => {
	let time = new Date((weatherData[1].list[i].dt - (ONEHOUR * 2) + weather.timezone) * 1000);
	let date = time.toLocaleDateString("en-us", dateOptions); 
	let hour = time.toLocaleTimeString("sr-rs", timeOptions);
	return `<p>${date}</p>
			<p>${hour}</p>`;
};

let addForecastForEveryHourToForecastArray = () => {
	if(weather.forecast.length >= forecastElementsNumber) {
		weather.forecast.shift();
		weather.forecast.push(weather.forecastForEveryHour);
	} else {
		weather.forecast.push(weather.forecastForEveryHour);
	};
};

let getCityNameFromInput = () => {
	clearNotificationElement();
	if (cityInput.value === "") {
		renderError("Please enter city name");
		return;
	} else {	
		getWeatherAndForecastByCityName(cityInput.value);
		cityInput.value = "";
		forecast = [];
	}
};

let getWeatherAndForecastByCityName = (city) => {
	let apiWeatherPromise = fetch(`${APILOCATION}weather?q=${city}&appid=${APIKEY}`);
	let apiForecastPromise = fetch(`${APILOCATION}forecast?q=${city}&appid=${APIKEY}`);
	resolvePromisesAndUpdateObjects(apiWeatherPromise, apiForecastPromise);
};
citySearch.addEventListener("click", getCityNameFromInput);
cityInput.addEventListener("keyup", (e) => {
	const term = e.target.value.toLowerCase();
	if(e.keyCode === 13) {
		e.preventDefault();
		document.querySelector(".citySearchBtn").click();
	}
});

let getWeatherAndForecastByGeolocation = (latitude, longitude) => {
	let apiWeatherPromise = fetch(`${APILOCATION}weather?lat=${latitude}&lon=${longitude}&appid=${APIKEY}`);
	let apiForecastPromise = fetch(`${APILOCATION}forecast?lat=${latitude}&lon=${longitude}&appid=${APIKEY}`);
	resolvePromisesAndUpdateObjects(apiWeatherPromise, apiForecastPromise);
};
let getGeolocation = () => {
	if (("latitude" in localStorage) && ("longitude" in localStorage)) {
		clearNotificationElement();
		getWeatherAndForecastByGeolocation(localStorage.latitude, localStorage.longitude);
	} else if ("geolocation" in navigator) {
		clearNotificationElement();
		navigator.geolocation.getCurrentPosition(setPosition, renderError);
	} else renderError(error);
};
let setPosition = (position) => {
	addToLocalStorage("latitude", position.coords.latitude);
	addToLocalStorage("longitude", position.coords.longitude);
	getWeatherAndForecastByGeolocation(position.coords.latitude, position.coords.longitude);
};
currentBtn.addEventListener("click", getGeolocation);

let resolvePromisesAndUpdateObjects = (apiWeatherPromise, apiForecastPromise) => {
	Promise.all([apiWeatherPromise, apiForecastPromise])
		.then((responses) => {
			return Promise.all(responses.map((response) => {
				if (response.status !== 200) {
					renderError(response.statusText);
				}
			return response.json();
			}));
		})
		.then((data) => {
			weatherData = data;
			updateWeatherObjectFromAPIData(weatherData);
			forecastDataForNext24Hours(weatherData);
		})
		.then(() => {renderWeatherData(), dayOrNightColors()})
		.catch(function(error) {
			console.log(error);
		});
};

let loadWeatherAndForecastFromLocalStorage = () => (localStorage.latitude && localStorage.longitude) ? (getWeatherAndForecastByGeolocation(localStorage.latitude, localStorage.longitude)) : console.log("No latitude and longitude in the local storage.");
let loadFavoritesFromLocalStorage = () => {
	if (localStorage.favorites) {
		let favoriteCities = JSON.parse(localStorage.favorites);
		cities = favoriteCities;
		cities.forEach(city => renderFavoriteCityItem(city.name));
	} else {
		console.log("No favorites in the local storage.");
		renderFavoriteCityMessage(noFavoritesMessage);
	};
};
let loadFrequencyFromLocalStorage = () => {
	if(localStorage.frequency) {
		clearInterval(refreshRateFromStorage);
		if(localStorage.frequency != "manually") {
			refreshRateFromStorage = setInterval((() => getWeatherAndForecastByCityName(weather.name)), localStorage.frequency * 1000 * 60);
		} else return;
	} else {
		console.log("No frequency in the local storage.");
		return;
	};
};

window.onload = () => {
	loadWeatherAndForecastFromLocalStorage();
	loadFavoritesFromLocalStorage();
	loadFrequencyFromLocalStorage();
	isCitiesArrayEmpty();
};

let isCitiesArrayEmpty = () => {
	if (!cities.length && listOfCities.childNodes.length === 0) {
		renderFavoriteCityMessage(noFavoritesMessage);
	}
};

let addCityToArrayAndStorageAndRender = () => {
	if(weather.name !== undefined) {
		if(!(cities.some(city => city.name === weather.name))) {
			cities.push({
				name: weather.name,
				cityId: cityId
			});
			cityId++;
			addToLocalStorage("favorites", JSON.stringify(cities));
			if(cities.length === 1) {
				listOfCities.removeChild(listOfCities.childNodes[0]);
				renderFavoriteCityItem(weather.name);
			} else {
				renderFavoriteCityItem(weather.name);
				console.log(`${weather.name} is added to the list.`);
			}
		} else {
			console.log(`${weather.name} is already on the list.`)
		}
		
	} else {
		console.log("There is nothing to be added to the favorites list.");
		return;
	}
};

let removeCityFromArrayAndStorageAndRender = (element) => {
	let cityToDelete = element.parentNode.childNodes[1].innerText;
	cities = cities.filter((city) => city.name != cityToDelete);
	addToLocalStorage("favorites", JSON.stringify(cities));
	element.parentNode.parentNode.removeChild(element.parentNode);
	console.log(`${cityToDelete} is removed from the list.`);
	isCitiesArrayEmpty();
};

let renderFavoriteCityMessage = (message) => {
	let cityAdded = 
		`<li class="cityItem">
			<p id="noFavoritesMessage">${message}</p>
		</li>`;
	listOfCities.insertAdjacentHTML(POSITIONINLIST, cityAdded);
};

let renderFavoriteCityItem = (city) => {
	let cityAdded = 
		`<li class="cityItem">
			<p id="cityAddedToList">${city}</p>
			<img id="deleteCityIcon" src="icons/svg/trash-2.svg" alt="" width="3em">
		</li>`;
	listOfCities.insertAdjacentHTML(POSITIONINLIST, cityAdded);
};

let favoritesListElementsControl = (event) => {
	let element = event.target;
	if(element.id === "deleteCityIcon") {
		element.parentNode.style.opacity = "0";
		setTimeout(function() {
			removeCityFromArrayAndStorageAndRender(element);	
		}, 500);
		localStorage.removeItem(element);
	} else if(element.id === "cityAddedToList") {
		getWeatherAndForecastByCityName(element.innerText);
	} else return;
};

addCityBtn.addEventListener("click", addCityToArrayAndStorageAndRender);
listOfCities.addEventListener("click", favoritesListElementsControl);
refreshBtn.addEventListener("click", () => {
	if(weather.name !== undefined) getWeatherAndForecastByCityName(weather.name);
});
updateFrequency.addEventListener("click", function(event) {
	localStorage.removeItem("frequency");
	let frequency = event.target.value;
	if(frequency) {
		addToLocalStorage("frequency", frequency);
		loadFrequencyFromLocalStorage();
	} else return;
});

let localCurrentTimeFormat = () => {
	let getLocalCurentElementFromObject = (element) => new Date((element - (ONEHOUR * 2) + weather.timezone) * 1000);
		localCurrentTime = getLocalCurentElementFromObject(weather.time);
		localHourFormated = localCurrentTime.toLocaleTimeString("sr-rs", timeOptions); 
		localDateCurrent = localCurrentTime.toLocaleDateString("en-us", dateOptions);
		localSunrise = getLocalCurentElementFromObject(weather.sunrise).toLocaleTimeString("sr-rs", timeOptions);
		localSunset = getLocalCurentElementFromObject(weather.sunset).toLocaleTimeString("sr-rs", timeOptions);

	return `<span><img src="icons/svg/clock.svg" width="3em">${localHourFormated}</span> 
		<span><img src="icons/svg/calendar.svg" width="3em">${localDateCurrent}</span>
		<span><img src="icons/svg/sunset.svg" width="3em">${localSunrise}</span>
		<span><img src="icons/svg/sunset.svg" width="3em">${localSunset}</span>`;
};

let formatTimeElementString = (element) => (element < 10) ? element = `0${element}` : element;

let display24hForecast = () => {
	updateForecastObjectFromAPIData(weatherData);
	addForecastForEveryHourToForecastArray();
	renderHourlyForecastTemplate(weather);
};

let renderHourlyForecastTemplate = (weather) => {
	if (weather.forecast.length === forecastElementsNumber) {
		forecastList.removeChild(forecastList.firstChild);
	};
	createHourlyForecastTemplate(weather.forecastForEveryHour.temperature.value, "C");
};

let createHourlyForecastTemplate = (hourlyTemp, unit) => { 
	let hourlyForecastTemplate =
		`<li class="hourlyForecast">
			<p id="hourlyTime">${weather.forecastForEveryHour.hours}</p>
			<p style='font-size:x-large; font-family: "montserratmedium";' id="hourlyTemerature">${hourlyTemp}<sup>&deg${unit}</sup></p>
			<img id="hourlyIcon" src="icons/png/64x64/${weather.forecastForEveryHour.icon}.png" alt="">
			<p id="hourlyDescription">${weather.forecastForEveryHour.description}</p>
		</li>`
	forecastList.insertAdjacentHTML(POSITIONINLIST, hourlyForecastTemplate);
};

let renderWeatherData = () => {
	weatherContainer.style.display = "block";
	iconElement.innerHTML = `<img src="icons/png/64x64/${weather.iconId}.png">`;
	locationElement.innerHTML = `Currently in <span>${weather.name},</span> ${weather.country}`;
	tempElement.innerHTML = `${weather.temperature.value}<sup><span>&degC</span></sup>`;
	descElement.innerHTML = `${weather.description}`;
	timeAndDateElement.innerHTML = `${localCurrentTimeFormat()}`;
	feelsLikeElement.innerHTML = `<img src="icons/png/temperature.png"> <p>Feels like:</p> <span>${weather.feelsLike}<sup>&degC</sup></span>`;
	pressureElement.innerHTML = `<img src="icons/png/pressure.png"> <p>Pressure:</p> <span>${weather.pressure} mb</span>`;
	humidityElement.innerHTML = `<img src="icons/png/humidity.png"> <p>Humidity:</p> <span>${weather.humidity} %</span>`;
	windElement.innerHTML = `<img src="icons/png/wind.png"> <p>Wind:</p> <span>${weather.wind.speed} m/s ${windDirection()}</span>`;
};

let forecastDataForNext24Hours = (weatherData) => {
	for (i=0; i<forecastElementsNumber; i++) display24hForecast(weather);
};

let windDirection = () => (!(weather.wind.degrees)) ? "" : WINDDIRECTIONS[Math.round(weather.wind.degrees / 45) % 8];
let dayOrNight = () => (localTimeInSeconds > weather.sunset || localTimeInSeconds < weather.sunrise) ? "night" : "day";
let dayOrNightColors = () => (dayOrNight() === "night") ? ((containerElement.classList.remove("day")), (containerElement.classList.add("night"))) :  ((containerElement.classList.remove("night")), (containerElement.classList.add("day")));
let celsiusToFahrenheit = (temperature) => (temperature * 9/5) + 32;

let renderToggledUnit = (temperatureElement, unit, feelsLike, unitString) => {
	tempElement.innerHTML = `${temperatureElement}<sup><span>&deg${unit}</span></sup>`;
	feelsLikeElement.innerHTML = `<img src="icons/png/temperature.png"> Feels like: <span>${feelsLike}<sup>&deg${unit}</sup></span>`;
	weather.temperature.unit = unitString;
};

let toggleUnit = () => {
	let fahrenheitTemp = Math.floor(celsiusToFahrenheit(weather.temperature.value));
	let fahrenheitFeelsLike = Math.floor(celsiusToFahrenheit(weather.feelsLike));
	if(weather.temperature.value === undefined) return;
	if(weather.temperature.unit === "celsius") {
		renderToggledUnit(fahrenheitTemp, "F", fahrenheitFeelsLike, "fahrenheit");
		for (i=0; i<forecastElementsNumber; i++) toggleForecastUnit(weather);
	} else {
		renderToggledUnit(weather.temperature.value, "C", weather.feelsLike, "celsius");
		for (i=0; i<forecastElementsNumber; i++) display24hForecast(weather);
	};
};

let toggleForecastUnit = (weather) => {
	updateForecastObjectFromAPIData(weatherData);
	addForecastForEveryHourToForecastArray();
	if (weather.forecast.length === forecastElementsNumber) {
		forecastList.removeChild(forecastList.firstChild);
	};
	let fahrenheitHourly = Math.floor(celsiusToFahrenheit(weather.forecastForEveryHour.temperature.value));
	createHourlyForecastTemplate(fahrenheitHourly, "F");
};
toggleUnitBtn.addEventListener("click", toggleUnit);