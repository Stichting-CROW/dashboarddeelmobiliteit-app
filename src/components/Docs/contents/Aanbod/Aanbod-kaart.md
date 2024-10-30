De [Aanbod-kaart](https://dashboarddeelmobiliteit.nl/map/park) toont het aanbod van deelvoertuigen op een tijdstip naar keuze. Een kleurcode geeft tevens aan hoe lang het voertuig te huur staat.

## Screenshot

![Aanbod-kaart](https://dashboarddeelmobiliteit.nl/components/Docs/Aanbod/aanbod-kaart.png)

## Functionaliteiten

### Bekijk de voertuigen

![Voertuigweergave](https://dashboarddeelmobiliteit.nl/components/Docs/Aanbod/kaart-voertuig.png)

Selecteer bij _Lagen_ de laag **Voertuigen** om alle individuele voertuigen te zien op de kaart.

De kleur van de grote cirkel geeft aan hoe lang het voertuig al geparkeerd staat.

De kleur van de kleine circel is de aanbieder-kleur.

Als je klikt op een voertuig zie je:
- Naam van de aanbieder
- Het voertuigtype (bijvoorbeeld: fiets)
- Hoe lang het voertuig stil staat
- Datum/tijd waarop het voertuig geparkeerd werd
- Het voertuig-ID (alleen voor admins)
- Een link naar de site van de aanbieder

### Bekijk voertuigclusters

![Clusterweergave](https://dashboarddeelmobiliteit.nl/components/Docs/Aanbod/kaart-clusters.png)

Selecteer bij _Lagen_ de laag **Clusters** om voertuigen gegroepeerd te zien in clusters. Dit toont je snel hoeveel voertuigen er in elk gebied staan.

### Bekijk een heatmap

![Heatmap-weergave](https://dashboarddeelmobiliteit.nl/components/Docs/Aanbod/kaart-heatmap.png)

Selecteer bij _Lagen_ de laag **Heat map** om een heat map te zien. Waar het donkerrood is staan er veel voertuigen, waar het oranje is minder en waar het geel is staan weinig voertuigen. Je ziet zo snel wat de intensiteit is van geparkeerde voertuigen in elk gebied.

### Bekijk aantal voertuigen met bepaalde parkeerduur

![Laagselectie en meta-info](https://dashboarddeelmobiliteit.nl/components/Docs/Aanbod/meta-laag-en-info.png)

Als uitschuifbare 'tabjes' zijn er het laagselectiemenu en de info-tab met een samenvatting van hoeveel voertuigen er hoe lang stil staan. 

Bekijk in de info-tab de parkeerduren voor de hele stad of voor elke afzonderlijk geselecteerde zone.

### Filter op datum/tijd

![Selecteer datum/tijd](https://dashboarddeelmobiliteit.nl/components/Docs/Aanbod/filter-datetime.png)


Standaard zie je de kaartweergave met alle voertuigen die op dit moment geparkeerd staan.

Je kunt ook een datum/tijd in het verleden selecteren. Dit doe je met de "Datum/tijd"-selectie.

Wil je weer het huidige aanbod zien, ga dan naar het nu met een klik op de knop met de klok.

### Filter op plaats/zone

![Selecteer datum/tijd](https://dashboarddeelmobiliteit.nl/components/Docs/Aanbod/filter-gebied.png)

Als je toegang hebt tot meerdere plaatsen, kun je bij **Plaats** de plaats selecteren waar je voertuigen van wilt zien.

Binnen een plaats zijn vaak meerdere zones, bijvoorbeeld de stadsdelen, wijken, en zelf toegevoegde "maatwerkzones". Je kunt optioneel 1 of meerdere zones selecteren waarvan je de voertuigen wilt zien. De rest van de voertuigen wordt dan verborgen.

### Filter op parkeerduur

![Filter parkeerduur](https://dashboarddeelmobiliteit.nl/components/Docs/Aanbod/filter-duur.png)

Een kleurcode geeft aan hoe lang het voertuig te huur staat. Met de parkeerduur-filter kun je filteren op parkeerduur. Toon hiermee bijvoorbeeld alleen voertuigen die langer dan 14 dagen geparkeerd staan.

### Filter op voertuigtype

![Filter voertuigtype](https://dashboarddeelmobiliteit.nl/components/Docs/Aanbod/filter-type.png)

Als aanbieders in hun data-feed met voertuigen aangeven welk voertuigtype elk voertuig heeft, kun je hierop filteren.

De mogelijke filters zijn momenteel: fiets, bakfiets, scooter en auto.

### Filter op aanbieder

![Filter aanbieder](https://dashboarddeelmobiliteit.nl/components/Docs/Aanbod/filter-aanbieder.png)

Met de aanbieders-filter kun je alleen voertuigen tonen van een specifieke (set aan) aanbieder(s).

## Databronnen

De aanbodsdata wordt aangeleverd door de verschillende aanbieders. Op de pagina [datakwaliteit](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit?tab=readme-ov-file#dashboard-deelmobiliteit-data-quality) staat een lijst met aanbieders en de datafeed die zij aanleveren.

Wij bevragen de datafeeds elke 30 seconden en slaan de aanbodsdata op in ons Data Exchange Platform. In het Dashboard Deelmobiliteit kun je de data visueel bekijken. Je kunt de aanbodsdata ook zelf ophalen middels de beschikbare [API's](https://dashboarddeelmobiliteit.nl/docs/APIs) voor je eigen analyses, of voor integratie in je eigen software / andere softwarepakketten.
