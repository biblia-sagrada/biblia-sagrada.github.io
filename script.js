// --- VARIÁVEIS GLOBAIS ---
let livros = [];
let offersData = [];
const OFFERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaiIM_7fbsAN3SJvgWmJhEeciFZtvCeUFEyJwyaldEDlbh5kxXgg5l6y31V7RpxGldW-Kpc7oWdHst/pub?gid=1157838368&single=true&output=csv";

// --- INICIALIZAÇÃO SEGURA ---
document.addEventListener("DOMContentLoaded", () => {
    // Carrega o Velho Testamento por padrão ao abrir o app
    carregarDados('velho');
    
    // Inicia a busca de ofertas
    fetchOffers();

    // Configura o botão de recolher a publicidade
    const collapseBtn = document.getElementById('collapse-button');
    if (collapseBtn) {
        collapseBtn.onclick = () => {
            const area = document.getElementById('content-area');
            area.classList.toggle('collapsed');
            collapseBtn.innerText = area.classList.contains('collapsed') ? '▲' : '▼';
        };
    }
});

// --- LOGICA DE CARREGAMENTO DE DADOS ---

async function carregarDados(testamento) {
    // Define qual arquivo buscar
    const arquivo = testamento === 'velho' ? './velho.json' : './novo.json';
    
    try {
        const res = await fetch(arquivo);
        if (!res.ok) throw new Error("Não foi possível encontrar o arquivo " + arquivo);
        
        livros = await res.json();
        
        // Após carregar, desenha a grade de livros na tela
        renderizarGrade();
        
        // Garante que a tela de menu esteja visível e a de leitura escondida
        document.getElementById('menu').style.display = 'block';
        document.getElementById('telaLeitura').style.display = 'none';
        window.scrollTo(0, 0);
        
    } catch (err) {
        console.error("Erro ao carregar os dados da Bíblia:", err);
    }
}

// Atalho para o logo voltar ao início (carrega todos ou mantém o atual)
function irParaMenu() {
    carregarDados('velho'); // Ou uma lógica para voltar ao que estava
}

// Troca de testamento via botões do topo
function filtrarTestamento(tipo) {
    carregarDados(tipo);
}

// Desenha os botões dos livros
function renderizarGrade() {
    const grade = document.getElementById('listaLivros');
    if (!grade) return;
    
    grade.innerHTML = '';
    
    livros.forEach((livro, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn-livro';
        btn.innerText = livro.name;
        btn.onclick = () => abrirSeletorCapitulos(index);
        grade.appendChild(btn);
    });
}

// --- NAVEGAÇÃO INTERNA (CAPÍTULOS E VERSÍCULOS) ---

function abrirSeletorCapitulos(livroIdx) {
    const livro = livros[livroIdx];
    document.getElementById('menu').style.display = 'none';
    document.getElementById('telaLeitura').style.display = 'block';
    
    document.getElementById('nomeLivro').innerText = livro.name;
    
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    seletor.className = "lista-grid";
    seletor.innerHTML = '';
    areaTexto.innerHTML = `<p style="text-align:center; color:#a1887f; margin-top:20px;">Toque no número do capítulo:</p>`;

    livro.chapters.forEach((_, capIdx) => {
        const btnCap = document.createElement('button');
        btnCap.className = 'btn-livro';
        btnCap.innerText = capIdx + 1;
        btnCap.onclick = () => carregarCapitulo(livroIdx, capIdx);
        seletor.appendChild(btnCap);
    });

    // Se o livro só tiver 1 capítulo (ex: Obadias), carrega direto
    if (livro.chapters.length === 1) {
        carregarCapitulo(livroIdx, 0);
    }
    window.scrollTo(0, 0);
}

function carregarCapitulo(livroIdx, capIdx) {
    const livro = livros[livroIdx];
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    // Cria a barra superior de navegação do capítulo
    seletor.className = ""; 
    seletor.innerHTML = `
        <div class="barra-capitulo">
            <span class="label-cap">Capítulo ${capIdx + 1}</span>
            <button onclick="abrirSeletorCapitulos(${livroIdx})" class="btn-trocar-cap">Trocar Capítulo</button>
        </div>
    `;

    // Monta o texto do capítulo
    const html = livro.chapters[capIdx].map((versiculo, idx) => {
        return `<p class="versiculo"><span class="num-v">${idx + 1}</span>${versiculo}</p>`;
    }).join('');
    
    areaTexto.innerHTML = html;
    window.scrollTo(0, 0);
}

// --- COMPARTILHAMENTO ---

function compartilharWhatsApp() {
    // Título que aparecerá no WhatsApp
    const tituloApp = "📖 *Bíblia Sagrada - Fácil de Ler*";
    const fraseConvite = "Olá! Gostaria de compartilhar com você este site para leitura da Bíblia. É muito simples de usar e as letras são grandes.";
    const linkApp = window.location.href.split('?')[0]; // Pega a home do site

    // Monta a mensagem final
    const mensagem = `${tituloApp}\n\n${fraseConvite}\n\n👉 Acesse aqui: ${linkApp}`;
    
    // Codifica e abre o WhatsApp
    const linkZap = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    window.open(linkZap, '_blank');
}

// --- LOGICA DE OFERTAS (CSV) ---

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
            setInterval(updateOffer, 15000); // Rotaciona a cada 15 segundos
        }
    } catch (e) { 
        console.error("Erro ao carregar ofertas:", e);
        document.getElementById('loading-ads').innerText = "Fortaleça a sua fé diariamente.";
    }
}

function updateOffer() {
    if (offersData.length === 0) return;
    const ad = offersData[Math.floor(Math.random() * offersData.length)];
    
    const loading = document.getElementById('loading-ads');
    const link = document.getElementById('content-link');
    
    if (loading) loading.style.display = 'none';
    if (link) {
        link.classList.remove('hidden');
        link.href = ad['Offer_Link'] || "#";
        document.getElementById('content-image').src = ad['img'] || "";
        document.getElementById('content-title').innerText = ad['Item_Name'] || "";
        document.getElementById('offer-description').innerText = ad['Description'] || "";
    }
}
