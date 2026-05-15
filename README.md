# sirco-validator

## Descrizione

Applicativo web locale per validare file TXT a lunghezza fissa del flusso SIRCO.  
L’app legge i file da una cartella locale del progetto, esegue controlli sintattici e relazionali, mostra gli errori in interfaccia e permette l’esportazione del report errori in CSV.

In questa versione non sono presenti:
- database
- upload file
- autenticazione
- gestione anagrafica
- editing persistente
- export dei TXT corretti

## Tracciati gestiti

Gestiti:
- Ricoveri
- Motivi Ricovero
- Diagnosi
- Interventi Procedure
- Problemi socio-sanitari
- Lesioni

Non ancora gestito:
- Anagrafica

## File attesi

I file devono essere copiati nella cartella:

`/data/input`

File attesi:

- Ricoveri20260515.txt
- MotiviRicovero20260515.txt
- Diagnosi20260515.txt
- InterventiProcedure20260515.txt
- Problemisociosanitari20260515.txt
- Lesioni20260515.txt

## Requisiti

- Node.js versione consigliata: 20 LTS o superiore
- npm oppure pnpm
- sistema operativo: Windows, Linux o macOS

## Installazione in sviluppo

1. Clonare o scaricare il progetto
2. Entrare nella cartella del progetto
3. Installare le dipendenze

Con npm:

```bash
npm install
```

Con pnpm:

```bash
pnpm install
```

4. Creare la cartella dei file input, se non esiste:

```bash
mkdir -p data/input
```

Su Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path data/input
```

5. Copiare i file TXT dentro `data/input`
6. Avviare l’applicazione in sviluppo:

```bash
npm run dev
```

Oppure:

```bash
pnpm dev
```

7. Aprire il browser all’indirizzo:

`http://localhost:3000`

## Build di produzione

```bash
npm run build
npm run start
```

Oppure:

```bash
pnpm build
pnpm start
```

Anche in produzione l’app legge i file dalla cartella locale `data/input` rispetto alla root del progetto.

## Deploy locale su server interno

1. Installare Node.js 20 LTS
2. Copiare il progetto sul server
3. Eseguire `npm install`
4. Creare `data/input`
5. Copiare i TXT da validare in `data/input`
6. Eseguire `npm run build`
7. Avviare con `npm run start`
8. Accedere dal browser alla porta configurata

Di default Next.js usa la porta 3000.

Esempi:

```bash
npm run start -- -p 3000
PORT=3000 npm run start
```

Windows PowerShell:

```powershell
$env:PORT=3000
npm run start
```

## Deploy con PM2

```bash
npm install -g pm2
npm run build
pm2 start npm --name sirco-validator -- run start
pm2 save
pm2 startup
```

I file TXT devono continuare a essere messi in `data/input`.

## Deploy con Docker

È incluso un `Dockerfile` basato su Node.js 20 alpine e un `docker-compose.yml` che monta la cartella input locale.

Volume importante:

```yaml
volumes:
  - ./data/input:/app/data/input
```

Avvio:

```bash
docker compose up -d --build
```

Accesso:

`http://localhost:3000`

## Variabili ambiente

Variabile opzionale:

- `SIRCO_INPUT_DIR`

Se valorizzata, l’app legge i file da quella cartella invece che da `data/input`.

Esempio:

```bash
SIRCO_INPUT_DIR=/percorso/assoluto/file/sirco
```

Default se non valorizzata: `data/input`.

## Note importanti

- i file sono TXT a lunghezza fissa
- non bisogna aprire e salvare i file con Excel prima della validazione, perché Excel può alterare zeri iniziali e spazi significativi
- l’app non modifica i file originali
- il report CSV degli errori è solo un report di controllo
- la gestione dell’anagrafica verrà aggiunta in una fase successiva
