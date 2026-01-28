import React from 'react';
import { useParams } from 'react-router-dom';
import DashboardPrestatiesAanbieders from './DashboardPrestatiesAanbieders';
import DashboardPrestatiesAanbiedersDetails from './DashboardPrestatiesAanbiedersDetails';

interface DashboardPageProps {

}

function DashboardPage(props: DashboardPageProps) {
  const { dashboard } = useParams<{ dashboard: string }>();

  if (dashboard === 'prestaties-aanbieders') {
    return <DashboardPrestatiesAanbieders />;
  }

  if (dashboard === 'prestaties-aanbieders-details') {
    return <DashboardPrestatiesAanbiedersDetails />;
  }

  // Default fallback for unknown dashboard types
  return (
    <div className="DashboardPage pt-4 pb-24">
      <h1>Dashboard niet gevonden</h1>
      <p>Het dashboard "{dashboard}" bestaat niet.</p>
    </div>
  );
}

export default DashboardPage;
