// --- CONFIGURAÇÕES E DADOS GLOBAIS ---
let livros = [];
let offersData = [];
const OFFERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaiIM_7fbsAN3SJvgWmJhEeciFZtvCeUFEyJwyaldEDlbh5kxXgg5l6y31V7RpxGldW-Kpc7oWdHst/pub?gid=1157838368&single=true&output=csv";

// Lista de livros do Novo Testamento para o filtro automático
const livrosNovoTestamento = [
    "Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", 
    "2 Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", 
    "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", 
    "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro", 
    "1 João", "2 João", "3 João", "Judas", "Apocalipse"
];

// --- INICIALIZAÇÃO ---

// Busca o JSON da Bíblia na raiz
fetch('./biblia.json')
    .then(res => {
        if (!res.ok) throw new Error("Erro ao carregar biblia.json");
        return res.json();
    })
    .then(data => {
        livros = data;
        renderizarMenu(); // Inicia mostrando todos os livros
    })
    .catch(err => console.error(err));

// --- NAVEGAÇÃO E FILTROS ---

// Renderiza a lista de livros (Todos, Velho ou Novo)
function filtrarTestamento(tipo) {
    const grade = document.getElementById('listaLivros');
    document.getElementById('menu').style.display = 'block';
    document.getElementById('telaLeitura').style.display = 'none';
    
    // Limpa a grade e o topo
    grade.innerHTML = '';
    window.scrollTo(0, 0);

    // Se 'todos', renderiza tudo. Se não, filtra.
    livros.forEach((l, i) => {
        const isNovo = livrosNovoTestamento.includes(l.name);
        if (tipo === 'todos' || (tipo === 'novo' && isNovo) || (tipo === 'velho' && !isNovo)) {
            const b = document.createElement('button');
            b.className = 'btn-livro';
            b.innerText = l.name;
            b.onclick = () => abrirSeletorCapitulos(i);
            grade.appendChild(b);
        }
    });
}

// Atalho para voltar ao início total
function irParaMenu() {
    filtrarTestamento('todos');
}

// Abre a grade de números dos capítulos
function abrirSeletorCapitulos(livroIdx) {
    const livro = livros[livroIdx];
    document.getElementById('menu').style.display = 'none';
    document.getElementById('telaLeitura').style.display = 'block';
    
    document.getElementById('nomeLivro').innerText = livro.name;
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    areaTexto.innerHTML = ''; 
    seletor.innerHTML = ''; 
    seletor.className = "lista-grid"; // Garante que os números fiquem em grade

    // Cria botões grandes para cada capítulo
    livro.chapters.forEach((_, capIdx) => {
        const btnCap = document.createElement('button');
        btnCap.innerText = capIdx + 1;
        btnCap.className = 'btn-livro';
        btnCap.onclick = () => carregarCapitulo(livroIdx, capIdx);
        seletor.appendChild(btnCap);
    });

    if (livro.chapters.length === 1) {
        carregarCapitulo(livroIdx, 0);
    } else {
        areaTexto.innerHTML = `<p class="text-center text-gray-500 mt-6 font-bold">Toque no número do capítulo:</p>`;
    }
    window.scrollTo(0, 0);
}

// Carrega os versículos do capítulo selecionado
function carregarCapitulo(livroIdx, capIdx) {
    const livro = livros[livroIdx];
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    // Simplifica o seletor para mostrar apenas onde o usuário está
    seletor.className = ""; 
    seletor.innerHTML = `
        <div class="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-200 mb-6">
            <span class="font-bold text-amber-900">Capítulo ${capIdx + 1}</span>
            <button onclick="abrirSeletorCapitulos(${livroIdx})" class="text-xs bg-amber-200 text-amber-900 px-3 py-1 rounded-md font-bold uppercase">Trocar Capítulo</button>
        </div>
    `;

    let html = '';
    livro.chapters[capIdx].forEach((v, idx) => {
        html += `<p class="versiculo"><span class="num-v">${idx + 1}</span>${v}</p>`;
    });
    
    areaTexto.innerHTML = html;
    window.scrollTo(0, 0);
}

// Função padrão de renderização (Início)
function renderizarMenu() {
    filtrarTestamento('todos');
}

// --- LÓGICA DE OFERTAS (CSV) ---

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
    } catch (e) { console.error("Erro nos anúncios:", e); }
}

function updateOffer() {
    if (offersData.length === 0) return;
    const ad = offersData[Math.floor(Math.random() * offersData.length)];
    const link = document.getElementById('content-link');
    const loading = document.getElementById('loading-ads');
    
    if (loading) loading.classList.add('hidden');
    if (link) {
        link.classList.remove('hidden');
        document.getElementById('content-title').textContent = ad['Item_Name'] || "";
        document.getElementById('content-image').src = ad['img'] || "";
        document.getElementById('offer-description').textContent = ad['Description'] || "";
        link.href = ad['Offer_Link'] || "#";
    }
}

// --- EVENTOS DE CARREGAMENTO ---

window.onload = () => {
    fetchOffers();
    // Botão de recolher o rodapé
    const collapseBtn = document.getElementById('collapse-button');
    if (collapseBtn) {
        collapseBtn.onclick = () => {
            const area = document.getElementById('content-area');
            area.classList.toggle('collapsed');
            collapseBtn.innerText = area.classList.contains('collapsed') ? '▲' : '▼';
        };
    }
};
