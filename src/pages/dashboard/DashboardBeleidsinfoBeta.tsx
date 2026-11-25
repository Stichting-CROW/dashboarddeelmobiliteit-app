import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { StateType } from '../../types/StateType';
import type {
  Aggregation,
  DistributionResponse,
  DistributionStatistic,
  StatisticQuery,
  TimeSeriesResponse,
  TimeSeriesStatistic,
  TripSource
} from '../../types/StatsV3';
import PageTitle from '../../components/common/PageTitle';
import InfoTooltip from '../../components/InfoTooltip/InfoTooltip';

import {
  BetaChartCard,
  ModalityLineChart,
  Stacked100ColumnChart,
  BetaSegmented,
  BetaPlaceholder,
  SegmentedOption,
  StatisticState,
  ValueFormatter,
  countDays,
  formatNumber,
  formatPercent,
  formatPeriod,
  formatRatio,
  getEffectivePeriod,
  getWholeMonthsPeriod,
  toDateString,
  toDistributionRows,
  toTimeSeriesRows,
  useStatsV3Statistic
} from '../../components/BeleidsinfoBeta';

import '../StatsPage.css';
import '../../components/BeleidsinfoBeta/BeleidsinfoBeta.css';

const SOURCE_OPTIONS: readonly SegmentedOption<TripSource>[] = [
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'trips', label: 'Trips' }
];

const AGGREGATION_LEVELS: ReadonlyArray<{ name: Aggregation; title: string }> = [
  { name: 'day', title: 'dag' },
  { name: 'week', title: 'week' },
  { name: 'month', title: 'maand' }
];

const AGGREGATION_DESCRIPTIONS: Record<Aggregation, string> = {
  day: 'per dag',
  week: 'per week (afgerond naar hele weken)',
  month: 'per maand (afgerond naar hele maanden)'
};

const DISTRIBUTION_CARD_HEIGHT = 440;

/** Topics from the proposal sheet without data in the stats API yet. */
const LATER_ITEMS: Array<{ title: string; text?: string }> = [
  {
    title: 'Aandeel voertuigen in hubs',
    text: 'Lijngrafiek per modaliteit op 6 meetmomenten per dag. Nog geen data beschikbaar.'
  },
  {
    title: 'Dekkingsgraad naar moment van de dag',
    text: 'Gegroepeerde kolommen per modaliteit en meetmoment. Nog geen data beschikbaar.'
  },
  {
    title: 'Top 15 HB-relaties tussen CBS-buurten',
    text: 'Liggende staven per modaliteit. Nog geen data beschikbaar.'
  },
  { title: 'Deel van de tijd dat voertuigen verhuurd zijn' },
  { title: 'Deel van de tijd hubs leeg' },
  { title: 'Aandeel verhuringen uit hubs' },
  { title: 'Deel van de hubs te groot' },
  { title: 'Deel van de hubs te klein' },
  { title: 'Aandeel voertuigen in verbodsgebieden' }
];

const getErrorMessage = (status: number): string => {
  if (status === 401) return 'Je sessie is verlopen. Log opnieuw in.';
  if (status === 403) return 'Je hebt geen toegang tot de statistieken van deze gemeente.';
  return 'De gegevens konden niet worden geladen. Probeer het later opnieuw.';
};

/** Message for a card: an error, "no data", or null when the chart can be shown. */
const getCardMessage = (state: StatisticState<unknown>, hasData: boolean): string | null => {
  if (state.errorStatus !== null) return getErrorMessage(state.errorStatus);
  if (state.data && !hasData) return 'Geen data voor deze periode.';
  return null;
};

interface TimeSeriesCardProps {
  title: string;
  toelichting: React.ReactNode;
  state: StatisticState<TimeSeriesResponse>;
  today: string;
  yLabel: string;
  formatter: ValueFormatter;
  perDay?: boolean;
  controls?: React.ReactNode;
  opmerkingen?: string[];
}

function TimeSeriesCard({
  title,
  toelichting,
  state,
  today,
  yLabel,
  formatter,
  perDay = false,
  controls,
  opmerkingen
}: TimeSeriesCardProps) {
  const chart = useMemo(
    () => (state.data ? toTimeSeriesRows(state.data, { today, perDay }) : null),
    [state.data, today, perDay]
  );
  const hasData = Boolean(chart && chart.rows.length > 0 && chart.modalities.length > 0);

  return (
    <BetaChartCard
      title={title}
      status="live"
      toelichting={toelichting}
      controls={controls}
      opmerkingen={opmerkingen}
      loading={state.loading}
      message={getCardMessage(state, hasData)}
    >
      {chart && hasData && (
        <ModalityLineChart
          data={chart.rows}
          modalities={chart.modalities}
          yLabel={yLabel}
          formatter={formatter}
          yDomain={[0, 'auto']}
        />
      )}
    </BetaChartCard>
  );
}

interface DistributionCardProps {
  title: string;
  toelichting: React.ReactNode;
  state: StatisticState<DistributionResponse>;
  controls?: React.ReactNode;
  opmerkingen?: string[];
}

function DistributionCard({ title, toelichting, state, controls, opmerkingen }: DistributionCardProps) {
  const chart = useMemo(() => (state.data ? toDistributionRows(state.data) : null), [state.data]);
  const hasData = Boolean(chart && chart.rows.length > 0);

  return (
    <BetaChartCard
      title={title}
      status="live"
      toelichting={toelichting}
      controls={controls}
      opmerkingen={opmerkingen}
      height={DISTRIBUTION_CARD_HEIGHT}
      loading={state.loading}
      message={getCardMessage(state, hasData)}
    >
      {chart && hasData && (
        <Stacked100ColumnChart data={chart.rows} xKey="modality" categories={chart.categories} />
      )}
    </BetaChartCard>
  );
}

/**
 * Beleidsinfo (beta): the proposed new policy charts, filled with data from
 * the stats_v3 API. Charts show modalities for the whole municipality
 * (no operators, no totals, no zones).
 */
function DashboardBeleidsinfoBeta() {
  const dispatch = useDispatch();
  const filter = useSelector((state: StateType) => state.filter);
  const gebieden = useSelector((state: StateType) => state.metadata?.gebieden ?? []);
  const token = useSelector(
    (state: StateType) => state.authentication?.user_data?.token || null
  );

  const [rentalsSource, setRentalsSource] = useState<TripSource>('vehicles');
  const [ratioSource, setRatioSource] = useState<TripSource>('vehicles');
  const [usageDistributionSource, setUsageDistributionSource] = useState<TripSource>('vehicles');

  const gmCode: string | null = filter.gebied || null;
  const startDate = toDateString(filter.ontwikkelingvan);
  const endDate = toDateString(filter.ontwikkelingtot);
  const today = useMemo(() => toDateString(new Date()), []);
  const rawAgg = filter.ontwikkelingaggregatie;
  // The beta page only knows day / week / month; map finer levels to 'day'.
  const agg: Aggregation = rawAgg === 'week' || rawAgg === 'month' ? rawAgg : 'day';

  const daysInSelectedPeriod = countDays(startDate, endDate) - 1;
  const aggregationButtonsToRender = AGGREGATION_LEVELS.filter((x) => {
    if (x.name === 'week') return daysInSelectedPeriod >= 6;
    if (x.name === 'month') return daysInSelectedPeriod >= 27;
    return true;
  });

  const setAggregationLevel = (newlevel: Aggregation) => {
    dispatch({ type: 'SET_FILTER_ONTWIKKELING_AGGREGATIE', payload: newlevel });
  };

  const timeSeriesPeriod = getEffectivePeriod(startDate, endDate, agg, today);
  const distributionPeriod = getWholeMonthsPeriod(startDate, endDate);

  const pageTitle = useMemo(() => {
    const gebied = gebieden.find((g) => g.gm_code === gmCode);
    return gebied?.name || 'Beleidsinfo';
  }, [gebieden, gmCode]);

  const hasZoneSelection = Boolean(filter.zones && String(filter.zones).trim());

  /* ---------------- data ---------------- */

  const timeSeriesQuery = (
    statistic: TimeSeriesStatistic,
    tripSource?: TripSource
  ): StatisticQuery | null =>
    gmCode
      ? {
          statistic,
          municipality: gmCode,
          start_date: timeSeriesPeriod.start,
          end_date: timeSeriesPeriod.end,
          aggregation: agg,
          trip_source: tripSource
        }
      : null;

  const distributionQuery = (
    statistic: DistributionStatistic,
    tripSource?: TripSource
  ): StatisticQuery | null =>
    gmCode
      ? {
          statistic,
          municipality: gmCode,
          start_date: startDate,
          end_date: endDate,
          trip_source: tripSource
        }
      : null;

  const maxBeschikbaar = useStatsV3Statistic<TimeSeriesResponse>(
    token,
    timeSeriesQuery('max_available_vehicles')
  );
  const verhuringen = useStatsV3Statistic<TimeSeriesResponse>(
    token,
    timeSeriesQuery('rentals', rentalsSource)
  );
  const gebruiksratio = useStatsV3Statistic<TimeSeriesResponse>(
    token,
    timeSeriesQuery('usage_ratio', ratioSource)
  );
  const nietBeschikbaar = useStatsV3Statistic<TimeSeriesResponse>(
    token,
    timeSeriesQuery('unavailable_percentage')
  );
  const verdelingDag = useStatsV3Statistic<DistributionResponse>(
    token,
    distributionQuery('usage_distribution', usageDistributionSource)
  );
  const verdelingAfstand = useStatsV3Statistic<DistributionResponse>(
    token,
    distributionQuery('distance_distribution')
  );
  const verdelingAfstandWeg = useStatsV3Statistic<DistributionResponse>(
    token,
    distributionQuery('real_distance_distribution')
  );
  const verdelingDuur = useStatsV3Statistic<DistributionResponse>(
    token,
    distributionQuery('duration_distribution')
  );

  const avgPrefix = agg === 'day' ? '' : 'Gemiddeld ';

  const renderPrerequisiteNotice = () => {
    if (!token) {
      return (
        <div className="DashboardBeleidsinfoBeta-notice my-4">
          Log in om de beleidsinformatie te bekijken.
        </div>
      );
    }
    if (!gmCode) {
      return (
        <div className="DashboardBeleidsinfoBeta-notice my-4">
          Kies links bij <strong>Plaats</strong> een gemeente om de grafieken te tonen.
        </div>
      );
    }
    return null;
  };

  const prerequisiteNotice = renderPrerequisiteNotice();

  return (
    <div className="DashboardBeleidsinfoBeta StatsPage pt-4 pb-24">
      <PageTitle className="my-2">
        {pageTitle} <span className="text-gray-400 font-normal">· beta</span>
      </PageTitle>

      <div className="DashboardBeleidsinfoBeta-banner my-4">
        <strong>Beta.</strong> Deze pagina toont de nieuwe beleidsgrafieken per modaliteit voor de hele
        gemeente. De weergave kan nog veranderen.
      </div>

      {hasZoneSelection && !prerequisiteNotice && (
        <div className="DashboardBeleidsinfoBeta-notice my-4">
          De gekozen zones worden op deze pagina niet toegepast: de grafieken tonen de hele gemeente.
        </div>
      )}

      {prerequisiteNotice}

      {!prerequisiteNotice && (
        <>
          {/* ------------------------------------------------------------ */}
          {/* Tijdreeksen                                                   */}
          {/* ------------------------------------------------------------ */}
          <div className="DashboardBeleidsinfoBeta-section-header">
            <h2 className="DashboardBeleidsinfoBeta-section-title">Ontwikkeling door de tijd</h2>
            <div className="agg-button-container items-center">
              <span className="BetaSegmented-label text-xs">Per</span>
              {aggregationButtonsToRender.map((x) => (
                <button
                  type="button"
                  key={`agg-level-${x.name}`}
                  className={'agg-button ' + (agg === x.name ? ' agg-button-active' : '')}
                  onClick={() => setAggregationLevel(x.name)}
                  aria-pressed={agg === x.name}
                >
                  {x.title}
                </button>
              ))}
              <InfoTooltip className="mx-2 inline-block">
                {'Bij week en maand wordt de gekozen periode afgerond naar hele weken (maandag t/m ' +
                  'zondag) of hele kalendermaanden, zodat elk punt een volledige week of maand is. ' +
                  'Een week of maand die nog loopt, is nog niet compleet.'}
              </InfoTooltip>
            </div>
          </div>
          <p className="DashboardBeleidsinfoBeta-section-subtitle">
            {formatPeriod(timeSeriesPeriod.start, timeSeriesPeriod.end)},{' '}
            {AGGREGATION_DESCRIPTIONS[agg]}.
          </p>

          <div className="DashboardBeleidsinfoBeta-grid">
            <TimeSeriesCard
              title="Max. beschikbare voertuigen per dag"
              toelichting={
                <>
                  Elke dag wordt op 6 momenten bepaald hoeveel voertuigen er te huur staan. Het moment met
                  het hoogste aantal beschikbare voertuigen is maatgevend. Bij week en maand: gemiddelde
                  van deze dagelijkse maxima.
                </>
              }
              state={maxBeschikbaar}
              today={today}
              yLabel={`${avgPrefix}aantal beschikbare voertuigen per dag`.trim()}
              formatter={formatNumber}
            />

            <TimeSeriesCard
              title="Aantal verhuringen per dag"
              toelichting={
                <>
                  Aantal beëindigde verhuringen per dag. Bij week en maand: het totaal gedeeld door het
                  aantal dagen.
                </>
              }
              state={verhuringen}
              today={today}
              perDay
              yLabel={`${avgPrefix}aantal verhuringen per dag`.trim()}
              formatter={formatNumber}
              controls={
                <BetaSegmented<TripSource>
                  label="Bron"
                  value={rentalsSource}
                  options={SOURCE_OPTIONS}
                  onChange={setRentalsSource}
                />
              }
            />

            <TimeSeriesCard
              title="Gebruiksratio: verhuringen per voertuig per dag"
              toelichting={
                <>
                  Som van de verhuringen gedeeld door de som van het maximum aantal voertuigen in de
                  openbare ruimte per dag.
                </>
              }
              state={gebruiksratio}
              today={today}
              yLabel={`${avgPrefix}gebruiksratio per dag`.trim()}
              formatter={formatRatio}
              controls={
                <BetaSegmented<TripSource>
                  label="Bron"
                  value={ratioSource}
                  options={SOURCE_OPTIONS}
                  onChange={setRatioSource}
                />
              }
            />

            <TimeSeriesCard
              title="Percentage van de voertuigen niet beschikbaar"
              toelichting={
                <>
                  Aantal voertuigen in de openbare ruimte om 03:30 uur dat niet beschikbaar is, gedeeld door
                  het maximum aantal voertuigen in de openbare ruimte op die dag. Bij week en maand:
                  gemiddelde van de dagpercentages.
                </>
              }
              state={nietBeschikbaar}
              today={today}
              yLabel={`${avgPrefix}percentage niet beschikbaar`.trim()}
              formatter={formatPercent}
            />
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Verdelingen                                                   */}
          {/* ------------------------------------------------------------ */}
          <div className="DashboardBeleidsinfoBeta-section-header">
            <h2 className="DashboardBeleidsinfoBeta-section-title">Verdelingen</h2>
            <span className="DashboardBeleidsinfoBeta-period-label">
              Hele maanden: {formatPeriod(distributionPeriod.start, distributionPeriod.end)}
            </span>
          </div>
          <p className="DashboardBeleidsinfoBeta-section-subtitle">
            Deze gegevens zijn per maand beschikbaar. De gekozen periode wordt daarom afgerond naar hele
            kalendermaanden.
          </p>

          <div className="DashboardBeleidsinfoBeta-grid">
            <DistributionCard
              title="Verdeling van de verhuringen over de dag"
              toelichting={
                <>
                  Aantal verhuringen per dagdeel gedeeld door het totaal aantal verhuringen per modaliteit.
                  Het dagdeel wordt bepaald door de eindtijd van de verhuring.
                </>
              }
              state={verdelingDag}
              controls={
                <BetaSegmented<TripSource>
                  label="Bron"
                  value={usageDistributionSource}
                  options={SOURCE_OPTIONS}
                  onChange={setUsageDistributionSource}
                />
              }
            />

            <DistributionCard
              title="Verdeling verhuringen naar afstandsklasse (hemelsbreed)"
              toelichting={
                <>
                  Aantal beëindigde verhuringen per afstandsklasse (hemelsbreed tussen begin- en eindpunt),
                  gedeeld door het totaal aantal beëindigde verhuringen.
                </>
              }
              state={verdelingAfstand}
              opmerkingen={['Bron: MDS-Vehicles.']}
            />

            <DistributionCard
              title="Verdeling verhuringen naar afstandsklasse (over de weg)"
              toelichting={
                <>
                  Aantal beëindigde verhuringen per afstandsklasse, op basis van de afgelegde afstand die de
                  aanbieder meldt, gedeeld door het totaal aantal beëindigde verhuringen.
                </>
              }
              state={verdelingAfstandWeg}
              opmerkingen={['Bron: MDS-Trips.']}
            />

            <DistributionCard
              title="Verdeling verhuringen naar verhuurduur"
              toelichting={
                <>
                  Aantal beëindigde verhuringen per verhuurduurklasse, gedeeld door het totaal aantal
                  beëindigde verhuringen.
                </>
              }
              state={verdelingDuur}
              opmerkingen={[
                'Bron: MDS-Vehicles.',
                'N.a.v. gesprek BUAS: nog kijken naar de verhuurduur-categorieën.'
              ]}
            />
          </div>
        </>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Later                                                         */}
      {/* ------------------------------------------------------------ */}
      <div className="DashboardBeleidsinfoBeta-section-header">
        <h2 className="DashboardBeleidsinfoBeta-section-title">Later</h2>
      </div>
      <p className="DashboardBeleidsinfoBeta-section-subtitle">
        Onderwerpen uit het voorstel waarvoor nog geen data beschikbaar is, of waarvan grafiektype,
        legenda en assen nog bepaald moeten worden.
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
