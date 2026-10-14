/**
 * Transforms chart data so 0 values become null. Used with connectNulls={true}
 * on Line/Area components to connect the line across zero values instead of stopping.
 * @param {Array<Object>} data - Chart data with time/name and provider keys
 * @param {string[]} valueKeys - Keys to transform (e.g. provider names, 'Totaal'). Omit time/name.
 * @returns {Array<Object>} New data array with 0 replaced by null for value keys
 */
export const transformZerosToNullForChart = (data, valueKeys) => {
  if (!data?.length || !valueKeys?.length) return data ?? [];
  return data.map((row) => {
    const transformed = { ...row };
    valueKeys.forEach((key) => {
      if (key in transformed && Number(transformed[key]) === 0) {
        transformed[key] = null;
      }
    });
    return transformed;
  });
};

export const getOperatorStatsForChart = (data, aanbieders) => {
  let operators = {};
  aanbieders.forEach(a=>{ operators[a.system_id]=0 })
  data.forEach(timeframe=> {
    Object.keys(timeframe).forEach(key=>{
      // Skip if aanbieder wasn't found in 'aanbieders' metadata
      if(operators[key] === undefined) {
        return;
      }
      if(key!=='start_interval') {
        if(key in operators === false) { operators[key]=0; }
        operators[key]++;
      }
    })

  });
  return operators;
}
