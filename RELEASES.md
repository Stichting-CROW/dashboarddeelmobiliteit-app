# Dashboard Deelmobiliteit app Releases

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
