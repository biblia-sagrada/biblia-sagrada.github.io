let livros = [];
let offersData = [];
const OFFERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaiIM_7fbsAN3SJvgWmJhEeciFZtvCeUFEyJwyaldEDlbh5kxXgg5l6y31V7RpxGldW-Kpc7oWdHst/pub?gid=1157838368&single=true&output=csv";

// Carregar Bíblia da Raiz
fetch('./biblia.json')
    .then(res => res.json())
    .then(data => {
        livros = data;
        renderizarMenu();
    }).catch(err => console.error("Erro ao carregar biblia.json", err));

function renderizarMenu() {
    const grade = document.getElementById('listaLivros');
    if (!grade) return;
    grade.innerHTML = '';
    livros.forEach((l, i) => {
        const b = document.createElement('button');
        b.className = 'btn-livro';
        b.innerText = l.name;
        b.onclick = () => abrirLivro(i);
        grade.appendChild(b);
    });
}

function abrirLivro(i) {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('telaLeitura').style.display = 'block';
    const livro = livros[i];
    document.getElementById('nomeLivro').innerText = livro.name;
    
    let html = '';
    if (livro.chapters && livro.chapters[0]) {
        livro.chapters[0].forEach((v, idx) => {
            html += `<span class="versiculo"><span class="num-v">${idx + 1}</span>${v}</span> `;
        });
    }
    document.getElementById('texto').innerHTML = html;
    window.scrollTo(0, 0);
}

function irParaMenu() {
    document.getElementById('menu').style.display = 'block';
    document.getElementById('telaLeitura').style.display = 'none';
}

// Lógica de Ofertas
function parseCsvLine(line) {
    const result = [];
    let inQuote = false;
    let currentField = '';
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
            result.push(currentField.trim());
            currentField = '';
        } else currentField += char;
    }
    result.push(currentField.trim());
    return result;
}

async function fetchOffers() {
    try {
        const response = await fetch(OFFERS_CSV_URL);
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(l => l.trim() !== '');
        const headers = parseCsvLine(lines[0]);
        
        offersData = lines.slice(1).map(line => {
            const values = parseCsvLine(line);
            const row = {};
            headers.forEach((h, idx) => {
                row[h.trim()] = values[idx] ? values[idx].replace(/^"|"$/g, '').replace(/\r$/, '') : '';
            });
            return row;
        }).filter(o => o.img && o.img.length > 10);

        if (offersData.length > 0) {
            updateOffer();
            setInterval(updateOffer, 10000);
        }
    } catch (e) { console.error(e); }
}

function updateOffer() {
    const ad = offersData[Math.floor(Math.random() * offersData.length)];
    const link = document.getElementById('content-link');
    document.getElementById('loading-ads').classList.add('hidden');
    link.classList.remove('hidden');
    document.getElementById('content-title').textContent = ad['Item_Name'] || "";
    document.getElementById('content-image').src = ad['img'] || "";
    document.getElementById('offer-description').textContent = ad['Description'] || "";
    link.href = ad['Offer_Link'] || "#";
}

window.onload = () => {
    fetchOffers();
    document.getElementById('collapse-button').onclick = () => {
        const area = document.getElementById('content-area');
        area.classList.toggle('collapsed');
        document.getElementById('collapse-button').innerText = area.classList.contains('collapsed') ? '▲' : '▼';
    };
};
