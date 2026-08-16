import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { StateType } from '../../types/StateType';
import Modal from '../Modal/Modal.jsx';
import { Button } from '../ui/button';

const STORAGE_KEY = 'introModalDismissedAt';
const DISMISS_DAYS = 7;
const DISMISS_MS = DISMISS_DAYS * 24 * 60 * 60 * 1000;

interface IntroModalProps {
  pathName: string;
}

const isAanbodLandingPath = (pathName: string): boolean => {
  return pathName === '/' || pathName === '/map/park';
};

const shouldShowIntroModal = (): boolean => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const dismissedAt = Number(raw);
    if (Number.isNaN(dismissedAt)) return true;
    return Date.now() - dismissedAt >= DISMISS_MS;
  } catch {
    return true;
  }
};

const markIntroModalDismissed = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
};

/**
 * First-visit introduction for guests on the Aanbod (public map) landing page.
 * Dismissed for seven days after close or any CTA click.
 */
const IntroModal = ({ pathName }: IntroModalProps) => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });

  const [isVisible, setIsVisible] = useState(false);
  const isLanding = isAanbodLandingPath(pathName);

  useEffect(() => {
    if (!isLoggedIn && isLanding && shouldShowIntroModal()) {
      setIsVisible(true);
      return;
    }
    setIsVisible(false);
  }, [isLoggedIn, isLanding]);

  const dismiss = () => {
    markIntroModalDismissed();
    setIsVisible(false);
  };

  const handleLogin = () => {
    dismiss();
    navigate('/login');
  };

  const handleMeerInfo = () => {
    dismiss();
    navigate('/over');
  };

  const handleOpenbareKaart = () => {
    dismiss();
    navigate('/map/park');
  };

  if (isLoggedIn || !isLanding) {
    return null;
  }

  return (
    <Modal
      isVisible={isVisible}
      title="Dashboard Deelmobiliteit"
      hideModalHandler={dismiss}
      config={{
        maxWidth: '540px',
        width: 'calc(100% - 2rem)',
      }}
    >
      <p className="text-gray-700 leading-relaxed mb-6">
        Het Dashboard Deelmobiliteit is een webtool van en voor overheden die de
        ontwikkelingen rond deelmobiliteit op de voeten willen volgen. Met de
        informatie uit het Dashboard Deelmobiliteit kunnen overheden hun beleid
        ontwikkelen, evalueren en bijsturen.
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={handleLogin}
        >
          Log in
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={handleOpenbareKaart}
        >
          Openbare kaart
        </Button>
        <Button
          type="button"
          className="w-full sm:w-auto bg-theme-blue text-white hover:bg-theme-blue/90"
          onClick={handleMeerInfo}
        >
          Meer info
        </Button>
      </div>
    </Modal>
  );
};

export default IntroModal;
