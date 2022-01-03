import React from 'react'
import {marked} from 'marked'

const About = () => {
  return (
    <div dangerouslySetInnerHTML={{ __html: marked.parse(`
# Over het Dashboard Deelmobiliteit

## Algemeen

Het Dashboard Deelmobiliteit is een webtool van en voor overheden die de ontwikkelingen rond deelmobiliteit op de voeten willen. Hoe lang en waar staan deelvoertuigen ongebruikt in de openbare ruimte? Hoe vaak worden de deelvoertuigen verhuurd? In welke wijken en op welke tijdstippen zijn deelvoertuigen populair?  Met de informatie uit het Dashboard Deelmobiliteit kunnen overheden hun beleid ontwikkelen, evalueren en bijsturen.

## Hoe werkt het?

Het Dashboard Deelmobiliteit verzamelt elke halve minuut positie van  meer dan 15.000 geparkeerde deelvoertuigen in Nederland (januari 2022). Op basis deze informatie genereert het dashboard zogenaamde parkeergebeurtenissen en verhuringen, die opgeslagen worden in een centrale database. Het dashboard biedt een aantal functionaliteiten (kaarten, grafieken en tabellen) om de database te raadplegen. Voor analyses waar het dashboard niet in voorziet, kunnen overheden downloads maken van de ruwe data uit het dashboard om maatwerkanalyses te (laten) maken.

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
- geen nieuwe dataformaten nodig i.v.m. gebruik gangbare internationale datastandaarden
- gemeentes hebben beter inzicht in de stand van zaken

## Tot slot

Wil je contact opnemen met het team achter het Dashboard Deelmobiliteit, neem dan contact op met <a href="mailto:info@deelfietsdashboard.nl?Subject=Hallo">info@deelfietsdashboard.nl</a>
      `)}} />
  )

}

export default About;