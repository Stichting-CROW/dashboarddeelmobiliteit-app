import React from 'react';
import './DashboardPrestatiesAanbieders.css';
import PageTitle from '../../components/common/PageTitle';

interface DashboardPrestatiesAanbiedersDetailsProps {

}

function DashboardPrestatiesAanbiedersDetails(props: DashboardPrestatiesAanbiedersDetailsProps) {
  return (
    <div className="DashboardPrestatiesAanbiedersDetails pt-4 pb-24">
      <PageTitle>Prestaties Aanbieders Details</PageTitle>
      <p>Details pagina voor prestaties aanbieders.</p>
    </div>
  );
}

export default DashboardPrestatiesAanbiedersDetails;
