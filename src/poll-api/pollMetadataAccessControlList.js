const cPublicAanbieders = [
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
  ];
  
const cPublicGebieden = [
  { gm_code:"", name:"Alle Gebieden" }, { gm_code:"GM0518", name:"'s-Gravenhage" }, { gm_code:"GM0796", name:"'s-Hertogenbosch" }, { gm_code:"GM0613", name:"Albrandswaard" }, { gm_code:"GM0141", name:"Almelo" }, { gm_code:"GM0034", name:"Almere" }, { gm_code:"GM0484", name:"Alphen aan den Rijn" }, { gm_code:"GM0307", name:"Amersfoort" }, { gm_code:"GM0362", name:"Amstelveen" }, { gm_code:"GM0363", name:"Amsterdam" }, { gm_code:"GM0200", name:"Apeldoorn" }, { gm_code:"GM0202", name:"Arnhem" }, { gm_code:"GM0106", name:"Assen" }, { gm_code:"GM0489", name:"Barendrecht" }, { gm_code:"GM0203", name:"Barneveld" }, { gm_code:"GM0373", name:"Bergen (NH" }, { gm_code:"GM0753", name:"Best" }, { gm_code:"GM0375", name:"Beverwijk" }, { gm_code:"GM0377", name:"Bloemendaal" }, { gm_code:"GM0758", name:"Breda" }, { gm_code:"GM0312", name:"Bunnik" }, { gm_code:"GM0313", name:"Bunschoten" }, { gm_code:"GM0502", name:"Capelle aan den IJssel" }, { gm_code:"GM0310", name:"De Bilt" }, { gm_code:"GM0736", name:"De Ronde Venen" }, { gm_code:"GM0503", name:"Delft" }, { gm_code:"GM0150", name:"Deventer" }, { gm_code:"GM0384", name:"Diemen" }, { gm_code:"GM0505", name:"Dordrecht" }, { gm_code:"GM0228", name:"Ede" }, { gm_code:"GM0772", name:"Eindhoven" }, { gm_code:"GM0153", name:"Enschede" }, { gm_code:"GM0232", name:"Epe" }, { gm_code:"GM1771", name:"Geldrop-Mierlo" }, { gm_code:"GM1942", name:"Gooise Meren" }, { gm_code:"GM0014", name:"Groningen" }, { gm_code:"GM0392", name:"Haarlem" }, { gm_code:"GM0394", name:"Haarlemmermeer" }, { gm_code:"GM0243", name:"Harderwijk" }, { gm_code:"GM0246", name:"Heerde" }, { gm_code:"GM0794", name:"Helmond" }, { gm_code:"GM0164", name:"Hengelo" }, { gm_code:"GM0798", name:"Hilvarenbeek" }, { gm_code:"GM0402", name:"Hilversum" }, { gm_code:"GM0353", name:"IJsselstein" }, { gm_code:"GM0166", name:"Kampen" }, { gm_code:"GM0542", name:"Krimpen aan den IJssel" }, { gm_code:"GM1621", name:"Lansingerland" }, { gm_code:"GM0080", name:"Leeuwarden" }, { gm_code:"GM1916", name:"Leidschendam-Voorburg" }, { gm_code:"GM0327", name:"Leusden" }, { gm_code:"GM0809", name:"Loon op Zand" }, { gm_code:"GM0556", name:"Maassluis" }, { gm_code:"GM1842", name:"Midden-Delfland" }, { gm_code:"GM1952", name:"Midden-Groningen" }, { gm_code:"GM0356", name:"Nieuwegein" }, { gm_code:"GM0267", name:"Nijkerk" }, { gm_code:"GM0268", name:"Nijmegen" }, { gm_code:"GM1930", name:"Nissewaard" }, { gm_code:"GM0820", name:"Nuenen, Gerwen en Nederwetten" }, { gm_code:"GM0302", name:"Nunspeet" }, { gm_code:"GM0826", name:"Oosterhout" }, { gm_code:"GM0431", name:"Oostzaan" }, { gm_code:"GM1926", name:"Pijnacker-Nootdorp" }, { gm_code:"GM0273", name:"Putten" }, { gm_code:"GM0597", name:"Ridderkerk" }, { gm_code:"GM0603", name:"Rijswijk" }, { gm_code:"GM1674", name:"Roosendaal" }, { gm_code:"GM0599", name:"Rotterdam" }, { gm_code:"GM0606", name:"Schiedam" }, { gm_code:"GM0848", name:"Son en Breugel" }, { gm_code:"GM0855", name:"Tilburg" }, { gm_code:"GM1730", name:"Tynaarlo" }, { gm_code:"GM0344", name:"Utrecht" }, { gm_code:"GM1581", name:"Utrechtse Heuvelrug" }, { gm_code:"GM0861", name:"Veldhoven" }, { gm_code:"GM0622", name:"Vlaardingen" }, { gm_code:"GM0865", name:"Vught" }, { gm_code:"GM0866", name:"Waalre" }, { gm_code:"GM0867", name:"Waalwijk" }, { gm_code:"GM0289", name:"Wageningen" }, { gm_code:"GM0629", name:"Wassenaar" }, { gm_code:"GM1960", name:"West Betuwe" }, { gm_code:"GM1783", name:"Westland" }, { gm_code:"GM0637", name:"Zoetermeer" }, { gm_code:"GM0642", name:"Zwijndrecht" }, { gm_code:"GM0193", name:"Zwolle" }
]

const cPublicVoertuigTypes = [
  { id: 0, name:"Alle voertuigtypes" },
  { id: 1, name:"Onbekend" },
  { id: 2, name: "Fiets" }
]

var store_accesscontrollist = undefined;

const isLoggedIn = (state) => {
  return state.authentication.user_data ? true : false;
};

var timerid_gebiedenaanbieders = undefined;

const updateAccessControlList = ()  => {
  let delay = 5 * 1000;
  try {
    if(undefined===store_accesscontrollist) {
      console.log("no redux state available yet - skipping metadata update");
      return false;
    }
    
    const state = store_accesscontrollist.getState();
    if(!isLoggedIn(state)) {
      // items -> {"name": "Cykl","system_id": "cykl"}
      store_accesscontrollist.dispatch({ type: 'SET_GEBIEDEN', payload: cPublicGebieden});
      
      // items -> {"name": "Cykl","system_id": "cykl"}
      store_accesscontrollist.dispatch({ type: 'SET_AANBIEDERS', payload: cPublicAanbieders});
    } else {
      let url="https://api.deelfietsdashboard.nl/dashboard-api/menu/acl";
      let options = { headers : { "authorization": "Bearer " + state.authentication.user_data.token }}
      
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
            
            // items -> {"name": "Cykl","system_id": "cykl"}
            store_accesscontrollist.dispatch({ type: 'SET_AANBIEDERS', payload: metadata.operators});

            // items -> {"id": 1, "name": "asdfasdfadfa" }
            let types = cPublicVoertuigTypes; // TODO: get from ACL once implemented
            store_accesscontrollist.dispatch({ type: 'SET_VEHICLE_TYPES', payload: types});
          })
        }).catch(ex=>{
          console.error("unable to decode JSON");
        });
        return true;
      }
  } catch(ex) {
    console.error("Unable to update gebieden", ex)
    delay = 5 * 1000;
    
    return false;
  } finally {
    timerid_gebiedenaanbieders = setTimeout(updateAccessControlList, delay);
  }
}

export const forceUpdateAccessControlList = () => {
  if(undefined!==timerid_gebiedenaanbieders) { clearTimeout(timerid_gebiedenaanbieders); }
  updateAccessControlList();
}

export const initUpdateAccessControlList = (_store) => {
  store_accesscontrollist = _store;
}

forceUpdateAccessControlList();

