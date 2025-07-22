import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { marked } from 'marked';

import Logo from '../Logo.jsx';

const GuestIntroduction = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <Logo />
        <h1 className="text-4xl font-bold text-gray-900 mt-8 mb-4">
          Dashboard Deelmobiliteit
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Welkom bij het Dashboard Deelmobiliteit - je centrale platform voor inzicht in deelmobiliteit in Nederland
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🚲 Wat is het Dashboard?
          </h2>
          <p className="text-gray-700 mb-4">
            Het Dashboard Deelmobiliteit is een webtool die real-time data verzamelt van meer dan 19.000 deelvoertuigen in Nederland. 
            Het biedt <b>overheden</b> en andere belanghebbenden inzicht in deelmobiliteit om beleid te ontwikkelen en evalueren.
          </p>
          <ul className="text-gray-700 space-y-2">
            <li>Real-time positie van deelvoertuigen</li>
            <li>Verhuurpatronen en bezettingsgraad</li>
            <li>Geografische analyses per gemeente</li>
            <li>Downloadbare rapportages</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📊 Wat kun je zien?
          </h2>
          <p className="text-gray-700 mb-4">
            Als gast kun je een beperkte versie van het dashboard bekijken. Een account is alleen beschikbaar voor deelmobiliteits-aanbieders en overheden. Na inloggen krijg je toegang tot:
          </p>
          <ul className="text-gray-700 space-y-2">
            <li>Interactieve kaarten met voertuiglocaties</li>
            <li>Verhuurstatistieken en trends</li>
            <li>Gedetailleerde analyses per gebied</li>
            <li>Exportmogelijkheden voor data</li>
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Waarom deelmobiliteit monitoren?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌱</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Duurzaamheid</h3>
            <p className="text-gray-700">
              Inzicht in gebruik van deelvoertuigen helpt bij het bevorderen van duurzame mobiliteit
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏙️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stedelijke Planning</h3>
            <p className="text-gray-700">
              Data-gedreven beslissingen voor infrastructuur en parkeerbeleid
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Effectiviteit</h3>
            <p className="text-gray-700">
              Evalueren van deelmobiliteit-initiatieven en optimaliseren van dienstverlening
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Hoe werkt het?
        </h2>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
              1
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Data Verzameling</h3>
              <p className="text-gray-700">
                Elke 30 seconden worden posities van deelvoertuigen verzameld via internationale datastandaarden (MDS, GBFS), zoals voorgeschreven door het Nederlands Profiel.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
              2
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analyse & Verwerking</h3>
              <p className="text-gray-700">
                Data wordt verwerkt tot parkeergebeurtenissen en verhuringen, opgeslagen in een centrale database, zoals voorgeschreven door het Nederlands Profiel.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
              3
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Visualisatie</h3>
              <p className="text-gray-700">
                Interactieve kaarten, grafieken en tabellen maken de data toegankelijk en inzichtelijk.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Voor wie is het Dashboard?
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">🏛️ Overheden</h3>
            <ul className="text-gray-700 space-y-2">
              <li>Gemeenten en provincies</li>
              <li>Beleidsmakers en planners</li>
              <li>Verkeerskundigen</li>
              <li>Duurzaamheidscoördinatoren</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">🏢 Aanbieders</h3>
            <ul className="text-gray-700 space-y-2">
              <li>Deel(bak)fiets-aanbieders</li>
              <li>Deelscooter-aanbieders</li>
              <li>Deelauto-aanbieders</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="bg-blue-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            Klaar om te beginnen?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Log in om toegang te krijgen tot alle functionaliteiten van het Dashboard Deelmobiliteit. 
            Neem contact op voor een account of bekijk de functionaliteiten van de publieke app.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Inloggen
            </button>
            <button
              onClick={() => navigate('/map/park')}
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Publieke app bekijken
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-gray-600">
        <p className="mb-4">
          Het Dashboard Deelmobiliteit wordt ontwikkeld in samenwerking met Nederlandse overheden en aanbieders.
        </p>
        <p>
          Vragen? Neem contact op via{' '}
          <a 
            href="mailto:info@dashboarddeelmobiliteit.nl" 
            className="text-theme-blue hover:text-blue-800 underline"
          >
            info@dashboarddeelmobiliteit.nl
          </a>
        </p>
      </div>
    </div>
  );
};

export default GuestIntroduction; 