"""Extrai dados das planilhas DIOP/DIFOB/DIPSE para src/data/planilhas.json
e as imagens da F-07 para public/f07/. Rode: python scripts/extract.py"""
import json, re, zipfile, datetime, os, unicodedata
from collections import defaultdict
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'data')
os.makedirs(OUT, exist_ok=True)


def num(v):
    return float(v) if isinstance(v, (int, float)) else None


def txt(v):
    if v is None:
        return None
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%d/%m/%Y')
    s = str(v).strip()
    return s or None


CAPA_REMOVER = {
    'CODIGO E TITULO',
    'PERIODO',
    'VERSAO',
    'SISTEMA DE ORIGEM',
    'EVIDENCIA',
    'FONTE',
    'METODO',
    'SIGILO / FUNDAMENTO',
}


def sem_acento(s):
    return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii').strip().upper()


def capa(ws):
    d = {}
    for r in ws.iter_rows(min_row=4, max_row=30, max_col=2):
        k, v = txt(r[0].value), txt(r[1].value)
        if k and v:
            kn = sem_acento(k)
            vn = sem_acento(v)
            if kn in CAPA_REMOVER or vn.startswith('NAO SE APLICA'):
                continue
            if kn.startswith('COLABORADORES'):
                k = 'COLABORADORES'
            if kn == 'DATA-BASE' and 'SETEMBRO' in vn:
                v = '30/09/2026'
            if 'AUTORIDADE QUE CONFIRMA' in kn:
                v = 'Hellen Nyde da Silva e Souza - Secretária Adjunta SAGEP'
            if 'DE PESSOAS' in v.upper() and 'GESTÃO DE PESSOAS' not in v.upper():
                v = re.sub(r'DE PESSOAS', 'DE PESSOAL', v, flags=re.I)
            d[k] = v
    return d


def top(d, n=12):
    return sorted(([k, round(v, 1)] for k, v in d.items()), key=lambda x: -x[1])[:n]


res = {}

# ---------------- DIOP ----------------
wb = openpyxl.load_workbook(os.path.join(ROOT, 'DIOP.xlsx'), data_only=True)
ws = {s.title.strip(): s for s in wb.worksheets}
res['DIOP'] = {'capa': capa(wb.worksheets[0])}

f1 = [s for t, s in ws.items() if t.startswith('F-01')][0]
sintese, link = [], None
for r in range(8, 30):
    a, b = f1.cell(r, 1).value, f1.cell(r, 2).value
    if isinstance(b, (int, float)) and a:
        rot = txt(a)
        if sem_acento(rot) == 'COMISSAO':
            rot = 'Exclusivamente Comissionado'
        sintese.append([rot, b])
    elif a and isinstance(b, str) and b.startswith('http'):
        link = b
total_geral = next((v for k, v in sintese if k.lower().startswith('total')), None)
sintese = [x for x in sintese if not x[0].lower().startswith('total')]

dre_tot, dre_vinc, cargo_tot, escolas, vinc_tot = (defaultdict(float), defaultdict(lambda: defaultdict(float)),
                                                  defaultdict(float), set(), defaultdict(float))
dre = escola = vinc = None
sede_tot = 0.0
for row in f1.iter_rows(min_row=5, min_col=4, max_col=8, values_only=True):
    d, e, f, g, h = row
    if d and 'Total' not in str(d):
        dre = txt(d)
    if e and 'Total' not in str(e):
        escola = txt(e)
    if f and 'Total' not in str(f):
        vinc = txt(f)
        if sem_acento(vinc) == 'COMISSAO':
            vinc = 'Exclusivamente Comissionado'
    if g and isinstance(h, (int, float)):
        if dre and escola and vinc:
            if 'SEDUC' in dre.upper() or 'SEDE' in dre.upper():
                sede_tot += h
            else:
                dre_tot[dre] += h
                dre_vinc[dre][vinc] += h
                escolas.add((dre, escola))
            cg = txt(g)
            if sem_acento(cg) == 'COMISSAO':
                cg = 'Exclusivamente Comissionado'
            cargo_tot[cg] += h
            vinc_tot[vinc] += h

all_dres = sorted(([k, round(v, 1)] for k, v in dre_tot.items()), key=lambda x: -x[1])
all_cargos = sorted(([k, round(v, 1)] for k, v in cargo_tot.items()), key=lambda x: -x[1])

res['DIOP']['F-01'] = {
    'sintese': sintese, 'total': total_geral, 'link': link,
    'por_dre': all_dres,
    'por_dre_vinculo': {k: {a: b for a, b in v.items()} for k, v in dre_vinc.items()},
    'cargos_top': all_cargos,
    'n_escolas': len(escolas), 'n_dres': len(dre_tot),
    'sede_servidores': sede_tot,
}

f2 = [s for t, s in ws.items() if t.startswith('F-02')][0]
comp = []
for r in range(5, f2.max_row + 1):
    a, b = f2.cell(r, 1).value, f2.cell(r, 2).value
    if a and isinstance(b, (int, float)) and 'Total' not in str(a):
        comp.append([txt(a), b])
res['DIOP']['F-01']['componentes'] = sorted(comp, key=lambda x: -x[1])
res['DIOP']['F-01']['n_componentes'] = len(comp)

# F-02: INTERIOR e RMB (demanda descoberta por modalidade)
mods = {'EDUCACAO ESPECIAL': 'Educação especial', 'FUND I': 'Fundamental I',
        'FUND I INTEGRAL': 'Fund. I integral', 'INTEGRAL': 'Integral', 'REG E EJA': 'Regular e EJA'}
f2d = {}
for regiao in ('INTERIOR', 'RMB'):
    sh = ws[regiao]
    blocos = {}
    for c in range(1, sh.max_column + 1):
        lab = txt(sh.cell(1, c).value)
        if lab in mods:
            blocos[lab] = c
    out = {}
    for lab, c0 in blocos.items():
        ch, qp, d_ch, disc_ch, total_info = 0.0, 0.0, defaultdict(float), defaultdict(float), None
        d_qp = defaultdict(float)
        for r in range(3, sh.max_row + 1):
            cl = sh.cell(r, c0).value
            if txt(cl) != regiao:
                continue
            d_, disc = txt(sh.cell(r, c0 + 1).value), txt(sh.cell(r, c0 + 3).value)
            c_h, q = num(sh.cell(r, c0 + 4).value) or 0, num(sh.cell(r, c0 + 5).value) or 0
            ch += c_h; qp += q
            d_ch[d_] += c_h; d_qp[d_] += q; disc_ch[disc] += c_h
        for r in range(3, 10):
            t = num(sh.cell(r, c0 + 6).value)
            if t is not None:
                total_info = t; break
        if ch or qp:
            out[mods[lab]] = {
                'ch': ch, 'prof': qp, 'total_planilha': total_info,
                'dres': sorted(([k, round(v, 1)] for k, v in d_ch.items()), key=lambda x: -x[1]),
                'disciplinas': sorted(([k, round(v, 1)] for k, v in disc_ch.items()), key=lambda x: -x[1])
            }
    f2d[regiao] = out
res['DIOP']['F-02'] = f2d

# F-07: links + imagens
f7 = [s for t, s in ws.items() if t.startswith('F-07')][0]
links = []
for r in range(1, f7.max_row + 1):
    a = txt(f7.cell(r, 1).value)
    if a and a.startswith('http') and links:
        links[-1]['url'] = a
    elif a:
        links.append({'titulo': a, 'url': None})
res['DIOP']['F-07'] = {'links': [l for l in links if l['url']]}

# ---------------- DIFOB ----------------
wb = openpyxl.load_workbook(os.path.join(ROOT, 'DIFOB.xlsx'), data_only=True)
capa_difob = {
    "UNIDADE E RESPONSÁVEL PRINCIPAL": "Diretoria de Folha e Benefícios (DIFOB)",
    "COLABORADORES": "Olga Ferreira Nascimento - CFOP",
    "ELABORADOR E CARGO": "Olga Ferreira Nascimento - Coordenadoria de Folha de Pagamento (CFOP)",
    "AUTORIDADE QUE CONFIRMA ORIGEM E LOCALIZAÇÃO": "Hellen Nyde da Silva e Souza - Secretária Adjunta SAGEP",
    "DATA-BASE": "30/09/2026",
    "SERVIDOR DE REFERÊNCIA E CONTATO INSTITUCIONAL": "Gisele Almeida de Barros - Diretora de Folha e Benefícios (DIFOB) - email: gisele.barros@seduc.pa.gov.br"
}
res['DIFOB'] = {'capa': capa_difob}
f5 = [s for s in wb.worksheets if 'F-05' in s.title][0]
tab, link = [], None
cols = [txt(f5.cell(4, c).value) for c in range(1, 8)]
nota_f05 = None
for r in range(5, 20):
    nome = txt(f5.cell(r, 1).value)
    if not nome or nome.startswith('*'):
        continue
    # Linha de observação → salvar como nota e não adicionar à tabela
    if nome.lower().startswith('observa'):
        nota_f05 = nome
        continue
    row = {'produto': nome}
    for c in range(2, 7):
        row[cols[c - 1]] = f5.cell(r, c).value
    lnk = txt(f5.cell(r, 7).value)
    if lnk:
        row['link'] = lnk
        if not link:
            link = lnk
    tab.append(row)
nota = nota_f05 or txt(f5.cell(7, 1).value)
res['DIFOB']['F-05'] = {'colunas': cols[1:6], 'linhas': tab, 'link': link, 'nota': nota}

# F-04: Carreira e Remuneração
f4 = [s for s in wb.worksheets if 'F-04' in s.title][0]
cols4 = [txt(f4.cell(4, c).value) for c in range(1, 9)]
f4_linhas = []
for r in range(5, f4.max_row + 1):
    prod = txt(f4.cell(r, 1).value)
    if not prod or prod.startswith('*'):
        continue
    row = {'produto': prod}
    for c in range(2, 8):
        v = f4.cell(r, c).value
        row[cols4[c - 1]] = v
    lnk = txt(f4.cell(r, 8).value)
    if lnk:
        row['link'] = lnk
    f4_linhas.append(row)
res['DIFOB']['F-04'] = {'colunas': cols4[1:7], 'linhas': f4_linhas}

res['DIFOB']['F-06'] = {}

# F-08: Passivos e Risco de Pessoal
f8 = [s for s in wb.worksheets if 'F-08' in s.title][0]

def parse_brl(v):
    if v is None: return 0.0
    if isinstance(v, (int, float)): return float(v)
    s = str(v).replace('R$', '').replace('.', '').replace(',', '.').strip()
    try: return float(s)
    except: return 0.0

# Bloco 1: DEAs NÃO analisados em 2026 (L4..L9)
nao_anal = []
for r in range(5, 10):
    nome = txt(f8.cell(r, 1).value)
    qtd = num(f8.cell(r, 2).value)
    val = parse_brl(f8.cell(r, 3).value)
    if nome and nome.lower().startswith('total'):
        nao_anal_total = {'qtd': qtd, 'valor': val}
    elif nome:
        nao_anal.append({'descricao': nome, 'qtd': int(qtd) if qtd else 0, 'valor': val})

# Bloco 2: DEAs analisados em 2026 (L12..L41) e Cessão a receber nas últimas linhas
anal = []
anal_total = {'qtd': 0, 'valor': 0.0}
cessao_receber = None
pos_total_anal = False
for r in range(12, f8.max_row + 1):
    nome = txt(f8.cell(r, 1).value)
    if not nome:
        continue
    qtd = num(f8.cell(r, 2).value)
    val = parse_brl(f8.cell(r, 3).value)
    if not pos_total_anal:
        if nome.lower().startswith('total'):
            anal_total = {'qtd': int(qtd) if qtd else 0, 'valor': float(val) if val else 0.0}
            pos_total_anal = True
        else:
            anal.append({'descricao': nome, 'qtd': int(qtd) if qtd else 0, 'valor': float(val) if val else 0.0})
    else:
        val_extra = parse_brl(f8.cell(r, 2).value) or parse_brl(f8.cell(r, 3).value)
        if val_extra > 0:
            cessao_receber = {'descricao': nome, 'valor': float(val_extra)}

res['DIFOB']['F-08'] = {
    'nao_analisados': nao_anal,
    'nao_analisados_total': nao_anal_total,
    'analisados': anal,
    'analisados_total': anal_total,
    'cessao_receber': cessao_receber,
}


# ---------------- DIPSE ----------------
wb = openpyxl.load_workbook(os.path.join(ROOT, 'DIPSE.xlsx'), data_only=True)
res['DIPSE'] = {'capa': capa(wb.worksheets[0])}
s = wb.worksheets[1]
pss = []
for r in range(9, 16):
    n = txt(s.cell(r, 1).value)
    if n and not n.startswith('Produto') and '03/2024' not in n:
        pss.append({'nome': n, 'vigencia': txt(s.cell(r, 2).value), 'modalidade': txt(s.cell(r, 3).value),
                    'link': txt(s.cell(r, 4).value)})
cab = [txt(s.cell(20, c).value) or '' for c in range(3, 8)]
cont = []
for r in range(21, 24):
    cont.append({'categoria': txt(s.cell(r, 1).value), 'total': num(s.cell(r, 2).value),
                 'desligamentos': [num(s.cell(r, c).value) or 0 for c in range(3, 8)]})
conc = {'nome': txt(s.cell(28, 1).value), 'validade': txt(s.cell(28, 2).value), 'obs': txt(s.cell(28, 5).value)}
cargos = []
for r in range(37, s.max_row + 1):
    cat = txt(s.cell(r, 1).value)
    leg = txt(s.cell(r, 2).value)
    eme = txt(s.cell(r, 3).value)
    nome = txt(s.cell(r, 4).value)
    nat = txt(s.cell(r, 5).value)
    cr = num(s.cell(r, 6).value)
    oc = num(s.cell(r, 7).value)
    vg = num(s.cell(r, 8).value)
    col_i = txt(s.cell(r, 9).value)
    if cat and nome and cr is not None and not cat.upper().startswith('TOTAL'):
        nat_lower = (nat or '').lower()
        if 'art. 19' in nat_lower or 'extinção' in nat_lower or 'pa-a' in (nome or '').lower():
            sit = 'Em extinção'
        elif 'comissionado' in nat_lower:
            sit = 'Comissionado'
        else:
            sit = 'Ativo'
        cargos.append({
            'categoria': cat,
            'legislacao': leg or '',
            'ementa': eme or '',
            'cargo': re.sub(r'\s+', ' ', nome).strip(),
            'natureza': nat or '',
            'criado': cr,
            'ocupado': oc or 0,
            'vago': vg or 0,
            'coluna_i': col_i or '',
            'situacao': sit
        })
res['DIPSE']['F-03'] = {'pss': pss, 'contratos': cont,
                        'contratos_cab': ['Dez/2026', 'Jan/2027', 'Fev/2027', 'Mar/2027', 'A partir de abr/2027'],
                        'concurso': conc, 'cargos': cargos}

# ---------------- LOTAÇÃO DREs (F-02 / DIOP) ----------------
import glob


def fix_txt(t):
    if t is None:
        return t
    t = re.sub(r'^DRE\s*-\s*', '', str(t).strip())
    t = re.sub(r'c\?o\b', 'ção', t)
    t = re.sub(r'\?o\b', 'ão', t)
    t = re.sub(r'\?es\b', 'ões', t)
    return re.sub(r'\s+', ' ', t).strip()


lot_files = [x for x in glob.glob(os.path.join(ROOT, '*.xlsx')) if 'DREs' in os.path.basename(x)]
if lot_files:
    wl = openpyxl.load_workbook(lot_files[0], data_only=True)
    totais = {}
    total_geral_lot = None
    for r in wl['RESUMOS DAS DRES'].iter_rows(min_row=3, max_col=2, values_only=True):
        if r[0] and isinstance(r[1], (int, float)):
            if r[0] == 'Total geral':
                total_geral_lot = r[1]
            else:
                totais[r[0]] = r[1]

    base = wl.worksheets[0]
    cab = [c.value for c in base[1]]
    ci = {h: i for i, h in enumerate(cab) if h}
    vinc_d, cat_d = defaultdict(lambda: defaultdict(set)), defaultdict(lambda: defaultdict(set))
    for r in base.iter_rows(min_row=2, values_only=True):
        if not r[0]:
            continue
        vinc_d[r[0]][txt(r[ci['TIPO_VINCULO']]) or 'N/I'].add(r[ci['MATVIN']])
        cat_d[r[0]][txt(r[ci['CATEGORIA']]) or 'N/I'].add(r[ci['MATVIN']])

    ativ_d, modelo, fonte_lot = {}, 0, None
    for w in wl.worksheets[2:]:
        itens = defaultdict(float)
        m = 0
        for r in w.iter_rows(min_row=3, min_col=3, max_col=9, values_only=True):
            if isinstance(r[1], (int, float)):
                m += r[1]
            if isinstance(r[3], str) and r[3].startswith('DRE') and r[5] and isinstance(r[6], (int, float)):
                itens[fix_txt(r[5])] += r[6]
            if r[4] == 'FONTE' and r[5]:
                fonte_lot = txt(r[5])
        ativ_d[w.title] = sorted(([k, v] for k, v in itens.items()), key=lambda x: (-x[1], x[0]))
        modelo = max(modelo, m)

    sede_lot = totais.pop('SEDUC SEDE', 0)  # SEDUC Sede não é DRE
    soma_dres_lot = sum(totais.values())
    nomes_cat = {'MAGISTERIO BASICO': 'Magistério básico', 'ADMINISTRACAO GERAL': 'Administração geral', 'FUNCAO GRAT': 'Função gratificada'}
    dres_lot = []
    for nome, tot_dre in sorted(totais.items(), key=lambda x: -x[1]):
        dres_lot.append({
            'dre': nome,
            'total': tot_dre,
            'vinculo': {k: len(v) for k, v in vinc_d.get(nome, {}).items()},
            'categoria': {nomes_cat.get(k, k): len(v) for k, v in cat_d.get(nome, {}).items()},
            'atividades': ativ_d.get(nome, []),
        })
    lot = {
        'fonte': fonte_lot, 'data_base': '03/11/2026', 'total_geral': soma_dres_lot, 'sede': sede_lot,
        'soma_dres': soma_dres_lot, 'modelo_posicoes': modelo, 'dres': dres_lot,
    }
    with open(os.path.join(OUT, 'lotacao_dre.json'), 'w', encoding='utf-8') as fh:
        json.dump(lot, fh, ensure_ascii=False, indent=1)
    print('LOTACAO DRE', len(dres_lot), 'unidades; total geral', total_geral_lot, '; modelo', modelo)


with open(os.path.join(OUT, 'planilhas.json'), 'w', encoding='utf-8') as fh:
    json.dump(res, fh, ensure_ascii=False, indent=1)
print('OK', os.path.getsize(os.path.join(OUT, 'planilhas.json')), 'bytes')
print('F-01 total', total_geral, 'soma por_dre', sum(v for _, v in res['DIOP']['F-01']['por_dre']))
print('F-02', {r: {m: (d['ch'], d['prof'], d['total_planilha']) for m, d in v.items()} for r, v in f2d.items()})
print('cargos', len(cargos), 'pss', len(pss))
