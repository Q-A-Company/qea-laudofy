"""
Converte a Ficha de Imóvel original (.docx com content controls nativos do Word)
em um template Jinja (docxtpl) preservando 100% a formatação original.

Uso: python3 build_template.py
Lê:  ../../../LAUDO DIGITAL 2025.docx (raiz do projeto)
Gera: ../ficha_imovel.template.docx

Estratégia:
- Checkboxes/dropdowns/date pickers (w:sdt) viram runs de texto simples com
  {{ variavel }}, herdando o rPr (fonte/tamanho) do conteúdo original -> o
  valor final (glifo de checkbox, número, data formatada) é resolvido em
  Python/TS ANTES de renderizar, nunca por lógica dentro do template.
- Dropdowns e o date picker usam o estilo nativo do Word "TextodoEspaçoReservado"
  (cinza/menor) no texto de instrução ("Escolher um item.", "Clique para
  inserir uma data."). Se preservássemos o rPr original do controle, esse
  estilo vazaria pro valor final - por isso, para esses tipos, copiamos o rPr
  do rótulo imediatamente anterior (removendo negrito) em vez do rPr do
  próprio controle. Checkbox não tem esse problema (o glifo ☐/☒ já usa a
  fonte de conteúdo real, ex. MS Gothic, não a de placeholder).
- Campos em branco sem controle (Endereço:, CEP:, etc.) recebem um novo run
  com {{ variavel }} logo após o rótulo, copiando o rPr do rótulo.
- Seções fora do escopo do MVP (cabeçalho de roteamento interno, tabela de
  Captação/Habite-se/Documentação/Em Obra/Opcionista/Comissão, log de
  atualizações no rodapé) NÃO são tocadas: continuam como controles nativos
  do Word, em branco, exatamente como no original.
"""
import shutil
import tempfile
import zipfile
from pathlib import Path

from lxml import etree

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[2]

SRC = PROJECT_ROOT / "LAUDO DIGITAL 2025.docx"
OUT_DOCX = SCRIPT_DIR.parent / "ficha_imovel.template.docx"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def q(tag):
    return f"{W}{tag}"


# Mapa posicional dos 88 SDTs, na ordem em que aparecem no documento.
# Ausente = deixar intocado (fora do escopo do MVP, permanece controle nativo em branco).
SDT_MAP = {
    1: "chk_canto_pedra_sim",
    2: "chk_canto_pedra_nao",
    3: "data_laudo",
    4: "chk_tipo_apartamento",
    5: "chk_tipo_casa",
    6: "chk_tipo_cobertura",
    7: "chk_tipo_comercial",
    8: "chk_tipo_loja",
    9: "chk_tipo_sala",
    10: "chk_tipo_sitio",
    11: "chk_tipo_terreno",
    12: "planta_tipo",
    13: "chk_bairro_barra_da_tijuca",
    14: "chk_bairro_recreio",
    15: "chk_bairro_outros",
    16: "chk_posicao_frente",
    17: "chk_posicao_fundos",
    18: "chk_posicao_lateral",
    19: "chk_sol_manha",
    20: "chk_sol_tarde",
    21: "chk_agendar_sim",
    22: "chk_agendar_nao",
    23: "chk_chave_sim",
    24: "chk_chave_nao",
    25: "chk_imovel_vazio",
    26: "chk_imovel_ocupado",
    27: "chk_placa_sim",
    28: "chk_placa_nao",
    29: "quartos",
    30: "suites",
    31: "banheiros",
    32: "vagas",
    33: "chk_subsolo_sim",
    34: "chk_subsolo_nao",
    35: "elevadores",
    36: "andar",
    37: "unidades_por_andar",
    38: "chk_hidrometro_individual",
    39: "chk_hidrometro_coletivo",
    40: "chk_finalidade_venda",
    41: "chk_finalidade_locacao",
    42: "chk_permuta_sim",
    43: "chk_permuta_nao",
    # 44-52: tabela de back-office (Captação/Habite-se/Documentação/Em Obra) -> fora do escopo, intocado
    53: "chk_fotos_imovel_sim",
    54: "chk_fotos_imovel_nao",
    55: "chk_sauna_imovel_sim",
    56: "chk_sauna_imovel_nao",
    57: "chk_area_gourmet_imovel_sim",
    58: "chk_area_gourmet_imovel_nao",
    59: "chk_dependencia_sim",
    60: "chk_dependencia_nao",
    61: "chk_academia_imovel_sim",
    62: "chk_academia_imovel_nao",
    63: "chk_piscina_imovel_sim",
    64: "chk_piscina_imovel_nao",
    65: "chk_fotos_cond_sim",
    66: "chk_fotos_cond_nao",
    67: "chk_playground_sim",
    68: "chk_playground_nao",
    69: "chk_area_gourmet_cond_sim",
    70: "chk_area_gourmet_cond_nao",
    71: "chk_seguranca_24h_sim",
    72: "chk_seguranca_24h_nao",
    73: "chk_salao_festa_sim",
    74: "chk_salao_festa_nao",
    75: "chk_piscina_cond_sim",
    76: "chk_piscina_cond_nao",
    77: "chk_campo_futebol_sim",
    78: "chk_campo_futebol_nao",
    79: "chk_quadra_esportes_sim",
    80: "chk_quadra_esportes_nao",
    81: "chk_sauna_cond_sim",
    82: "chk_sauna_cond_nao",
    83: "chk_onibus_van_sim",
    84: "chk_onibus_van_nao",
    85: "chk_balsa_praia_sim",
    86: "chk_balsa_praia_nao",
    87: "chk_academia_cond_sim",
    88: "chk_academia_cond_nao",
}

# Campos em branco (sem SDT): (table_idx, row_idx, cell_idx) -> nome da variável
# O placeholder é anexado ao ÚLTIMO <w:t> daquela célula (todos os rótulos
# mapeados terminam a célula, confirmado na análise da estrutura).
BLANK_FIELD_MAP = {
    (1, 1, 0): "bairro_outro",          # "... Qual?"
    (1, 2, 0): "endereco",
    (1, 2, 1): "cep",
    (1, 3, 0): "localizacao",
    (1, 4, 0): "condominio_nome",
    (1, 4, 1): "edificio",
    (1, 6, 0): "agendamento_obs",       # "Agendar: Sim/Não Obs:"
    (1, 6, 1): "chave_numero",          # "Chave: Sim/Não Nº"
    (1, 7, 1): "placa_numero",          # "Placa: Sim/Não Nº"
    (2, 0, 0): "proprietario_nome",
    (2, 1, 0): "proprietario_telefones",
    (2, 2, 0): "proprietario_email",
    (2, 3, 0): "conjuge_nome",
    (2, 4, 0): "conjuge_telefone",
    (2, 4, 1): "conjuge_email",
    (3, 1, 2): "ano_construcao",
    (4, 0, 0): "area_terreno",
    (4, 0, 1): "area_construida",
    (4, 1, 0): "condominio_valor",      # "Condomínio:R$"
    (4, 1, 1): "iptu_valor",            # "IPTU:R$"
    (4, 1, 2): "inscricao_iptu",
    (5, 0, 1): "valor",                 # "Valor: R$"
    (5, 0, 2): "data_entrega",
    (5, 1, 1): "permuta_tipo_local",
    (5, 2, 0): "motivo_venda",
    (5, 3, 0): "condicoes_obs",
}

STYLED_PLACEHOLDER_TYPES = {"date", "dropDownList", "comboBox"}
BOLD_TAGS = {q("b"), q("bCs")}

# Campos que recebem um valor docxtpl.RichText (não string simples) no
# render, porque precisam de formatação própria (cor/negrito) por trecho.
# motivo_venda: quando o imóvel também é pra locação, o gerador de laudo
# antepõe "LOCAÇÃO: (R$ valor) + Taxas" em vermelho antes do texto normal.
RICH_TEXT_FIELDS = {"motivo_venda"}


def label_rpr_before(sdt_el):
    """Clona o rPr do último run imediatamente anterior ao sdt no mesmo parágrafo,
    removendo negrito (peso normal), para igualar tamanho/cor ao rótulo."""
    parent = sdt_el.getparent()
    idx = list(parent).index(sdt_el)
    for sib in reversed(parent[:idx]):
        if sib.tag == q("r"):
            rpr = sib.find(q("rPr"))
            if rpr is not None:
                clone = etree.fromstring(etree.tostring(rpr))
                for tag in list(clone):
                    if tag.tag in BOLD_TAGS:
                        clone.remove(tag)
                return clone
            return None
    return None


def unwrap_sdt(sdt_el, jinja_var, ctype):
    """Substitui um w:sdt por seu conteúdo (runs), com o texto trocado por {{ var }}."""
    parent = sdt_el.getparent()
    content = sdt_el.find(q("sdtContent"))
    idx = list(parent).index(sdt_el)

    borrowed_rpr = label_rpr_before(sdt_el) if ctype in STYLED_PLACEHOLDER_TYPES else None

    placed_placeholder = False
    children = list(content) if content is not None else []
    for child in children:
        if child.tag == q("r"):
            t = child.find(q("t"))
            if t is not None and (t.text or "").strip():
                if not placed_placeholder:
                    t.text = "{{ " + jinja_var + " }}"
                    t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
                    if borrowed_rpr is not None:
                        old_rpr = child.find(q("rPr"))
                        if old_rpr is not None:
                            child.remove(old_rpr)
                        child.insert(0, borrowed_rpr)
                    placed_placeholder = True
                else:
                    # runs de texto extra dentro do mesmo controle: esvazia
                    t.text = ""
    if not placed_placeholder and children:
        # fallback: nenhum <w:t> com texto foi achado, insere um run simples
        for child in children:
            if child.tag == q("r"):
                new_t = etree.SubElement(child, q("t"))
                new_t.text = "{{ " + jinja_var + " }}"
                new_t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
                placed_placeholder = True
                break

    # move os filhos do sdtContent para o lugar do sdt, na mesma posição
    for offset, child in enumerate(children):
        parent.insert(idx + offset, child)
    parent.remove(sdt_el)
    return placed_placeholder


def append_placeholder_to_cell(tbl, row_idx, cell_idx, var_name, rich=False):
    """rich=True usa a sintaxe {{r var}} do docxtpl (RichText) - necessário
    quando o valor final precisa de formatação própria (cor/negrito) que não
    dá pra herdar do rPr do rótulo, ex: motivo_venda quando tem o aviso de
    locação em vermelho concatenado antes do texto."""
    trs = tbl.findall(q("tr"))
    tr = trs[row_idx]
    tcs = tr.findall(q("tc"))
    tc = tcs[cell_idx]
    all_t = tc.findall(f".//{q('t')}")
    if not all_t:
        raise RuntimeError(f"Nenhum <w:t> encontrado em table row={row_idx} cell={cell_idx}")
    last_t = all_t[-1]
    tag = "{{r " + var_name + "}}" if rich else "{{ " + var_name + " }}"
    last_t.text = (last_t.text or "") + " " + tag
    last_t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")


def main():
    if not SRC.exists():
        raise FileNotFoundError(f"Modelo original não encontrado em: {SRC}")

    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        with zipfile.ZipFile(SRC) as z:
            z.extractall(workdir)

        doc_path = workdir / "word" / "document.xml"
        tree = etree.parse(str(doc_path))
        root = tree.getroot()
        body = root.find(q("body"))

        # 1) SDTs (checkbox / dropdown / date) em ordem de documento
        sdt_count = 0
        unresolved = []
        for sdt in list(root.iter(q("sdt"))):
            sdt_count += 1
            var = SDT_MAP.get(sdt_count)
            if var is None:
                continue  # fora do escopo do MVP: mantém controle nativo intocado
            pr = sdt.find(q("sdtPr"))
            ctype = None
            if pr is not None:
                for child in pr:
                    lt = etree.QName(child.tag).localname
                    if lt in ("checkbox", "date", "dropDownList", "comboBox"):
                        ctype = lt
            ok = unwrap_sdt(sdt, var, ctype)
            if not ok:
                unresolved.append((sdt_count, var))

        print(f"Total de SDTs encontrados: {sdt_count} (esperado 88)")
        if unresolved:
            print("ATENCAO - nao foi possivel inserir placeholder nestes SDTs:", unresolved)

        # 2) Campos em branco dentro de tabelas
        tables = body.findall(q("tbl"))
        print(f"Total de tabelas: {len(tables)} (esperado 10)")
        for (t_idx, r_idx, c_idx), var in BLANK_FIELD_MAP.items():
            append_placeholder_to_cell(
                tables[t_idx], r_idx, c_idx, var, rich=(var in RICH_TEXT_FIELDS)
            )

        # 3) Parágrafos soltos: "Planta original" (idx 6) e "Descrição" (idx 18)
        paras = body.findall(q("p"))
        p6_runs = paras[6].findall(q("r"))
        target_run = p6_runs[1]
        t = target_run.find(q("t"))
        original = t.text
        replaced = original.replace(
            "(       )", "({{ quartos_planta_original }})"
        ).replace(
            "(        )", "({{ suites_planta_original }})"
        )
        if replaced == original:
            raise RuntimeError("Padrao de parenteses da 'Planta original' nao encontrado - verifique espacamento")
        t.text = replaced
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")

        # RichText: título em negrito/maiúsculo + frase fixa em itálico +
        # corpo com rótulos em negrito automático (ver render_report.py).
        p18_runs = paras[18].findall(q("r"))
        last_t18 = p18_runs[-1].find(q("t"))
        last_t18.text = (last_t18.text or "") + "{{r descricao}}"
        last_t18.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")

        tree.write(str(doc_path), xml_declaration=True, encoding="UTF-8", standalone=True)

        with zipfile.ZipFile(SRC) as zsrc:
            names = zsrc.namelist()

        OUT_DOCX.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(OUT_DOCX, "w", zipfile.ZIP_DEFLATED) as zout:
            for name in names:
                zout.write(workdir / name, name)

    print(f"\nTemplate gerado em: {OUT_DOCX}")


if __name__ == "__main__":
    main()
