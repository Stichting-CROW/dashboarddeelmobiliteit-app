Wil je HB-matrices zien? Ga dan naar de **Verhuringen**-pagina en klik bij lagen op **HB**.

## Algemene werking HB-matrices

De HB-matrices worden gegenereerd op basis van de verhuringen-data.

De data is geaggregeerd in periode's van 4 uur. Data wordt alleen getoond in de gebieden waarin minimaal 4 verhuringen waren.

## Hoe filter je de data?

Je kunt de data als volgt filteren:

- Stel een periode in (datum tot datum)
- Stel de werkdag(en) in waarvan je data wilt zien
- Stel de tijdvakken in die je wilt zien
- Stel de modaliteiten in

Je kunt deze opties instellen:

- Bepaal detailniveau: wijk, H3 niveau 7 of H3 niveau 8
- Toon alleen de herkomsten, of alleen de bestemmingen

## Voorbeeldbevragingen

1. Geef alle H3-8 relaties vanaf ZoneA, voor Den Haag, voor de maand juli, en dan alleen de werkdagen tijdens spitstijden (= 6-10, 14-18 uur)

2. Er is een wedstrijd in De Kuip. Waar kwamen de mensen vandaan, voordat ze naar De Kuip gingen?

- Kies 1 dag: datum van wedstrijd
- Kies 1 of meerdere tijdvensters. Was de wedstrijd afgelopen om 17 uur, selecteer dan tijdvensters 14-18 en 18-22.
- Kies 1 vertrekzone: Gebied rondom De Kuip (1/meerdere vertrekzones)
- Kies "Voeg 2 aanklikte vertrekzones samen en toon de som"

## Bediening van de HB-kaart

In de filterbalk kun je opgeven voor welke periode je data wilt zien, voor welke dagen/tijden/voertuigtypen en op welk detailniveau. Als laatst geef je aan: wil je bestemmingen of herkomsten zien.

Heb je bepaald wat je wilt zien, bepaal dan vervolgens middels een klik of tap van welk gebied je de herkomst-bestemmingsmatrix wilt zien. Het actieve gebied heeft een blauwe rand.

Je kunt meerdere gebieden tegelijkertijd actief maken middels Ctrl+klik. Als er meerdere gebieden tegelijkertijd actief zijn, zie je de som van voertuigen die van/naar dat samengestelde gebied vertrokken.

Wissel in de filterbalk gemakkelijk tussen herkomsten en bestemmingen.

Een gemeente kan HB-matrices zien van/naar een gebied dat zich binnen de gemeentegrenzen bevindt.

## Privacy

Voor het beschermen van de privacy van individuele gebruikers maken we gebruik van een minimaal aantal voertuigen dat uit een zone vertrokken moet zijn voordat we deze tonen. In ons initiële ontwerp kiezen we voor minstens 4 voertuigen. Dit doen we in combinatie met een minimale te bevragen tijdsperiode van 4 uur. Op deze manier is alleen te achterhalen naar welke zone een persoon toe reist als je weet dat een specifiek persoon in die periode vertrokken is en je weet waar de 4 andere personen die in die periode vertrokken zijn naar toe zijn gereisd. Dat is geen data die op eenvoudige wijze op grote schaal te combineren valt aan externe databronnen.

## Wat is een H3 grid?

Het doel van een herkomst-bestemmingsmatrix is om losse verplaatsingen die ongeveer naar eenzelfde gebied gaan te clusteren. Er zijn verschillende manieren om dat te doen, je kunt uitgaan van administratieve zones (bijvoorbeeld CBS wijkgrenzen of gemeentegrenzen). Er zijn ook diverse andere referentiesystemen gebaseerd op wiskunde die je kunt gebruiken om data geografisch te aggregeren. Onze voorkeur gaat in dit project uit naar zo'n soort grid-systeem, omdat administratieve zones arbitrair getrokken zijn waardoor er groot verschil kan zit in de grootte van zulke zones.

Bij gebruik van H3 heb je verschillende detailniveaus, alle zones zijn even groot en het is efficient in opslag en verwerking. We gebruiken zowel het H3-grid als CBS-wijken voor het visualiseren van de HB-relaties.

____
<br />

&raquo; **[Verhuringen](/map/rentals)**