import { React, useState } from 'react'
import Button from '../Button/Button'
import {
  useSelector
} from 'react-redux';

function AddUserModule(props) {
  const [errorMessage, setErrorMessage] = useState('')
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

  const fetchOptions = {
    headers: {
      "authorization": `Bearer ${token}`,
      'mode':'no-cors'
    },
    method: "POST", 
    body: JSON.stringify({email}),
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('https://api.deelfietsdashboard.nl/dashboard-api/admin/user/list', fetchOptions);
      const parsed = await response.json();
      console.log('parsed', parsed)
      if (response.status === 201) {
        console.log('ok')
        props.setShowModule(false);
      } else {
        console.log('not ok')
        setErrorMessage(parsed.message);
      }
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>Emailadres</label>
        <input 
          type="email" 
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label>Rollen</label>
        <label htmlFor="admin">Admin</label>
        <input 
          type="checkbox" 
          id="admin"
          name="admin"
          value={admin}
          onChange={(event) => setAdmin(event.target.value)}
        />
        <label htmlFor="overheid">Overheid</label>
        <input 
          type="checkbox" 
          id="overheid"
          name="overheid"
          value={overheid}
          onChange={(event) => setOverheid(event.target.value)}
        />
        <label htmlFor="aanbieder">Aanbieder</label>
        <input 
          type="checkbox" 
          id="aanbieder"
          name="aanbieder"
          value={aanbieder}
          onChange={(event) => setAanbieder(event.target.value)}
        />
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
        <label>Stuur welkomstmail</label>
        <input 
          type="checkbox" 
          value={sendEmail}
          onChange={(event) => setSendEmail(event.target.value)}
        />
        <Button type="submit" >Opslaan</Button>
      </form>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  )
}

export default AddUserModule