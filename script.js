// --- VARIÁVEIS GLOBAIS ---
let livros = [];
let offersData = [];
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
/*
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
            setInterval(updateOffer, 15000);
        }
    } catch (e) { 
        console.error("Erro ao carregar ofertas:", e);
        if(document.getElementById('loading-ads')) {
            document.getElementById('loading-ads').innerText = "Fortaleça a sua fé diariamente.";
        }
    }
}
*/
// A lista que vai guardar os produtos da Colab55
let offersData = [];

// Nova função para buscar o XML
async function fetchOffers() {
    try {
        // 1. Busca o arquivo XML no seu Github
        const response = await fetch('https://biblia-sagrada.github.io/c55_palavraquefortifica.xml');
        const str = await response.text();
        
        // 2. Transforma o texto XML em um formato que o JavaScript entende
        const data = new window.DOMParser().parseFromString(str, "text/xml");
        
        // 3. Pega todos os produtos (geralmente ficam dentro da tag <item>)
        const items = data.querySelectorAll("item");
        
        // 4. Converte os itens do XML para o formato que a sua publicidade já usa
        offersData = Array.from(items).map(item => {
            // Busca a imagem (tenta várias tags comuns em XML de produtos)
            const imgNode = item.getElementsByTagName("g:image_link")[0] || 
                            item.getElementsByTagName("image_link")[0] || 
                            item.querySelector("image");
                            
            const titleNode = item.querySelector("title");
            const linkNode = item.querySelector("link");
            const descNode = item.querySelector("description");

            // Limpa a descrição caso o XML venha com códigos HTML misturados
            let cleanDesc = descNode ? descNode.textContent.replace(/(<([^>]+)>)/gi, "") : "";
            if (cleanDesc.length > 60) cleanDesc = cleanDesc.substring(0, 60) + "..."; // Limita o tamanho

            return {
                Item_Name: titleNode ? titleNode.textContent : "Produto Exclusivo",
                Description: cleanDesc,
                img: imgNode ? imgNode.textContent : "",
                Offer_Link: linkNode ? linkNode.textContent : "#"
            };
        });

        // 5. Após carregar tudo, chama a função para mostrar a oferta na tela
        updateOffer();
        
    } catch (error) {
        console.error("Erro ao carregar os produtos da Colab55:", error);
        // Se der erro, esconde a área de carregamento para não ficar travado
        const loading = document.getElementById('loading-ads');
        if (loading) loading.style.display = 'none';
    }
}

function updateOffer() {
    if (offersData.length === 0) return;
    
    // Sorteia uma oferta
    const ad = offersData[Math.floor(Math.random() * offersData.length)];
    
    const loading = document.getElementById('loading-ads');
    const link = document.getElementById('content-link');
    const img = document.getElementById('content-image');
    
    // Só prossegue se houver uma imagem válida no dado sorteado
    if (ad['img'] && ad['img'].length > 10) {
        // 1. Alimenta os dados
        img.src = ad['img'];
        document.getElementById('content-title').innerText = ad['Item_Name'] || "";
        document.getElementById('offer-description').innerText = ad['Description'] || "";
        link.href = ad['Offer_Link'] || "#";

        // 2. Quando a imagem terminar de carregar de fato
        img.onload = () => {
            if (loading) loading.style.display = 'none'; // Esconde o texto de espera
            link.classList.remove('hidden'); // Mostra a oferta montada
            img.style.display = 'block'; // Garante que a imagem apareça
        };
    }
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
