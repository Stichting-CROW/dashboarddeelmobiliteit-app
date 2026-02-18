import React from 'react';
import PageTitle from '../../components/common/PageTitle';
import BeleidszonesVehiclesChart from '../../components/Chart/BeleidszonesVehiclesChart';
import BeleidszonesRentalsChart from '../../components/Chart/BeleidszonesRentalsChart';

function DashboardBeleidszones() {
  return (
    <div className="DashboardBeleidszones pt-12 pb-24">
      <PageTitle className="my-2">Beleidszones</PageTitle>

      <div className="xl:flex">
        <div className="xl:flex-1 mt-8 xl:mt-0">
          <BeleidszonesVehiclesChart
            title="Percentage voertuigen in hubs"
          />
        </div>
        <div className="xl:flex-1 mt-8 xl:mt-0">
          <BeleidszonesRentalsChart
            title="Percentage verhuringen in hubs"
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardBeleidszones;
