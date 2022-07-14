import React, {useState} from 'react'
import {marked} from 'marked'
import { Redirect } from "react-router-dom";

import Logo from '../Logo.jsx';
import { IconButtonClose } from '../IconButtons.jsx';

const About = () => {
  const [doRenderRedirect, setDoRenderRedirect] = useState(false);

  const renderRedirect = () => {
    return (
      <Redirect to="/" />
    );
  }
 
  if (doRenderRedirect) {
    return renderRedirect();
  }

  return (
    <div className="
      px-4
      min-h-screen
      sm:flex sm:justify-center
      sm:px-0
    ">
      <div className="mx-auto py-8">

        <IconButtonClose
          onClick={() => setDoRenderRedirect(true)}
          style={{position: 'absolute', right: '30px', top: '18px'}}
        />

        <Logo />

        <div
          style={{
            maxWidth: '100%',
            width: '616px'
          }}
          dangerouslySetInnerHTML={{ __html: marked.parse(`
# Over het Dashboard Deelmobiliteit

## Algemeen

Het Dashboard Deelmobiliteit is een webtool van en voor overheden die de ontwikkelingen rond deelmobiliteit op de voeten willen volgen.

Hoe lang en waar staan deelvoertuigen ongebruikt in de openbare ruimte? Hoe vaak worden de deelvoertuigen verhuurd? In welke wijken en op welke tijdstippen zijn deelvoertuigen populair? 

Met de informatie uit het Dashboard Deelmobiliteit kunnen overheden hun beleid ontwikkelen, evalueren en bijsturen.

## Hoe werkt het?

Het Dashboard Deelmobiliteit verzamelt elke halve minuut positie van  meer dan 15.000 geparkeerde deelvoertuigen in Nederland (januari 2022).

Op basis van deze informatie genereert het dashboard zogenaamde parkeergebeurtenissen en verhuringen, die opgeslagen worden in een centrale database.

Het dashboard biedt een aantal functionaliteiten (kaarten, grafieken en tabellen) om de database te raadplegen. 

Voor analyses waar het dashboard niet in voorziet, kunnen overheden downloads maken van de ruwe data uit het dashboard om maatwerkanalyses te (laten) maken.

## Functionaliteiten

In overleg met deelnemende overheden zijn de volgende functionaliteiten ontwikkeld:

- Een kaart met het aanbod van deelvoertuigen op een tijdstip naar keuze. Een kleurcode geeft tevens aan hoe lang het voertuig te huur staat.
- Een kaart met verhuringen van deelvoertuigen gedurende een periode naar keuze. Het betreft zowel de locaties waar verhuringen gestart zijn als beëindigd.
- Grafieken met ontwikkelingen in een periode naar keuze. Het gaat zowel om de ontwikkeling in het aantal deelvoertuigen dat aangeboden wordt als om de ontwikkeling het aantal verhuringen.
- Standaardrapportages als excel-sheets gedownload kunnen worden.

Overheden hebben alleen toegang tot de informatie over deelvoertuigen in hun eigen bestuursgebied.

## Voordelen voor gemeenten

- sneller toegang tot data
- minder uitvragen naar aanbieders nodig (1 bron met alle data)
- geen conversie meer nodig: data van elke aanbieder heeft precies hetzelfde dataformaat
- ontwikkeling in overleg met de aangesloten gemeentes
- indien gewenst uit te breiden door gemeentes zelf (open source software)

## Voordelen aanbieders

- minder aanvragen vanuit gemeentes
- geen nieuwe dataformaten nodig i.v.m. gebruik internationale datastandaarden
- gemeentes hebben beter inzicht in de stand van zaken
- aanbieders hebben beter inzicht

## Veel gestelde vragen

### Hoe krijg ik toegang tot het Dashboard?

Via het CROW of via info@deelfietsdashboard.nl kun je een login aanvragen. Afhankelijk van je taak en de afspraken over de data kun je vervolgens toegang krijgen tot de dashboard informatie voor gebieden en/of van aanbieders. Zo kunnen gemeente medewerkers over het algemeen toegang krijgen voor het dashboard in hun gemeente. Aanbieders van deelfietsen kunnen uiteraard toegang krijgen tot alle informatie van hun deelfietsen. Neem voor vragen over de rechten ook contact op met het CROW of info@deelfietsdashboard.nl.

### Welke datastandaarden worden ondersteund?

Hoewel het Dashboard Deelmobiliteit verschillende datastandaarden ondersteunt, geven we er de voorkeur aan dat aanbieders hun data aanleveren conform MDS. Dit geeft ook de aanbieders de meeste zekerheid dat de koppeling in de toekomst goed functioneert. Zie de details in deze [specificatie](https://docs.crow.nl/deelfietsdashboard/hr-dataspec/).

### Wat zijn de afspraken over data en financiering?

[Op deze pagina](https://www.fietsberaad.nl/Kennisbank/Afspraken-over-data-en-financiering-van-dashboard) vind je de afspraken over openbaarheid data en de financiering.

### Is de software open source?

Ja, de software is open source. Via [GitHub](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app) en [Gitlab](https://gitlab.com/bikedashboard) kun de laaste versie van de broncode bekijken.

Velen handen maken licht werk. We zijn daarom blij als je wilt helpen. Gemeenten of andere overheden kunnen helpen bij het specificeren van handige overzichten. Deelmobiliteitbedrijven kunnen meebouwen aan open source tools. Ontwikkelaars kunnen bijdragen aan de code. Ontwerpers kunnen de look & feel verbeteren. Mail ons als je wilt weten hoe je mee kunt helpen!

We nodigen iedereen uit om mee te kijken en mee te ontwikkelen. Bugs en suggesties kunnen direct in de [issue-lijst](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues) geplaatst worden. Ons mailen op info@deelfietsdashboard.nl kan natuurlijk ook.

## Tot slot

Wil je contact opnemen met het team achter het Dashboard Deelmobiliteit, neem dan contact op met <a href="mailto:info@deelfietsdashboard.nl?Subject=Hallo">info@deelfietsdashboard.nl</a>
          `)}}
        />
      </div>
    </div>
  )

}

export default About;