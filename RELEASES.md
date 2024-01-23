# Dashboard Deelmobiliteit app Releases

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

- Update welkomsmailmail-tekst: "Leuk dat je aan de slag gaat met het Dashboard Deelmobiliteit!" -> "Welkom bij het Dashboard Deelmobiliteit!"

**Servicegebieden**

- 🪄 Servicegebieden van aanbieders worden in de database opgeslagen (via GBFS [geofencing_zones.json](https://gbfs.org/reference/#geofencing_zonesjson-added-in-v21)). De eerste aanbieder die servicegebieden levert is CHECK. Er worden incrementele updates van de servicegebieden opgeslagen, zodat je ook terug kunt in de tijd
- 🪄 Nieuwe API voor ophalen van servicegebieden uit de database

**Installatiescript**

- ✨ Nieuw database installatiescript, waardoor je afzonderlijk van elkaar de database en de Dashboard Deelmobiliteit app kunt initialiseren ([commit](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-docs/commit/e0b0d9922b7ddf475df9391c6b56f2d87d153499))
- 🐛 Fix: Redis database laadde geen bestaande data in als je de databaseserver zou stoppen, weggooien en opnieuw zou installeren ([commit](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-docs/commit/e0b0d9922b7ddf475df9391c6b56f2d87d153499#diff-7e126862da612efb636354ce53c9b23e7c390e68a5057b7642b3bb10c4be0720))

## Release 2023-12-06

**Algemeen**

- 🪄 Toon voertuig-id aan _iedere_ ingelogde gebruiker (bijvoorbeeld in voertuig-popup)

**Exporteer**

- 🪄 Maak Parkeertelling beschikbaar voor alle gebruikers met 'download ruwe data' rechten (niet meer alleen voor admins)

## Release 2023-12-05

**Aanbod**

- 🪄 Nieuwe parkeerduur-filter: _> 30 dagen_
