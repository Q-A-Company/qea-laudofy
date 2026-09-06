"""
Gera um laudo (.docx) real a partir do template + dados de um imóvel.

Uso: python3 render_report.py <output.docx>
Lê o contexto (JSON) via stdin - um objeto plano {variavel: valor_string},
com chaves especiais que viram RichText (cor/negrito por trecho, não dá pra
fazer só com {{ variavel }}):

  - motivo_venda / motivo_venda_locacao_prefixo: aviso de locação em
    vermelho antes do texto normal do corretor.
  - descricao_titulo / descricao_corpo: título em negrito/maiúsculo + a
    frase fixa "O imóvel vem descrito da seguinte forma:" em itálico +
    corpo do texto, onde qualquer linha "Rótulo:" vira negrito automático
    (ex: "1º Pavimento:"), igual ao modelo real de laudo da imobiliária.
    O aviso de direitos autorais do site NÃO entra aqui - é gerado pelo
    site deles automaticamente, não faz parte do laudo.

Chamado como subprocesso pelo backend Node (apps/api/src/report/renderDocx.ts).
"""
import json
import re
import sys
from pathlib import Path

from docxtpl import DocxTemplate, RichText

SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATE = SCRIPT_DIR.parent / "ficha_imovel.template.docx"

# Linha "Rótulo curto: resto do texto" -> rótulo (com os dois-pontos) em negrito.
LABEL_LINE = re.compile(r"^([^:\n]{1,40}):\s*(.*)$")


def add_break(rt):
    """RichText não tem helper de quebra de linha - injeta um <w:br/> cru,
    técnica padrão pra isso no docxtpl (rt.xml é só uma string pública)."""
    rt.xml += "<w:r><w:br/></w:r>"


def build_motivo_venda_richtext(texto, prefixo):
    rt = RichText()
    if prefixo:
        rt.add(prefixo, color="FF0000", bold=True, size=28)
        if texto:
            rt.add("   ")
    if texto:
        rt.add(texto, size=28)
    return rt


def build_descricao_richtext(titulo, corpo):
    rt = RichText()
    if not titulo and not corpo:
        return rt

    if titulo:
        rt.add(titulo.upper(), bold=True, size=28)
        add_break(rt)
        add_break(rt)

    rt.add("O imóvel vem descrito da seguinte forma:", italic=True, underline=True, size=28)

    if corpo:
        add_break(rt)
        add_break(rt)
        linhas = [l for l in corpo.splitlines() if l.strip()]
        for i, linha in enumerate(linhas):
            match = LABEL_LINE.match(linha)
            if match:
                rt.add(match.group(1) + ":", bold=True, size=28)
                if match.group(2):
                    rt.add(" " + match.group(2), size=28)
            else:
                rt.add(linha, size=28)
            if i < len(linhas) - 1:
                add_break(rt)
                add_break(rt)

    return rt


def main():
    if len(sys.argv) < 2:
        print("Uso: render_report.py <output.docx>", file=sys.stderr)
        sys.exit(1)
    output_path = Path(sys.argv[1])

    ctx = json.load(sys.stdin)

    motivo_texto = ctx.pop("motivo_venda", "") or ""
    motivo_prefixo = ctx.pop("motivo_venda_locacao_prefixo", "") or ""
    ctx["motivo_venda"] = build_motivo_venda_richtext(motivo_texto, motivo_prefixo)

    descricao_titulo = ctx.pop("descricao_titulo", "") or ""
    descricao_corpo = ctx.pop("descricao_corpo", "") or ""
    ctx["descricao"] = build_descricao_richtext(descricao_titulo, descricao_corpo)

    tpl = DocxTemplate(str(TEMPLATE))
    undeclared = tpl.get_undeclared_template_variables()
    missing = undeclared - set(ctx.keys())
    if missing:
        print(f"AVISO - variaveis do template sem valor no contexto (usando vazio): {sorted(missing)}", file=sys.stderr)
        for key in missing:
            ctx[key] = ""

    tpl.render(ctx)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    tpl.save(str(output_path))
    print(str(output_path))


if __name__ == "__main__":
    main()
