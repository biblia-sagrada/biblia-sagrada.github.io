// --- 1. VARIÁVEIS GLOBAIS ---
let livros = [];
let offersData = [];

// --- 2. LOGICA DE OFERTAS (COLAB55) ---

async function fetchOffers() {
    try {
        console.log("Iniciando busca do XML...");
        // O ?t= evita que o navegador use uma versão antiga em cache
        const response = await fetch('./c55_palavraquefortifica.xml?t=' + Date.now());
        const str = await response.text();
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(str, "text/xml");
        
        // AJUSTE: Buscamos todos os <item>, independentemente de onde estejam no XML
        const items = xmlDoc.getElementsByTagName("item");

        offersData = Array.from(items).map(item => {
            // Transformamos o item em texto para usar Regex (mais seguro contra prefixos g:)
            const rawItem = new XMLSerializer().serializeToString(item);
            
            const extract = (tag) => {
                // Procura a tag ignorando prefixos (como g:) e pega o conteúdo
                const regex = new RegExp(`<[^>]*${tag}[^>]*>([^]*?)<\/[^>]*${tag}>`, 'i');
                const match = rawItem.match(regex);
                if (match && match[1]) {
                    return match[1]
                        .replace(/<!\[CDATA\[/g, '')
                        .replace(/\]\]>/g, '')
                        .trim();
                }
                return "";
            };

            const title = extract("title") || "Arte Cristã";
            const link = extract("link") || "#";
            const img = extract("image_link");
            let price = extract("price");

            if (price) {
                // Limpa o preço (ex: "49.90 BRL" vira "R$ 49,90")
                const num = price.replace(/[a-zA-Z]/g, '').trim();
                price = "R$ " + num.replace('.', ',');
            }

            return { title, link, img, price };
        }).filter(ad => ad.img && ad.img.includes('http')); // Só aceita se tiver link de imagem

        console.log("Produtos identificados:", offersData.length);

        if (offersData.length > 0) {
            updateOffer();
        } else {
            const loading = document.getElementById('loading-ads');
            if (loading) loading.style.display = 'none';
        }
    } catch (err) {
        console.error("Erro ao processar XML:", err);
    }
}

function updateOffer() {
    if (offersData.length === 0) return;
    
    const ad = offersData[Math.floor(Math.random() * offersData.length)];
    const loading = document.getElementById('loading-ads');
    const link = document.getElementById('content-link');
    const img = document.getElementById('content-image');
    const title = document.getElementById('content-title');
    const priceDisplay = document.getElementById('offer-price');

    if (link && img) {
        img.src = ad.img;
        title.innerText = ad.title;
        link.href = ad.link;
        if (priceDisplay) priceDisplay.innerText = ad.price;

        if (loading) loading.style.display = 'none';
        link.classList.remove('hidden');
        link.style.display = 'flex'; 
    }
}

// --- 3. LOGICA DA BÍBLIA ---

async function carregarDados(testamento) {
    const arquivo = testamento === 'velho' ? './velho.json' : './novo.json';
    try {
        const res = await fetch(arquivo);
        if (!res.ok) throw new Error("Erro ao carregar " + arquivo);
        livros = await res.json();
        renderizarGrade();
        irParaMenu();
    } catch (err) {
        console.error("Erro ao carregar os dados da Bíblia:", err);
    }
}

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

function abrirSeletorCapitulos(livroIdx) {
    const livro = livros[livroIdx];
    document.getElementById('menu').style.display = 'none';
    document.getElementById('telaLeitura').style.display = 'block';
    document.getElementById('nomeLivro').innerText = livro.name;
    
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    seletor.innerHTML = `<h3 class="titulo-selecao">Escolha o Capítulo:</h3>`;
    const gradeBotoes = document.createElement('div');
    gradeBotoes.className = "lista-grid";
    areaTexto.innerHTML = ""; 

    livro.chapters.forEach((_, capIdx) => {
        const btnCap = document.createElement('button');
        btnCap.className = 'btn-livro';
        btnCap.innerText = capIdx + 1;
        btnCap.onclick = () => carregarCapitulo(livroIdx, capIdx);
        gradeBotoes.appendChild(btnCap);
    });
    seletor.appendChild(gradeBotoes);
    window.scrollTo(0, 0);
}

function carregarCapitulo(livroIdx, capIdx) {
    const livro = livros[livroIdx];
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    seletor.innerHTML = `
        <div class="barra-capitulo">
            <span class="label-cap">Capítulo ${capIdx + 1}</span>
            <button onclick="abrirSeletorCapitulos(${livroIdx})" class="btn-trocar-cap">Trocar Capítulo</button>
        </div>
    `;

    areaTexto.innerHTML = livro.chapters[capIdx].map((versiculo, idx) => 
        `<p class="versiculo"><span class="num-v">${idx + 1}</span>${versiculo}</p>`
    ).join('');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function irParaMenu() {
    document.getElementById('menu').style.display = 'block';
    document.getElementById('telaLeitura').style.display = 'none';
    window.scrollTo(0, 0);
}

// --- 4. UTILITÁRIOS E MODAL ---

function compartilharWhatsApp() {
    const mensagem = `📖 *Um presente para você!*\n\nSite da Bíblia com letras grandes.\n\n👉 *Acesse:* ${window.location.href.split('?')[0]}\n\n_Deus abençoe!_ ✨`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
}

function abrirInfo() { document.getElementById('modalInfo').style.display = "block"; }
function fecharInfo() { document.getElementById('modalInfo').style.display = "none"; }

window.onclick = (e) => {
    const modal = document.getElementById('modalInfo');
    if (e.target == modal) fecharInfo();
};

// --- 5. INICIALIZAÇÃO (DOM CONTENT LOADED) ---

document.addEventListener("DOMContentLoaded", () => {
    // 1. Carrega Bíblia (Velho Testamento)
    carregarDados('velho');
    
    // 2. Carrega Ofertas
    fetchOffers();

    // 3. Configura botão de recolher ads
    const collapseBtn = document.getElementById('collapse-button');
    if (collapseBtn) {
        collapseBtn.onclick = () => {
            const area = document.getElementById('content-area');
            area.classList.toggle('collapsed');
            collapseBtn.innerText = area.classList.contains('collapsed') ? '▲' : '▼';
        };
    }
});
