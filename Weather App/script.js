const apiKey = "b1b15e88fa797225412429c1c50c122a"; // Replace with your OpenWeather key
const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const weatherInfo = document.querySelector(".weather-info");
const toggleMode = document.getElementById("toggle-mode");
const favoritesList = document.getElementById("favorites");
const datalist = document.getElementById("cities");
const ctx = document.getElementById("forecastChart").getContext("2d");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let forecastChart;

// ✅ Popular Cities for autocomplete
const popularCities = [
  "New York,US","London,UK","Paris,FR","Tokyo,JP",
  "Sydney,AU","Delhi,IN","Mumbai,IN","Los Angeles,US",
  "Beijing,CN","Moscow,RU","Berlin,DE","Dubai,AE"
];

// Render autocomplete
function renderAutocomplete(filter="") {
  datalist.innerHTML = "";
  popularCities
    .filter(city => city.toLowerCase().includes(filter.toLowerCase()))
    .forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      datalist.appendChild(option);
    });
}

// ✅ Fetch Weather + Forecast
async function getWeather(city) {
  if (!city) return; // Safety check
  try {
    const resWeather = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    if (!resWeather.ok) throw new Error("City not found");
    const weatherData = await resWeather.json();

    const resForecast = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
    );
    const forecastData = await resForecast.json();

    displayWeather(weatherData);
    displayForecast(forecastData);
    saveFavorite(city);
  } catch (error) {
    showError(city);
  }
}

// ✅ Display Current Weather
function displayWeather(data) {
  const { name, main, weather, wind } = data;
  const isDay = weather[0].icon.includes("d");
  document.body.style.background = isDay
    ? "linear-gradient(to right, #4facfe, #00f2fe)"
    : "linear-gradient(to right, #141e30, #243b55)";

  weatherInfo.innerHTML = `
    <h2>${name}</h2>
    <p>${weather[0].description.toUpperCase()}</p>
    <p>🌡️ Temp: ${main.temp}°C (min: ${main.temp_min}°C / max: ${main.temp_max}°C)</p>
    <p>💧 Humidity: ${main.humidity}%</p>
    <p>🌬️ Wind: ${wind.speed} m/s</p>
  `;
}

// ✅ Display 5-day Forecast with Chart.js
function displayForecast(data) {
  const dailyData = {};
  data.list.forEach((entry) => {
    const date = entry.dt_txt.split(" ")[0];
    if (!dailyData[date]) dailyData[date] = [];
    dailyData[date].push(entry.main.temp);
  });

  const labels = Object.keys(dailyData).slice(0,5);
  const avgTemps = labels.map(day =>
    (dailyData[day].reduce((sum,t)=>sum+t,0)/dailyData[day].length).toFixed(1)
  );

  if(forecastChart) forecastChart.destroy();

  forecastChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label:"Avg Temp (°C)",
        data: avgTemps,
        borderColor:"#007bff",
        backgroundColor:"rgba(0,123,255,0.3)",
        fill:true,
        tension:0.4
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:true}}
    }
  });
}

// ✅ Error Handling
function showError(city) {
  weatherInfo.innerHTML = `
    <p style="color:red;">❌ Could not find "${city || "Unknown"}".</p>
    <p>👉 Check spelling or add country code (e.g., "Paris,FR").</p>
  `;
}

// ✅ Save & Render Favorites
function saveFavorite(city) {
  if(!city) return;
  if(!favorites.includes(city)){
    favorites.push(city);
    localStorage.setItem("favorites",JSON.stringify(favorites));
    renderFavorites();
  }
}

function renderFavorites() {
  favoritesList.innerHTML="";
  favorites.forEach(city=>{
    const li=document.createElement("li");
    li.textContent=city;
    li.className="fav-item";
    li.addEventListener("click",()=>getWeather(city));
    favoritesList.appendChild(li);
  });
}

// ✅ Dark/Light Mode
toggleMode.addEventListener("click",()=>{
  document.querySelector(".weather-app").classList.toggle("dark");
});

// ✅ Geolocation: Auto-detect user city (safe)
function getLocationWeather() {
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(async pos=>{
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try{
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        const data = await res.json();
        if(data && data.name){
          getWeather(data.name); // ✅ Only if valid
        } else {
          console.warn("Geolocation returned invalid city. Please search manually.");
        }
      }catch(err){
        console.error("Geolocation failed", err);
      }
    });
  }
}

// ✅ Event Listeners
searchBtn.addEventListener("click",()=>{ 
  const city = cityInput.value.trim();
  if(city) getWeather(city);
});

cityInput.addEventListener("input",()=>{ 
  renderAutocomplete(cityInput.value);
});

// ✅ Initial Load
renderFavorites();
renderAutocomplete();
getLocationWeather();
// Optionally load a default city if geolocation fails