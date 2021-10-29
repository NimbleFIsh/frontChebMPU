document.addEventListener('DOMContentLoaded', () => {
    let map = L.map('map').setView([56.1265,47.2440], 13);
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map); // Задание слоя маски - обычный
});