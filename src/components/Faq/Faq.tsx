import { Link, useLocation } from "react-router-dom";
import Section from '../Section/Section';
import {marked} from 'marked'
import { useEffect, useState } from "react";

function Faq() {
  const [pathName, setPathName] = useState(document.location.pathname);

  // Store window location in a local variable
  let location = useLocation();
  useEffect(() => {
    setPathName(location ? location.pathname : null);
  }, [location]);

  return (
    <div className="
      Faq
    ">
      <h1 className="
        text-4xl
        font-bold
      ">
        FAQ
      </h1>

      <div className="my-5">
        <Section title="Wat zijn de nieuwste functionaliteiten?">
          <div dangerouslySetInnerHTML={{ __html: marked.parse(`
De nieuwste functionaliteiten vind je hier:
- **[Dashboard Deelmobiliteit app Releases](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/blob/main/RELEASES.md#dashboard-deelmobiliteit-app-releases)**
          `) }}
          />
        </Section>
        <Section title="Ruwe data downloaden">
          <div dangerouslySetInnerHTML={{ __html: marked.parse(`
Via het Dashboard Deelmobiliteit kun je data inzien, en ook de ruwe data downloaden. Hierdoor kun je zelf analyses doen op de data, of eigen visualisaties maken.

Alleen als je downloadrechten hebt, kun je ruwe data downloaden. Meestal heeft 1 persoon binnen de gemeente downloadrechten.

Heb je geen downloadrechten en wil je deze wel hebben? Vraag deze dan aan via [info@dashboarddeelmobiliteit.nl](mailto:info%40dashboarddeelmobiliteit.nl).

## Zo download je de ruwe data

1. Ga naar **[Export](https://dashboarddeelmobiliteit.nl/export)**
2. Klik op **Download ruwe data**
3. Selecteer de periode waarvan je ruwe data wilt downloaden
4. Klik op de knop **Vraag ruwe data export**

Er wordt nu een mail naar je verstuurd, met daarin de link naar het ZIP-bestand met alle ruwe data.

## Welke data is beschikbaar?

Als je een ruwe data export opvraagt, ontvang je 2 bestanden in een ZIP:

1. park_events.csv
2. trips.csv

Je kunt de bestanden openen als spreadsheet.

### park_events

De 'park events' zijn alle periode's waarin voertuigen stil stonden in de publieke ruimte, onverhuurd.

Elke rij bevat de volgende waardes:

<small>

- **Naam aanbieder**<br />"bolt"
- **Uniek voertuig-ID**<br />"bolt:791-614"
- **Latitude**<br />"51.832037"
- **Longitude**<br />"5.779984"
- **Starttijd voertuig onverhuurd geparkeerd**<br />"2023-01-08 00:00:18.323965"
- **Einddtijd voertuig onverhuurd geparkeerd**<br />"2023-01-15 16:26:11.588491"
- **Uniek ID**<br />"49881491"

</small>

### trips

De 'trips' zijn alle periode's waarin een voertuig verhuurd werd: begin verhuur tot eind verhuur.

Elke rij bevat de volgende waardes:

<small>

- **Naam aanbieder**<br />"bolt"
- **Uniek voertuig-ID**<br />"bolt:791-614"
- **Latitude startlocatie**<br />"51.832037"
- **Longitude startlocatie**<br />"5.779984"
- **Latitude eindlocatie**<br />"51.832037"
- **Longitude eindlocatie**<br />"5.779984"
- **Verschil in afstand in meters, tussen begin- en eindpunt**<br />"2642.49416801"
- **Verhuurduur in seconden**<br />"1560.572472"

</small>
          `) }}
          />
        </Section>
        <Section title="De HB-kaart">
          <div dangerouslySetInnerHTML={{ __html: marked.parse(`
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
          `) }}
          />
        </Section>
      </div>

    </div>
  )
}

export default Faq;
