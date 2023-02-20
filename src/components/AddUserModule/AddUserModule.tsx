import { React, useState } from 'react'
import Button from '../Button/Button'
import {
  useSelector
} from 'react-redux';
import './AddUserModule.css'; 
import {themes} from '../../themes';

function AddUserModule(props) {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [overheid, setOverheid] = useState(false)
  const [aanbieder, setAanbieder] = useState(false)
  const [overigBedrijf, setOverigBedrijf] = useState(false)
  const [kernteam, setKernteam] = useState(false)
  const [downloadrechten, setDownloadrechten] = useState(false)

  const token = useSelector(state => (state.authentication.user_data && state.authentication.user_data.token)||null)

  if (!props.showModule) {
    return null
  }

let userRoles = []

const handleSubmit = (event) => {
    event.preventDefault();
    console.log('admin', admin)
    if (admin) {
      userRoles.push("Admin")
    } 
    if (overheid) {
      userRoles.push("Overheid")
    } 
    if (aanbieder) {
      userRoles.push("Aanbieder")
    } 
    console.log('userRoles', userRoles)
    createUser(email, userRoles)
  }
  
  function getHeaders() {
    return {
      headers: {
        "Authorization":  `Bearer ${token}`
      }
    };
  }
  
  const handleClose = () => {
    props.setShowModule(false);
    setMessage('')
    setEmail('')
    setSendEmail(false)
    setAdmin(false)
    setOverheid(false)
    setAanbieder(false)
  }


  function createUser(email, role) {
    let roles = {
        "Admin": "administer",
        "Overheid": "municipality",
        "Aanbieder": "operator",
    };
    let body = {
        email: email,
        user_type: roles[role]
    };
    console.log(body);
    let url = 'https://api.deelfietsdashboard.nl/dashboard-api/admin/user/create';
    let options =  getHeaders();
    options.method = "PUT";
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
    return fetch(url, options)
        .then((response) => {
            if (response.status == 200) {
              setMessage("User created successfully!")         
              setTimeout(() => {
                handleClose()
              }, "1500")
            } else {
                //errorNoPermission(response);
                setMessage("There has been an error. Please try again.")
                setTimeout(() => {
                  handleClose()
                }, "1500")
                
            }
            return response.json();
        });
  }


  
  return (
    <div>
      <form onSubmit={handleSubmit} className='add-user-form'>
        <label>Emailadres</label>
        <input 
          type="email" 
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label>Rollen</label>
        <div>
          <label htmlFor="admin">Admin</label>
          <input 
            type="radio" 
            id="admin"
            name="admin"
            value={admin}
            onChange={(event) => setAdmin(true)}
          />
        </div>
        <div>
          <label htmlFor="overheid">Overheid</label>
          <input 
            type="radio" 
            id="overheid"
            name="overheid"
            value={overheid}
            onChange={(event) => setOverheid(true)}
          />
        </div>
        <div>
          <label htmlFor="aanbieder">Aanbieder</label>
          <input 
            type="radio" 
            id="aanbieder"
            name="aanbieder"
            value={aanbieder}
            onChange={(event) => setAanbieder(true)}
          />
        </div>

        {/* <input 
          type="checkbox" 
          id="overigBedrijf"
          name="overigBedrijf"
          value={overigBedrijf}
          onChange={(event) => setOverigBedrijf(event.target.value)}
        />
        <input 
          type="checkbox" 
          id="kernteam"
          name="kernteam"
          value={kernteam}
          onChange={(event) => setKernteam(event.target.value)}
        />
        <input 
          type="checkbox" 
          id="downloadrechten"
          name="downloadrechten"
          value={downloadrechten}
          onChange={(event) => setDownloadrechten(event.target.value)}
        /> */}
        <div>
          <input 
            type="checkbox" 
            value={sendEmail}
            onChange={(event) => setSendEmail(event.target.value)}
          />
          <label>Stuur welkomstmail</label>
        </div>
        
        <button type="submit" 
          className="
            rounded-lg
            inline-block
            border-solid border-2
            px-2
            py-2
            mr-2
            mb-2
            text-sm
            cursor-pointer"
            //style={themes[extends.colors.primary]}
        >Opslaan</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default AddUserModule


