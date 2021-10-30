const SERVERHOST = 'https://cheb.typex.one/api/v1/';
const markersParh = './';
const marker = 'marker.png';
const userMarker = 'pin.svg';

function sendReq(method, mode, callback, postData = '') { // Функция для стандартного сетевого взаимодействия
    const xhr = new XMLHttpRequest();
    xhr.open(method, SERVERHOST + mode, true);
    xhr.addEventListener('readystatechange', () => xhr.readyState === xhr.DONE && callback(mode === 'requestsText' ? xhr.response : JSON.parse(xhr.response)));
    xhr.send(JSON.stringify(postData));
}

const getMarkers = () => Array.from(document.getElementsByClassName('leaflet-marker-pane')[0].children);
const removeContextPin = () => getMarkers().forEach(img => img.src.includes(userMarker) && img.remove());
const clearMarkers = () => getMarkers().forEach(el => el.remove());

function createCategory(element) {
    const div = document.createElement('div');
    const label = document.createElement('label');
    const radio = document.createElement('input');
    div.id=element.requestId;
    div.dataset.color = element.color;
    label.innerText = element.name;
    radio.type = 'radio';
    div.insertAdjacentElement('afterbegin', label);
    div.insertAdjacentElement('afterbegin', radio);
    document.getElementById('settings').insertAdjacentElement('beforeend', div);
}

const renderForm = () => document.getElementById('container').insertAdjacentHTML('beforeend', '<div id="form"><div id="closeForm"></div><label for="description">Укажите тему обращения</label><textarea id="description"></textarea><label for="text">Опишите вашу проблему</label><textarea id="text"></textarea><div id="attention">Укажите на карте току, нажав правой кнопкой мыши</div><div id="sendForm">Отправить</div></div>');

document.addEventListener('DOMContentLoaded', () => {
    let coords = [];
    let map = L.map('map').setView([56.1012, 47.2261], 12);
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map); // Задание слоя маски - обычный
    map.on('contextmenu', () => null);

    const setMarker = (coords, content, icon=markersParh + marker, size) => L.marker(coords, {icon:L.icon({iconUrl:icon,iconSize:size,iconAnchor:[5,35],popupAnchor:[0,-40]})}).bindPopup(content).addTo(map);

    const contextMenu = e => {
        removeContextPin();
        coords = e.latlng;
        setMarker(e.latlng, 'Ваша точка', markersParh + userMarker, [25, 40]);
        document.getElementById('attention').innerHTML = '<span id="unselectPin">Убрать маркер</span>';
        document.getElementById('unselectPin').addEventListener('click', () => {
            removeContextPin();
            document.getElementById('attention').innerText = 'Укажите на карте току, нажав правой кнопкой мыши';
        });
    }

    const openForm = () => {
        if (!document.getElementById('form')) {
            renderForm();
            map.addEventListener('contextmenu', contextMenu);
            document.getElementById('closeForm').addEventListener('click', e => {
                e.target.parentElement.remove();
                map.removeEventListener('contextmenu', contextMenu);
                removeContextPin();
            });
            document.getElementById('sendForm').addEventListener('click', () => {
                const description = document.getElementById('description');
                const text = document.getElementById('text');
                if (description.value !== '' && text.value !== '' && (coords.lng && coords.lat))
                    sendReq('POST', 'createRequest', data => {
                        console.log(data);
                        if (data.id) console.log('Успешно создано!');
                    }, { "summary": description.value, "text": text.value, "coordinate": { "lon": coords.lng, "lat": coords.lat } });
                else alert('Пожалуйста заполните все поля и поставте точку на карте');
                coords = [];
            });
        }
    }
    
    const renderSettings = () => {
        document.body.insertAdjacentHTML('afterbegin', '<div id="container"><ul id="settings"></ul></div>');
        sendReq('GET', 'categories', data => {
            data.forEach(createCategory);
            document.getElementById('settings').insertAdjacentHTML('beforeend', '<div id="openForm">Отправить запрос</div>');
            document.getElementById('openForm').addEventListener('click', openForm);
        });
    }

    renderSettings();
    
    setMarker([56.1012, 47.2261], 'Текст'); // Тестовый маркет
});