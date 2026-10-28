import { useEffect, useRef } from 'react';
import store from '../store';

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function lerBloco(bloco) {
    let evento = 'message';
    const dados = [];
    bloco.split('\n').forEach((linha) => {
        if (linha.startsWith('event:')) evento = linha.slice(6).trim();
        else if (linha.startsWith('data:')) dados.push(linha.slice(5).trim());
    });
    return { evento, dados: dados.join('\n') };
}

/**
 * Mantém aberta a conexão de eventos do chat (Server-Sent Events) e chama `aoEvento` para cada mensagem nova, na hora.
 * Usa fetch em vez de EventSource para poder enviar o token no cabeçalho. Reconecta sozinho, com espera crescente.
 */
export function useChatTempoReal({ ativo, aoEvento }) {
    const callback = useRef(aoEvento);
    callback.current = aoEvento;

    useEffect(() => {
        if (!ativo) return undefined;
        let parar = false;
        let controle = null;

        const conectar = async () => {
            let tentativa = 0;
            while (!parar) {
                try {
                    controle = new AbortController();
                    const token = store.getState().session.user?.accessToken;
                    const resposta = await fetch(`${process.env.REACT_APP_BASE_URL}/api/chat/eventos`, {
                        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
                        signal: controle.signal,
                    });
                    // Sem permissão, fora do plano ou sessão vencida: não adianta insistir.
                    if (resposta.status === 401 || resposta.status === 402 || resposta.status === 403) return;
                    if (!resposta.ok || !resposta.body) throw new Error(`HTTP ${resposta.status}`);

                    tentativa = 0;
                    const leitor = resposta.body.getReader();
                    const decodificador = new TextDecoder();
                    let acumulado = '';

                    for (;;) {
                        const { value, done } = await leitor.read();
                        if (done) break;
                        acumulado += decodificador.decode(value, { stream: true });
                        let fim = acumulado.indexOf('\n\n');
                        while (fim >= 0) {
                            const { evento, dados } = lerBloco(acumulado.slice(0, fim));
                            acumulado = acumulado.slice(fim + 2);
                            if (evento === 'chat' && dados) {
                                try {
                                    callback.current?.(JSON.parse(dados));
                                } catch {
                                    // evento malformado: ignora
                                }
                            }
                            fim = acumulado.indexOf('\n\n');
                        }
                    }
                } catch (erro) {
                    if (parar || erro?.name === 'AbortError') return;
                }
                tentativa += 1;
                await esperar(Math.min(30000, 1000 * 2 ** Math.min(tentativa, 5)));
            }
        };

        conectar();
        return () => {
            parar = true;
            controle?.abort();
        };
    }, [ativo]);
}
