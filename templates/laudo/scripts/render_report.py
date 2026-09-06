"""
Gera um laudo (.docx) real a partir do template + dados de um imóvel.

Uso: python3 render_report.py <output.docx>
Lê o contexto (JSON) via stdin - um objeto plano {variavel: valor_string},
com duas chaves especiais pro campo de "Motivo da venda" (que usa RichText
pra poder colorir o aviso de locação em vermelho):
  - motivo_venda: texto normal digitado pelo corretor
  - motivo_venda_locacao_prefixo: texto extra (ex: "LOCAÇÃO: (R$ ...) + Taxas"),
    ou "" quando não se aplica

Chamado como subprocesso pelo backend Node (apps/api/src/report/renderDocx.ts).
"""
import json
import sys
from pathlib import Path

from docxtpl import DocxTemplate, RichText

SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATE = SCRIPT_DIR.parent / "ficha_imovel.template.docx"


def build_motivo_venda_richtext(texto, prefixo):
    rt = RichText()
    if prefixo:
        rt.add(prefixo, color="FF0000", bold=True, size=28)
        if texto:
            rt.add("   ")
    if texto:
        rt.add(texto, size=28)
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
