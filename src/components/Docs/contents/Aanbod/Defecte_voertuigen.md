Op de [Aanbod-kaart](https://dashboarddeelmobiliteit.nl/map/park) zie je eenvoudig welke voertuigen niet-operationeel ('defect') zijn.

Klik in het linkermenu op de knop **Defecte voertuigen** om alleen defecte voertuigen op de kaart te tonen.

Bekijk de voertuigiconen op de kaart: als er een uitroepteken bij een voertuig staat is/was het een defect voertuig op de geselecteerde datum/tijd.

## Screenshots

**Knop: toon defecte voertuigen**<br />
![Knop: toon defecte voertuigen](https://files.dashboarddeelmobiliteit.nl/docs/Aanbod/Defecte_voertuigen/toon_defecte_voertuigen.png)

**Voertuig-icoon met uitroepteken indien defect**<br />
<img alt="Voertuig-icoon met uitroepteken indien defect" src="https://files.dashboarddeelmobiliteit.nl/docs/Aanbod/Defecte_voertuigen/defect_voertuig.png" width="100" />

## Databronnen

De aanbodsdata wordt aangeleverd door de verschillende aanbieders. Op de pagina [datakwaliteit](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit?tab=readme-ov-file#dashboard-deelmobiliteit-data-quality) staat een lijst met aanbieders en de datafeed die zij aanleveren.

Wij bevragen de datafeeds elke 30 seconden en slaan de aanbodsdata op in ons Data Exchange Platform. In het Dashboard Deelmobiliteit kun je de data visueel weergeven. Je kunt de aanbodsdata ook zelf ophalen middels de beschikbare [API's](https://dashboarddeelmobiliteit.nl/docs/APIs) voor je eigen analyses, of voor integratie in je eigen software / andere softwarepakketten.

## Hoe het technisch werkt

Het Dashboard Deelmobiliteit slaat in de database op:
- Park events
- Per park event: 0 of meer 'non_operational' events

Er kan dus een periode zijn waarin een voertuig onverhuurd in de publieke ruimte staat: maandag t/m vrijdag. Als op dinsdag het voertuig als 'non_operational' wordt gekenmerkt door de aanbieder, dan blijft de start- en eindtijd van het park event gelijk. Er wordt daarnaast bijgehouden dat het voertuig bijvoorbeeld van dinsdag t/m vrijdag de status 'non_operational' had.

De meeste aanbieders bieden een MDS-feed aan (`/vehicles`), zoals gespecificeerd in het Nederlands Profiel voor datadelen deeltweewielers. Sommige aanbieders bieden nog een GBFS-feed aan, en er is zelfs nog 1 TOMP-feed actief.

Op deze manier wordt de 'non_operational' status bepaald:

- Bij MDS v1: `non_operational` als `last_vehicle_state == "non_operational"`.
- Bij MDS v2: `non_operational` als `last_event.vehicle_state == "non_operational"`.
- Bij GBFS v1: `non_operational` als `is_disabled == 1`
- Bij TOMP: `non_operational` als `isDisabled == true`

In de MDS-standaard is [gedocumenteerd](https://github.com/openmobilityfoundation/mobility-data-specification/blob/main/modes/vehicle_states.md#mobility-data-specification-vehicle-states) wanneer een voertuig de status 'non_operational' moet hebben:

> **non_operational**<br />
> Not available for hire. Examples include: vehicle has low battery, or currently outside legal operating hours.

## Vragen?

Vragen over deze functionaliteit? Mail [info@dashboarddeelmobiliteit.nl](mailto:info@dashboarddeelmobiliteit.nl?subject=Defecte voertuigen)
