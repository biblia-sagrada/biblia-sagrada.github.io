// 1. Declaramos a variável globalmente no topo
let livros = [];
let offersData = [];

// 2. Definimos a função fetchOffers (ela DEVE estar fora de qualquer outra função)
async function fetchOffers() {
    try {
        console.log("Iniciando busca do XML...");
        const response = await fetch('./c55_palavraquefortifica.xml');
        if (!response.ok) throw new Error("Erro ao carregar arquivo XML");
        
        const str = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(str, "text/xml");
        const items = xmlDoc.querySelectorAll("item");

        offersData = Array.from(items).map(item => {
            const itemStr = new XMLSerializer().serializeToString(item);
            
            // Extrator robusto para tags g:image_link, g:price, etc.
            const extract = (tag) => {
                const regex = new RegExp(`<([^> ]*:)?${tag}[^>]*>([^]*?)<\\/\\1?${tag}>`, 'i');
                const match = itemStr.match(regex);
                return match ? match[2].trim().replace('<![CDATA[', '').replace(']]>', '') : "";
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
        }).filter(ad => ad.img !== "");

        console.log("Produtos processados:", offersData.length);

        if (offersData.length > 0) {
            updateOffer();
        }
    } catch (err) {
        console.error("Erro na função fetchOffers:", err);
        const loading = document.getElementById('loading-ads');
        if (loading) loading.style.display = 'none';
    }
}

// 3. Função para atualizar a interface
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
        link.style.display = 'flex'; // Força a exibição
    }
}

// 4. O GATILHO: Chama as funções quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
    console.log("Página carregada, chamando fetchOffers...");
    
    // Verifica se a função existe antes de chamar para evitar o erro de ReferenceError
    if (typeof fetchOffers === "function") {
        fetchOffers();
    } else {
        console.error("Erro: A função fetchOffers não foi encontrada no carregamento.");
    }

    
// Mantive sua URL original da planilha
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
    const arquivo = testamento === 'velho' ? './velho.json' : './novo.json';
    
    try {
        const res = await fetch(arquivo);
        if (!res.ok) throw new Error("Não foi possível encontrar o arquivo " + arquivo);
        
        livros = await res.json();
        renderizarGrade();
        
        document.getElementById('menu').style.display = 'block';
        document.getElementById('telaLeitura').style.display = 'none';
        window.scrollTo(0, 0);
        
    } catch (err) {
        console.error("Erro ao carregar os dados da Bíblia:", err);
    }
}

function irParaMenu() {
    // Retorna ao menu inicial limpando estados de leitura
    document.getElementById('menu').style.display = 'block';
    document.getElementById('telaLeitura').style.display = 'none';
    window.scrollTo(0, 0);
}

function filtrarTestamento(tipo) {
    carregarDados(tipo);
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

// --- NAVEGAÇÃO INTERNA (CAPÍTULOS E VERSÍCULOS) ---

function abrirSeletorCapitulos(livroIdx) {
    const livro = livros[livroIdx];
    document.getElementById('menu').style.display = 'none';
    document.getElementById('telaLeitura').style.display = 'block';
    
    document.getElementById('nomeLivro').innerText = livro.name;
    
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    // Limpa e prepara o título de escolha
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

    if (livro.chapters.length === 1) {
        carregarCapitulo(livroIdx, 0);
    }
    window.scrollTo(0, 0);
}

function carregarCapitulo(livroIdx, capIdx) {
    const livro = livros[livroIdx];
    const seletor = document.getElementById('seletorCapitulos');
    const areaTexto = document.getElementById('texto');
    
    // IMPORTANTE: Criamos a estrutura que será fixada pelo CSS
    seletor.innerHTML = `
        <div class="barra-capitulo">
            <span class="label-cap">Capítulo ${capIdx + 1}</span>
            <button onclick="abrirSeletorCapitulos(${livroIdx})" class="btn-trocar-cap">Trocar Capítulo</button>
        </div>
    `;

    const html = livro.chapters[capIdx].map((versiculo, idx) => {
        return `<p class="versiculo"><span class="num-v">${idx + 1}</span>${versiculo}</p>`;
    }).join('');
    
    areaTexto.innerHTML = html;
    
    // Faz a página voltar ao topo para iniciar a leitura
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- COMPARTILHAMENTO ---

function compartilharWhatsApp() {
    const linha1 = "📖 *Um presente para você!*";
    const linha2 = "Site da Bíblia com letras grandes e leitura bem simples.";
    const link = window.location.href.split('?')[0];
    const assinatura = "_Deus abençoe todos nós!_ ✨";

    const mensagem = `${linha1}\n\n${linha2}\n\n👉 *Acesse aqui:* ${link}\n\n${assinatura}`;
    const linkZap = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    window.open(linkZap, '_blank');
}


function abrirInfo() {
    document.getElementById('modalInfo').style.display = "block";
}

function fecharInfo() {
    document.getElementById('modalInfo').style.display = "none";
}

// Fecha se o usuário clicar fora da caixinha branca
window.onclick = function(event) {
    const modal = document.getElementById('modalInfo');
    if (event.target == modal) {
        fecharInfo();
    }
}

// --- LOGICA DE OFERTAS (MANTIDA ORIGINAL) ---

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
});



