window.CallbackRegistry = {}; // реестр

function scriptRequest(url, onSuccess, onError) {

    var scriptOk = false; // флаг, что вызов прошел успешно

    var callbackName = 'cb' + String(Math.random()).slice(-6);

    url += ~url.indexOf('?') ? '&' : '?';
    url += 'callback=CallbackRegistry.' + callbackName;

    CallbackRegistry[callbackName] = function(data) {
        scriptOk = true; // обработчик вызвался, указать что всё ок
        delete CallbackRegistry[callbackName]; // можно очистить реестр
        onSuccess(data); // и вызвать onSuccess
    };

    function checkCallback() {
        if (scriptOk) return; // сработал обработчик?
        delete CallbackRegistry[callbackName];
        onError(url); // нет - вызвать onError
    }

    var script = document.createElement('script');

    script.onreadystatechange = function() {
        if (this.readyState == 'complete' || this.readyState == 'loaded') {
            this.onreadystatechange = null;
            setTimeout(checkCallback, 0);
        }
    };

    script.onload = script.onerror = checkCallback;
    script.src = url;

    document.body.appendChild(script);
}

function httpGet(url) {
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);

        xhr.onload = function() {
            if (this.status == 200) {
                resolve(JSON.parse(this.response));
            } else {
                var error = new Error(this.statusText);
                error.code = this.status;
                reject(error);
            }
        };

        xhr.onerror = function() {
            reject(new Error("Network Error"));
        };

        xhr.send();
    });
}

function googleApiGetGeoLocation(city) {
    return httpGet('https://maps.google.com/maps/api/geocode/json?sensor=false" . "&address=' + city);
}

function forecastApiGetWeather({ results }) {
    const lat = results[0].geometry.location.lat;
    const lng = results[0].geometry.location.lng;


    return new Promise((res, rej) => {
        const url = `https://api.forecast.io/forecast/e6b2ec46c1a1424d28fd7606c38272c6/${lat},${lng}?units=si`;
        const onSuccess = (data) => {
            res(data);
        };
        const onError = () => {
            console.log('onError');
        };
        scriptRequest(url, onSuccess, onError);
    });
}

const getWeatherByCity = async function (city) {
    const googleApiResponse = await googleApiGetGeoLocation(city);
    const forecastApiResponse = await forecastApiGetWeather(googleApiResponse);
    return forecastApiResponse;
};

getWeatherByCity('Dnipro').then((data) => {
    console.log(data);
});