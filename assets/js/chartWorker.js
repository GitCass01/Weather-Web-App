onmessage = async function (e) {
    //console.log('Message received from main script');
    const city = JSON.parse(e.data).city;

    let workerResult;
    await fetch('/chartTemperatures?city=' + city.name + '&lat=' + city.lat + '&lon=' + city.lon)
        .then(response => response.json())
        .then(result => {
            workerResult = result;
        })
        .catch(err => console.log("err: ", err));

    postMessage(JSON.stringify(workerResult));
}