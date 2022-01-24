export const getOperatorStatsForChart = (data, aanbieders) => {
  let operators = {};
  aanbieders.forEach(a=>{ operators[a.system_id]=0 })
  data.forEach(row=> {
    Object.keys(row).forEach(key=>{
      if(key!=='start_interval') {
        if(key in operators === false) { operators[key]=0; }
        operators[key]++;
      }
    })
  });
  
  return operators;
}

