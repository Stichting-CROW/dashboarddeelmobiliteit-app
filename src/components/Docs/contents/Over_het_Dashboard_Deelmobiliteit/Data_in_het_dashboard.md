Op deze pagina lees je wat voor data er in het Dashboard Deelmobiliteit wordt getoond.

## Typen data

Dit zijn de typen data die het Data Exchange Platform verzamelt en het Dashboard Deelmobiliteit toont:

- [Aanbod](https://dashboarddeelmobiliteit.nl/docs/Aanbod/Aanbod-kaart.md) van geparkeerde voertuigen in de publieke ruimte
  - Per plaats / stadsdeel / wijk / maatwerkzone
  - Maatwerkzone-statistieken geaggregeerd per aanbieder per periode
    - 5 minuten / 15 minuten / 1 uur / dag / week / maand
- Verhuringen met begin- en eindlocatie
- Verhuringen als [herkomst-bestemmingsmatrix](/docs/HB-relaties)
- Servicegebieden van aanbieders inclusief historie
- [Beleidszones](/docs/Beleidszones) door gemeentes beheerd (verbodszones, hubs)
- Standaardrapportage met data zoals verhuringen per voertuig per dag, per stadswijk

![Zone-aanbod geaggregeerd per 5 minuten](https://dashboarddeelmobiliteit.nl/components/Docs/Over_het_Dashboard_Deelmobiliteit/aanbod_per_5min.png)

## Hoe ontvangt dit Data Exchange Platform de data?

Aanbieders kunnen een datafeed online aanbieden. Die datafeed met alle voertuigen, verhuringen en servicegebieden lezen wij elke 30 seconden in.

We normaliseren de data, zodat voor elke aanbieder precies dezelfde data en velden wordt opgeslagen. Dit is handig bij analyses; zo hoef je niet voor elke aanbieder een andere analyse te doen.

We aggregeren de data op diverse manieren, bijvoorbeeld op zo'n manier dat je snel grafieken kunt opvragen met bezetting op 5-minuten-niveau.

Op de pagina [dashboarddeelmobiliteit-datakwaliteit](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit?tab=readme-ov-file#dashboard-deelmobiliteit-data-quality) staat een lijst met de aanbieders die nu ondersteund worden, met de datafeed die zij aanbieden.

## Welke datastandaarden worden ondersteund?

Hoewel het Data Exchange Platform verschillende datastandaarden ondersteunt, geven we er de voorkeur aan dat aanbieders hun voertuigdata aanleveren conform MDS. Dit geeft ook de aanbieders de meeste zekerheid dat de koppeling in de toekomst goed functioneert. Zie de details in deze [specificatie](https://docs.dashboarddeelmobiliteit.nl/data_feeds/for_monitoring/).

Voor analyses gebruiken we:

```
MDS  /vehicles         | Voor registreren van het aanbod
MDS  /trips            | Voor registreren van verhuringen
GBFS /geofencing_zones | Voor registreren van servicegebieden
```

<br />Voor sturing gebruiken we:

```
MDS  /stops            | De microhubs inclusief metadata
MDS  /policies         | Ingestelde regels per microhub
MDS  /geographies      | Geografische randen per microhub
```

## Wat is de datakwaliteit?

Op de pagina [dashboarddeelmobiliteit-datakwaliteit](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit#dashboard-deelmobiliteit-data-quality) houden wij bij wat de datakwaliteit is per aanbieder. Voor elke aanbieder staat er in het totaaloverzicht een score op 5 kwaliteitseigenschappen. Als alle 5 eigenschappen goed zijn, is de datakwaliteit van de aanbieder 🟢 Perfect.

Het is mogelijk om per aanbieder de datakwaliteit-geschiedenis in te zien door te klikken op de aanbieder.

Per jaar is er een overzicht van de belangrijkste datakwaliteit-issues, zie jaaroverzicht [2022](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/blob/main/year-overview/2022.md), [2023](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/blob/main/year-overview/2023.md) en [2024](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/blob/main/year-overview/2024.md).
