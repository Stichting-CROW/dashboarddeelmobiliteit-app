Bij Zones zie je alle maatwerkzones op het scherm: de analysezones, parkeerzones en verbodszones. Je kunt zones handmatig toevoegen of importeren middels een GeoPackage-bestand. Hieronder lees je hoe dit werkt.

## Zones importeren

1. Zet alvast een GeoPackage-bestand klaar met een losse polygon per zone, en metadata zoals de naam van de zone
2. Ga naar [Zones](/zones)
3. Zorg dat je de **Concept**-fase actief hebt
4. Open de tabel via knop **Tabel openen**
5. Klik op de knop "Importeer", in de rechtsbovenhoek
6. Selecteer het .gpkg-bestand en klik op **Importeer zones**<br /><br />
![img](https://dashboarddeelmobiliteit.nl/components/Docs/Zones/import-zones-from-geopackage-modal.png)
7. De zones zijn nu geimporteerd!

## Demo

<a href="https://www.linkedin.com/posts/sven-boor_geopackages-in-het-dashboarddeelmobiliteit-activity-7262776076811001857-v0XY/" target="_blank" rel="external">Bekijk op LinkedIn een video-demo</a> van de exporteer- en importeer-functionaliteit.

## Handig: een GeoPackage-template met voorbeeldzones

Download [dit gpkg-bestand](https://drive.google.com/file/d/1xrQSFHN_p5YQXl-mfH7sOsLNSfYco7No/view?usp=sharing
) als voorbeeld-template van hoe zones kunnen worden aangeleverd. In het bestand zie je per zone alle attributen die je kunt meegeven, zoals de naam en het interne ID van de zone. Alle velden die beginnen met een _ worden genegeerd en het heeft daarom geen zin die in te vullen. Zodra je de zones geïmporteerd hebt wordt een deel van deze velden automatisch gevuld. 

## Tips bij het importeren van zones

- Zorg dat elke zone een naam heeft, dan is die gemakkelijk herkenbaar
- Zorg dat elke zone een losse polygon is
- Vul geen velden in die beginnen met een _ in het GIS-programma
