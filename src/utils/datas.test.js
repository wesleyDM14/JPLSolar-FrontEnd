import { detectarModo } from '../pages/Financial/SeletorPeriodo';
import {
    anoAtual,
    fimDaSemana,
    fimDoMes,
    hojeIso,
    inicioDaSemana,
    isoBr,
    mesAtual,
    somarDias,
    somarMeses,
    somarMesesChave,
} from './datas';

describe('datas no horário de Brasília', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('usa o dia de Brasília quando o UTC já virou o dia', () => {
        // 23h30 de 31/12 em Brasília = 02h30 de 01/01 em UTC
        jest.useFakeTimers().setSystemTime(new Date('2027-01-01T02:30:00.000Z'));

        expect(hojeIso()).toBe('2026-12-31');
        expect(mesAtual()).toBe('2026-12');
        expect(anoAtual()).toBe(2026);
    });

    it('vira o dia às 00h de Brasília (03h UTC)', () => {
        jest.useFakeTimers().setSystemTime(new Date('2027-01-01T03:00:00.000Z'));

        expect(hojeIso()).toBe('2027-01-01');
    });

    it('converte um instante para o dia de Brasília', () => {
        expect(isoBr('2026-10-15T01:59:00.000Z')).toBe('2026-10-14');
        expect(isoBr('2026-10-15T03:00:00.000Z')).toBe('2026-10-15');
    });
});

describe('cálculos de período', () => {
    it('soma dias e meses sem estourar o fim do mês', () => {
        expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
        expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28');
        expect(somarMesesChave('2026-11', 3)).toBe('2027-02');
        expect(fimDoMes('2028-02-10')).toBe('2028-02-29');
    });

    it('a semana vai de segunda a domingo', () => {
        // 14/10/2026 é uma quarta-feira
        expect(inicioDaSemana('2026-10-14')).toBe('2026-10-12');
        expect(fimDaSemana('2026-10-14')).toBe('2026-10-18');
        expect(inicioDaSemana('2026-10-18')).toBe('2026-10-12');
    });

    it('reconhece o tipo de período escolhido', () => {
        expect(detectarModo('', '')).toBe('tudo');
        expect(detectarModo('2026-10-14', '2026-10-14')).toBe('dia');
        expect(detectarModo('2026-10-12', '2026-10-18')).toBe('semana');
        expect(detectarModo('2026-10-01', '2026-10-31')).toBe('mes');
        expect(detectarModo('2026-01-01', '2026-12-31')).toBe('ano');
        expect(detectarModo('2026-10-05', '2026-10-20')).toBe('custom');
    });
});
