const CONFIG = {
    defaultView: { center: [39.5, -98.35], zoom: 4 },
    userZoom: 10,
    lightDataUrl: "../dataset/light/lightdata.txt",
    tileLayer: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        options: {
            maxZoom: 20,
            subdomains: "abcd",
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
        }
    },
    pointStyle: {
        color: "#e9edff",
        stroke: false
    },
    locationStyle: {
        radius: 300,
        color: "#95c4ff",
        stroke: false,
        fillOpacity: 0.3
    }
};

const appState = {
    map: null,
    pollutionLayer: null,
    userLayer: null
};

const ui = {
    status: document.getElementById("status"),
    locateBtn: document.getElementById("locate-btn")
};

const setStatus = (message, { append = false } = {}) => {
    ui.status.textContent = append ? `${ui.status.textContent} ${message}`.trim() : message;
};

const scoreToStyle = (score) => {
    const normalized = Math.min(Math.max((score - 1) / 8, 0), 1);
    return {
        fillOpacity: 0.12 + normalized * 0.25,
        radius: Math.max(220, score * 380)
    };
};

const initMap = () => {
    appState.map = L.map("map", { zoomControl: true }).setView(
        CONFIG.defaultView.center,
        CONFIG.defaultView.zoom
    );

    L.tileLayer(CONFIG.tileLayer.url, CONFIG.tileLayer.options).addTo(appState.map);
    appState.pollutionLayer = L.layerGroup().addTo(appState.map);
    appState.userLayer = L.layerGroup().addTo(appState.map);
};

const clearUserLocation = () => {
    appState.userLayer.clearLayers();
};

const showUserLocation = (lat, lon) => {
    clearUserLocation();
    appState.map.setView([lat, lon], CONFIG.userZoom);

    L.marker([lat, lon])
        .bindPopup("<b>You are here</b>")
        .addTo(appState.userLayer)
        .openPopup();

    L.circle([lat, lon], CONFIG.locationStyle).addTo(appState.userLayer);
};

const getCurrentPosition = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
        reject(new Error("Geolocation unsupported"));
        return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000
    });
});

const parseLightData = (rawData) => rawData
    .split(/\r?\n/)
    .reduce((acc, line) => {
        const [lat, lon, score] = line.trim().split("\t");
        const point = [lat, lon, score].map(Number.parseFloat);
        if (point.length === 3 && point.every(Number.isFinite)) {
            acc.push({ lat: point[0], lon: point[1], score: point[2] });
        }
        return acc;
    }, []);

const renderLightData = (dataPoints) => {
    appState.pollutionLayer.clearLayers();
    dataPoints.forEach(({ lat, lon, score }) => {
        const style = scoreToStyle(score);
        L.circle([lat, lon], {
            ...CONFIG.pointStyle,
            ...style
        }).addTo(appState.pollutionLayer);
    });
};

const loadLightData = async () => {
    const response = await fetch(CONFIG.lightDataUrl, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Data fetch failed: ${response.status}`);
    }
    const rawData = await response.text();
    const parsedData = parseLightData(rawData);
    renderLightData(parsedData);
    return parsedData.length;
};

const locateUser = async () => {
    ui.locateBtn.disabled = true;
    setStatus("Locating you…");

    try {
        const position = await getCurrentPosition();
        showUserLocation(position.coords.latitude, position.coords.longitude);
        setStatus("Location found. Centered map on your position.");
    } catch (error) {
        setStatus("Could not access your location. Showing default map view.");
    } finally {
        ui.locateBtn.disabled = false;
    }
};

const bootstrap = async () => {
    initMap();
    ui.locateBtn.addEventListener("click", locateUser);

    try {
        const pointCount = await loadLightData();
        setStatus(`Loaded ${pointCount.toLocaleString()} light-pollution data points.`);
    } catch (error) {
        setStatus("Could not load light-pollution data.");
    }

    await locateUser().catch(() => {});
};

bootstrap();
