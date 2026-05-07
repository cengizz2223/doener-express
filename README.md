# 🥙 Döner Express – Internes Bestellsystem

Professionelles Mitarbeiter-Bestellsystem für Dönerladen. Gebaut mit Next.js 14, React, Tailwind CSS und TypeScript.

## Login-Daten

| Feld | Wert |
|------|------|
| Benutzername | `test` |
| Passwort | `deingesicht` |

## Schnellstart

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Features

- **Login-System** mit JWT-Session (8 Stunden gültig)
- **Bestellformular** mit Produktauswahl (+/−), Extras, Priorität, Notiz
- **Küchenmonitor** mit Echtzeit-Updates (alle 5 Sekunden)
- **Status-System** – Neu → In Arbeit → Fertig → Abgeholt
- **Mitarbeiter-Zuweisung** – Ali, Mehmet, Yusuf
- **Live-Statistiken** – Offen, In Arbeit, Fertig, Umsatz, Ø Zeit
- **Suche & Filter** nach Status, Name, Nummer, Produkt
- **Ton-Benachrichtigung** bei neuen Bestellungen
- **Druckfunktion** pro Bestellung (Bon)
- **Drag & Drop** Bestellungen sortieren
- **Responsive Design** – Desktop, Tablet, Handy

## Produkte & Preise

| Produkt | Preis |
|---------|-------|
| Döner | 7,50 € |
| Dürüm | 8,00 € |
| Lahmacun | 5,50 € |
| Pommes | 3,50 € |
| Cola | 2,50 € |
| Ayran | 2,00 € |
| Extra Fleisch | +2,00 € |

## Auf GitHub hochladen

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/doener-express.git
git push -u origin main
```

## Auf Vercel deployen

1. Gehe zu [vercel.com](https://vercel.com) → **New Project**
2. GitHub-Repository importieren
3. Environment Variables setzen:

| Variable | Wert |
|----------|------|
| `JWT_SECRET` | Langer zufälliger String (mind. 32 Zeichen) |
| `ADMIN_USERNAME` | `test` |
| `ADMIN_PASSWORD` | `deingesicht` |

4. **Deploy** klicken – fertig!

> **Hinweis:** Bestellungen werden im Arbeitsspeicher gespeichert und gehen beim Server-Neustart verloren. Für persistente Daten empfehlen sich [Vercel Postgres](https://vercel.com/storage/postgres) oder [PlanetScale](https://planetscale.com).

## Projektstruktur

```
├── app/
│   ├── api/
│   │   ├── auth/login/route.ts    # POST – Login
│   │   ├── auth/logout/route.ts   # POST – Logout
│   │   └── orders/
│   │       ├── route.ts           # GET alle, POST neu
│   │       └── [id]/route.ts      # PATCH Status/Mitarbeiter
│   ├── dashboard/page.tsx         # Dashboard (geschützt)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Login-Seite
├── components/
│   ├── Header.tsx                 # Header mit Uhrzeit
│   ├── KitchenMonitor.tsx         # Bestellliste mit Filter
│   ├── LoginForm.tsx              # Login-Formular
│   ├── OrderCard.tsx              # Einzelne Bestellkarte
│   ├── OrderForm.tsx              # Neue Bestellung erstellen
│   └── StatsBar.tsx               # Statistik-Leiste
├── lib/
│   ├── auth.ts                    # JWT-Hilfsfunktionen
│   └── store.ts                   # In-Memory Datenspeicher
├── middleware.ts                  # Route-Schutz
└── types/index.ts                 # TypeScript-Typen
```

## Technologie-Stack

- **Next.js 14** – App Router, Server Components, API Routes
- **React 18** – Client Components mit Hooks
- **Tailwind CSS** – Dark-Theme UI
- **TypeScript** – Vollständig typisiert
- **jose** – JWT Authentication (Edge-kompatibel)
