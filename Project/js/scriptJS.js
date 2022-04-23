// funzione per mostrare la card specifica per la città innserita nella search bar
function showMe() {
    var card = document.getElementById('hidden-card');
    var city = document.getElementById('floatingInput');

    if (city.value.trim()) {
        if (card.style.display == '' || card.style.display == 'none') {
            card.style.display = 'block';
            document.getElementById('city').innerHTML = city.value;
        }
        else {
            card.style.display = 'none';
        }
    }
}