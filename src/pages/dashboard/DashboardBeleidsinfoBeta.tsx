import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';

import { StateType } from '../../types/StateType';
import PageTitle from '../../components/common/PageTitle';
import InfoTooltip from '../../components/InfoTooltip/InfoTooltip';

import {
  BetaChartCard,
  ModalityLineChart,
  Stacked100ColumnChart,
  GroupedColumnChart,
  HorizontalBarChart,
  BetaSegmented,
  BetaPlaceholder,
  SegmentedOption,
  formatNumber,
  formatPercent,
  formatRatio,
  // mock data
  MODALITIES,
  DAGDELEN,
  MOMENTEN,
  AFSTANDSKLASSEN,
  VERHUURDUURKLASSEN,
  ModalityKey,
  RentalSource,
  getModality,
  getTimeBuckets,
  getMaxBeschikbareVoertuigen,
  getVerhuringenPerDag,
  getGebruiksratio,
  getVerdelingOverDeDag,
  getPercentageNietBeschikbaar,
  getVerdelingAfstand,
  getVerdelingVerhuurduur,
  getDekkingsgraadPerMoment,
  getAandeelVoertuigenInHubs,
  getTopHbRelaties
} from '../../components/BeleidsinfoBeta';

import '../StatsPage.css';
import '../../components/BeleidsinfoBeta/BeleidsinfoBeta.css';

const SOURCE_OPTIONS: readonly SegmentedOption<RentalSource>[] = [
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'trips', label: 'Trips' }
];

const MODALITY_OPTIONS: readonly SegmentedOption<ModalityKey>[] = MODALITIES.map((m) => ({
  value: m.key,
  label: m.label
}));

const AGGREGATION_LEVELS = [
  { name: 'day', title: 'dag' },
  { name: 'week', title: 'week' },
  { name: 'month', title: 'maand' }
] as const;

/** Text for the "later" items from the proposal sheet. */
const LATER_ITEMS: Array<{ title: string; text?: string }> = [
  { title: 'Deel van de tijd dat voertuigen verhuurd zijn' },
  { title: 'Deel van de tijd hubs leeg' },
  { title: 'Aandeel verhuringen uit hubs' },
  { title: 'Deel van de hubs te groot' },
  { title: 'Deel van de hubs te klein' },
  { title: 'Aandeel voertuigen in verbodsgebieden' }
];

/**
 * Beleidsinfo (beta): mockup of the proposed new policy charts.
 * All charts render FICTIONAL, deterministic mock data; the point of this
 * page is to agree on chart types, legends and axes before building the
 * real aggregations.
 */
function DashboardBeleidsinfoBeta() {
  const dispatch = useDispatch();
  const filter = useSelector((state: StateType) => state.filter);
  const zones = useSelector((state: StateType) => state.metadata?.zones ?? []);
  const gebieden = useSelector((state: StateType) => state.metadata?.gebieden ?? []);

  const [rentalsSource, setRentalsSource] = useState<RentalSource>('vehicles');
  const [ratioSource, setRatioSource] = useState<RentalSource>('vehicles');
  const [hbModality, setHbModality] = useState<ModalityKey>('bicycle');

  const van = filter.ontwikkelingvan;
  const tot = filter.ontwikkelingtot;
  const rawAgg = filter.ontwikkelingaggregatie;
  // The beta page only knows day / week / month; map finer levels to 'day'.
  const agg = rawAgg === 'week' || rawAgg === 'month' ? rawAgg : 'day';

  const daysInSelectedPeriod = moment(tot).diff(moment(van), 'days');

  const setAggregationLevel = (newlevel: string) => {
    dispatch({ type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE', payload: newlevel });
  };

  const aggregationButtonsToRender = AGGREGATION_LEVELS.filter((x) => {
    if (x.name === 'week') return daysInSelectedPeriod >= 6;
    if (x.name === 'month') return daysInSelectedPeriod >= 27;
    return true;
  });

  const pageTitle = useMemo(() => {
    if (filter.zones) {
      const zoneIds = String(filter.zones)
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter(Boolean);
      const names = zones.filter((z) => zoneIds.includes(z.zone_id)).map((z) => z.name);
      if (names.length) return names.join(', ');
    }
    if (filter.gebied) {
      const gebied = gebieden.find((g) => g.gm_code === filter.gebied);
      if (gebied?.name) return gebied.name;
    }
    return 'Beleidsinfo';
  }, [filter.zones, filter.gebied, zones, gebieden]);

  /* ---------------- mock data (memoised on the filter) ---------------- */

  const buckets = useMemo(() => getTimeBuckets(van, tot, agg), [van, tot, agg]);
  const maxBeschikbaar = useMemo(() => getMaxBeschikbareVoertuigen(buckets), [buckets]);
  const verhuringen = useMemo(() => getVerhuringenPerDag(buckets, rentalsSource), [buckets, rentalsSource]);
  const gebruiksratio = useMemo(() => getGebruiksratio(buckets, ratioSource), [buckets, ratioSource]);
  const nietBeschikbaar = useMemo(() => getPercentageNietBeschikbaar(buckets), [buckets]);
  const verdelingDag = useMemo(() => getVerdelingOverDeDag(), []);
  const verdelingAfstand = useMemo(() => getVerdelingAfstand(), []);
  const verdelingDuur = useMemo(() => getVerdelingVerhuurduur(), []);
  const dekkingsgraad = useMemo(() => getDekkingsgraadPerMoment(), []);
  const hubs = useMemo(() => getAandeelVoertuigenInHubs(van, tot), [van, tot]);
  const hbRelaties = useMemo(() => getTopHbRelaties(hbModality), [hbModality]);

  const periodLabel = `${moment(van).format('D MMM YYYY')} – ${moment(tot).format('D MMM YYYY')}`;
  const avgPrefix = agg === 'day' ? '' : 'Gemiddeld ';
  const hubsDays = Math.min(31, daysInSelectedPeriod + 1);

  return (
    <div className="DashboardBeleidsinfoBeta StatsPage pt-4 pb-24">
      <div className="agg-button-container mb-6">
        {aggregationButtonsToRender.map((x) => (
          <div
            key={`agg-level-${x.name}`}
            className={'agg-button ' + (agg === x.name ? ' agg-button-active' : '')}
            onClick={() => setAggregationLevel(x.name)}
          >
            {x.title}
          </div>
        ))}
        <InfoTooltip className="mx-2 inline-block">
          {`Toon de tijdreeksen per ${aggregationButtonsToRender.map((x) => x.title).join(' / ')}. ` +
            `Je bekijkt nu ${aggregationButtonsToRender.find((x) => x.name === agg)?.title}-niveau.`}
        </InfoTooltip>
      </div>

      <PageTitle className="my-2">
        {pageTitle} <span className="text-gray-400 font-normal">· beta</span>
      </PageTitle>

      <div className="DashboardBeleidsinfoBeta-banner my-4">
        <strong>Mockup.</strong> Deze pagina toont de voorgestelde nieuwe beleidsgrafieken met{' '}
        <strong>fictieve voorbeelddata</strong>. Grafieken tonen modaliteiten (geen aanbieders, geen totaal).
        Periode: {periodLabel}.
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Tijdreeksen                                                   */}
      {/* ------------------------------------------------------------ */}
      <h2 className="DashboardBeleidsinfoBeta-section-title">Ontwikkeling door de tijd</h2>
      <p className="DashboardBeleidsinfoBeta-section-subtitle">
        Lijngrafieken per modaliteit; x-as in dagen (of weken / maanden).
      </p>

      <div className="DashboardBeleidsinfoBeta-grid">
        <BetaChartCard
          title="Max. beschikbare voertuigen per dag"
          status="voorstel"
          chartType="lijn"
          toelichting={
            <>
              Elke dag wordt op 6 momenten bepaald hoeveel voertuigen er te huur staan (excl. defect) en
              hoeveel voertuigen verhuurd zijn maar dezelfde dag nog beschikbaar komen. Het moment met het
              hoogste aantal beschikbare voertuigen is maatgevend.
            </>
          }
          opmerkingen={['Geen onderscheid naar aanbieder meer.']}
        >
          <ModalityLineChart
            data={maxBeschikbaar}
            yLabel={`${avgPrefix}aantal beschikbare voertuigen per dag`.trim()}
            formatter={formatNumber}
            yDomain={[0, 'auto']}
          />
        </BetaChartCard>

        <BetaChartCard
          title="Aantal verhuringen per dag"
          status="voorstel"
          chartType="lijn"
          toelichting={<>Som van de beëindigde verhuringen gedeeld door het aantal dagen.</>}
          opmerkingen={[
            'Geen onderscheid naar aanbieder meer.',
            'Kan switchen tussen bron: Vehicles of Trips.'
          ]}
          controls={
            <BetaSegmented<RentalSource>
              label="Bron"
              value={rentalsSource}
              options={SOURCE_OPTIONS}
              onChange={setRentalsSource}
            />
          }
        >
          <ModalityLineChart
            data={verhuringen}
            yLabel={`${avgPrefix}aantal verhuringen per dag`.trim()}
            formatter={formatNumber}
            yDomain={[0, 'auto']}
          />
        </BetaChartCard>

        <BetaChartCard
          title="Gebruiksratio: verhuringen per voertuig per dag"
          status="voorstel"
          chartType="lijn"
          toelichting={
            <>
              Som van de verhuringen per dag gedeeld door de som van het maximum aantal beschikbare
              voertuigen per dag.
            </>
          }
          opmerkingen={['Kan kiezen tussen bronnen: Vehicles of Trips.']}
          controls={
            <BetaSegmented<RentalSource>
              label="Bron"
              value={ratioSource}
              options={SOURCE_OPTIONS}
              onChange={setRatioSource}
            />
          }
        >
          <ModalityLineChart
            data={gebruiksratio}
            yLabel={`${avgPrefix}gebruiksratio per dag`.trim()}
            formatter={formatRatio}
            yDomain={[0, 'auto']}
          />
        </BetaChartCard>

        <BetaChartCard
          title="Percentage van de voertuigen niet beschikbaar"
          status="voorstel"
          chartType="lijn"
          toelichting={
            <>
              Aantal voertuigen in de openbare ruimte om 03:30 uur dat niet beschikbaar is, gedeeld door
              het maximum aantal voertuigen in de openbare ruimte op die dag.
            </>
          }
        >
          <ModalityLineChart
            data={nietBeschikbaar}
            yLabel={`${avgPrefix}percentage niet beschikbaar`.trim()}
            formatter={formatPercent}
            yDomain={[0, 'auto']}
          />
        </BetaChartCard>

        <BetaChartCard
          title="Aandeel voertuigen in hubs"
          status="voorstel"
          chartType="lijn"
          toelichting={
            <>
              Voor alle 6 momenten op de dag: aantal voertuigen in hubs gedeeld door het aantal voertuigen in
              de openbare ruimte. De x-as toont elke dag 6 momenten (03:30, 07:30, 11:30, 15:30, 19:30,
              23:30).
            </>
          }
          opmerkingen={[
            `Toont de laatste ${hubsDays} dagen van de geselecteerde periode (6 meetmomenten per dag).`
          ]}
          className="DashboardBeleidsinfoBeta-span-2"
        >
          <ModalityLineChart
            data={hubs}
            yLabel="Aandeel van de voertuigen in de openbare ruimte"
            formatter={formatPercent}
            yDomain={[0, 100]}
            tickFilter={(row) => Boolean(row.isDayStart)}
            tickLabel={(row) => String(row.dayLabel ?? '')}
            xTickInterval={hubsDays > 16 ? 11 : hubsDays > 8 ? 5 : 0}
          />
        </BetaChartCard>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Verdelingen                                                   */}
      {/* ------------------------------------------------------------ */}
      <h2 className="DashboardBeleidsinfoBeta-section-title">Verdelingen over de periode</h2>
      <p className="DashboardBeleidsinfoBeta-section-subtitle">
        Kolomgrafieken per modaliteit, berekend over de hele geselecteerde periode ({periodLabel}).
      </p>

      <div className="DashboardBeleidsinfoBeta-grid">
        <BetaChartCard
          title="Verdeling van de verhuringen over de dag"
          status="voorstel"
          chartType="100% gestapelde kolommen"
          toelichting={
            <>
              Som van de verhuringen tijdens een dagdeel gedeeld door het totaal aantal verhuringen per
              modaliteit. Zes dagdelen van 4 uur.
            </>
          }
        >
          <Stacked100ColumnChart data={verdelingDag} xKey="modality" categories={DAGDELEN} />
        </BetaChartCard>

        <BetaChartCard
          title="Verdeling verhuringen naar afstandsklasse (hemelsbreed)"
          status="voorstel"
          chartType="100% gestapelde kolommen"
          toelichting={
            <>
              Aantal beëindigde verhuringen per afstandsklasse (hemelsbreed) in de periode, gedeeld door
              het totaal aantal beëindigde verhuringen in de periode. Bron: MDS-Vehicles.
            </>
          }
          opmerkingen={['Bron: MDS-Vehicles.']}
        >
          <Stacked100ColumnChart data={verdelingAfstand} xKey="modality" categories={AFSTANDSKLASSEN} />
        </BetaChartCard>

        <BetaChartCard
          title="Verdeling verhuringen naar verhuurduur"
          status="voorstel"
          chartType="100% gestapelde kolommen"
          toelichting={
            <>
              Aantal beëindigde verhuringen per verhuurduurklasse in de periode, gedeeld door het totaal
              aantal beëindigde verhuringen in de periode. Bron: MDS-Vehicles.
            </>
          }
          opmerkingen={[
            'Bron: MDS-Vehicles.',
            'N.a.v. gesprek BUAS: nog kijken naar de verhuurduur-categorieën.'
          ]}
        >
          <Stacked100ColumnChart data={verdelingDuur} xKey="modality" categories={VERHUURDUURKLASSEN} />
        </BetaChartCard>

        <BetaChartCard
          title="Dekkingsgraad naar moment van de dag"
          status="voorstel"
          chartType="gegroepeerde kolommen"
          toelichting={
            <>
              Gemiddelde dekkingsgraad naar modaliteit op 6 momenten per dag voor de gekozen periode:
              het aandeel van de huishoudens met een voertuig binnen loopafstand.
            </>
          }
        >
          <GroupedColumnChart
            data={dekkingsgraad}
            xKey="modality"
            groups={MOMENTEN}
            yLabel="Gemiddeld aandeel van de huishoudens"
            formatter={formatPercent}
          />
        </BetaChartCard>

        <BetaChartCard
          title="Top 15 HB-relaties tussen CBS-buurten"
          status="voorstel"
          chartType="liggende staaf"
          toelichting={
            <>
              De 15 herkomst–bestemmingsrelaties tussen CBS-buurten met de meeste verhuurrelaties per dag,
              voor de gekozen modaliteit en periode.
            </>
          }
          controls={
            <BetaSegmented<ModalityKey>
              label="Modaliteit"
              value={hbModality}
              options={MODALITY_OPTIONS}
              onChange={setHbModality}
            />
          }
          height={520}
          className="DashboardBeleidsinfoBeta-span-2"
        >
          <HorizontalBarChart
            data={hbRelaties}
            labelKey="label"
            valueKey="value"
            seriesName={`Verhuurrelaties per dag (${getModality(hbModality).label.toLowerCase()})`}
            color={getModality(hbModality).color}
            xLabel="Aantal verhuurrelaties per dag"
            formatter={formatNumber}
            labelWidth={260}
          />
        </BetaChartCard>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Later                                                         */}
      {/* ------------------------------------------------------------ */}
      <h2 className="DashboardBeleidsinfoBeta-section-title">Later</h2>
      <p className="DashboardBeleidsinfoBeta-section-subtitle">
        Onderwerpen uit het voorstel waarvan grafiektype, legenda en assen nog bepaald moeten worden.
      </p>

      <div className="DashboardBeleidsinfoBeta-grid DashboardBeleidsinfoBeta-grid-placeholders">
        {LATER_ITEMS.map((item) => (
          <BetaChartCard key={item.title} title={item.title} status="later" height={140}>
            <BetaPlaceholder text={item.text} />
          </BetaChartCard>
        ))}
      </div>
    </div>
  );
}

export default DashboardBeleidsinfoBeta;
