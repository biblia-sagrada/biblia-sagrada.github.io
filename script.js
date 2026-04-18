let livros = [];
let offersData = [];
const OFFERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaiIM_7fbsAN3SJvgWmJhEeciFZtvCeUFEyJwyaldEDlbh5kxXgg5l6y31V7RpxGldW-Kpc7oWdHst/pub?gid=1157838368&single=true&output=csv";

// Carregar Bíblia
fetch('./biblia.json')
    .then(res => res.json())
    .then(data => {
        livros = data;
        renderizarMenu();
    }).catch(err => console.error("Erro ao carregar biblia.json", err));

// Renderiza o Índice Principal
function renderizarMenu() {
    const grade = document.getElementById('listaLivros');
    document.getElementById('menu').style.display = 'block';
    document.getElementById('telaLeitura').style.display = 'none';
    
    grade.innerHTML = '';
    livros.forEach((l, i) => {
        const b = document.createElement('button');
        b.className = 'btn-livro';
        b.innerText = l.name;
        b.onclick = () => abrirSeletorCapitulos(i);
        grade.appendChild(b);
    });
}

// Lista de livros do Novo Testamento para o filtro automático
const livrosNovoTestamento = [
    "Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", 
    "2 Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", 
    "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", 
    "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro", 
    "1 João", "2 João", "3 João", "Judas", "Apocalipse"
];

function filtrarTestamento(tipo) {
    const grade = document.getElementById('listaLivros');
    document.getElementById('menu').style.display = 'block';
    document.getElementById('telaLeitura').style.display = 'none';
    
    grade.innerHTML = '';
    
    livros.forEach((l, i) => {
        const isNovo = livrosNovoTestamento.includes(l.name);
        
        if ((tipo === 'novo' && isNovo) || (tipo === 'velho' && !isNovo)) {
            const b = document.createElement('button');
            b.className = 'btn-livro';
            b.innerText = l.name;
            b.onclick = () => abrirSeletorCapitulos(i);
            grade.appendChild(b);
        }
    });
    window.scrollTo(0, 0);
}

// Altere a função irParaMenu para que ela volte ao índice completo ou ao último filtro
function irParaMenu() {
    renderizarMenu(); // Mostra todos os livros novamente
}

// 1ª Etapa: Abre a grade de capítulos do livro escolhido
function abrirSeletorCapitulos(livroIdx) {
    const livro = livros[livroIdx];
    document.getElementById('menu').style.display = 'none';
    document.getElementById('telaLeitura').style.display = 'block';
    
    document.getElementById('nomeLivro').innerText = livro.name;
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    areaTexto.innerHTML = ''; // Limpa texto anterior
    seletor.innerHTML = ''; // Limpa seletor anterior
    seletor.className = "lista-grid"; // Usa a mesma grade dos livros para os números

    // Cria botões grandes para cada capítulo
    livro.chapters.forEach((_, capIdx) => {
        const btnCap = document.createElement('button');
        btnCap.innerText = capIdx + 1;
        btnCap.className = "btn-livro"; // Reutiliza o estilo de botão bonito
        btnCap.onclick = () => carregarCapitulo(livroIdx, capIdx);
        seletor.appendChild(btnCap);
    });

    // Se o livro só tiver 1 capítulo, carrega direto
    if (livro.chapters.length === 1) {
        carregarCapitulo(livroIdx, 0);
    } else {
        areaTexto.innerHTML = `<p class="text-center text-gray-500 mt-4">Escolha o número do capítulo acima.</p>`;
    }
    window.scrollTo(0, 0);
}

// 2ª Etapa: Mostra os versículos do capítulo escolhido
function carregarCapitulo(livroIdx, capIdx) {
    const livro = livros[livroIdx];
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    // Esconde o seletor de capítulos para dar espaço ao texto (opcional)
    // Se quiser que os números continuem aparecendo, comente a linha abaixo:
    seletor.innerHTML = `<button class="btn-acao" onclick="abrirSeletorCapitulos(${livroIdx})"> Escolher outro capítulo</button>`;

    let html = '';
    livro.chapters[capIdx].forEach((v, idx) => {
        html += `<p class="versiculo"><span class="num-v">${idx + 1}</span>${v}</p>`;
    });
    
    areaTexto.innerHTML = html;
    document.getElementById('nomeLivro').innerText = `${livro.name} - Cap. ${capIdx + 1}`;
    window.scrollTo(0, 0);
}

function irParaMenu() {
    renderizarMenu();
}

// --- LÓGICA DE OFERTAS ---
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
    if (!ad || !link) return;
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
