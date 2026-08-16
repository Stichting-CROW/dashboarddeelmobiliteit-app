import { ReactNode } from 'react';
import { marked } from 'marked';

import DemoVehiclesMap from './demo/DemoVehiclesMap';
import DemoDefectVehiclesMap from './demo/DemoDefectVehiclesMap';
import DemoHeatmapMap from './demo/DemoHeatmapMap';
import DemoOntwikkelingChart from './demo/DemoOntwikkelingChart';

const introMarkdown = `
Het Dashboard Deelmobiliteit is een webtool van en voor overheden die de ontwikkelingen rond deelmobiliteit op de voeten willen volgen. Met de informatie uit het Dashboard Deelmobiliteit kunnen overheden hun beleid ontwikkelen, evalueren en bijsturen. [meer info](/over)
`;

const aanbodMarkdown = `
## Aanbod

- Actueel en historisch aanbod
- Voertuigweergave en heatmap
- Waar staan defecte voertuigen?
- Hoe lang staan voertuigen onverhuurd stil?
- Trends door tijd
- Filter op voertuigtype en aanbieder
`;

const verhuringenMarkdown = `
## Verhuringen

- Actuele en historische verhuringen (vertrek en aankomst)
- Hoe ver reden de voertuigen?
- HB-matrix: zie waar men heen ging vanuit een punt
- Trends door tijd
`;

const servicegebiedenMarkdown = `
## Servicegebieden

- In welke servicegebieden is een aanbieder actief?
- Actuele weergave en servicegebieden die vroeger werden gehanteerd
`;

const zonesMarkdown = `
## Zones

- Gemeenten tekenen hubs en verbodsgebieden in voor optimalisatie in de stad
- Waar staan de hubs- en verbodsgebieden?
- Wat is de bezetting, hoeveel verhuringen zijn er?
- Ontwikkeling door tijd, vanaf kwartierniveau
- Filter op voertuigtype en aanbieder
`;

const prestatiesMarkdown = `
## Statistiek: Prestaties aanbieders

- Een handig overzicht in de prestaties van aanbieders
- Statistieken door tijd
`;

const outroMarkdown = `
Wil je meer informatie? Bekijk dan de [gebruikersdocumentatie](/docs) en [technische documentatie](https://docs.dashboarddeelmobiliteit.nl/).
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

const Features = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold">
        Dashboard Deelmobiliteit in het kort
      </h1>

      <div className="mx-auto pb-8">
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

        <Markdown>{servicegebiedenMarkdown}</Markdown>

        <Markdown>{zonesMarkdown}</Markdown>

        <Markdown>{prestatiesMarkdown}</Markdown>

        <Markdown>{outroMarkdown}</Markdown>
      </div>
    </div>
  );
};

export default Features;
