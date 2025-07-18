import moment from 'moment';
import { APIPermitResultCurrent, settingsrow } from './Permits';

export const generateMockSettingstable = async (
    municipality_gmcode: string | undefined, 
    voertuigtypes: string[],
    operators: {name: string, system_id: string, color: string}[],
  ): Promise<settingsrow[]> => {
    if("" === municipality_gmcode) {
      console.warn('generateMockOccupancyCurrent: no municipality selected')
      return []
    }
  
    const startYear = moment().subtract(5, 'years').year();
    const endYear = moment().year();

    const min_pct_duration_correct = Math.floor(80 + Math.random() * 15);
    const min_rides_per_vehicle_pct_correct = Math.floor(80 + Math.random() * 15);
    const max_vehicles_illegally_parked_count = Math.floor(2 + Math.random() * 1);
  
    const settingstable: settingsrow[] = [];
    operators.forEach((operator) => {
      voertuigtypes.forEach((voertuigtype) => {
        for (let year = startYear; year <= endYear; year++) {
          const valid_from_iso8601 = moment(`${year}-07-18`).format('YYYY-MM-DD');
          const valid_until_iso8601 = moment(`${year + 1}-07-18`).format('YYYY-MM-DD');
          settingstable.push({
            municipality: municipality_gmcode,
            voertuigtype: voertuigtype,
            operator_system_id: operator.system_id,
            valid_from_iso8601,
            valid_until_iso8601,
            min_capacity: 20,
            max_capacity: 200,
            min_pct_duration_correct,
            min_rides_per_vehicle_pct_correct,
            max_vehicles_illegally_parked_count,
          });
        }
      });
    });
  
    return settingstable;
  }
  
  export const generateMockOccupancyCurrent = (
    settingstable: settingsrow[],
    availableOperatorSystemIds: string[],
    timestamp_iso8601: string,
  ): APIPermitResultCurrent[] => {
    const data: APIPermitResultCurrent[] = [];
  
    if(!settingstable) {
      console.warn('generateMockOccupancyCurrent: no settingstable found')
      return [];
    }
  
    // Only include rows where timestamp_iso8601 is within the interval
    const filteredsettingstable = settingstable.filter((settingsrow) => {
      const operatorIsIncluded = availableOperatorSystemIds.includes(settingsrow.operator_system_id) || availableOperatorSystemIds.length===0;
      const intervalIsIncluded = moment(timestamp_iso8601).isSameOrAfter(settingsrow.valid_from_iso8601) &&
        moment(timestamp_iso8601).isBefore(settingsrow.valid_until_iso8601);
  
      return operatorIsIncluded && intervalIsIncluded;
    });
  
    filteredsettingstable.forEach((settingsrow, index) => {
      // Generate current_capacity with 10% below min, 20% above max, rest in [min, max]
      let current_capacity: number;
      const rand = Math.random();
      const min = settingsrow.min_capacity;
      const max = settingsrow.max_capacity;
      if (rand < 0.1) {
        // 10% below min
        current_capacity = Math.max(0, min - Math.floor(Math.random() * Math.max(1, min)));
      } else if (rand < 0.3) {
        // 20% above max (up to max * 1.2)
        const overMax = max + Math.floor(Math.random() * Math.max(1, Math.round(max * 0.2)));
        current_capacity = overMax;
      } else {
        // 70% between min and max
        current_capacity = min + Math.floor(Math.random() * (max - min + 1));
      }

      // fill in pct_duration_correct with random values 50 and 100, 80% of the lines should be < 80%, pct_duration_violation should be 100 - pct_duration_correct
      let pct_duration_correct: number;
      if (Math.random() < 0.8) {
        // 80% of the time, less than 80
        pct_duration_correct = Math.floor(50 + Math.random() * 30); // 50-79
      } else {
        // 20% of the time, 80-100
        pct_duration_correct = Math.floor(80 + Math.random() * 21); // 80-100
      }

      // fill in vehicles_illegally_parked_count with a random value between 0 and 5 (it should always be less than current_capacity)
      const vehicles_illegally_parked_count = Math.floor(Math.random() * Math.min(5, current_capacity));

      let pct_rides_per_vehicle_correct: number;
      if (Math.random() < 0.8) {
        // 80% of the time, less than 80
        pct_rides_per_vehicle_correct = Math.floor(50 + Math.random() * 30); // 50-79
      } else {
        // 20% of the time, 80-100
        pct_rides_per_vehicle_correct = Math.floor(80 + Math.random() * 21); // 80-100
      }

      data.push({
        // properties
        id: index,
        municipality: settingsrow.municipality,
        voertuigtype: settingsrow.voertuigtype,
        operator_system_id: settingsrow.operator_system_id,
        valid_from_iso8601: settingsrow.valid_from_iso8601,
        valid_until_iso8601: settingsrow.valid_until_iso8601,
        min_capacity: settingsrow.min_capacity,
        max_capacity: settingsrow.max_capacity,
        min_pct_duration_correct: settingsrow.min_pct_duration_correct,
        min_rides_per_vehicle_pct_correct: settingsrow.min_rides_per_vehicle_pct_correct,
        max_vehicles_illegally_parked_count: settingsrow.max_vehicles_illegally_parked_count,

        // kpi
        current_capacity,
        pct_duration_correct,
        pct_rides_per_vehicle_correct,
        vehicles_illegally_parked_count
      });
    });
  
    return data;
  }
  
  