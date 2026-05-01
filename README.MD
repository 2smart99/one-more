Ecco un **Product Requirements Document (PRD)** completo, strutturato appositamente per la creazione di una Telegram Mini App (TMA). È pronto per essere condiviso, scaricato o inserito nel tuo repository GitHub come `README.md` o documentazione di progetto.

---

# 📄 PRD: "One More" - Telegram Mini App per il tracking dell'allenamento

## 1. Visione del Prodotto
AuraWorkout è una Telegram Mini App progettata per bodybuilder e frequentatori di palestre che desiderano un tracker di allenamento rapido, analitico e privo di distrazioni sociali. Sfruttando l'ecosistema Telegram, garantisce un accesso immediato senza download aggiuntivi. L'interfaccia adotta uno stile **Soft UI e Glassmorphism**, offrendo un'esperienza utente moderna, fluida e visivamente rilassante.

## 2. Stack Tecnologico
*   **Piattaforma Base:** Telegram Web Apps API.
*   **Frontend:** React.js o Next.js (consigliato per la gestione dello state complesso durante l'allenamento).
*   **Styling:** Tailwind CSS (ideale per implementare rapidamente i dettami della Soft UI).
*   **Database & Autenticazione:** Supabase (PostgreSQL).
*   **Hosting / Deploy:** Railway (collegato direttamente alla repo GitHub per CI/CD o per ospitare un eventuale backend Node.js, sebbene l'approccio serverless con Supabase sia il più efficiente).
*   **Version Control:** GitHub.

---

## 3. Funzionalità Core (MVP)
L'app è strettamente focalizzata sulle performance e sui dati.

### A. Preparazione e Gestione
*   **Autenticazione:** Accesso automatico e trasparente (Silent Login) tramite `Telegram.WebApp.initDataUnsafe.user.id`.
*   **Database Esercizi:** Lista preimpostata di base (divisa per gruppi muscolari) + possibilità di aggiungere `Esercizi Custom`.
*   **Costruttore Routine:** Creazione di schede salvate (es. "Leg Day", "Push") associando sequenze di esercizi collegati.

### B. Registrazione Live (Il "Cuore" dell'app)
*   **Avvio Workout:** Da una routine esistente o sessione "Vuota" (aggiungendo esercizi al volo).
*   **Input Dati:** Registrazione rapida di `Peso` e `Ripetizioni` per ogni set.
*   **Tagging dei Set:** Selezione del tipo di serie (`Normal`, `Warm-up`, `Drop set`, `Failure`).
*   **Rest Timer integrato:** Timer fluttuante in Glassmorphism che parte al completamento di un set.
*   **Anteprima Storico:** Sotto l'input attuale, visualizzazione in grigio chiaro dei dati dell'ultima volta in cui si è eseguito quell'esercizio.

### C. Analitica e Progressioni
*   **Volume Totale:** Calcolo automatico a fine sessione usando la formula:
    $$\text{Volume Totale} = \sum (\text{Peso} \times \text{Ripetizioni})$$
*   **Massimale Stimato (1RM):** Calcolato sulle best performaces usando l'equazione di Brzycki:
    $$1\text{RM} \approx \text{Peso} \times \left(1 + \frac{\text{Ripetizioni}}{30}\right)$$
*   **Record (PR):** Badge visivi al raggiungimento di nuovi massimali o incrementi di volume.

---

## 4. Architettura Database (Supabase / PostgreSQL)

Per garantire la scalabilità e le corrette relazioni, il database dovrà essere strutturato con le seguenti tabelle principali:

```sql
-- Tabella Utenti (Sincronizzata con Telegram ID)
CREATE TABLE users (
  tg_id BIGINT PRIMARY KEY,
  first_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella Esercizi (predefiniti o custom)
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT REFERENCES users(tg_id) NULL, -- NULL per esercizi di default
  name TEXT NOT NULL,
  muscle_group TEXT
);

-- Tabella Routine
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT REFERENCES users(tg_id),
  title TEXT NOT NULL
);

-- Collegamento Esercizi-Routine
CREATE TABLE routine_exercises (
  routine_id UUID REFERENCES routines(id),
  exercise_id UUID REFERENCES exercises(id),
  sort_order INTEGER,
  PRIMARY KEY (routine_id, exercise_id)
);

-- Sessioni di Allenamento
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT REFERENCES users(tg_id),
  routine_id UUID REFERENCES routines(id) NULL,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP
);

-- Singoli Set (Il dato più granulare)
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id),
  exercise_id UUID REFERENCES exercises(id),
  weight NUMERIC,
  reps INTEGER,
  set_type TEXT DEFAULT 'Normal', -- Normal, Warmup, Drop, Failure
  compelted BOOLEAN DEFAULT FALSE
);
```

---

<details>
<summary><strong>🎨 5. Linee Guida per il Design e Frontend (Clicca per espandere)</strong></summary>

I developer dovranno attenersi rigorosamente a questo design system basato su Soft UI e Glassmorphism.

*   **Tavolozza Colori:**
    *   `Background`: `#F4F7FB` (Azzurro/grigio neutro e chiarissimo).
    *   `Surface / Panels`: `#FFFFFF`.
    *   `Primary Accent`: `#78BCEE` (Azzurro pastello/Cyan, usato per bottoni principali).
    *   `Text Primary`: `#2D3748` (Antracite, MAI nero assoluto).
    *   `Text Secondary`: `#A0AEC0`.
*   **Tipografia:**
    *   Font univoco: `Poppins` o `Nunito`.
    *   Uso marcato dei pesi `Bold` ed `ExtraBold` per i numeri di Peso e Ripetizioni.
*   **Regole Geometriche & CSS:**
    *   `border-radius` massiccio: Card min `24px`, bottoni e chip `9999px` (a pillola).
    *   Spaziatura esagerata: Le card devono avere molto padding interno (es. `p-6` in Tailwind).
*   **La Regola dell'Ombra (Soft UI):**
    Utilizzare questa equazione per le `box-shadow`: la sfumatura ($B_r$) deve essere il doppio dell'offset verticale ($O_y$).
    $$B_r = 2 \times O_y$$
    *Esempio Tailwind:* `shadow-[0_8px_16px_rgba(0,0,0,0.04)]`
*   **Gestione Z-Index (Effetto 3D):**
    Nella schermata attiva dell'allenamento, il timer di rest deve sovrapporsi (Glassmorphism) ai set sottostanti.
    ```css
    /* Classe Glassmorphism essenziale */
    .glass-panel {
      background: rgba(255, 255, 255, 0.65);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
    ```
</details>

---

## 6. Flusso dell'Utente (User Flow)

1.  L'utente apre il bot Telegram e preme "Inizia Allenamento".
2.  La Mini App si apre in overlay dal basso (Full screen).
3.  **Homepage:** Mostra "Ciao, [Nome Telegram]", statistiche rapide (volume mese in corso) e due pulsanti principali: `Nuovo Allenamento Vuoto` o `Scegli Modello`.
4.  **Schermata Live Tracker:**
    *   Premere il bottone `+ Aggiungi Esercizio` apre il database.
    *   La card dell'esercizio mostra le righe dei set (Set, Kg, Reps).
    *   Tappando sul numero di Kg o Reps si apre un tastierino numerico nativo/personalizzato per input velocissimo.
    *   Tappando la spunta (✔) appare un popup *Glassmorphism* in basso col conto alla rovescia del timer di recupero.
5.  **Fine sessione:** Pressione prolungata su `Termina`. L'app calcola il tonnellaggio, salva i log temporali in Supabase e riporta l'utente alla schermata di riepilogo con un messaggio di complimenti da parte del Bot Telegram.

## 7. Roadmap di Deploy (GitHub -> Railway -> Supabase)

*   **Fase 1 (Setup):**
    1. Creare progetto su Supabase. Creare le tabelle tramite psql (SQL soprastante).
    2. Creare un bot con BotFather su Telegram e ottenere il Token.
    3. Inizializzare repo GitHub (Next.js/React + Tailwind).
*   **Fase 2 (Sviluppo MVP):**
    1. Integrare Telegram Web App SDK.
    2. Configurare `Supabase Client` con le variabili d'ambiente.
    3. Sviluppare interfacce UI seguendo fedelmente il design system (Soft UI).
*   **Fase 3 (Deploy on Railway):**
    1. Collegare Railway alla repo GitHub per auto-deploy.
    2. Inserire URL generato da Railway sulla configurazione della Web App generata tramite BotFather di Telegram.
    3. Testing live direttamente dall'app mobile di Telegram per verificare l'esperienza touch e gli input fields.