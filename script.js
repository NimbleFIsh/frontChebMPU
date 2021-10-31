const SERVERHOST  = 'https://cheb.typex.one/api/v1/';
const markersParh = './img/';
const infra       = 'infra.png';
const roads       = 'roads.png';
const eco         = 'eco.png';
const social      = 'social.png';
const business    = 'business.png';
const phone       = 'telephone.png';
const covid       = 'virus.png';
const earth       = 'earth_work.png';
const marker      = 'marker.png';
const userMarker  = 'pin.svg';

let links = {}, // Объект для связи категорий и маркеров
    markers = [ infra, roads, eco, social, business, phone, earth, covid, marker ]; // Массив последовательности для связи с категориями

function sendReq(method, mode, callback, postData = '', id) { // Функция для стандартного сетевого взаимодействия
    const xhr = new XMLHttpRequest();
    xhr.open(method, SERVERHOST + mode + (mode === 'points' ? '?category=' + id : (mode === 'requestsText' ? '/'+id : '')), true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.addEventListener('readystatechange', () => xhr.readyState === xhr.DONE && callback(mode === 'requestsText' ? xhr.response : JSON.parse(xhr.response)));
    xhr.send(JSON.stringify(postData));
}

const getMarkers = () => Array.from(document.getElementsByClassName('leaflet-marker-pane')[0].children); // Получение списка всех маркеров
const removeContextPin = () => getMarkers().forEach(img => img.src.includes(userMarker) && img.remove()); // Очистка метки пользователя
const clearMarkers = () => getMarkers().forEach(el => el.remove()); // Очистка всей карты

function createCategory(element) { // Наполняет выпадающий список категориями
    const option = document.createElement('option');
    option.id=element.id;
    option.innerText=element.name;
    option.dataset.color = element.color;
    document.getElementById('modeList').insertAdjacentElement('beforeend', option);
}

const renderForm = () => document.getElementById('container').insertAdjacentHTML('beforeend', '<div id="form"><div id="closeForm"></div><select id="selectForm"></select><label for="text">Опишите вашу проблему</label><textarea id="text"></textarea><div id="attention">Укажите на карте току, нажав правой кнопкой мыши</div><div id="sendForm">Отправить</div></div>');

document.addEventListener('DOMContentLoaded', () => {
    let coords = {}, // Дамп для координат
        dataDump; // Дамп для категорий
    let map = L.map('map').setView([56.1012, 47.2261], 12); // Инициализация карты
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map); // Задание слоя маски - обычный
    map.on('contextmenu', () => null); // Отключение стандартного контекстного меню браузера

    const setMarker = (coords, icon=marker, size=[30, 20], callback = console.log) => L.marker(coords, {icon:L.icon({iconUrl:markersParh + icon,iconSize:size,iconAnchor:[5,35],popupAnchor:[0,-40]})}).addEventListener('click', callback).addTo(map);

    const contextMenu = e => {
        removeContextPin(); // Удаление точки пользователя
        
        coords = e.latlng; // Дамп координат
        
        setMarker(e.latlng, userMarker, [25, 40]); // Установка точки пользователя
        
        document.getElementById('attention').innerHTML = '<span id="unselectPin">Убрать маркер</span>'; // Рендер отмены выбора точки
        document.getElementById('unselectPin').addEventListener('click', () => { // Обработчик отмены выбора точки
            removeContextPin(); // Удаление точки пользователя
            document.getElementById('attention').innerText = 'Укажите на карте току, нажав правой кнопкой мыши';
        });
    }

    const openForm = () => { // Открытие формы
        if (!document.getElementById('form')) { // Если форма не была открыта ранее
            let selectDump; // Дамп для выбранной id категории
            renderForm(); // Рендер формы
            
            dataDump.forEach(el => {
                const option = document.createElement('option');
                option.innerText = el.name;
                option.id = el.id;
                option.dataset.color = el.color;
                document.getElementById('selectForm').insertAdjacentElement('beforeend', option);
            });
            document.getElementById('selectForm').addEventListener('change', e => selectDump = { 'name': e.target.selectedOptions[0].value, 'id': e.target.selectedOptions[0].id });
            selectDump = { 'name': dataDump[0].name, 'id': dataDump[0].id };
            document.getElementById('openForm').classList.add('hide'); // Прячем кнопку

            map.addEventListener('contextmenu', contextMenu); // Обработчик контекстного меню

            document.getElementById('closeForm').addEventListener('click', e => {
                e.target.parentElement.remove();
                map.removeEventListener('contextmenu', contextMenu);
                removeContextPin(); // Удаление точки пользователя
                document.getElementById('openForm').classList.remove('hide'); // Показываем кнопку
            });

            document.getElementById('sendForm').addEventListener('click', () => { // Обработчик отправки формы
                const text = document.getElementById('text'); // Получение полей формы для чтения их значений

                if (text.value !== '' && (coords.lng && coords.lat)) { // Отправка формы, только если она полностью заполнена
                    sendReq('POST', 'createRequest', () => alert('Успешно создано!'), { "summary": selectDump.name, "text": text.value, "coordinate": { "lon": coords.lng, "lat": coords.lat } });
                    document.getElementById('closeForm').click(); // Закрытие формы
                    if (document.getElementById('modeList').selectedOptions[0].value === selectDump.name) setMarker([coords.lat, coords.lng], links[selectDump.id], undefined, e => e.target.bindPopup(text.value)); // Добавление маркера без запроса с сервера
                    coords = {}; // Сброс координат
                } else alert('Пожалуйста заполните все поля и поставте точку на карте');
            });
        }
    }
    const changeCategoryRender = (data, catID) => {
        clearMarkers(); // Очистка всех маркеров с карты
        data.forEach(el => setMarker([el.coordinate.lat, el.coordinate.lon], links[catID], undefined, e =>
            sendReq('GET', 'requestsText', d => e.target.bindPopup(d).openPopup(), undefined, el.requestId)));
    }

    const renderSettings = () => {
        document.body.insertAdjacentHTML('afterbegin', '<div id="container"></div>'); // Рендер базовой структуры

        sendReq('GET', 'categories', data => { // Запрос категорий
            dataDump = data;
            dataDump.forEach((category, i) => links[category.id] = markers[i]); // Установка связи категорий и маркеров
            console.log(links);
            const select = document.createElement('select');
            select.id="modeList";
            select.addEventListener('change', e => sendReq('GET', 'points', data => changeCategoryRender(data, e.target.selectedOptions[0].id), null, e.target.selectedOptions[0].id));

            document.getElementById('container').insertAdjacentElement('afterbegin', select); // Рендер контейнера списка категорий
            data.forEach(createCategory); // Наполнение списка категорий

            sendReq('GET', 'points', data => changeCategoryRender(data, dataDump[0].id), null, dataDump[0].id); // Запрос категории по id

            document.getElementById('container').insertAdjacentHTML('beforeend', '<div id="openForm">Отправить запрос</div>'); // Рендер кнопки открытия формы
            document.getElementById('openForm').addEventListener('click', openForm); // Добавляет обработчик открытия формы
        });
    }

    renderSettings(); // Точка входа
});