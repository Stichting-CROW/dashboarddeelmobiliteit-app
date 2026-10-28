import { marked } from 'marked';

/** Frequently asked questions (moved here from the About page). */
const VeelgesteldeVragen = () => {
  return (
    <div>
      <div className="mx-auto pb-8">
        <div
          dangerouslySetInnerHTML={{ __html: marked.parse(`
## Hoe krijg ik toegang tot het Dashboard?

Via het CROW of via info@dashboarddeelmobiliteit.nl kun je een login aanvragen. Afhankelijk van je taak en de afspraken over de data kun je vervolgens toegang krijgen tot de dashboard informatie voor gebieden en/of van aanbieders. Zo kunnen gemeente medewerkers over het algemeen toegang krijgen voor het dashboard in hun gemeente. Aanbieders van deelfietsen kunnen uiteraard toegang krijgen tot alle informatie van hun deelfietsen. Neem voor vragen over de rechten ook contact op met het CROW of info@dashboarddeelmobiliteit.nl.

## Is de software open source?

Ja, de software is open source. [Op de documentatie-site](https://docs.dashboarddeelmobiliteit.nl/start/how_to_install/) vind je instructies over hoe je de software zelf kunt installeren als een 'kloon' op je eigen server.

Velen handen maken licht werk. We zijn daarom blij als je wilt helpen. Gemeenten of andere overheden kunnen helpen bij het specificeren van handige overzichten. Deelmobiliteitbedrijven kunnen meebouwen aan open source tools. Ontwikkelaars kunnen bijdragen aan de code. Ontwerpers kunnen de look & feel verbeteren. Mail ons als je wilt weten hoe je mee kunt helpen!

We nodigen iedereen uit om mee te kijken en mee te ontwikkelen. Bugs en suggesties kunnen direct in de [issue-lijst](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues) geplaatst worden. Ons mailen op info@dashboarddeelmobiliteit.nl kan natuurlijk ook.

## Wat is de datakwaliteit?

Op de pagina [dashboarddeelmobiliteit-datakwaliteit](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit#dashboard-deelmobiliteit-data-quality) houden wij bij wat de datakwaliteit is per aanbieder. Voor elke aanbieder staat er in het totaaloverzicht een score op 5 kwaliteitseigenschappen. Als alle 5 eigenschappen goed zijn, is de datakwaliteit van de aanbieder 🟢 Perfect.

Het is mogelijk om per aanbieder de datakwaliteit-geschiedenis in te zien door te klikken op de aanbieder.

Per jaar is er een overzicht van de belangrijkste datakwaliteit-issues, zie de [jaaroverzichten](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-datakwaliteit/tree/main/year-overview) (vanaf 2022).

## Welke datastandaarden worden ondersteund?

Hoewel het Dashboard Deelmobiliteit verschillende datastandaarden ondersteunt, geven we er de voorkeur aan dat aanbieders hun data aanleveren conform MDS. Dit geeft ook de aanbieders de meeste zekerheid dat de koppeling in de toekomst goed functioneert. Zie de details in deze [specificatie](https://docs.dashboarddeelmobiliteit.nl/data_feeds/for_monitoring/).

Voor analyses gebruiken we:

\`\`\`
MDS  /vehicles         | Voor registreren van het aanbod
MDS  /trips            | Voor registreren van verhuringen
GBFS /geofencing_zones | Voor registreren van servicegebieden
\`\`\`

<br />Voor sturing gebruiken we:

\`\`\`
MDS  /stops            | De microhubs inclusief metadata
MDS  /policies         | Ingestelde regels per microhub
MDS  /geographies      | Geografische randen per microhub
\`\`\`

## Wat zijn de afspraken over data en financiering?

[Op deze pagina](https://www.fietsberaad.nl/Kennisbank/Afspraken-over-data-en-financiering-van-dashboard) vind je de afspraken over openbaarheid data en de financiering.

## Welke API's biedt het Dashboard?

Op [docs.dashboarddeelmobiliteit.nl](https://docs.dashboarddeelmobiliteit.nl/) vind je informatie over de diverse API's die worden aangeboden door het Dashboard Deelmobiliteit. Zo is er een microhubs API die bezettingsdata teruggeeft van de hubs. Er zijn diverse gemeenten die de API's geintegreerd hebben in intern gebruikte software en eigen dashboards. Mis je informatie? Vul de documentatie aan of stuur je vragen aan [info@dashboarddeelmobiliteit.nl](mailto:info@dashboarddeelmobiliteit.nl).

## Wat is er nieuw?

De nieuwste functionaliteiten vind je in de [release notes](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/blob/main/RELEASES.md#dashboard-deelmobiliteit-app-releases).

Alle software gemaakt voor het Dashboard Deelmobiliteit is open source. De code-updates vind je [op GitHub](https://github.com/orgs/Stichting-CROW/repositories?q=dashboard+OR+dd) en informatie over de open source applicatie staat op de documentatiesite bij [How to install](https://docs.dashboarddeelmobiliteit.nl/start/how_to_install/).
          `)}}
        />
      </div>
    </div>
  );
};

export default VeelgesteldeVragen;
