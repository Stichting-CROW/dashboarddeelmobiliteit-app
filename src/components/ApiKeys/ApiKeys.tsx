import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select'
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from 'react-router';
// import './SharedDataOverview.css'; 
import Modal from '../Modal/Modal.jsx';
import {
  // useDispatch,
  useSelector
} from 'react-redux';
import { Check, Copy } from 'lucide-react';

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
import { copyTextToClipboard } from '../../helpers/clipboard';

// Import components
import Button from '../Button/Button';
import PageTitle from '../common/PageTitle';
import H4Title from '../H4Title/H4Title';

const API_KEY_REVEAL_DURATION_MS = 10000;
const MASKED_API_KEY = '••••••••••••••••••••••••';

const TableRow = ({
  apiKey,
  onRevokeHandler
}: {
  apiKey: any,
  onRevokeHandler: Function
}) => {
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [didCopy, setDidCopy] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const revealKey = () => {
    setIsKeyVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsKeyVisible(false);
      hideTimeoutRef.current = null;
    }, API_KEY_REVEAL_DURATION_MS);
  };

  const hideKey = () => {
    setIsKeyVisible(false);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const copyKey = () => {
    copyTextToClipboard(apiKey.key);
    setDidCopy(true);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setDidCopy(false);
      copyTimeoutRef.current = null;
    }, 2000);
  };

  return (
      <div
        key={apiKey.id}
        className={`TableRow no-hover`}
      >
        <div className="flex">
          <div className="col-apiKey text-sm flex-1 flex items-center flex-wrap gap-2">
            <code
              className="font-mono break-all"
              style={{ userSelect: isKeyVisible ? 'text' : 'none' }}
            >
              {isKeyVisible ? apiKey.key : MASKED_API_KEY}
            </code>
            <button
              type="button"
              className="underline text-gray-600 hover:text-gray-900 bg-transparent p-0"
              onClick={isKeyVisible ? hideKey : revealKey}
            >
              {isKeyVisible ? 'Verberg' : 'Toon'}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center bg-transparent p-0 text-gray-600 hover:text-gray-900"
              style={{ height: '20px', width: '20px' }}
              title={didCopy ? 'Gekopieerd' : 'Kopieer API key'}
              aria-label={didCopy ? 'Gekopieerd' : 'Kopieer API key'}
              onClick={copyKey}
            >
              {didCopy ? <Check size={16} /> : <Copy size={16} />}
            </button>
            {didCopy ? (
              <span className="text-xs text-gray-500">Gekopieerd</span>
            ) : null}
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

  const onRevokeHandler = async (id: string) => {
    if(! id) return;

    await deleteApiKey(token, id);
    fetchApiKeyList();
  }

  return (
    <div className="ApiKeys" style={{maxWidth: '800px'}}>
      <div className="flex justify-between flex-wrap">
        <PageTitle style={{marginTop: 0}}>
          API keys
        </PageTitle>
      </div>
      <div className='mb-8' style={{marginRight: '-0.5rem', marginLeft: '-0.5rem'}}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 pt-4 pb-4 rounded relative" role="alert">
          <strong className="font-bold">
            Let op: houd API keys geheim
          </strong><br /><br />
          <p className="block">
            Op deze pagina kun je API-keys aanmaken die toestemming geven om data uit het Dashboard Deelmobiliteit te downloaden met behulp van API's. 
          </p>
          <p className="block" style={{marginBottom: 0}}>
            Jij bent eigenaar van de API-keys die je hier aanmaakt. Daarmee ben je verantwoordelijk voor het gebruik van de data die met jouw API-keys worden gedownload. De <a href="https://www.fietsberaad.nl/Kennisbank/Afspraken-over-data-en-financiering-van-dashboard" target="_blank">afspraken over openbaarheid</a> zijn hierop van toepassing.
          </p>
        </div>
      </div>
      <div className='mb-8' style={{marginRight: '-0.5rem', marginLeft: '-0.5rem'}}>
        <Button theme='primary' classes='add-new' onClick={async () => {
          await createApiKey(token);
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
