import {
  arquivoAceitoPeloAccept,
  blobComTipo,
  classificarArquivoPreview,
  inferirMimeArquivo,
} from './hug-arquivo.util';

describe('hug-arquivo.util', () => {
  it('infere PDF pela extensão quando o MIME é octet-stream', () => {
    expect(inferirMimeArquivo('application/octet-stream', 'relatorio.pdf')).toBe('application/pdf');
  });

  it('classifica imagem e PDF', () => {
    expect(classificarArquivoPreview('image/png', 'foto.png')).toBe('imagem');
    expect(classificarArquivoPreview('application/pdf', 'doc.pdf')).toBe('pdf');
    expect(classificarArquivoPreview('application/octet-stream', 'doc.pdf')).toBe('pdf');
  });

  it('valida accept com MIME e extensão', () => {
    const accept = 'application/pdf,image/jpeg,image/png';
    expect(arquivoAceitoPeloAccept({ type: 'application/pdf', name: 'a.pdf' } as File, accept)).toBe(true);
    expect(arquivoAceitoPeloAccept({ type: '', name: 'a.PNG' } as File, accept)).toBe(true);
    expect(arquivoAceitoPeloAccept({ type: 'text/plain', name: 'a.txt' } as File, accept)).toBe(false);
  });

  it('redefine o tipo do blob quando necessário', () => {
    const bruto = new Blob(['%PDF'], { type: 'application/octet-stream' });
    const tipado = blobComTipo(bruto, 'application/pdf');
    expect(tipado.type).toBe('application/pdf');
  });
});
