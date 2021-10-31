import './Filterbar.css';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilteritemDatum from './FilteritemDatum.jsx';
import FilteritemAanbieders from './FilteritemAanbieders.jsx';
import FilteritemZones from './FilteritemZones.jsx';

function Filterbar() {
  return (
    <div className="box-border p-2 pb-0">
      <div className="flex bg-gray-400 rounded-lg p-2 w-full grid grid-cols-4 gap-4">
        <FilteritemGebieden />
        <FilteritemZones />
        <FilteritemDatum />
        <FilteritemAanbieders />
      </div>
    </div>
    )
}

export default Filterbar;
