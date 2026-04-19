let livros = [];
let offersData = [];
const OFFERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaiIM_7fbsAN3SJvgWmJhEeciFZtvCeUFEyJwyaldEDlbh5kxXgg5l6y31V7RpxGldW-Kpc7oWdHst/pub?gid=1157838368&single=true&output=csv";

const livrosNovoTestamento = ["Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João", "Judas", "Apocalipse"];

// Função para processar CSV com segurança (lidando com aspas e vírgulas)
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

// Inicialização segura
document.addEventListener("DOMContentLoaded", () => {
    // 1. Carregar Bíblia
    fetch('./biblia.json')
        .then(res => res.json())
        .then(data => {
            livros = data;
            filtrarTestamento('todos'); // Força a exibição inicial
        })
        .catch(err => console.error("Erro ao carregar Bíblia:", err));

    // 2. Carregar Ofertas
    fetchOffers();

    // 3. Configurar botão de colapsar
    const collapseBtn = document.getElementById('collapse-button');
    if (collapseBtn) {
        collapseBtn.onclick = () => {
            const area = document.getElementById('content-area');
            area.classList.toggle('collapsed');
            collapseBtn.innerText = area.classList.contains('collapsed') ? '▲' : '▼';
        };
    }
});

function filtrarTestamento(tipo) {
    const grade = document.getElementById('listaLivros');
    if (!grade) return;
    
    document.getElementById('menu').style.display = 'block';
    document.getElementById('telaLeitura').style.display = 'none';
    grade.innerHTML = '';
    
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
    window.scrollTo(0,0);
}

function irParaMenu() { filtrarTestamento('todos'); }

function abrirSeletorCapitulos(livroIdx) {
    const livro = livros[livroIdx];
    document.getElementById('menu').style.display = 'none';
    document.getElementById('telaLeitura').style.display = 'block';
    document.getElementById('nomeLivro').innerText = livro.name;
    
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    seletor.className = "lista-grid";
    seletor.innerHTML = '';
    areaTexto.innerHTML = `<p style="text-align:center; color:#a1887f; margin-top:20px;">Escolha o capítulo:</p>`;

    livro.chapters.forEach((_, capIdx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-livro';
        btn.innerText = capIdx + 1;
        btn.onclick = () => carregarCapitulo(livroIdx, capIdx);
        seletor.appendChild(btn);
    });
    if(livro.chapters.length === 1) carregarCapitulo(livroIdx, 0);
}

function carregarCapitulo(livroIdx, capIdx) {
    const livro = livros[livroIdx];
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    seletor.className = ""; 
    seletor.innerHTML = `
        <div class="barra-capitulo">
            <span class="label-cap">Capítulo ${capIdx + 1}</span>
            <button onclick="abrirSeletorCapitulos(${livroIdx})" class="btn-trocar-cap">Trocar Capítulo</button>
        </div>`;

    areaTexto.innerHTML = livro.chapters[capIdx].map((v, idx) => 
        `<p class="versiculo"><span class="num-v">${idx + 1}</span>${v}</p>`
    ).join('');
    window.scrollTo(0,0);
}

function compartilharWhatsApp() {
    const titulo = document.getElementById('nomeLivro').innerText;
    const texto = document.getElementById('texto').innerText;
    const msg = encodeURIComponent(`📖 *${titulo}*\n\n${texto}\n\nLido em: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
}

async function fetchOffers() {
    try {
        const res = await fetch(OFFERS_CSV_URL);
        const text = await res.text();
        const lines = text.split('\n').filter(l => l.trim() !== '');
        const headers = parseCsvLine(lines[0]);
        
        offersData = lines.slice(1).map(line => {
            const values = parseCsvLine(line);
            const row = {};
            headers.forEach((h, idx) => {
                row[h.trim()] = values[idx] ? values[idx].replace(/^"|"$/g, '') : '';
            });
            return row;
        }).filter(o => o.img && o.img.length > 10);

        if(offersData.length) {
            updateOffer();
            setInterval(updateOffer, 15000);
        }
    } catch (e) { console.error("Erro ofertas:", e); }
}

function updateOffer() {
    if (!offersData.length) return;
    const ad = offersData[Math.floor(Math.random()*offersData.length)];
    const loading = document.getElementById('loading-ads');
    const link = document.getElementById('content-link');
    
    if (loading) loading.style.display = 'none';
    if (link) {
        link.classList.remove('hidden');
        link.href = ad['Offer_Link'] || "#";
        document.getElementById('content-image').src = ad['img'];
        document.getElementById('content-title').innerText = ad['Item_Name'];
        document.getElementById('offer-description').innerText = ad['Description'] || "";
    }
}
