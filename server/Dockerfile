FROM oven/bun

COPY index.ts index.ts 
COPY package.json package.json
COPY bun.lockb bun.lockb
RUN bun install

CMD ["bun", "start"]
