// Configurações e Variáveis Globais
let livros = [];
let offersData = [];
const OFFERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaiIM_7fbsAN3SJvgWmJhEeciFZtvCeUFEyJwyaldEDlbh5kxXgg5l6y31V7RpxGldW-Kpc7oWdHst/pub?gid=1157838368&single=true&output=csv";

// --- LÓGICA DA BÍBLIA ---

// Carregar o JSON da Bíblia
fetch('js/biblia.json')
    .then(res => res.json())
    .then(data => {
        livros = data;
        renderizarMenu();
    })
    .catch(err => console.error("Erro ao carregar biblia.json. Verifique a pasta js/", err));

// Renderiza a lista de botões dos livros
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

// Abre o conteúdo do livro selecionado
function abrirLivro(i) {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('telaLeitura').style.display = 'block';
    
    const livro = livros[i];
    document.getElementById('nomeLivro').innerText = livro.name;
    
    let html = '';
    // Mostra o capítulo 1 por padrão
    if (livro.chapters && livro.chapters[0]) {
        livro.chapters[0].forEach((v, idx) => {
            html += `<span class="versiculo"><span class="num-v">${idx + 1}</span>${v} </span>`;
        });
    }
    document.getElementById('texto').innerHTML = html;
    window.scrollTo(0, 0);
}

// Volta para a tela principal
function irParaMenu() {
    document.getElementById('menu').style.display = 'block';
    document.getElementById('telaLeitura').style.display = 'none';
}

// --- LÓGICA DE PUBLICIDADE (CSV) ---

// Função para tratar o CSV respeitando aspas e vírgulas
function parseCsvLine(line) {
    const result = [];
    let inQuote = false;
    let currentField = '';
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    result.push(currentField.trim());
    return result;
}

// Busca as ofertas na planilha do Google
async function fetchOffers() {
    try {
        const response = await fetch(OFFERS_CSV_URL);
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length <= 1) return;

        const headers = parseCsvLine(lines[0]);
        
        offersData = lines.slice(1).map(line => {
            const values = parseCsvLine(line);
            const row = {};
            headers.forEach((header, index) => {
                // Limpa aspas extras e quebras de linha
                let val = values[index] ? values[index].replace(/^"|"$/g, '').replace(/\r$/, '') : '';
                row[header.trim()] = val;
            });
            return row;
        }).filter(o => o.img && o.img.length > 5);

        if (offersData.length > 0) {
            updateOffer();
            setInterval(updateOffer, 10000); // Troca a cada 10 segundos
        }
    } catch (error) {
        console.error("Erro ao carregar anúncios:", error);
    }
}

// Atualiza o banner de oferta no rodapé
function updateOffer() {
    if (offersData.length === 0) return;
    
    const ad = offersData[Math.floor(Math.random() * offersData.length)];
    const linkElem = document.getElementById('content-link');
    const loadingElem = document.getElementById('loading-ads');

    if (loadingElem) loadingElem.classList.add('hidden');
    if (linkElem) {
        linkElem.classList.remove('hidden');
        document.getElementById('content-title').textContent = ad['Item_Name'] || "Destaque";
        document.getElementById('content-image').src = ad['img'] || "";
        document.getElementById('offer-description').textContent = ad['Description'] || "";
        linkElem.href = ad['Offer_Link'] || "#";
    }
}

// Configura o botão de recolher/expandir o rodapé
function setupCollapse() {
    const btn = document.getElementById('collapse-button');
    const area = document.getElementById('content-area');
    if (btn && area) {
        btn.onclick = () => {
            area.classList.toggle('collapsed');
            btn.innerText = area.classList.contains('collapsed') ? '▲' : '▼';
        };
    }
}

// Inicializa tudo quando a página carregar
window.onload = () => {
    fetchOffers();
    setupCollapse();
};
