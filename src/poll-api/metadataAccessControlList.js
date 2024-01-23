const cPublicAanbieders = [
  { value:"cykl", system_id:"cykl", name:"Cykl" },
  { value:"donkey", system_id:"donkey", name:"Donkey" },
  { value:"htm", system_id:"htm", name:"HTM" },
  { value:"gosharing", system_id:"gosharing", name:"GO Sharing" },
  { value:"check", system_id:"check", name:"CHECK" },
  { value:"felyx", system_id:"felyx", name:"Felyx" },
  { value:"deelfietsnederland", system_id:"deelfietsnederland", name:"Deelfiets" },
  { value:"keobike", system_id:"keobike", name:"Keobike" },
  { value:"lime", system_id:"lime", name:"Lime" },
  { value:"baqme", system_id:"baqme", name:"BAQME" },
  { value:"cargoroo", system_id:"cargoroo", name:"Cargoroo" },
  { value:"uwdeelfiets", system_id:"uwdeelfiets", name:"uwdeelfiets" },
  { value:"hely", system_id:"hely", name:"Hely" },
  { value:"tier", system_id:"tier", name:"TIER" },
  { value:"bird", system_id:"bird", name:"Bird" },
  { value:"bolt", system_id:"bolt", name:"Bolt" },
  { value:"bondi", system_id:"bondi", name:"Bondi" },
  { value:"dott", system_id:"dott", name:"Dott" },
  { value:"moveyou", system_id:"moveyou", name:"MoveYou" },
];

const isDutchDashboardDeelmobiliteit = document.location.host.indexOf('dashboarddeelmobiliteit.nl') > -1;

const cPublicGebieden = isDutchDashboardDeelmobiliteit
  ? [
    { gm_code:"", name:"Alle plaatsen" }, { gm_code:"GM0518", name:"'s-Gravenhage" }, { gm_code:"GM0796", name:"'s-Hertogenbosch" }, { gm_code:"GM0613", name:"Albrandswaard" }, { gm_code:"GM0141", name:"Almelo" }, { gm_code:"GM0034", name:"Almere" }, { gm_code:"GM0484", name:"Alphen aan den Rijn" }, { gm_code:"GM0307", name:"Amersfoort" }, { gm_code:"GM0362", name:"Amstelveen" }, { gm_code:"GM0363", name:"Amsterdam" }, { gm_code:"GM0200", name:"Apeldoorn" }, { gm_code:"GM0202", name:"Arnhem" }, { gm_code:"GM0106", name:"Assen" }, { gm_code:"GM0489", name:"Barendrecht" }, { gm_code:"GM0203", name:"Barneveld" }, { gm_code:"GM0373", name:"Bergen (NH" }, { gm_code:"GM0753", name:"Best" }, { gm_code:"GM0375", name:"Beverwijk" }, { gm_code:"GM0377", name:"Bloemendaal" }, { gm_code:"GM0758", name:"Breda" }, { gm_code:"GM0312", name:"Bunnik" }, { gm_code:"GM0313", name:"Bunschoten" }, { gm_code:"GM0502", name:"Capelle aan den IJssel" }, { gm_code:"GM0310", name:"De Bilt" }, { gm_code:"GM0736", name:"De Ronde Venen" }, { gm_code:"GM0503", name:"Delft" }, { gm_code:"GM0150", name:"Deventer" }, { gm_code:"GM0384", name:"Diemen" }, { gm_code:"GM0505", name:"Dordrecht" }, { gm_code:"GM0512", name:"Gorinchem" }, { gm_code:"GM0228", name:"Ede" }, { gm_code:"GM0772", name:"Eindhoven" }, { gm_code:"GM0153", name:"Enschede" }, { gm_code:"GM0232", name:"Epe" }, { gm_code:"GM1771", name:"Geldrop-Mierlo" }, { gm_code:"GM1942", name:"Gooise Meren" }, { gm_code:"GM0014", name:"Groningen" }, { gm_code:"GM0392", name:"Haarlem" }, { gm_code:"GM0394", name:"Haarlemmermeer" }, { gm_code:"GM0243", name:"Harderwijk" }, { gm_code:"GM0246", name:"Heerde" }, { gm_code:"GM0794", name:"Helmond" }, { gm_code:"GM0164", name:"Hengelo" }, { gm_code:"GM0798", name:"Hilvarenbeek" }, { gm_code:"GM0402", name:"Hilversum" }, { gm_code:"GM0353", name:"IJsselstein" }, { gm_code:"GM0166", name:"Kampen" }, { gm_code:"GM0542", name:"Krimpen aan den IJssel" }, { gm_code:"GM1621", name:"Lansingerland" }, { gm_code:"GM0080", name:"Leeuwarden" }, { gm_code:"GM1916", name:"Leidschendam-Voorburg" }, { gm_code:"GM0327", name:"Leusden" }, { gm_code:"GM0809", name:"Loon op Zand" }, { gm_code:"GM0556", name:"Maassluis" }, { gm_code:"GM1842", name:"Midden-Delfland" }, { gm_code:"GM1952", name:"Midden-Groningen" }, { gm_code:"GM0356", name:"Nieuwegein" }, { gm_code:"GM0267", name:"Nijkerk" }, { gm_code:"GM0268", name:"Nijmegen" }, { gm_code:"GM1930", name:"Nissewaard" }, { gm_code:"GM0820", name:"Nuenen, Gerwen en Nederwetten" }, { gm_code:"GM0302", name:"Nunspeet" }, { gm_code:"GM0826", name:"Oosterhout" }, { gm_code:"GM0431", name:"Oostzaan" }, { gm_code:"GM1926", name:"Pijnacker-Nootdorp" }, { gm_code:"GM0273", name:"Putten" }, { gm_code:"GM0597", name:"Ridderkerk" }, { gm_code:"GM0603", name:"Rijswijk" }, { gm_code:"GM1674", name:"Roosendaal" }, { gm_code:"GM0599", name:"Rotterdam" }, { gm_code:"GM0606", name:"Schiedam" }, { gm_code:"GM0848", name:"Son en Breugel" }, { gm_code:"GM0855", name:"Tilburg" }, { gm_code:"GM1730", name:"Tynaarlo" }, { gm_code:"GM0344", name:"Utrecht" }, { gm_code:"GM1581", name:"Utrechtse Heuvelrug" }, { gm_code:"GM0861", name:"Veldhoven" }, { gm_code:"GM0622", name:"Vlaardingen" }, { gm_code:"GM0865", name:"Vught" }, { gm_code:"GM0866", name:"Waalre" }, { gm_code:"GM0867", name:"Waalwijk" }, { gm_code:"GM0289", name:"Wageningen" }, { gm_code:"GM0629", name:"Wassenaar" }, { gm_code:"GM1960", name:"West Betuwe" }, { gm_code:"GM1783", name:"Westland" }, { gm_code:"GM0637", name:"Zoetermeer" }, { gm_code:"GM0642", name:"Zwijndrecht" }, { gm_code:"GM0193", name:"Zwolle" }
  ]
  : [
    { gm_code:"cnis5:44021", name:"Gent" },
    { gm_code:"cnis5:21001", name:"Anderlecht" }
  ];

// id should correspond to the api filter values
const cPublicVoertuigTypes = [
    { id: 'bicycle', name: 'Fiets'},
    { id: 'cargo_bicycle', name: 'Bakfiets'},
    { id: 'moped', name: 'Scooter'},
    { id: 'car', name: 'Auto'},
    { id: 'unknown', name: 'Onbekend'},
]

// var store_accesscontrollist = undefined;
const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};

export const initAccessControlList = (store_accesscontrollist)  => {
  try {
    if(undefined===store_accesscontrollist) {
      // console.log("no redux state available yet - skipping metadata update");
      return false;
    }
    
    const state = store_accesscontrollist.getState();
    if(!isLoggedIn(state)) {
      // console.log("initialize ACL Data (not logged in)")
      // items -> {"name": "Cykl","system_id": "cykl"}
      store_accesscontrollist.dispatch({ type: 'SET_GEBIEDEN', payload: cPublicGebieden});
      
      // items -> {"name": "Cykl","system_id": "cykl"}
      store_accesscontrollist.dispatch({ type: 'SET_AANBIEDERS', payload: cPublicAanbieders});

      let types = cPublicVoertuigTypes; // TODO: get from ACL once implemented
      store_accesscontrollist.dispatch({ type: 'SET_VEHICLE_TYPES', payload: types});

      store_accesscontrollist.dispatch({ type: 'SET_METADATA_LOADED', payload: true});
    } else {
      // console.log("initialize ACL Data (logged in)")
      let url=`${process.env.REACT_APP_MAIN_API_URL}/dashboard-api/menu/acl`;
      let options = { headers : { "authorization": "Bearer " + state.authentication.user_data.token }}
      
      store_accesscontrollist.dispatch({type: 'SHOW_LOADING', payload: true});
      
      fetch(url, options).then((response) => {
        if(!response.ok) {
          console.error("unable to fetch: %o", response);
          return false
        }

        response.json()
          .then((metadata) => {
            // items -> {"name": "Cykl","system_id": "cykl"}
            // console.log("dispatch gebieden ", metadata.municipalities);
            store_accesscontrollist.dispatch({ type: 'SET_GEBIEDEN', payload: metadata.municipalities});
            if(metadata.municipalities.length===1) {
              store_accesscontrollist.dispatch({ type: 'SET_FILTER_GEBIED', payload: metadata.municipalities[0].gm_code});
            } else {
              // Reset filterGebied if user has access to no or multiple gebieden
              store_accesscontrollist.dispatch({ type: 'SET_FILTER_GEBIED', payload: ""});
            }
            
            // items -> {"name": "Cykl","system_id": "cykl"}
            store_accesscontrollist.dispatch({ type: 'SET_AANBIEDERS', payload: metadata.operators});

            // items -> {"id": 1, "name": "asdfasdfadfa" }
            let types = cPublicVoertuigTypes; // TODO: get from ACL once implemented
            store_accesscontrollist.dispatch({ type: 'SET_VEHICLE_TYPES', payload: types});
            
            store_accesscontrollist.dispatch({ type: 'SET_METADATA_LOADED', payload: true});
          })
        }).catch(ex=>{
          console.error("unable to decode JSON");
        }).finally(()=>{
          store_accesscontrollist.dispatch({type: 'SHOW_LOADING', payload: false});
        })
        return true;
      }
  } catch(ex) {
    // console.error("Unable to update ACL", ex)
    store_accesscontrollist.dispatch({type: 'SHOW_LOADING', payload: false});
    return false;
  }
}