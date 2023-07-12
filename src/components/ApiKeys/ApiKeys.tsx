import React, { useState, useEffect } from 'react';
import Select from 'react-select'
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from 'react-router';
// import './SharedDataOverview.css'; 
import Modal from '../Modal/Modal.jsx';
import {
  // useDispatch,
  useSelector
} from 'react-redux';

// import {OrganisationType} from '../../types/OrganisationType';
import {StateType} from '../../types/StateType';
import {AclType} from '../../types/AclType';

// Import API methods
import {
  getApiKeyList,
  createApiKey,
  deleteApiKey
} from '../../api/apiKeys';
import {getAcl} from '../../api/acl';

// Import components
import Button from '../Button/Button';
import H1Title from '../H1Title/H1Title';
import H4Title from '../H4Title/H4Title';

const TableRow = ({
  apiKey,
  onRevokeHandler
}, {
  apiKey: any,
  onRevokeHandler: Function
}) => {
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  return (
      <div
        key={apiKey.id}
        className={`TableRow no-hover`}
      >
        <div className="flex">
          <div className="col-apiKey text-sm flex-1">
            {apiKey.key}
          </div>
          <div className="col-actions text-sm flex justify-end">
            <button className='delete-icon' style={{height: '100%'}} onClick={() => setShowRevokeModal(true)} />
          </div>

          {showRevokeModal ? (
            <Modal
              isVisible={showRevokeModal}
              title="Weet je het zeker?"
              button1Title={'Nee, annuleer'}
              button1Handler={(e) => {
                setShowRevokeModal(false);
              }}
              button2Title={"Ja, stop met delen"}
              button2Handler={async (e) => {
                e.preventDefault();
                // Hide modal
                setShowRevokeModal(false);
                // Revoke action
                onRevokeHandler(apiKey.id);
              }}
              hideModalHandler={() => {
                setShowRevokeModal(false);
              }}
            >
              <p className="mb-4">
                Weet je zeker dat je deze API key wilt verwijderen?
              </p>
            </Modal>
          ): <></>}
        </div>
      </div>
  )
}

// ApiKeys
const ApiKeys = ({
}: {
}) => {
  const [acl, setAcl] = useState<AclType>(null);
  const [apiKeys, setApiKeys] = useState(null);

  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  // Get acl data on component load
  useEffect(() => {
    fetchAcl();
  }, []);

  // Reload API key list if user session changes
  useEffect(() => {
    if(!acl) return;
    fetchApiKeyList();
  }, [
    acl
  ]);

  const navigate = useNavigate();

  const fetchAcl = async () => {
    const theAcl = await getAcl(token);
    setAcl(theAcl);
  }

  const fetchApiKeyList = async () => {
    // Fetch organisations and set in state
    const apiKeys = await getApiKeyList(token);
    setApiKeys(apiKeys);
  }

  // const handleClick = () => {
  //   navigate('/admin/organisations/new');
  // }

  const onRevokeHandler = (id: string) => {
    if(! id) return;

    deleteApiKey(token, id);
    fetchApiKeyList();
  }

  return (
    <div className="ApiKeys" style={{maxWidth: '800px'}}>
      <div className="flex justify-between flex-wrap">
        <H1Title style={{marginTop: 0}}>
          API keys
        </H1Title>
      </div>
      <div className='mb-8' style={{marginRight: '-0.5rem', marginLeft: '-0.5rem'}}>
        <Button theme='primary' classes='add-new' onClick={() => {
          createApiKey(token);
          fetchApiKeyList();
        }}>
          Nieuwe API key
        </Button>
      </div>
      <div className="
        Table
      ">
        <div className="TableRow flex justify-between no-hover">
          <H4Title className="col-name flex-1">API key</H4Title>
          <H4Title className="col-actions">Intrekken</H4Title>
        </div>
        {(apiKeys && apiKeys.length > 0) ? apiKeys.map(key => {
          return <TableRow key={key.id} apiKey={key} onRevokeHandler={onRevokeHandler} />
        }) : <></>}
      </div>
    </div>
  );
}

export default ApiKeys;
