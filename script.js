let livros = [];
let offersData = [];
const OFFERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaiIM_7fbsAN3SJvgWmJhEeciFZtvCeUFEyJwyaldEDlbh5kxXgg5l6y31V7RpxGldW-Kpc7oWdHst/pub?gid=1157838368&single=true&output=csv";

const livrosNovoTestamento = ["Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João", "Judas", "Apocalipse"];

fetch('./biblia.json')
    .then(res => res.json())
    .then(data => { livros = data; renderizarMenu(); });

function filtrarTestamento(tipo) {
    const grade = document.getElementById('listaLivros');
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

// Lógica de Ofertas (Simplificada)
async function fetchOffers() {
    try {
        const res = await fetch(OFFERS_CSV_URL);
        const text = await res.text();
        const lines = text.split('\n').slice(1);
        offersData = lines.map(line => {
            const parts = line.split(',');
            return { name: parts[0], img: parts[1], link: parts[2], desc: parts[3] };
        }).filter(o => o.img);
        if(offersData.length) updateOffer();
    } catch (e) {}
}

function updateOffer() {
    const ad = offersData[Math.floor(Math.random()*offersData.length)];
    document.getElementById('loading-ads').classList.add('hidden');
    const link = document.getElementById('content-link');
    link.classList.remove('hidden');
    link.href = ad.link;
    document.getElementById('content-image').src = ad.img;
    document.getElementById('content-title').innerText = ad.name;
    document.getElementById('offer-description').innerText = ad.desc || "";
}

window.onload = () => {
    fetchOffers();
    setInterval(updateOffer, 15000);
    document.getElementById('collapse-button').onclick = () => {
        const area = document.getElementById('content-area');
        area.classList.toggle('collapsed');
        document.getElementById('collapse-button').innerText = area.classList.contains('collapsed') ? '▲' : '▼';
    };
};
