/**
 * Created by David on 5/11/2017.
 */
$(function () {
    var mymap = L.map('map');
    navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude, lon = pos.coords.longitude;
        mymap.setView([lat, lon], 13.5);
        var myLoc = L.marker([lat, lon]).addTo(mymap);
        myLoc.bindPopup("<b>You are here</b>");
        L.circle([lat, lon], {radius: 200, color: 'white', stroke: false, fillOpacity: 0.5}).addTo(mymap);
    });
    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZmlyZXZlbmdlMDA3IiwiYSI6ImNqMnA2ZnE1eDAzNzcycm1peHducXhzOXYifQ.-qj_Mswy-MkpXqySSYFQNQ').addTo(mymap);
});
