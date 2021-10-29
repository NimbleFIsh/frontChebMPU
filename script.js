document.addEventListener('DOMContentLoaded', () => {
    let map = L.map('map').setView([56.1012, 47.2261], 12);
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map); // Задание слоя маски - обычный
});