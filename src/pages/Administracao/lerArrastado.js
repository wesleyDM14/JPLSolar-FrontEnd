// Leitura de arquivos e PASTAS arrastados para a tela (ou escolhidos no seletor de pasta).
// O resultado é sempre o mesmo formato: uma lista de arquivos, cada um com o caminho das pastas onde ele está
// ("Fotos/2026/obra" -> ['Fotos', '2026', 'obra']), e o conjunto de todas as pastas (inclusive as vazias).

export const LIMITE_DE_ARQUIVOS = 5000;

/** Lê um diretório do navegador por inteiro: readEntries devolve poucos itens por chamada (~100) e precisa ser repetido. */
function lerTodasEntradas(leitor) {
    return new Promise((resolve, reject) => {
        const todas = [];
        const proxima = () =>
            leitor.readEntries((lote) => {
                if (lote.length === 0) resolve(todas);
                else {
                    todas.push(...lote);
                    proxima();
                }
            }, reject);
        proxima();
    });
}

const lerArquivo = (entrada) => new Promise((resolve, reject) => entrada.file(resolve, reject));

/**
 * Percorre uma entrada (arquivo ou pasta) do navegador e acumula em `saida`.
 * `saida.arquivos`: [{ arquivo: File, pastas: string[] }]   `saida.pastas`: Set de caminhos "A/B/C"
 */
export async function percorrerEntrada(entrada, pastas, saida) {
    if (saida.arquivos.length > LIMITE_DE_ARQUIVOS) return;

    if (entrada.isFile) {
        // Arquivos de sistema que o sistema operacional cria sozinho não interessam.
        if (/^(\.DS_Store|Thumbs\.db|desktop\.ini)$/i.test(entrada.name)) return;
        saida.arquivos.push({ arquivo: await lerArquivo(entrada), pastas });
        return;
    }

    if (entrada.isDirectory) {
        const caminho = [...pastas, entrada.name];
        saida.pastas.add(caminho.join('/'));
        for (const filha of await lerTodasEntradas(entrada.createReader())) {
            await percorrerEntrada(filha, caminho, saida);
        }
    }
}

/**
 * Itens de um evento de soltar (drop). As entradas precisam ser pegas de forma SÍNCRONA, antes de qualquer await:
 * depois disso o navegador esvazia a lista. Sem suporte a pastas, cai para a lista simples de arquivos.
 */
export async function lerSoltos(dataTransfer) {
    const saida = { arquivos: [], pastas: new Set() };
    const itens = Array.from(dataTransfer?.items ?? []);
    const entradas = itens.map((item) => (typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null));

    if (entradas.some(Boolean)) {
        for (const entrada of entradas) {
            if (entrada) await percorrerEntrada(entrada, [], saida);
        }
    } else {
        Array.from(dataTransfer?.files ?? []).forEach((arquivo) => saida.arquivos.push({ arquivo, pastas: [] }));
    }
    return finalizar(saida);
}

/** Itens do seletor de pasta (<input webkitdirectory>): o caminho vem em webkitRelativePath. */
export function lerSelecionados(arquivos) {
    const saida = { arquivos: [], pastas: new Set() };
    for (const arquivo of Array.from(arquivos ?? [])) {
        if (/^(\.DS_Store|Thumbs\.db|desktop\.ini)$/i.test(arquivo.name)) continue;
        const partes = (arquivo.webkitRelativePath || '').split('/').filter(Boolean);
        const pastas = partes.slice(0, -1);
        pastas.forEach((_, i) => saida.pastas.add(pastas.slice(0, i + 1).join('/')));
        saida.arquivos.push({ arquivo, pastas });
    }
    return finalizar(saida);
}

function finalizar(saida) {
    // Toda pasta de um arquivo também precisa existir, mesmo que o navegador só tenha informado o arquivo.
    saida.arquivos.forEach(({ pastas }) => pastas.forEach((_, i) => saida.pastas.add(pastas.slice(0, i + 1).join('/'))));
    return {
        arquivos: saida.arquivos,
        // Das mais rasas para as mais fundas: o pai sempre é criado antes do filho.
        pastas: [...saida.pastas].sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b, 'pt-BR')),
        excedeu: saida.arquivos.length > LIMITE_DE_ARQUIVOS,
    };
}

/**
 * Cria (ou reaproveita) cada pasta dentro de `destino` e devolve { 'A/B': idDaPasta }.
 * `garantir(paiId, nome)` devolve { id }. Se uma pasta falhar, as filhas dela são puladas e vão em `falhas`.
 */
export async function criarEstrutura(pastas, destino, garantir) {
    const ids = new Map([['', destino]]);
    const falhas = new Map();

    for (const caminho of pastas) {
        const partes = caminho.split('/');
        const pai = partes.slice(0, -1).join('/');
        if (falhas.has(pai)) {
            falhas.set(caminho, falhas.get(pai));
            continue;
        }
        try {
            const criada = await garantir(ids.get(pai), partes[partes.length - 1]);
            ids.set(caminho, criada.id);
        } catch (erro) {
            falhas.set(caminho, erro);
        }
    }
    return { ids, falhas };
}
