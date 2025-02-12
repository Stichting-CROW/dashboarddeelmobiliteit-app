# Dashboard Deelmobiliteit app Releases

## Release 2025-02-11

- 🪄 Bij Beleidszones wordt zoom-niveau en kaartmidden nu ook opgeslagen in de URL, zodat je de precieze kaartpositie kunt delen
- 🪄 Servicegebieden-pagina is nu ook zichtbaar voor gastgebruikers

## Release 2025-02-10

- 🪄 Op [Beleidszones](https://dashboarddeelmobiliteit.nl/docs/Beleidszones/Zones_beheren.md)-pagina: 
  - Zoek op hubnaam of **adres**
  - Kaart zal naar de geselecteerde hub of adres zoomen

## Release 2025-01-08

- 🪄 Servicegebieden-pagina heeft nu ondersteuning voor meerdere aanbieders
- 🪄 Nieuwe documentatie-pagina: [Servicegebieden](https://dashboarddeelmobiliteit.nl/docs/Servicegebieden/_Introductie.md)

## Release 2025-01-06

- Toon autoaanbieders in de aanbiederslijst

## Release 2024-12-18

- Exporteer zones nu zowel als GeoPackage als KML (ipv alleen GeoPackage)

## Release 2024-12-05

- Nieuwe segmentatie parkeerduurfilters
  - Oud: <= 2 dagen, <= 4 dagen, <= 7 dagen, <= 14 dagen, >= 15 dagen
  - Nieuw: < 2 dagen, < 4 dagen, < 7 dagen, < 14 dagen, >= 14 dagen

## Release 2024-12-03

- 🏁 Sneller laden van historische parkeerdata op de kaart
  - Resultaat 1: binnen 30 seconden laden van parkeerdata voor elke datum in het verleden
  - Resultaat 2: 30 GB minder schijfruimte gebruikt voor park_events indexes in database
  - Technische details:
    - Indexes van tabel park_events worden enkel voor laatste x dagen bewaard
    - Voor oudere data wordt een nachtelijk geupdated 'view' bevraagd, waar parkeerdata opgeslagen is per dag
    - Code: [Maken materialized view + Verwijderen oude indexes](https://github.com/Stichting-CROW/dd-daily-report-aggregator/commit/d63597f8681075bf3c07e756c0368024ab8e3287#diff-b10564ab7d2c520cdd0243874879fb0a782862c3c902ab535faabe57d5a505e1R55)
    - Code: [Geupdated queries voor opvragen park_event_ids per datum](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-api/commit/bff348252a7549d87172d048cb156266146f8711)

## Release 2024-11-23

- ✨ Nieuwe lagenselectie-knop in de kaart, voor meer gebruikersgemak

## Release 2024-11-21

- ✨ Verbeterde UX voor de servicegebieden-tijdlijn:
  - Zie maximaal 1 wijziging per dag voor beter overzicht
  - Standaard ingezoomd op huidige week
  - Maximaal zoomniveau is gelimiteerd tot 'per dag' in plaats van 'per uur'
  - Meerdere datums bij elkaar worden gegroepeerd tot een cluster
  - Verticaal scrollen uitgeschakeld

## Release 2024-11-14

- Geupdate documentatie-pagina: Importeer zones (inclusief GeoPackage-template)
- Geupdate documentatie-pagina: Exporteer zones

## Release 2024-11-13

- ✨ Zone-beheerders kunnen nu zones importeren als GPKG-bestand (GeoPackage file)
- 🐛 Fix: Concept-verbodszones gebaseerd op bestaande, actieve verbodszones konden niet bewerkt worden -> opgelost

## Release 2024-11-03

- ✨ Zie sneller waar hubs staan op de kaart: Uitgezoomd zie je het [Mijksenaar hub-logo](https://www.zeeland.nl/sites/default/files/2022-07/2022-07-11%20Handboek%20identiteit%20hubs%20V1.pdf), ingezoomd de hubcontouren zelf
- ✨ Bekijk de datafeed-status van elke aanbieder in [dit statusoverzicht](https://dashboarddeelmobiliteit.nl/active_feeds)

## Release 2024-11-01

- ✨ Nieuw status-overzicht met active datafeeds geeft aan of de feed werkt en zo ja: wanneer de laatste data-import was. API end point: https://api.dashboarddeelmobiliteit.nl/dashboard-api/public/active_feeds ([commit](https://github.com/Stichting-CROW/dd-importer-v2/commit/e828924dcb78de696f368d28f7b161756f20c794))

- ✨ Custom integratie voor importeren van de Dott-datafeed, zodat we nu de nieuwe Dott MDS feed kunnen gebruiken. ([commit](https://github.com/Stichting-CROW/dd-importer-v2/commit/e828924dcb78de696f368d28f7b161756f20c794))

## Release 2024-10-31

- ✨ Nieuwe documentatie-pagina: **Data in het dashboard** 

## Release 2024-10-30

- ✨ Nieuwe documentatie-pagina: **Aanbod-kaart**

## Release 2024-10-03

- 🖌️ Betere mobiele weergave van hubstats

![Screenshot hub-stats op mobiel](https://private-user-images.githubusercontent.com/899234/373241007-c1f3bc74-239d-4901-a3b3-aa62cfe7ae58.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjc5NTY4MTAsIm5iZiI6MTcyNzk1NjUxMCwicGF0aCI6Ii84OTkyMzQvMzczMjQxMDA3LWMxZjNiYzc0LTIzOWQtNDkwMS1hM2IzLWFhNjJjZmU3YWU1OC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQxMDAzJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MTAwM1QxMTU1MTBaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03MTYxN2U5NDEyMzkwM2RkZTA0YTM0NWI4N2U2NWQwNGZjNTc2MTI4MzE4YTAyNTMwMDU0MmFlNTg5NjhlYmI3JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.jjeEH4U_rXBjHkYrvTIyJI6NeBfk8NUUg9lxp8oShV4)

## Release 2024-09-24

- ✨ Zoek op zone-naam op de Beleidszones-pagina, voor snel navigeren naar een hub of verbodsgebied

## Release 2024-09-14

- ✨ Nieuwe gebruikersdocumenentatie op /docs

## Release 2024-09-03

- 🐛 Fix: Bij Ontwikkeling werden datums op x-as niet juist getoond, indien een maatwerkzone werd geselecteerd

## Release 2024-08-22

- 🖌️ Test-feeds niet meer in grafieken
- Nieuwe MDS-feed CHECK & Felyx

## Release 2024-08-14

**Beleidszones**

- ✨ 'Exporteer zones' nu beschikbaar voor alle gebruikers, inclusief aanbieders

**Gebruikersbeheer**

- Organisatie-beheerders mogen alleen 'kan hubs beheren' recht uitgeven als zij tot een overheidsorganisatie behoren

## Release 2024-XX-XX

- Diverse verbeteringen sinds 9 mei 2024

## Release 2024-05-09: Beleidszones

**Algemeen**

- ✨ Luchtfoto geactualiseerd: nu [PDOK 2023 8cm](https://www.pdok.nl/-/nu-hoge-resolutie-luchtfoto-2023-bij-pdok) actief
- ✨ Nieuwe notificatie-stijl, voor notificaties als "Zone opgeslagen"

**Aanbod**

- ✨ Nieuwe indeling van parkeerduurfilter: <= 2 dagen, <= 4 dagen, <= 7 dagen, <= 14 dagen, >= 15 dagen

**Beleidszones**

- ✨ Nieuwe beleidszones-kaart
- ✨ Nieuwe beleidszones-tabel met filtermogelijkheden
- ✨ Teken zones in de conceptfase
- ✨ Stel in wanneer zones vastgesteld zijn, gepubliceerd worden voor implementatie en actief moeten zijn
- ✨ Multi-edit
- ✨ Multi-delete
- ✨ Import vanuit KML geupdate: zie hoeveel zones zijn toegevoegd of juist gewijzigd
- ✨ Export naar KML geupdate: nu mogelijkheid om selectie te exporteren
- ✨ 'Deel een link'-functie: Deel een link naar de huidige weergave
- ✨ Stel voor een hub in of het een virtuele hub is of niet
- ✨ Stel hub-capaciteit in middels een slider, pijltjes of een vrij-invulveld
- ✨ Stel een 'lokaal ID' in, voor extra herkenbaarheid van de hub
- ✨ Filter zones op zone-type (verbods- of analysezone, of hub)

## Release 2024-03-11

**Servicegebieden**

- 🪄 Toon laatste servicegebiedwijzigingen in tijdlijn
- 🪄 Toon in de tijdlijn welke historische versie op de kaart zichtbaar is
- 🪄 Klik door de versies in de tijdlijn heen
- 🪄 Zie op de kaart wat is veranderd (grijs=ongewijzigd, groen=toegevoegd, rood=verwijderd)

**Ontwikkeling** 

- 🪄 [Aggregeer](https://github.com/Stichting-CROW/dd-zone-stats-aggregator/commit/b2ccbdb9895db825796b976edbc58b7a404fefe0) ook microhubs-statistieken van hubs groter dan 100 voertuigen

**Ruwe data export**

- 🐛 Fix: [Exporteer](https://github.com/Stichting-CROW/dd-raw-data-exporter/commit/33d9f27ba853b8906bb3f67045e2be8d327005cd) ook parkeringen en verhuringen als geen voertuigtype bekend is

**Documentatie**

- 🪄 Nieuwe [API-documentatie 'Service Areas'](https://docs.dashboarddeelmobiliteit.nl/api_docs/service_areas/)

## Release 2024-03-05

**Ruwe data export**

- 🐛 Fix: Ruwe data export exporteerde _tot_ de einddatum ipv _t/m_ de opgegeven einddatum [#186](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues/186)

## Release 2024-02-27

**Aanbod / Verhuringen**

- 🐛 Fix: Admin users zagen altijd alle voertuigen op de kaart, ook als 1 specifieke plaats geselecteerd was

**Ontwikkeling**

- 🐛 Fix: Admin users zagen 2x te veel voertuigen bij Beschikbare voertuigen en Verhuringen, omdat niet gefilterd werd op 'Alleen Nederland' [#194](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues/194)
- 🐛 Fix: Verhuringen-per-dag misten per 20 februari (de databasemigratie). Dit is opgelost en grafiekdata is met terugwerkende kracht hergenereerd

## Release 2024-02-21: Servicegebieden-pagina online

**Servicegebieden**

- 🪄 De nieuwe Servicegebieden-pagina staat online, met de live servicegebieden van CHECK

## Release 2024-02-20: Sneller dashboard en nieuwe servicegebieden-API

**Infrastructuur**

We hebben een nieuwe databaseserver ingericht en de oude databases daarnaartoe verhuisd. Dit resulteert in:

- **Meer database-mogelijkheden** met PostgreSQL en postgis (gewenst voor de nieuwe servicegebieden-API)
- Sneller bevragen van de database = **een sneller Dashboard Deelmobiliteit**

De server die we hadden was 5 jaar oud. Er is nu een nieuwe server bij DigitalOcean met:
- Verdubbeling geheugen, schijfruimte en CPU: nu 16G geheugen, 320G schijfruimte en 8 core CPU
- Nieuwe versie van Python (versie 3.11). Python is veel sneller geworden de laatste tijd
- Nieuwe versie van Postgres: Postgres 15

De totale server-inrichting is nu als volgt:

1. Er is een database-server bij DigitalOcean, die draait:
- hoofddatabase met 'park events', verhuringen, organisaties, etc
- FusionAuth-database met gebruikeraccounts
- Redis, een in-memory database voor razendsnel opvragen data
- tel38, de Geospatial Database & Geofencing Server

2. Er is een database-server bij DigitalOcean voor TimescaleDB:
- timescaleDB is de PostgreSQL database specifiek voor 'time series and events'
- (later verplaatsen we deze database naar de andere database-server, voor kostenbesparing)

3. Er zijn 2 Kubernetes clusters met een load balancer ervoor:
- 2 nodes van elk 4G memory met 80G disk
- alle Dashboard Deelmobiliteit apps, API's en data-importscripts draaien hier
- (later zetten we Kubernetes clusters om naar Docker containers)

4. Bij Hetzner staat een dedicated server voor de loopafstandenfunctionaliteit en -API

5. Zowel bij DigitalOcean als Hetzner hebben we enkele testservers

**Servicegebieden**

- 🪄 Nieuwe servicegebieden-API is nu actief
  - Voorbeeld: `https://mds.dashboarddeelmobiliteit.nl/public/service_area?municipalities=GM0518&municipalities=GM0599&operators=check`

## Release 2024-02-13

Vandaag hebben we serveraanpassingen gedaan gerelateerd aan het gebruikersbeheer:

- FusionAuth (gebruikersbeheer-software) is geupgrade van versie 1.03 naar 1.48. Hierdoor heeft het meer mogelijkheden en is de software helemaal up to date.
- Er is een nieuwe databaseserver met meer capaciteit
- Er is een nieuwe applicatie-container voor FusionAuth
- Domeinnaam auth.deelfietsdashboard.nl is uitgefaseerd
- Domeinnaam auth.dashboarddeelmobiliteit.nl is de nieuwe URL voor FusionAuth

Het resultaat hiervan is:
- We gebruiken verouderde domeinnaam deelfietsdashboard.nl niet meer
- De database-server is sneller: daardoor binnenkort een snellere site ivm meer werkgeheugen + we kunnen doorgroeien ivm meer schijfruimte
- FusionAuth en de database zijn gescheiden van elkaar: daardoor een meer modulaire opzet, dat heeft voordelen
- FusionAuth heeft nieuwe mogelijkheden, die we mogelijk in de toekomst gaan gebruiken

De gebruiker merkt nog niets van deze update. Binnenkort kan de gebruiker het merken, als we de snellere databaseserver in gebruik gaan maken. FusionAuth (login-systeem) maakt hier al gebruik van.

## Release 2023-01-23

**Kaart**

- 🪄 Nieuwe parkeerduur filter in Aanbod page: >= 30 dagen [#178](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues/178)
- 🪄 Nieuw parkeerduurtotaal in infobox [#6](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-api/issues/6)<br />
![screenshot](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-api/assets/899234/a9510ffc-858a-48df-86f2-0c49cb7afb1c)
- 🪄 Bekijk vanaf nu meerdere gemeentes tegelijkertijd, als je toegang hebt tot meer dan 1 gemeente (provincies, aanbieders)
- ✨ Voor admins laadt de kaart met park events nu veel sneller, doordat niet meer gefilterd wordt op 'Toon alleen voertuigen in Nederland'
- 🖌️ 'Zones' nu alleen zichtbaar in de filterbar als een plaats is geselecteerd

**Aanbiederslijst**

- MoveYou heet nu GoAbout
- Bird verwijderd uit de lijst
- FlickBike verwijderd uit de lijst

**Organisatiebeheer**

- 🐛 Fix: Organisatietype "Andere overheid" niet zichtbaar in organisatielijst
- Update tekst: "Data-eigenaar van de volgende gemeentes" -> "Heeft overeenkomst voor de data in volgende gemeentegebied(en)"
- Verwijder 'Deel met organistatie' in tabblad "Data delen" (je kunt nog alleen delen met gebruikers)

**Gebruikersbeheer**

- Update welkomsmailtekst: "Leuk dat je aan de slag gaat met het Dashboard Deelmobiliteit!" -> "Welkom bij het Dashboard Deelmobiliteit!"

**Servicegebieden**

- 🪄 Servicegebieden van aanbieders worden in de database opgeslagen (via GBFS [geofencing_zones.json](https://gbfs.org/reference/#geofencing_zonesjson-added-in-v21)). De eerste aanbieder die servicegebieden levert is CHECK. Er worden incrementele updates van de servicegebieden opgeslagen, zodat je ook terug kunt in de tijd
- 🪄 Nieuwe API voor ophalen van servicegebieden uit de database

**Installatiescript**

- ✨ Nieuw database installatiescript, waardoor je afzonderlijk van elkaar de database en de Dashboard Deelmobiliteit app kunt initialiseren ([commit](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-docs/commit/e0b0d9922b7ddf475df9391c6b56f2d87d153499))
- 🐛 Fix: Redis database laadde geen bestaande data in als je de databaseserver zou stoppen, weggooien en opnieuw zou installeren ([commit](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-docs/commit/e0b0d9922b7ddf475df9391c6b56f2d87d153499#diff-7e126862da612efb636354ce53c9b23e7c390e68a5057b7642b3bb10c4be0720))

## Release 2023-12-14

**Over**

- 🪄 Voeg datakwaliteit-info toe aan Over-pagina [link](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues/180)
- 🪄 Voeg link naar docs toe aan Over-pagina [link](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues/181)
- "[Over](https://dashboarddeelmobiliteit.nl/over)" pagina toegevoegd aan top menu (daardoor Over en FAQ gemakkelijker vindbaar)

**API key beheer**

- 🪄 Voeg waarschuwing-tekst toe aan API-key beheer: Delen van API-key geeft toegang tot data [link](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues/182)

**Organisatiebeheer**

- 🪄 Beheerder kan nu elke gemeente als datagebied toekennen aan een organisatie (Voorheen konden alleen gemeenten met aanbod van voertuigen worden toegoegd) [link](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues/177)
- 🪄 Beheerder kan nu datagebieden toekennen aan organisatietype "ANDERE OVERHEID"

**Documentatie-site**

- 🪄 Nieuwe documentatiepagina: '[How to add a feed](https://docs.dashboarddeelmobiliteit.nl/start/how_to_add_a_feed/)' (We hebben de [hr-data docs](https://docs.crow.nl/deelfietsdashboard/hr-dataspec/#how-to-offer-vehicle-type-in-gbfs-deprecated) toegevoegd aan de nieuwe documentatie-site) [link](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-docs/issues/2)
- 🪄 In data feed docs, maak onderscheid tussen data voor monitoring en sturen van aanbieders [link](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-docs/issues/3)

## Release 2023-12-06

**Algemeen**

- 🪄 Toon voertuig-id aan _iedere_ ingelogde gebruiker (bijvoorbeeld in voertuig-popup)

**Exporteer**

- 🪄 Maak Parkeertelling beschikbaar voor alle gebruikers met 'download ruwe data' rechten (niet meer alleen voor admins)

## Release 2023-12-05

**Aanbod**

- 🪄 Nieuwe parkeerduur-filter: _> 30 dagen_
