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

// We should receive this list dynamically
const cPublicGebieden = [
  { gm_code:"cnis5:21001", name:"Anderlecht" },
  { gm_code:"cnis5:44021", name:"Gent" },
  { gm_code:"cnis5:21016", name:"Ukkel" },
  { gm_code:"cnis5:23088", name:"Vilvoorde " },

]

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