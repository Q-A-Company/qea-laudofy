# Imagem de produção do backend: Node (Fastify + pg-boss) + Python (docxtpl,
# usado só para o script templates/laudo/scripts/render_report.py) +
# LibreOffice headless (conversão .docx -> .pdf).
#
# NUNCA construída/testada localmente ainda (sem Docker disponível no ambiente
# de desenvolvimento) - validar o build antes do primeiro deploy real.

FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    libreoffice \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages --no-cache-dir \
    docxtpl \
    lxml

WORKDIR /app

# Copia o monorepo inteiro (workspaces) - simples e adequado pra esse porte;
# revisar se o build ficar lento/pesado demais.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --workspace=@qea-laudofy/api --workspace=@qea-laudofy/shared

COPY packages/shared packages/shared
COPY apps/api apps/api
COPY templates/laudo templates/laudo

WORKDIR /app/apps/api
RUN npm run build

EXPOSE 3333
CMD ["node", "dist/index.js"]
