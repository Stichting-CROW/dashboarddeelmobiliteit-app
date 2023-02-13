import { Link } from "react-router-dom";
import Section from '../Section/Section';
import {marked} from 'marked'

function Faq() {
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
        <Section title="Wat zijn de mogelijkheden met maatwerkzones?">
          <div dangerouslySetInnerHTML={{ __html: marked.parse(`
Maatwerkzones, soms ook microhubs genoemd, zijn zelf-ingetekende zones. Deze zones kun je gebruiken voor het inzien van statistische data. Ook kun je de waardes instellen voor deze zones, zoals een maximum aantal voertuigen, en kun je op de hoogte gehouden worden als deze waardes overschreden worden.

![Voorbeeld van een microhub in Rotterdam](https://media.slid.es/uploads/116033/images/10031100/pasted-from-clipboard.png)

Globaal zijn dit de mogelijkheden met maatwerkzones:
- Zie bij [Aanbod](https://dashboarddeelmobiliteit.nl/) hoeveel voertuigen er geparkeerd staan in de zone
- Zie bij [Verhuringen](https://dashboarddeelmobiliteit.nl/map/rentals) hoeveel voertuigen er van of naar de hub reden
- Zie bij [Zones](https://dashboarddeelmobiliteit.nl/map/zones) hoeveel voertuigen er per modaliteit in de hub staan
- Zie bij [Ontwikkeling](https://dashboarddeelmobiliteit.nl/stats/overview) de beschikbaarheid van voertuigen, het aantal geparkeerde voertuigen en het aantal verhuringen voor deze hub, door de tijd heen

Enkele voorbeeld-cases:

- Bij welke tijden is de microhub vol en wanneer juist leeg? Zie **Ontwikkeling**<br /><br /><img src="https://media.slid.es/uploads/116033/images/10031107/pasted-from-clipboard.png" /><br />
- Wat was het verloop door de dag heen vandaag? Klik bij **Zones** op de microhub en open het "Hub"-tabje rechtsbovenin<br /><br />![Microhub-statistieken in het Zones-scherm](https://media.slid.es/uploads/116033/images/10034319/pasted-from-clipboard.png)<br />
- Hoeveel voertuigen staan er in de microhub, per week/dag/uur? Zie **Ontwikkeling**

We houden van microhubs de verhuringen en het aanbod bij op 5-minuten niveau. Hierdoor heb je gedetailleerde data, en kun je over de dag heen zien hoe hubs zich vullen en weer legen. Op deze manier heb je snel inzicht in het gebruik van de hub.Zie

Vanaf het moment dat je nieuwe maatwerkzone intekent in **Zones**, wordt er van die zone elke 5 minuten data bijgehouden en gevisualiseerd.

          `) }}
          />
        </Section>
        <Section title="Hoe beheer ik zones?">
          <div dangerouslySetInnerHTML={{ __html: marked.parse(`
Op de pagina **Zones** is het mogelijk om zones te beheren en bekijken.

Wil je zones toevoegen, aanpassen of verwijderen? Doe dit als volgt:

1. Ga naar [Zones](/map/zones)
2. Klik links in het menu op het potlood-icoon<br /><br />![img](https://i.imgur.com/b1ehHu5.png)<br /><br />


### Toevoegen

3. Klik op **Nieuwe zone aanmaken**
4. Klik meerdere keren op de kaart om een gebied af te kaderen<br /><br />![img](https://i.imgur.com/gV2mMvl.png)<br />
5. Geef de zone een **naam**
6. Bepaal welk type zone dit is:
  - Analysezone: Definieer een zone voor toekomstige analyses
  - Parking zone: Stel een limiet aan voertuigen in
  - No parking: Maak een verbodsgebied
7. Klik op **Opslaan**

![img](https://i.imgur.com/LFY7xHt.png)

          `) }}
          />
        </Section>
      </div>

    </div>
  )
}

export default Faq;
