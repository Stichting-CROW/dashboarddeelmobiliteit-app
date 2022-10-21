import { useState, useEffect } from 'react';
import { Redirect, useLocation,  } from "react-router-dom";

const renderTableRow = () => {
  return <div className="Table-tr flex justify-between">
    <div className="Table-td"></div>
    <div className="Table-td"></div>
    <div className="Table-td"></div>
    <div className="Table-td"></div>
  </div>
}

export default function LoginStats() {
  return (
    <div className="">
      <h1 className="
        text-4xl
        font-bold
      ">
        Login-statistieken
      </h1>
      <div className="Table-tr flex justify-between">
        <div className="Table-th font-bold">Datum</div>
        <div className="Table-th font-bold"># gemeentes</div>
        <div className="Table-th font-bold"># aanbieders</div>
        <div className="Table-th font-bold"># admins</div>
      </div>
      {renderTableRow()}
    </div>
  );
}
