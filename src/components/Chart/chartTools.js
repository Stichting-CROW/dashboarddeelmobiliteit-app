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
