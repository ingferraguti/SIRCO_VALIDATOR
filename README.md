# sirco-validator MVP

## Avvio
- `npm install`
- `npm run dev`
- Apri `http://localhost:3000`

## File attesi in input
In questa versione, l'app legge file TXT fixed-length dalla cartella locale `data/input`:

- `/data/input/Ricoveri20260515.txt`
- `/data/input/MotiviRicovero20260515.txt`
- `/data/input/Diagnosi20260515.txt`
- `/data/input/InterventiProcedure20260515.txt`
- `/data/input/Problemisociosanitari20260515.txt`
- `/data/input/Lesioni20260515.txt`

L'app legge i file localmente lato server (senza upload, senza database).

> Il tracciato Anagrafica non è ancora gestito in questa versione.
