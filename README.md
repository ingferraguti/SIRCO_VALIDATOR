# sirco-validator

## Descrizione

Applicativo web locale per validare e correggere in memoria file TXT a lunghezza fissa del flusso SIRCO. L’app legge i file da una cartella locale, mantiene una working copy modificabile senza alterare gli originali, esegue controlli sintattici, deterministici e relazionali sui tracciati B-G, mostra errori/warning/info in interfaccia e predispone l’esportazione dei TXT corretti.

Vincoli confermati:

- nessun database;
- nessun upload;
- nessuna autenticazione;
- nessuna gestione del tracciato A Anagrafica;
- codici, zeri iniziali e spazi significativi restano stringhe;
- non viene fatto trim distruttivo;
- valori troppo lunghi bloccano la modifica e non vengono mai troncati automaticamente.

## Tracciati gestiti

Gestiti:

- B - Ricoveri
- C - Motivi Ricovero
- D - Diagnosi
- E - Interventi Procedure
- F - Problemi socio-sanitari
- G - Lesioni

Non gestito in questa fase:

- A - Anagrafica

## Rilevamento dinamico dei file

I file devono essere copiati nella cartella configurata da `SIRCO_INPUT_DIR`, oppure in `data/input` se la variabile non è valorizzata.

Pattern cercati:

- `Ricoveri*.txt` → B - Ricoveri
- `MotiviRicovero*.txt` → C - Motivi Ricovero
- `Diagnosi*.txt` → D - Diagnosi
- `InterventiProcedure*.txt` → E - Interventi Procedure
- `Problemisociosanitari*.txt` → F - Problemi socio-sanitari
- `Lesioni*.txt` → G - Lesioni

Regole di configurazione:

- se per un pattern viene trovato più di un file viene emesso un errore di configurazione con l’elenco dei file;
- se manca Ricoveri viene mostrato un errore grave ma l’app non deve andare in crash;
- se manca uno dei file C-G viene mostrato un warning.

## Working copy e modifica dati

Ogni record caricato contiene:

- `originalRecord` immutabile;
- `currentRecord` ricostruito dai valori correnti;
- `originalValue` immutabile per ciascun campo;
- `currentValue` modificabile in memoria;
- flag `changed` a livello record e campo.

La ricostruzione rispetta le posizioni 1-based e la lunghezza fissa dei campi. I campi AN sono allineati a sinistra con spazi, i campi N sono allineati a destra e le date DT hanno lunghezza 8 in formato GGMMAAAA.

## Controlli locali implementati

Controlli generici guidati dalle definizioni dichiarative:

- lunghezza record;
- campo obbligatorio;
- campo chiave obbligatorio;
- tipo N composto solo da cifre se valorizzato;
- tipo DT in formato GGMMAAAA;
- data realmente esistente;
- dominio statico;
- dominio esterno locale se il JSON è disponibile;
- filler a soli spazi;
- duplicazione chiave primaria;
- allineamento AN e N/DT;
- valore oltre la lunghezza prevista;
- caratteri non ammessi o non rappresentabili.

Controlli locali specifici B - Ricoveri:

- B01, B02 e B03 obbligatori;
- B03 con ultime 6 cifre numeriche e diverse da zero;
- B03 congruente con anno di B04;
- B04 e B08 date valide;
- B04 minore o uguale a B08;
- B09 numerico e non superiore alle giornate effettive;
- degenza superiore a 42 giorni come warning;
- B10 deprecato con solo placeholder spazio in posizione 40, B12 e B16 filler;
- B13 e B14 tra 000 e 100 se valorizzati;
- B17 obbligatorio con gravità warning;
- B18 dominio e coerenza COT B19-B21;
- B22 valida e minore o uguale a B04;
- B23 obbligatoria quando B05 è diversa da 01;
- B26 lunghezza 2 con valori ammessi 1, 2, 3, 5, 7, 8, 9 più filler spazio e 10, 11 già a due cifre; valori 4 e 6 non ammessi;
- B27 dominio I/V/C.

Controlli locali specifici C-G:

- C: motivo obbligatorio, dominio statico, univocità da chiave primaria, motivo principale, filler e relazione verso Ricoveri;
- D: progressivo 01-10, univocità, diagnosi principale D04=01, codice diagnosi formalmente coerente, filler e relazione verso Ricoveri;
- E: progressivo, univocità, codice procedura obbligatorio, data procedura valida, filler e relazione verso Ricoveri;
- F: problema obbligatorio, dominio 00-10, univocità, incompatibilità di F04=00 con altri problemi della stessa scheda, filler e relazione verso Ricoveri;
- G: progressivo, tipologia lesione, domini stadi, obbligatorietà stadi per tipologia 1/2, divieto stadi per tipologia 3, filler e relazione verso Ricoveri.

Controlli relazionali:

- ogni figlio C-G deve avere un record B corrispondente;
- duplicazione della chiave primaria completa;
- ogni Ricovero deve avere almeno un record C;
- ogni Ricovero deve avere almeno un record D;
- cardinalità locali deterministiche indicate sopra.

## Domini esterni e controlli non verificabili localmente

La cartella predisposta per i domini locali è:

```text
data/domains
```

File supportati:

- `data/domains/aziende.json`
- `data/domains/strutture-sirco.json`
- `data/domains/regioni.json`
- `data/domains/comuni.json`
- `data/domains/diagnosi.json`
- `data/domains/procedure.json`

Formato atteso: array JSON di stringhe. Se un file è presente, il dominio viene controllato; se manca, viene generata una sola segnalazione INFO per dominio.

Non sono verificabili localmente e vengono segnalati come INFO, senza errori fittizi:

- controlli I/V/C rispetto alla presenza in banca dati regionale;
- controlli che dipendono da servizi regionali;
- controlli su banca dati regionale;
- controlli B24/B25 dipendenti da regole regionali non ricostruibili localmente senza contesto/domini ufficiali;
- controlli dipendenti da anno di rilevazione, periodo di elaborazione o numero invio quando il contesto non è configurato.

## Filtri e selezione

Il pannello **Selezione record tramite filtri** permette di filtrare record senza scrivere codice. Sono supportati operatori di confronto, testo, vuoto/non vuoto, appartenenza a elenco, presenza di errori/warning/codice segnalazione e stato modificato/non modificato. Le condizioni possono essere combinate con AND oppure OR. Il pannello mostra totale tabella, record filtrati, record selezionati e anteprima.

## Modifica singola e modifica massiva

Nel dettaglio record i campi non protetti sono modificabili. Per ogni campo sono mostrati codice, nome, valore originale, valore corrente, lunghezza usata/massima, tipo, dominio disponibile e segnalazioni associate.

La modifica massiva opera solo sui record selezionati e supporta:

- imposta valore;
- svuota campo;
- copia valore da altro campo compatibile;
- sostituisci testo (`testo=>nuovo testo`);
- aggiungi prefisso;
- aggiungi suffisso;
- normalizza allineamento;
- ripristina valore originale.

Campi protetti dalla modifica massiva in questa versione:

- B01, B02, B03
- C01, C02, C03, C04
- D01, D02, D03, D04
- E01, E02, E03, E04
- F01, F02, F03, F04
- G01, G02, G03, G04

La modifica massiva è atomica: se almeno un record non è modificabile, non viene applicata nessuna modifica.

## Storico modifiche e undo

Lo storico è mantenuto in memoria e contiene le operazioni singole/massive applicate, i record coinvolti e i valori precedenti/successivi. Sono disponibili:

- annulla ultima modifica;
- ripristina tutte le modifiche;
- indicatore del numero totale di record modificati.

## Esportazione

Cartella output predefinita:

```text
data/output
```

Variabile opzionale:

```text
SIRCO_OUTPUT_DIR
```

I file originali in `data/input` non vengono modificati. I file corretti vengono scritti in `data/output`.

L’export mantiene il nome del file originale, usa CR-LF come separatore, include record modificati e non modificati e scrive anche `sirco-change-log.json`. L’export viene bloccato se sono presenti errori di ricostruzione record.

## TODO residui sulle specifiche

Nel repository non è presente il PDF delle **Specifiche Funzionali SIRCO versione 2.0**. Per non inventare posizioni, lunghezze, domini o regole, le definizioni C-G sono state completate solo con le informazioni certe già presenti e con campi necessari ai controlli deterministici richiesti. Da completare quando sarà disponibile la fonte ufficiale:

- posizioni/lunghezze definitive di tutti i campi C-G;
- domini ufficiali completi dei motivi ricovero, diagnosi, procedure, tipologie/stadi lesione;
- cardinalità ufficiali complete per C, D, E, F e G;
- regole regionali per B24/B25;
- regole COT B19-B21 di dettaglio oltre alla presenza/coerenza locale.

## Requisiti

- Node.js versione consigliata: 20 LTS o superiore
- npm oppure pnpm
- sistema operativo: Windows, Linux o macOS

## Installazione in sviluppo

```bash
npm install
mkdir -p data/input data/output data/domains
npm run dev
```

Aprire il browser all’indirizzo `http://localhost:3000`.

## Build di produzione

```bash
npm run build
npm run start
```

Anche in produzione l’app legge i file dalla cartella locale `data/input` rispetto alla root del progetto, salvo `SIRCO_INPUT_DIR`.

## Deploy locale su server interno

```bash
npm install
mkdir -p data/input data/output data/domains
npm run build
PORT=3000 npm run start
```

## Deploy con PM2

```bash
npm install -g pm2
npm run build
pm2 start npm --name sirco-validator -- run start
pm2 save
pm2 startup
```

I file TXT devono continuare a essere messi in `data/input` o nella cartella indicata da `SIRCO_INPUT_DIR`.

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

Accesso: `http://localhost:3000`.

## Variabili ambiente

- `SIRCO_INPUT_DIR`: cartella di input; default `data/input`.
- `SIRCO_OUTPUT_DIR`: cartella di output; default `data/output`.
