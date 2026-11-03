import React, {useState} from 'react'
import {marked} from 'marked'
import { useNavigate } from "react-router-dom";

import LogoCrow from '../LogoCrow.jsx';
import { IconButtonClose } from '../IconButtons.jsx';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="
    ">
      <div className="mx-auto pb-8">
        <div
          dangerouslySetInnerHTML={{ __html: marked.parse(`
Het Dashboard is een mooi voorbeeld van een open source ontwikkeling door en voor overheden. Onder regie van <a href="https://www.crow.nl/" target="_blank" rel="noopener noreferrer">CROW</a> hebben overheden (veelal gemeenten) samen dit dashboard gerealiseerd. Zij zijn ook een belangrijke groep gebruikers ervan. De bedoeling is dat het beheer van het dashboard overgaat naar <a href="https://dova.nu/" target="_blank" rel="noopener noreferrer">DOVA</a>.

## Hoe werkt het?

Het Dashboard Deelmobiliteit verzamelt elke halve minuut de posities van de geparkeerde deelvoertuigen in Nederland.

Op basis van deze informatie genereert het dashboard zogenaamde parkeergebeurtenissen en verhuringen, die opgeslagen worden in een centrale database.

Het dashboard biedt een aantal functionaliteiten (kaarten, grafieken en tabellen) om de database te raadplegen. &raquo; [Wat kun je ermee?](/functionaliteiten)

Voor analyses waar het dashboard niet in voorziet, kunnen overheden downloads maken van de ruwe data uit het dashboard om maatwerkanalyses te (laten) maken.

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

## LinkedIn-groep

Praat mee in de <a href="https://www.linkedin.com/groups/42840271/" target="_blank" rel="noopener noreferrer">LinkedIn-groep Dashboard Deelmobiliteit</a> met andere gebruikers en de ontwikkelaars over hoe het dashboard nu werkt en de wensen voor de toekomst.

## Tot slot

Wil je contact opnemen met het team achter het Dashboard Deelmobiliteit, neem dan contact op met <a href="mailto:info@dashboarddeelmobiliteit.nl?Subject=Hallo">info@dashboarddeelmobiliteit.nl</a>
          `)}}
        />
      </div>
    </div>
  )

}

export default About;