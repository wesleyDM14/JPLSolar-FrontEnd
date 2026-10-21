import { criarEstrutura, lerSelecionados, lerSoltos } from './lerArrastado';

// Entradas falsas no formato do navegador (FileSystemEntry).
const arquivo = (name) => ({ isFile: true, isDirectory: false, name, file: (ok) => ok({ name, size: 3 }) });
const pasta = (name, filhos) => ({
    isFile: false,
    isDirectory: true,
    name,
    createReader: () => {
        // readEntries devolve em lotes e termina com uma lista vazia, como no navegador.
        let lotes = [];
        for (let i = 0; i < filhos.length; i += 2) lotes.push(filhos.slice(i, i + 2));
        return { readEntries: (ok) => ok(lotes.shift() ?? []) };
    },
});
const solto = (entrada) => ({ webkitGetAsEntry: () => entrada });

describe('pastas arrastadas', () => {
    it('recria a árvore: pastas, subpastas, pastas vazias e o caminho de cada arquivo', async () => {
        const raiz = pasta('Backups', [
            arquivo('geral.sql'),
            pasta('2026', [arquivo('a.zip'), arquivo('b.zip'), arquivo('c.zip'), pasta('outubro', [arquivo('dia-21.sql')])]),
            pasta('vazia', []),
            arquivo('.DS_Store'),
        ]);
        const resultado = await lerSoltos({ items: [solto(raiz), solto(arquivo('solto.txt'))] });

        expect(resultado.pastas).toEqual(['Backups', 'Backups/2026', 'Backups/vazia', 'Backups/2026/outubro']);
        expect(resultado.arquivos.map((a) => `${a.pastas.join('/')}::${a.arquivo.name}`).sort()).toEqual([
            '::solto.txt',
            'Backups/2026/outubro::dia-21.sql',
            'Backups/2026::a.zip',
            'Backups/2026::b.zip',
            'Backups/2026::c.zip',
            'Backups::geral.sql',
        ]);
        expect(resultado.excedeu).toBe(false);
    });

    it('sem suporte a pastas, usa a lista simples de arquivos', async () => {
        const resultado = await lerSoltos({ items: [{}], files: [{ name: 'x.txt' }] });
        expect(resultado.arquivos).toHaveLength(1);
        expect(resultado.pastas).toEqual([]);
    });

    it('seletor de pasta: usa o caminho relativo de cada arquivo', () => {
        const resultado = lerSelecionados([
            { name: 'a.txt', webkitRelativePath: 'Obra/fotos/a.txt' },
            { name: 'b.txt', webkitRelativePath: 'Obra/b.txt' },
            { name: 'Thumbs.db', webkitRelativePath: 'Obra/Thumbs.db' },
        ]);
        expect(resultado.pastas).toEqual(['Obra', 'Obra/fotos']);
        expect(resultado.arquivos.map((a) => a.pastas.join('/'))).toEqual(['Obra/fotos', 'Obra']);
    });

    it('cria cada pasta dentro da anterior e pula as filhas de uma pasta que falhou', async () => {
        const chamadas = [];
        const garantir = async (pai, nome) => {
            chamadas.push(`${pai}>${nome}`);
            if (nome === 'quebra') throw new Error('sem permissão');
            return { id: `id-${nome}` };
        };
        const { ids, falhas } = await criarEstrutura(['A', 'A/B', 'A/quebra', 'A/quebra/filha', 'C'], 'DESTINO', garantir);

        expect(chamadas).toEqual(['DESTINO>A', 'id-A>B', 'id-A>quebra', 'DESTINO>C']);
        expect(ids.get('A/B')).toBe('id-B');
        expect(ids.get('')).toBe('DESTINO');
        expect([...falhas.keys()]).toEqual(['A/quebra', 'A/quebra/filha']);
    });
});
