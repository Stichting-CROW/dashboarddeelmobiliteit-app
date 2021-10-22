import { useState } from 'react';
import './Filterbar.css';
import { useDispatch, useSelector } from 'react-redux';

function Filterbar() {
  const dispatch = useDispatch()
  
  const filterGebied = useSelector(state => {
    return state.filter ? state.filter.gebied : 0;
  });
  
  const filterAanbieders = useSelector(state => {
    return state.filter ? state.filter.aanbieders : [];
  });
  
  let [showSelectGebied, setShowSelectGebied] = useState(false);
  // let [showSelectZone, setShowSelectZone] = useState(false);
  // let [showSelectDatum, setShowSelectDatum] = useState(false);
  let [showSelectAanbieder, setShowSelectAanbieder] = useState(false);
  
  const setFilterGebied = (gebied) => {
    dispatch({
      type: 'SET_FILTER_GEBIED',
      payload: gebied
    })
  }
  
  const addToFilterAanbieders = (aanbieder) => {
    dispatch({ type: 'ADD_TO_FILTER_AANBIEDERS', payload: aanbieder })
  }
  const removeFromFilterAanbieders = (aanbieder) => {
    dispatch({ type: 'REMOVE_FROM_FILTER_AANBIEDERS', payload: aanbieder })
  }
    
  const renderModal = (content, closeFunction) => {
    return (
      <>
        <div
          className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
           onClick={() => closeFunction(false)}
        >
          <div className="relative w-auto my-6 mx-auto max-w-3xl">
            {/*content*/}
            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
              { content }
              <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                <button
                  className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                  type="button"
                  onClick={() => closeFunction(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="opacity-25 fixed inset-0 z-40 bg-black" />
      </>
    )
  }
  
  const renderSelectGebied = () => {
    let gebieden = [
        { value:"", name:"Alle Gebieden" }, { value:"GM0518", name:"'s-Gravenhage" }, { value:"GM0796", name:"'s-Hertogenbosch" }, { value:"GM0613", name:"Albrandswaard" }, { value:"GM0141", name:"Almelo" }, { value:"GM0034", name:"Almere" }, { value:"GM0484", name:"Alphen aan den Rijn" }, { value:"GM0307", name:"Amersfoort" }, { value:"GM0362", name:"Amstelveen" }, { value:"GM0363", name:"Amsterdam" }, { value:"GM0200", name:"Apeldoorn" }, { value:"GM0202", name:"Arnhem" }, { value:"GM0106", name:"Assen" }, { value:"GM0489", name:"Barendrecht" }, { value:"GM0203", name:"Barneveld" }, { value:"GM0373", name:"Bergen (NH" }, { value:"GM0753", name:"Best" }, { value:"GM0375", name:"Beverwijk" }, { value:"GM0377", name:"Bloemendaal" }, { value:"GM0758", name:"Breda" }, { value:"GM0312", name:"Bunnik" }, { value:"GM0313", name:"Bunschoten" }, { value:"GM0502", name:"Capelle aan den IJssel" }, { value:"GM0310", name:"De Bilt" }, { value:"GM0736", name:"De Ronde Venen" }, { value:"GM0503", name:"Delft" }, { value:"GM0150", name:"Deventer" }, { value:"GM0384", name:"Diemen" }, { value:"GM0505", name:"Dordrecht" }, { value:"GM0228", name:"Ede" }, { value:"GM0772", name:"Eindhoven" }, { value:"GM0153", name:"Enschede" }, { value:"GM0232", name:"Epe" }, { value:"GM1771", name:"Geldrop-Mierlo" }, { value:"GM1942", name:"Gooise Meren" }, { value:"GM0014", name:"Groningen" }, { value:"GM0392", name:"Haarlem" }, { value:"GM0394", name:"Haarlemmermeer" }, { value:"GM0243", name:"Harderwijk" }, { value:"GM0246", name:"Heerde" }, { value:"GM0794", name:"Helmond" }, { value:"GM0164", name:"Hengelo" }, { value:"GM0798", name:"Hilvarenbeek" }, { value:"GM0402", name:"Hilversum" }, { value:"GM0353", name:"IJsselstein" }, { value:"GM0166", name:"Kampen" }, { value:"GM0542", name:"Krimpen aan den IJssel" }, { value:"GM1621", name:"Lansingerland" }, { value:"GM0080", name:"Leeuwarden" }, { value:"GM1916", name:"Leidschendam-Voorburg" }, { value:"GM0327", name:"Leusden" }, { value:"GM0809", name:"Loon op Zand" }, { value:"GM0556", name:"Maassluis" }, { value:"GM1842", name:"Midden-Delfland" }, { value:"GM1952", name:"Midden-Groningen" }, { value:"GM0356", name:"Nieuwegein" }, { value:"GM0267", name:"Nijkerk" }, { value:"GM0268", name:"Nijmegen" }, { value:"GM1930", name:"Nissewaard" }, { value:"GM0820", name:"Nuenen, Gerwen en Nederwetten" }, { value:"GM0302", name:"Nunspeet" }, { value:"GM0826", name:"Oosterhout" }, { value:"GM0431", name:"Oostzaan" }, { value:"GM1926", name:"Pijnacker-Nootdorp" }, { value:"GM0273", name:"Putten" }, { value:"GM0597", name:"Ridderkerk" }, { value:"GM0603", name:"Rijswijk" }, { value:"GM1674", name:"Roosendaal" }, { value:"GM0599", name:"Rotterdam" }, { value:"GM0606", name:"Schiedam" }, { value:"GM0848", name:"Son en Breugel" }, { value:"GM0855", name:"Tilburg" }, { value:"GM1730", name:"Tynaarlo" }, { value:"GM0344", name:"Utrecht" }, { value:"GM1581", name:"Utrechtse Heuvelrug" }, { value:"GM0861", name:"Veldhoven" }, { value:"GM0622", name:"Vlaardingen" }, { value:"GM0865", name:"Vught" }, { value:"GM0866", name:"Waalre" }, { value:"GM0867", name:"Waalwijk" }, { value:"GM0289", name:"Wageningen" }, { value:"GM0629", name:"Wassenaar" }, { value:"GM1960", name:"West Betuwe" }, { value:"GM1783", name:"Westland" }, { value:"GM0637", name:"Zoetermeer" }, { value:"GM0642", name:"Zwijndrecht" }, { value:"GM0193", name:"Zwolle" }
      ];
      
      if(!showSelectGebied) {
        let item = gebieden.find(item=>item.value===filterGebied) || "";
        return item ? <span key={'gebied-'+item.value}>{item.name}</span>: null
      } else {
        return  (
          <div class="relative inline-block w-full text-gray-700">
            <select class="w-full h-10 pl-3 pr-6 text-base placeholder-gray-600 border rounded-lg appearance-none focus:shadow-outline" placeholder="Selecteer Gebied" name="area"
              value={filterGebied}
              onChange={e=>{setShowSelectGebied(false);setFilterGebied(e.target.value);}}>
              { gebieden.map(g=><option key={'go-'+g.value} value={g.value} id={g.value}>{g.name}</option>) }
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>
            </div>
          </div>
        )
      }
  }
  
  // const renderSelectZone = () => {
  //   let content = (
  //     <>
  //       <br />
  //       <span className="filter-selected">Alle zones</span>
  //       <form className="filter-options" id="filter-zone">
  //          <span className="hint">Selecteer eerst een gemeente</span>
  //       </form>
  //     </>
  //   )
  //   return renderModal(content,setShowSelectZone)
  // }
  //
  // const renderSelectDatum = () => {
  //   let hours = [];
  //   for(let h=0;h<24;h++) { hours.push(h.toString())};
  //   let minutes = ["0", "15", "30", "45"];
  //   let months = ["Jan","Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  //   let dates = [];
  //   for(let d=1;d<31;d++) { dates.push(d.toString())};
  //   let years = [];
  //   for(let y=2000;y<2031;y++) { years.push(y.toString())};
  //
  //   let content = (
  //     <>
  //     <span className="filter-selected"><span>22-10-2021 11:15</span></span>
  //     <div className="filter-options">
  //        <div id="date" className=" mtr-datepicker">
  //           <div className="mtr-row">
  //              <div className="mtr-input-slider" id="date-input-hours">
  //                 <div className="mtr-arrow up"><span></span></div>
  //                 <div className="mtr-content">
  //                    <input type="text" className="mtr-input hours" data-old-value="11" />
  //                    <div className="mtr-values">
  //                    { hours.map(h=>{
  //                         return (
  //                           <div className="mtr-default-value-holder" data-value={h}>
  //                              <div className="mtr-default-value" data-value={h}>{h}</div>
  //                           </div>
  //                         )
  //                    })}
  //                 </div>
  //                 <div className="mtr-arrow down"><span></span></div>
  //              </div>
  //              <div className="mtr-input-slider" id="date-input-minutes">
  //                 <div className="mtr-arrow up"><span></span></div>
  //                 <div className="mtr-content">
  //                   <input type="text" className="mtr-input minutes" data-old-value="15" />
  //                   <div className="mtr-values">
  //                   { minutes.map((m,i)=>{
  //                        return (
  //                          <div className="mtr-default-value-holder" data-value={i}>
  //                             <div className="mtr-default-value" data-value={i}>{m}</div>
  //                          </div>
  //                        )
  //                   })}
  //                   </div>
  //                 <div className="mtr-arrow down"><span></span></div>
  //              </div>
  //           </div>
  //           <div className="mtr-clearfix"></div>
  //           <div className="mtr-row">
  //              <div className="mtr-input-slider" id="date-input-months">
  //                 <div className="mtr-arrow up"><span></span></div>
  //                 <div className="mtr-content">
  //                    <input type="text" className="mtr-input months" data-old-value="9" />
  //                    <div className="mtr-values">
  //                    { months.map((m,i)=>{
  //                         return (
  //                           <div className="mtr-default-value-holder" data-value={i}>
  //                             <div className="mtr-default-value has-name" data-value={i}>{i+1}</div>
  //                              <div className="mtr-default-value-name" data-value={i}>{m}</div>
  //                           </div>
  //                         )
  //                    })}
  //                    </div>
  //                 </div>
  //                 <div className="mtr-arrow down"><span></span></div>
  //              </div>
  //              <div className="mtr-input-slider" id="date-input-dates">
  //                 <div className="mtr-arrow up"><span></span></div>
  //                 <div className="mtr-content">
  //                    <input type="text" className="mtr-input dates" data-old-value="22" />
  //                    <div className="mtr-values">
  //                    { dates.map((d,i)=>{
  //                         return (
  //                           <div className="mtr-default-value-holder" data-value={i}>
  //                             <div className="mtr-default-value has-name" data-value={i}>{i+1}</div>
  //                              <div className="mtr-default-value-name" data-value={i}>{d}</div>
  //                           </div>
  //                         )
  //                    })}
  //                    </div>
  //                 </div>
  //                 <div className="mtr-arrow down"><span></span></div>
  //              </div>
  //              <div className="mtr-input-slider" id="date-input-years">
  //                 <div className="mtr-arrow up"><span></span></div>
  //                 <div className="mtr-content">
  //                    <input type="text" className="mtr-input years" data-old-value="2021" />
  //                    <div className="mtr-values">
  //                        { dates.map((d,i)=>{
  //                             return (
  //                               <div className="mtr-default-value-holder" data-value={d}>
  //                                 <div className="mtr-default-value" data-value={d}>{d}</div>
  //                               </div>
  //                             )
  //                        })}
  //                    </div>
  //                 </div>
  //                 <div className="mtr-arrow down"><span></span></div>
  //              </div>
  //           </div>
  //           <div className="mtr-clearfix"></div>
  //         </div>
  //       </div>
  //       </div>
  //       </div>
  //     </>
  //   )
  //
  //   return renderModal(content,setShowSelectDatum)
  // }
  
  const renderSelectAanbieders = () => {
    let aanbieders = [
      { value:"cykl", name:"Cykl" },
      { value:"flickbike", name:"Flickbike" },
      { value:"donkey", name:"Donkey" },
      { value:"mobike", name:"Mobike" },
      { value:"htm", name:"HTM" },
      { value:"gosharing", name:"GO" },
      { value:"check", name:"CHECK" },
      { value:"felyx", name:"Felyx" },
      { value:"deelfietsnederland", name:"Deelfiets" },
      { value:"keobike", name:"Keobike" },
      { value:"lime", name:"Lime" },
      { value:"baqme", name:"BAQME" },
      { value:"cargoroo", name:"Cargoroo" },
      { value:"uwdeelfiets", name:"uwdeelfiets" },
      { value:"hely", name:"Hely" }
    ]
    
    if(!showSelectAanbieder) {
      let all = aanbieders
                  .filter(a=>filterAanbieders.includes(a.value))
                  .map(a=><span key={'sa-'+a.value}>{a.name}</span>)
      if(all.length===0) {
        all.push("Alle aanbieders");
      }
      return all;
    } else {
      return  renderModal(
        <div className="filter-options" id="filter-operator">
            { aanbieders.map((a,i)=>{
                let isSelected = filterAanbieders.includes(a.value);
                if(isSelected) {
                  return (<div key={'item-'+a.value} className="checkbox" onClick={e=>{ e.stopPropagation(); removeFromFilterAanbieders(a.value)}}>{a.name} (Selected)</div>)
                } else {
                  return (<div key={'item-'+a.value} className="checkbox" onClick={e=>{ e.stopPropagation(); addToFilterAanbieders(a.value)}}>{a.name}</div>)
                }
              })
            }
        </div>, setShowSelectAanbieder)
    }
  }
  
  // <div className="filter select-box multiple filter-zone">
  //    <div className="filter-name"  onClick={e=>{setShowSelectZone(!showSelectZone)}}>
  //      <span>Zone</span>
  //      { showSelectZone ? renderSelectZone() : null }
  //    </div>
  // </div>
  // <div className="filter date">
  //    <div className="filter-name"  onClick={e=>{setShowSelectDatum(!showSelectDatum)}}>
  //      <span>Datum &amp; tijd</span>
  //      { showSelectDatum ? renderSelectDatum() : null }
  //    </div>
  // </div>
  
  return (
    <div className="filter-bar">
       <div className="filter radio-box filter-area">
          <div className="filter-name" onClick={e=>{setShowSelectGebied(!showSelectGebied)}}>
            <span>Gebieden</span>
          </div>
          { renderSelectGebied() }
       </div>
       <div className="filter select-box multiple filter-operator">
          <div className="filter-name"  onClick={e=>{setShowSelectAanbieder(!showSelectAanbieder)}}>
            <span>Aanbieders</span><br />
            { renderSelectAanbieders() }
          </div>
       </div>
    </div>
    )
}

export default Filterbar;
