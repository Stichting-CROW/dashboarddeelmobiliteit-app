import { ReactNode, useState } from 'react';
import { marked } from 'marked';

import { DekkingSter, DekkingToelichting } from '../Dekking/Dekking';

import DemoVehiclesMap from './demo/DemoVehiclesMap';
import DemoDefectVehiclesMap from './demo/DemoDefectVehiclesMap';
import DemoHeatmapMap from './demo/DemoHeatmapMap';
import DemoOntwikkelingChart from './demo/DemoOntwikkelingChart';
import DemoRentalOriginsMap from './demo/DemoRentalOriginsMap';
import DemoHbMatrixMap from './demo/DemoHbMatrixMap';
import DemoVerhuringenChart from './demo/DemoVerhuringenChart';
import DemoServiceAreaMap from './demo/DemoServiceAreaMap';
import DemoHubsMap from './demo/DemoHubsMap';
import DemoPrestatiesOverview from './demo/DemoPrestatiesOverview';

const introMarkdown = `
Denk aan: Waar staan voertuigen? Hoe lang en waar staan deelvoertuigen ongebruikt in de openbare ruimte? Hoe vaak worden de deelvoertuigen verhuurd? In welke wijken en op welke tijdstippen zijn deelvoertuigen populair?

Niet-ingelogde gebruikers kunnen zien waar deelvoertuigen staan. Voor ingelogde gebruikers is meer functionaliteit beschikbaar. Zie hieronder een aantal voorbeelden.
`;

const aanbodMarkdown = `
## <a href="/map/park" target="_blank">Aanbod</a>

- Actueel en historisch aanbod
- Voertuigweergave en heatmap
- Waar staan defecte voertuigen?
- Hoe lang staan voertuigen onverhuurd stil?
- <a href="/stats/beleidsinfo" target="_blank">Trends door tijd</a>
- Filter op voertuigtype en aanbieder
`;

const verhuringenMarkdown = `
## <a href="/map/rentals" target="_blank">Verhuringen</a>

- Actuele en historische verhuringen (vertrek en aankomst)
- Hoe ver reden de voertuigen?
- HB-matrix: zie waar men heen ging vanuit een punt
- Trends door tijd
`;

const servicegebiedenMarkdown = `
## <a href="/map/servicegebieden" target="_blank">Servicegebieden</a>

- In welke servicegebieden is een aanbieder actief?
- Actuele weergave en servicegebieden die vroeger werden gehanteerd
`;

const zonesMarkdown = `
## <a href="/map/beleidshubs" target="_blank">Zones</a>

- Gemeenten tekenen hubs en verbodsgebieden in voor optimalisatie in de stad
- Waar staan de hubs- en verbodsgebieden?
- Wat is de bezetting, hoeveel verhuringen zijn er?
- Ontwikkeling door tijd, vanaf kwartierniveau
- Filter op voertuigtype en aanbieder
`;

const prestatiesMarkdown = `
## <a href="/stats/prestaties-aanbieders" target="_blank">Statistiek: Prestaties aanbieders</a>

- Een handig overzicht in de prestaties van aanbieders
- Statistieken door tijd
`;

const outroMarkdown = `
Ben je geinteresseerd geworden en ben je werkzaam bij een aanbieder of overheid? Lees dan bij [Veelgestelde vragen](/veelgestelde-vragen) hoe je toegang krijgt.

Wil je meer informatie? Bekijk dan de [(gebruikers)documentatie](/docs) en <a href="https://docs.dashboarddeelmobiliteit.nl/" target="_blank">technische documentatie</a>.
`;

const Markdown = ({ children }: { children: string }) => (
  <div dangerouslySetInnerHTML={{ __html: marked.parse(children) }} />
);

/** Grid with the demo widgets: maximum 2 blocks next to each other. */
const WidgetGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
    {children}
  </div>
);

/** Single widget that uses the full width of the page. */
const WidgetRow = ({ children }: { children: ReactNode }) => (
  <div className="my-4">
    {children}
  </div>
);

const Features = () => {
  const [showDekking, setShowDekking] = useState(false);

  return (
    <div>
      <div className="mx-auto pb-8">
        <p>
          Het Dashboard Deelmobiliteit toont vrijwel alle deelvoertuigen in Nederland<DekkingSter isOpen={showDekking} onToggle={() => setShowDekking(! showDekking)} />. Het is open source software van en voor overheden: zij zien hiermee hoe deelmobiliteit zich ontwikkelt, en kunnen zo hun beleid ontwikkelen, evalueren en bijsturen.
        </p>
        {showDekking && <DekkingToelichting />}
        <Markdown>{introMarkdown}</Markdown>

        <Markdown>{aanbodMarkdown}</Markdown>
        <WidgetGrid>
          <DemoVehiclesMap
            title="Hoe lang staan voertuigen stil?"
            description="Elke marker is een voertuig. De kleur laat zien hoe lang het al in de openbare ruimte staat."
          />
          <DemoHeatmapMap />
          <DemoDefectVehiclesMap />
          <DemoOntwikkelingChart />
        </WidgetGrid>

        <Markdown>{verhuringenMarkdown}</Markdown>
        <WidgetGrid>
          <DemoRentalOriginsMap />
          <DemoHbMatrixMap />
        </WidgetGrid>
        <WidgetRow>
          <DemoVerhuringenChart />
        </WidgetRow>

        <Markdown>{servicegebiedenMarkdown}</Markdown>
        <WidgetRow>
          <DemoServiceAreaMap />
        </WidgetRow>

        <Markdown>{zonesMarkdown}</Markdown>
        <WidgetRow>
          <DemoHubsMap />
        </WidgetRow>

        <Markdown>{prestatiesMarkdown}</Markdown>
        <WidgetRow>
          <DemoPrestatiesOverview />
        </WidgetRow>

        <Markdown>{outroMarkdown}</Markdown>
      </div>
    </div>
  );
};

export default Features;
