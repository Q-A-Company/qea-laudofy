"""
Renderiza ficha_imovel.template.docx com dados fictícios, para validação
visual manual (abrir o .docx gerado no Word/LibreOffice).

Uso: python3 render_test.py
"""
from pathlib import Path

from docxtpl import DocxTemplate, RichText

from render_report import build_descricao_richtext

SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATE = SCRIPT_DIR.parent / "ficha_imovel.template.docx"
OUT = SCRIPT_DIR.parent / "exemplo_renderizado.docx"

CHECK = "☒"


def build_motivo_venda(motivo_venda_texto, valor_locacao=None):
    """"Motivo da venda" é RichText porque, quando o imóvel também é pra
    locação, antepomos "LOCAÇÃO: (R$ valor) + Taxas" em vermelho/negrito
    antes do texto normal (pedido explícito da equipe)."""
    rt = RichText()
    if valor_locacao:
        rt.add(
            f"LOCAÇÃO: (R$ {valor_locacao}) + Taxas",
            color="FF0000",
            bold=True,
            size=28,
        )
        if motivo_venda_texto:
            rt.add("   ")
    if motivo_venda_texto:
        rt.add(motivo_venda_texto, size=28)
    return rt
UNCHECK = "☐"


def sim_nao(flag):
    return (CHECK, UNCHECK) if flag else (UNCHECK, CHECK)


# --- dados de exemplo (simulam o que viria do formulário estruturado) ---
tipo_imovel = "apartamento"
bairro = "barra_da_tijuca"
sol = {"manha": True, "tarde": True}
finalidade = {"venda": True, "locacao": True}

ctx = {}

for key in ["apartamento", "casa", "cobertura", "comercial", "loja", "sala", "sitio", "terreno"]:
    ctx[f"chk_tipo_{key}"] = CHECK if key == tipo_imovel else UNCHECK

ctx["planta_tipo"] = "Duplex"

ctx["chk_bairro_barra_da_tijuca"] = CHECK if bairro == "barra_da_tijuca" else UNCHECK
ctx["chk_bairro_recreio"] = UNCHECK
ctx["chk_bairro_outros"] = UNCHECK
ctx["bairro_outro"] = ""

ctx["endereco"] = "Av. das Américas, 1000, apto 302"
ctx["cep"] = "22640-100"
ctx["localizacao"] = "Próximo ao shopping"
ctx["condominio_nome"] = "Residencial Vista Mar"
ctx["edificio"] = "Bloco 2"

ctx["chk_posicao_frente"], ctx["chk_posicao_fundos"] = CHECK, UNCHECK
ctx["chk_posicao_lateral"] = UNCHECK
ctx["chk_sol_manha"], _ = sim_nao(sol["manha"])
ctx["chk_sol_tarde"], _ = sim_nao(sol["tarde"])

ctx["chk_agendar_sim"], ctx["chk_agendar_nao"] = sim_nao(True)
ctx["agendamento_obs"] = "Ligar 30min antes"
ctx["chk_chave_sim"], ctx["chk_chave_nao"] = sim_nao(True)
ctx["chave_numero"] = "12"
ctx["chk_imovel_vazio"], ctx["chk_imovel_ocupado"] = sim_nao(False)
ctx["chk_placa_sim"], ctx["chk_placa_nao"] = sim_nao(True)
ctx["placa_numero"] = "45"

ctx["chk_canto_pedra_sim"], ctx["chk_canto_pedra_nao"] = sim_nao(False)
ctx["data_laudo"] = "05/09/2026"

ctx["proprietario_nome"] = "João da Silva"
ctx["proprietario_telefones"] = "(21) 99999-0000"
ctx["proprietario_email"] = "joao@example.com"
ctx["conjuge_nome"] = "Maria da Silva"
ctx["conjuge_telefone"] = "(21) 98888-0000"
ctx["conjuge_email"] = "maria@example.com"

ctx["quartos"] = "3"
ctx["suites"] = "2"
ctx["banheiros"] = "4"
ctx["vagas"] = "2"
ctx["quartos_planta_original"] = "3"
ctx["suites_planta_original"] = "1"
ctx["chk_subsolo_sim"], ctx["chk_subsolo_nao"] = sim_nao(False)
ctx["ano_construcao"] = "2015"
ctx["elevadores"] = "2"
ctx["andar"] = "7"
ctx["unidades_por_andar"] = "4"

ctx["area_terreno"] = "-"
ctx["area_construida"] = "120 m²"
ctx["chk_hidrometro_individual"], ctx["chk_hidrometro_coletivo"] = sim_nao(True)
ctx["condominio_valor"] = "1.200,00"
ctx["iptu_valor"] = "350,00"
ctx["inscricao_iptu"] = "123.456.789-0"

ctx["chk_finalidade_venda"], ctx["chk_finalidade_locacao"] = sim_nao(finalidade["venda"])
ctx["valor"] = "1.500.000,00"
# "Data de entrega" agora tem 3 modos (a combinar / imediata / mês+ano ou só ano);
# a formatação da string final é resolvida antes de chegar no template.
ctx["data_entrega"] = "12/2027"
ctx["chk_permuta_sim"], ctx["chk_permuta_nao"] = sim_nao(False)
ctx["permuta_tipo_local"] = ""
ctx["motivo_venda"] = build_motivo_venda(
    "Mudança de cidade", valor_locacao="6.500,00" if finalidade["locacao"] else None
)
ctx["condicoes_obs"] = "Aceita financiamento"

for key, val in [
    ("fotos_imovel", True), ("sauna_imovel", False), ("area_gourmet_imovel", True),
    ("dependencia", True), ("academia_imovel", False), ("piscina_imovel", True),
]:
    ctx[f"chk_{key}_sim"], ctx[f"chk_{key}_nao"] = sim_nao(val)

for key, val in [
    ("fotos_cond", True), ("playground", True), ("area_gourmet_cond", True),
    ("seguranca_24h", True), ("salao_festa", True), ("piscina_cond", True),
    ("campo_futebol", False), ("quadra_esportes", True), ("sauna_cond", True),
    ("onibus_van", False), ("balsa_praia", False), ("academia_cond", True),
]:
    ctx[f"chk_{key}_sim"], ctx[f"chk_{key}_nao"] = sim_nao(val)

ctx["descricao"] = build_descricao_richtext(
    "Excelente apartamento duplex com vista mar, totalmente reformado, "
    "à venda no condomínio Águas Claras na Barra da Tijuca com segurança 24 horas.",
    "1º Pavimento: Sala em três ambientes com vista mar, cozinha planejada e lavabo.\n"
    "2º Pavimento: Duas suítes, sendo a master com closet e banheira de hidromassagem.\n"
    "Área de lazer: Piscina, área gourmet com churrasqueira e academia.",
)

tpl = DocxTemplate(str(TEMPLATE))
undeclared = tpl.get_undeclared_template_variables()
missing = undeclared - set(ctx.keys())
if missing:
    print("FALTANDO no ctx (vai quebrar o render):", sorted(missing))

tpl.render(ctx)
tpl.save(str(OUT))
print(f"Renderizado em: {OUT}")
