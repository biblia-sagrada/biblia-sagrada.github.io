// --- 1. VARIÁVEIS GLOBAIS ---
let livros = [];
let offersData = [];

// --- 2. LOGICA DE OFERTAS (COLAB55) ---

async function fetchOffers() {
    try {
        console.log("Iniciando busca do XML (Modo Blindado)...");
        
        // Adicionamos um carimbo de tempo (?t=...) para forçar o navegador a pegar o arquivo novo
        const response = await fetch('./c55_palavraquefortifica.xml?t=' + new Date().getTime(), {
            cache: "no-store"
        });
        
        if (!response.ok) throw new Error("Não foi possível acessar o arquivo XML.");
        
        const str = await response.text();
        
        // Se o XML veio vazio por algum motivo, paramos aqui
        if (str.length < 100) {
            console.error("O arquivo XML parece estar vazio ou mal formatado.");
            return;
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(str, "text/xml");
        const items = xmlDoc.querySelectorAll("item");

        offersData = Array.from(items).map(item => {
            // Pegamos o HTML bruto do item para garantir que nada escape do Regex
            const itemStr = new XMLSerializer().serializeToString(item);
            
            const extract = (tag) => {
                // Regex melhorada para pegar conteúdo mesmo com quebras de linha
                const regex = new RegExp(`<([^> ]*:)?${tag}[^>]*>([^]*?)<\\/\\1?${tag}>`, 'i');
                const match = itemStr.match(regex);
                if (match) {
                    return match[2]
                        .replace(/<!\[CDATA\[/g, '')
                        .replace(/\]\]>/g, '')
                        .trim();
                }
                return "";
            };

            let price = extract("price");
            if (price) {
                const num = price.replace(/[a-zA-Z]/g, '').trim();
                price = "R$ " + num.replace('.', ',');
            }

            return {
                title: item.querySelector("title")?.textContent || "Arte Cristã",
                link: item.querySelector("link")?.textContent || "#",
                img: extract("image_link"),
                price: price
            };
        }).filter(ad => ad.img && ad.img.includes('http')); // Só aceita se tiver um link de imagem válido

        console.log("Sucesso! Produtos processados:", offersData.length);

        if (offersData.length > 0) {
            updateOffer();
        } else {
            console.warn("Nenhum link de imagem foi encontrado dentro das tags do XML.");
            if(document.getElementById('loading-ads')) document.getElementById('loading-ads').style.display = 'none';
        }
    } catch (err) {
        console.error("Erro Crítico na busca:", err);
        if(document.getElementById('loading-ads')) document.getElementById('loading-ads').style.display = 'none';
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
