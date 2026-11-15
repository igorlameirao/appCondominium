import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { BancoFormComponent } from './banco-form.component';
import { BancoService } from './banco.service';
import { ConsultaService, ResultadoConsultaBanco, ResultadoConsultaCnpj } from '../../core/services/consulta.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';

describe('BancoFormComponent — consulta por Código Banco', () => {
  let fixture: ComponentFixture<BancoFormComponent>;
  let component: BancoFormComponent;
  let consultas: Subject<ResultadoConsultaBanco>[];
  let consultasCnpj: Subject<ResultadoConsultaCnpj>[];
  let consulta: jasmine.SpyObj<ConsultaService>;
  let toast: jasmine.SpyObj<ToastService>;

  const bb: ResultadoConsultaBanco = { codigoBanco: '001', nome: 'Banco do Brasil S.A.', ispb: '00000000' };

  function responder(i: number, r: ResultadoConsultaBanco): void {
    consultas[i].next(r);
    consultas[i].complete();
  }

  function falhar(i: number, status: number): void {
    consultas[i].error(new HttpErrorResponse({ status }));
  }

  function informarCodigo(codigo: string): void {
    component.model.codigoBanco = codigo;
    component.onCodigoBancoBlur();
  }

  beforeEach(() => {
    consultas = [];
    consultasCnpj = [];
    consulta = jasmine.createSpyObj<ConsultaService>('ConsultaService', ['consultarBancoPorCodigo', 'consultarCnpj']);
    consulta.consultarBancoPorCodigo.and.callFake(() => {
      const s = new Subject<ResultadoConsultaBanco>();
      consultas.push(s);
      return s.asObservable();
    });
    consulta.consultarCnpj.and.callFake(() => {
      const s = new Subject<ResultadoConsultaCnpj>();
      consultasCnpj.push(s);
      return s.asObservable();
    });
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['showWarning', 'showError', 'showSuccess']);

    TestBed.configureTestingModule({
      imports: [BancoFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}), url: [{ path: 'novo' }] } } },
        { provide: BancoService, useValue: jasmine.createSpyObj('BancoService', ['getById', 'create', 'update', 'delete']) },
        { provide: ConsultaService, useValue: consulta },
        { provide: PermissionService, useValue: { can: () => true } },
        { provide: ToastService, useValue: toast },
      ],
    });
    fixture = TestBed.createComponent(BancoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('consulta ao sair do campo e preenche Nome e ISPB sem tocar CNPJ, Dígito e Situação', () => {
    component.model = { ativo: 0, cnpj: '00000000000191', digitoVerificador: '9', codigoBanco: '001' };
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#banco-codigo');
    input.dispatchEvent(new Event('blur'));

    expect(consulta.consultarBancoPorCodigo).toHaveBeenCalledOnceWith('001');
    responder(0, bb);

    expect(component.model.nome).toBe('Banco do Brasil S.A.');
    expect(component.model.ispb).toBe('00000000');
    expect(component.model.cnpj).toBe('00000000000191');
    expect(component.model.digitoVerificador).toBe('9');
    expect(component.model.ativo).toBe(0);
  });

  it('ignora código incompleto ou 000', () => {
    informarCodigo('01');
    informarCodigo('000');
    informarCodigo('');
    expect(consulta.consultarBancoPorCodigo).not.toHaveBeenCalled();
  });

  it('não repete a consulta do mesmo código nem dispara consultas concorrentes', () => {
    informarCodigo('001');
    component.onCodigoBancoBlur();
    expect(consulta.consultarBancoPorCodigo).toHaveBeenCalledTimes(1);

    responder(0, bb);
    component.onCodigoBancoBlur();
    expect(consulta.consultarBancoPorCodigo).toHaveBeenCalledTimes(1);
  });

  it('descarta resposta de código trocado durante a consulta e consulta o código atual', () => {
    informarCodigo('001');
    component.model.codigoBanco = '237';
    component.onCodigoBancoBlur();
    expect(consulta.consultarBancoPorCodigo).toHaveBeenCalledTimes(1);

    responder(0, bb);
    expect(component.model.nome).toBeUndefined();
    expect(consulta.consultarBancoPorCodigo).toHaveBeenCalledWith('237');
    responder(1, { codigoBanco: '237', nome: 'Banco Bradesco S.A.', ispb: '60746948' });
    expect(component.model.nome).toBe('Banco Bradesco S.A.');
  });

  it('pede confirmação antes de sobrescrever valores digitados e respeita "Manter"', () => {
    component.model.nome = 'Meu banco';
    component.model.ispb = '12345678';
    informarCodigo('001');
    responder(0, bb);

    expect(component.model.nome).toBe('Meu banco');
    expect(component.substituicao).toEqual({ codigo: '001', nome: 'Banco do Brasil S.A.', ispb: '00000000' });

    component.manterDadosInformados();
    expect(component.substituicao).toBeNull();
    expect(component.model.nome).toBe('Meu banco');
    expect(component.model.ispb).toBe('12345678');
  });

  it('substitui após confirmação e preenche sem perguntar o campo vazio', () => {
    component.model.nome = 'Meu banco';
    informarCodigo('001');
    responder(0, bb);

    expect(component.model.ispb).toBe('00000000');
    expect(component.substituicao).toEqual({ codigo: '001', nome: 'Banco do Brasil S.A.' });
    component.substituirPelaConsulta();
    expect(component.model.nome).toBe('Banco do Brasil S.A.');
  });

  it('troca sem confirmação valores que vieram da consulta anterior', () => {
    informarCodigo('001');
    responder(0, bb);
    informarCodigo('237');
    responder(1, { codigoBanco: '237', nome: 'Banco Bradesco S.A.', ispb: '60746948' });

    expect(component.substituicao).toBeNull();
    expect(component.model.nome).toBe('Banco Bradesco S.A.');
    expect(component.model.ispb).toBe('60746948');
  });

  it('em falha mantém preenchimento manual, avisa e permite nova tentativa', () => {
    component.model.nome = 'Digitado';
    informarCodigo('001');
    falhar(0, 503);

    expect(component.model.nome).toBe('Digitado');
    expect(component.consultandoCodigo).toBeFalse();
    expect(toast.showWarning).toHaveBeenCalledTimes(1);

    component.onCodigoBancoBlur();
    expect(consulta.consultarBancoPorCodigo).toHaveBeenCalledTimes(2);
  });

  it('código inexistente avisa e não é consultado de novo', () => {
    informarCodigo('998');
    falhar(0, 404);
    expect(toast.showWarning).toHaveBeenCalledWith(jasmine.stringContaining('não encontrado'));
    component.onCodigoBancoBlur();
    expect(consulta.consultarBancoPorCodigo).toHaveBeenCalledTimes(1);
  });

  it('consulta de CNPJ continua funcionando com a consulta de código em andamento', () => {
    informarCodigo('001');
    component.onCnpjBlur('00.000.000/0001-91');
    expect(consulta.consultarCnpj).toHaveBeenCalledOnceWith('00000000000191');

    consultasCnpj[0].next({ cnpj: '00000000000191', razaoSocial: 'BANCO DO BRASIL SA', nomeFantasia: 'BB' });
    responder(0, bb);
    expect(component.model.nome).toBe('BANCO DO BRASIL SA');
    expect(component.substituicao?.nome).toBe('Banco do Brasil S.A.');
  });
});
