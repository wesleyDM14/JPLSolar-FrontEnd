// Endereços dos anexos (fotos e arquivos) dos serviços de campo. O `url` do anexo já traz o token de acesso curto.
// `variante`: 'mini' (miniatura), 'grande' (visualização), 'baixar' (original como download); sem variante, o original aberto no navegador.

export const urlDoAnexo = (anexo, variante) => `${process.env.REACT_APP_BASE_URL}${anexo.url}${variante ? `&v=${variante}` : ''}`;

export const ehImagem = (anexo) => String(anexo.mimeType ?? '').startsWith('image/');
export const ehPdf = (anexo) => anexo.mimeType === 'application/pdf';

/** Ao clicar: imagem abre no visualizador; PDF abre em nova aba; o resto (Word, Excel, ZIP…) é baixado. */
export const acaoDoAnexo = (anexo) => (ehImagem(anexo) ? 'visualizar' : ehPdf(anexo) ? 'abrir' : 'baixar');
