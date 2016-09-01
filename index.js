const getJSONP = (function () {
    window.CallbackRegistry = {};

    return function (url) {
        return new Promise((res, rej) => {

            var scriptOk = false;

            var callbackName = 'cb' + String(Math.random()).slice(-6);

            url += ~url.indexOf('?') ? '&' : '?';
            url += 'callback=CallbackRegistry.' + callbackName;

            CallbackRegistry[callbackName] = function(data) {
                scriptOk = true;
                delete CallbackRegistry[callbackName];
                res(data);
            };

            function checkCallback() {
                if (scriptOk) return;
                delete CallbackRegistry[callbackName];
                rej(err => err);
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
        });
    }
}());

function googleApiGetGeoLocation(city) {
    const url = 'https://maps.google.com/maps/api/geocode/json?sensor=false&address=';
    return fetch(`${url}city`).then(res => res.json()).catch(err => {
        throw new Error(err);
    });
}

function forecastApiGetWeather({ results }) {
    const lat = results[0].geometry.location.lat;
    const lng = results[0].geometry.location.lng;
    const url = `https://api.forecast.io/forecast/e6b2ec46c1a1424d28fd7606c38272c6/${lat},${lng}?units=si`;

    return getJSONP(url);
}

const getWeatherByCity = async function (city) {
    const googleApiResponse = await googleApiGetGeoLocation(city);
    const forecastApiResponse = await forecastApiGetWeather(googleApiResponse);
    return forecastApiResponse;
};

getWeatherByCity('Dnipro').then((data) => {
    console.log(data);
});