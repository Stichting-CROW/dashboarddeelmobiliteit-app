# Handleiding: Bewerk vergunningseisen-dialog

Deze handleiding beschrijft het functioneren van de dialog voor het beheren van vergunningseisen (KPI-limieten) per aanbieder, voertuigtype en gemeente.

---

## 1. Overzicht van de dialog

De dialog **Bewerk vergunningseisen** opent wanneer je een vergunning/aanbieder-selectie opent. Bovenaan zie je:

- **Provider** (aanbieder) – logo en naam, klikbaar om terug te kiezen
- **Voertuigtype** – icoon en naam, klikbaar om het voertuigtype te wijzigen

Daaronder een link naar het Prestaties aanbieders-dashboard voor actuele prestaties.

### Tabs

| Tab | Beschrijving |
|-----|--------------|
| **Invoer** | Hoofdwerkruimte voor het beheren van limieten |
| **KPI definities** | Overzicht van alle KPI's met type grens, eenheid, beschrijving en definitie |
| **Test** | *Verborgen functie, alleen zichtbaar te maken in development* – gebruikersmodus voor testen van create/update/delete (zie §4) |

### Invoer-modus: Tabel vs. formulier

Op de Invoer-tab kun je wisselen tussen twee weergaven:

- **Tabelweergave** (icoon Tabel): Overzicht van alle records per datum en KPI, met inline bewerken en de mogelijkheid om nieuwe grenswaarden toe te voegen
- **Formulierweergave** (icoon Formulier): Formulier voor één specifieke datum met navigatie (pijlen) naar vorige/volgende records

De wisselknop (icoon) staat rechts naast de tabstrip.

---

## 2. Werkingslogica

### 2.1 Datum-intervallen

Limieten werken met **effectieve datums** en optionele **einddatums**:

- Elk record heeft een `effective_date` (ingangsdatum)
- Het interval loopt van `effective_date` tot `end_date` (of tot de `effective_date` van het volgende record)
- Het laatste record heeft geen einddatum (actief t/m onbepaald)

De tekst boven het formulier toont:
- *"Deze configuratie is actief van [datum] tot [datum]"* – als er een volgend record is
- *"Deze configuratie is actief vanaf [datum]"* – voor het laatste record

### 2.2 Standaarddatum vormmodus

Bij het openen van het formulier wordt de datum ingesteld op:

- Het **laatste record** waarvan `effective_date ≤ vandaag`, of
- Het **eerste record** als er geen record op of vóór vandaag is

### 2.3 Create vs. Update

| Situatie | Actie | API |
|----------|-------|-----|
| **Bewerken van bestaand record** | `effective_date` = datum van het huidige record | **UPDATE** (PUT) – `geometry_operator_modality_limit_id` wordt meegestuurd |
| **Nieuw record** | Nieuwe datum of datum zonder bestaand record | **CREATE** (POST) – geen ID in de payload |

Regel: **ID wordt alleen meegestuurd bij bewerken van hetzelfde record** (zelfde `effective_date`). Bij een nieuwe datum wordt altijd een nieuw record aangemaakt (POST).

### 2.4 Lege waarde = uitgeschakelde limiet

- Een **leeg invoerveld** betekent dat de KPI-limiet **inactief** is voor die datum
- Alleen KPI's met een ingevulde numerieke waarde zijn actief
- In de tabel wordt een inactieve KPI weergegeven als **"---"** (vet) als er op die datum wel een record bestaat

### 2.5 Actieve datumrange

In de tabel krijgen rijen binnen de **actieve periode** (de periode waar vandaag in valt) een donkerdere achtergrond zodat de huidige configuratie snel herkenbaar is.

---

## 3. Bevoegdheden: admin vs. normaal

Er zijn twee modi: **admin** en **normaal**.

| Modus | Wie | Toegestane acties |
|-------|-----|-------------------|
| **Admin** | Gebruikers met `is_admin` of `ORGANISATION_ADMIN` | Alle datums bewerken (verleden en toekomst) |
| **Normaal** | Overige gebruikers | Alleen **toekomstige** datums toevoegen of wijzigen |

Bij pogingen om datums uit het verleden te wijzigen zonder admin-rechten: *"Alleen toekomstige datums kunnen worden gewijzigd."*

De API gebruikt een parameter `allowChange` om dit te controleren:
- `allowChange = true` (admin): geen restrictie op `effective_date`
- `allowChange = false` (normaal): `effective_date` moet ≥ vandaag zijn

---

## 4. Testmodus

De Test-tab is **standaard verborgen** en bedoeld voor ontwikkelaars/testers om create-, update- en delete-operaties te toetsen.

### 4.1 Test-tab tonen/verbergen

- **Shift+klik** op de tabel/formulier-toggle (icoon rechts naast de tabstrip) om de Test-tab te tonen of te verbergen
- **Let op:** Verborgen functie, alleen zichtbaar te maken in development – niet beschikbaar in productie

### 4.2 Doel van de Test-tab

- Snel testen van Insert, Update en Delete zonder handmatig door de Invoer-tab te gaan
- Controleren of de API correct reageert op verschillende operaties
- Grafiekweergave van limietverloop over de testdatums

### 4.3 Testdatums

De Test-tab gebruikt vaste datums: **2026-01-01**, **2026-04-01**, **2026-07-01** en **2026-10-01**.

### 4.4 Knoppen per datum

| Knop | Wanneer zichtbaar | Actie |
|------|-------------------|-------|
| **Insert** | Geen record op die datum | Maakt een nieuw record aan met willekeurige KPI-waarden (1–100) |
| **Random** | Er is al een record | Past het bestaande record aan: willekeurige KPIs toevoegen, wijzigen of uitschakelen |
| **Delete** | Er is al een record | Verwijdert het record; het vorige record wordt verlengd tot de `end_date` van het verwijderde record |

### 4.5 Overige acties

- **Alles wissen**: Verwijdert alle records voor de huidige context (aanbieder, voertuigtype, gemeente)
- **Tabel / Grafiek**: Schakelt tussen tabelweergave en lijnengrafiek van de KPI-waarden over de testdatums

### 4.6 Bevoegdheden in de Test-tab

In de Test-tab is `allowChange` altijd `true` – alle operaties zijn toegestaan, onafhankelijk van admin-status. Dit is uitsluitend bedoeld voor testdoeleinden.

---

## 5. Delete in de productie-interface

In de **Invoer-tab** (tabel en formulier) is er **geen delete-knop** voor records. Verwijderen kan alleen via de Test-tab (voor testdoeleinden).

De logica voor delete (zoals gebruikt in de Test-tab):

1. Zoek het vorige record
2. Verleng de `end_date` van het vorige record tot de `end_date` van het te verwijderen record (of tot de `effective_date` van het volgende record)
3. Voer een PUT uit op het vorige record
4. Voer een DELETE uit op het te verwijderen record

---

## 6. KPI definities-tab

De tab **KPI definities** toont een overzicht van alle KPI's met:

- **KPI** – naam
- **Type grens** – bovengrens of ondergrens
- **Eenheid** – nummer of percentage
- **Beschrijving** – korte omschrijving
- **Definitie** – formele definitie

Dit is alleen-lezen – geen bewerking mogelijk.

---

## 7. Samenvatting voorwaarden Create / Update / Delete

| Operatie | Voorwaarde | Opmerking |
|----------|------------|-----------|
| **Create** | Nieuwe datum of geen bestaand record op die datum | POST, geen ID |
| **Update** | Bestaand record bewerken (zelfde `effective_date`) | PUT, met `geometry_operator_modality_limit_id` |
| **Delete** | Alleen in Test-tab | Verleng vorige record, daarna DELETE |

**Datumrestrictie (Invoer-tab):**

- **Admin**: alle datums
- **Normaal**: alleen `effective_date ≥ vandaag`

---

## 8. Technisch: Record-management-abstraktie

De module `permitLimitsOperations` (`src/components/PrestatiesAanbieders/permitLimitsOperations.ts`) bevat pure functies die het beheer van limietrecords abstraheren. Veel acties vereisen **meerdere record-updates** (bijvoorbeeld het invoegen van een datum midden in een periode: eerst het vorige record inkorten met een nieuwe `end_date`, dan een nieuw record aanmaken). De module centraliseert deze logica en retourneert een geordende lijst van geplande operaties (PUT/POST). De UI-componenten en de Test-tab roepen deze functies aan; de daadwerkelijke API-calls gebeuren op een hoger niveau.

**Belangrijkste types en functies:**

- **`OperationContext`** – Context (operator, geometry_ref, form_factor, propulsion_type) voor alle operaties
- **`PlannedOp`** – Geplande API-operatie: `{ type: 'PUT' | 'POST', record }`
- **`findRecordContainingDate(history, date)`** – Bepaalt welk record een datum bevat; interval: `[effective_date, end_date)`
- **`planSetKpiAtDate(history, date, kpiKey, value, ctx)`** – Plan PUT/POST voor een enkel KPI bij datum D (waarde of `'absent'`); splitst records indien D binnen een interval valt
- **`planSetFullRecordAtDate(history, date, limits, ctx)`** – Plan PUT/POST voor een volledig record met alle KPIs; kiest POST (nieuw), PUT (in-place) of split (PUT + POST)
- **`planDeleteRecord(history, recordToDelete)`** – Verlengt het vorige record tot de `end_date` van het te verwijderen record; de aanroeper voert daarna PUT en DELETE uit

De logica is **puur** (geen side effects): de module retourneert alleen datastructuren; de API-invulling blijft buiten de module. De datum-intervallen zijn gesorteerd op `effective_date`; `end_date` wordt afgeleid van het volgende record of expliciet gezet.
