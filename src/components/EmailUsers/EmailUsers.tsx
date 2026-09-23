import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Select from 'react-select';

import { StateType } from '../../types/StateType';
import { AclType } from '../../types/AclType';
import { MailingFilters, MailingRequest, MailingResult } from '../../types/MailingType';

// API
import { getOrganisationList } from '../../api/organisations';
import {
  getLastMailing,
  getMailingPreview,
  getMailingRecipients,
  sendMailing,
  sendTestMailing
} from '../../api/mailing';

// Components
import Button from '../Button/Button';
import FormLabel from '../FormLabel/FormLabel';
import Modal from '../Modal/Modal.jsx';

import './EmailUsers.css';

interface EmailUsersProps {
  acl: AclType | any;
}

interface OrganisationOption {
  value: number;
  label: string;
}

interface Notice {
  type: 'success' | 'error' | 'info';
  text: string;
}

const PREVIEW_DEBOUNCE_MS = 500;

const DEFAULT_BODY = `# Beste gebruiker,

Schrijf hier je bericht. Je kunt **Markdown** gebruiken voor koppen, *nadruk*, lijsten en [links](https://dashboarddeelmobiliteit.nl).

## Een tussenkop

- Eerste punt
- Tweede punt

Met vriendelijke groet,

Team Dashboard Deelmobiliteit`;

const readableOrganisationType = (type: string): string => {
  switch (type) {
    case 'MUNICIPALITY': return 'Gemeente';
    case 'OPERATOR': return 'Aanbieder';
    case 'ADMIN': return 'Admin';
    case 'OTHER_GOVERNMENT': return 'Overheid';
    case 'OTHER_COMPANY': return 'Bedrijf';
    default: return type || '';
  }
};

const NoticeBox = ({ notice }: { notice: Notice | null }) => {
  if (!notice) return null;
  const colors = {
    success: 'bg-green-50 border-green-300 text-green-800',
    error: 'bg-red-50 border-red-300 text-red-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800'
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm mb-4 ${colors[notice.type]}`} role="status">
      {notice.text}
    </div>
  );
};

const EmailUsers = ({ acl }: EmailUsersProps) => {
  const navigate = useNavigate();
  const token = useSelector((state: StateType) => (
    state.authentication.user_data && state.authentication.user_data.token
  ) || null);

  // Filters
  const [organisationOptions, setOrganisationOptions] = useState<OrganisationOption[]>([]);
  const [selectedOrganisation, setSelectedOrganisation] = useState<OrganisationOption | null>(null);
  const [coreGroupOnly, setCoreGroupOnly] = useState<boolean>(false);
  const [microhubEditOnly, setMicrohubEditOnly] = useState<boolean>(false);

  // Recipients
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientCount, setRecipientCount] = useState<number>(0);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState<boolean>(false);

  // Content
  const [subject, setSubject] = useState<string>('');
  const [bodyMarkdown, setBodyMarkdown] = useState<string>('');
  const [hasLoadedLast, setHasLoadedLast] = useState<boolean>(false);
  const [lastInfo, setLastInfo] = useState<string | null>(null);

  // Preview
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Sending
  const [testedSignature, setTestedSignature] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [doShowConfirmModal, setDoShowConfirmModal] = useState<boolean>(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sendResult, setSendResult] = useState<MailingResult | null>(null);

  const filters: MailingFilters = useMemo(() => ({
    organisation_id: selectedOrganisation ? selectedOrganisation.value : null,
    core_group_only: coreGroupOnly,
    microhub_edit_only: microhubEditOnly
  }), [selectedOrganisation, coreGroupOnly, microhubEditOnly]);

  // A signature of everything that influences what is sent. The bulk send
  // button is only enabled when a test mail was sent for this exact signature.
  const currentSignature = useMemo(() => JSON.stringify({
    subject,
    bodyMarkdown,
    filters
  }), [subject, bodyMarkdown, filters]);

  const isTested = testedSignature !== null && testedSignature === currentSignature;
  const hasContent = subject.trim().length > 0 && bodyMarkdown.trim().length > 0;

  // Only super-admins may use this page
  useEffect(() => {
    if (!acl || Object.keys(acl).length === 0) return;
    if (acl.is_admin !== true) navigate('/');
  }, [acl, navigate]);

  // Load organisations for the filter dropdown
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const organisations = await getOrganisationList(token);
        if (!organisations || !Array.isArray(organisations)) return;
        const options: OrganisationOption[] = organisations.map((x: any) => ({
          value: x.organisation_id,
          label: `${x.name}${x.type_of_organisation ? ` (${readableOrganisationType(x.type_of_organisation)})` : ''}`
        }));
        options.sort((a, b) => a.label.localeCompare(b.label));
        setOrganisationOptions(options);
      } catch (e) {
        console.error('Error loading organisation list', e);
      }
    })();
  }, [token]);

  // Prefill subject and body with the last sent mailing
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const last = await getLastMailing(token);
        if (last && last.subject) {
          setSubject(last.subject);
          setBodyMarkdown(last.body_markdown || '');
          const when = last.sent_at ? new Date(last.sent_at).toLocaleString('nl-NL') : '';
          setLastInfo(
            `Laatst ${last.is_test ? 'als test verstuurd' : `verstuurd naar ${last.recipient_count} gebruikers`}` +
            `${when ? ` op ${when}` : ''} door ${last.sent_by}.`
          );
        } else {
          setBodyMarkdown(DEFAULT_BODY);
        }
      } catch (e) {
        console.error('Error loading last mailing', e);
        setBodyMarkdown(DEFAULT_BODY);
      } finally {
        setHasLoadedLast(true);
      }
    })();
  }, [token]);

  // Fetch recipients whenever the filters change
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setIsLoadingRecipients(true);
    (async () => {
      try {
        const result = await getMailingRecipients(token, filters);
        if (cancelled) return;
        setRecipients(result.recipients || []);
        setRecipientCount(result.count || 0);
      } catch (e) {
        if (cancelled) return;
        console.error('Error loading recipients', e);
        setRecipients([]);
        setRecipientCount(0);
      } finally {
        if (!cancelled) setIsLoadingRecipients(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, filters]);

  // Debounced server-side preview so what you see is exactly what is mailed
  useEffect(() => {
    if (!token || !hasLoadedLast) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoadingPreview(true);
      try {
        const preview = await getMailingPreview(token, subject, bodyMarkdown);
        if (!cancelled) setPreviewHtml(preview.html || '');
      } catch (e) {
        if (!cancelled) console.error('Error loading preview', e);
      } finally {
        if (!cancelled) setIsLoadingPreview(false);
      }
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token, subject, bodyMarkdown, hasLoadedLast]);

  const buildRequest = useCallback((): MailingRequest => ({
    subject: subject.trim(),
    body_markdown: bodyMarkdown,
    filters
  }), [subject, bodyMarkdown, filters]);

  const handleSendTest = async () => {
    if (!hasContent || isSendingTest) return;
    setNotice(null);
    setSendResult(null);
    setIsSendingTest(true);
    const signature = currentSignature;
    try {
      const result = await sendTestMailing(token, buildRequest());
      if (result.sent_count > 0) {
        setTestedSignature(signature);
        setNotice({
          type: 'success',
          text: `Testmail verstuurd naar ${acl.user_id}. Controleer je inbox; als alles goed is kun je nu naar alle geselecteerde gebruikers versturen.`
        });
      } else {
        setNotice({ type: 'error', text: 'De testmail kon niet verstuurd worden. Controleer de SMTP-instellingen van de API.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: `Versturen van de testmail mislukt: ${e?.message || 'onbekende fout'}` });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendAll = async () => {
    if (!isTested || recipientCount === 0 || isSending) return;
    setDoShowConfirmModal(false);
    setNotice(null);
    setIsSending(true);
    try {
      const result = await sendMailing(token, buildRequest());
      setSendResult(result);
      if (result.failed && result.failed.length > 0) {
        setNotice({
          type: 'info',
          text: `E-mail verstuurd naar ${result.sent_count} gebruikers; bij ${result.failed.length} adressen is het versturen mislukt.`
        });
      } else {
        setNotice({ type: 'success', text: `E-mail succesvol verstuurd naar ${result.sent_count} gebruikers.` });
      }
      // Require a new test before the same content can be bulk-sent again
      setTestedSignature(null);
    } catch (e: any) {
      setNotice({ type: 'error', text: `Versturen mislukt: ${e?.message || 'onbekende fout'}` });
    } finally {
      setIsSending(false);
    }
  };

  const recipientsLabel = isLoadingRecipients
    ? 'Ontvangers worden geteld...'
    : `Deze e-mail wordt verstuurd naar ${recipientCount} ${recipientCount === 1 ? 'gebruiker' : 'gebruikers'}`;

  return (
    <div className="EmailUsers">
      <p className="mb-6 text-sm text-gray-700" style={{ maxWidth: '800px' }}>
        Verstuur een e-mail naar (een selectie van) de gebruikers van het Dashboard Deelmobiliteit.
        Stuur eerst een testmail naar jezelf; pas daarna kun je de e-mail naar alle geselecteerde gebruikers versturen.
      </p>

      <div className="EmailUsers-grid">

        {/* Left: filters + content + actions */}
        <div className="EmailUsers-form">

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">1. Ontvangers</h2>

            <FormLabel classes="mt-2 mb-2 font-bold">
              Organisatie
            </FormLabel>
            <Select
              className="w-full mb-3"
              isMulti={false}
              isClearable={true}
              isDisabled={isSending}
              options={organisationOptions}
              value={selectedOrganisation}
              placeholder="Alle organisaties"
              noOptionsMessage={() => 'Geen organisaties gevonden'}
              onChange={(choice: any) => setSelectedOrganisation(choice || null)}
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="coreGroupOnly"
                checked={coreGroupOnly}
                disabled={isSending}
                onChange={(e) => setCoreGroupOnly(e.target.checked)}
              />
              <FormLabel htmlFor="coreGroupOnly" classes="py-2 px-2">
                Alleen contactpersonen (onderdeel van het kernteam)
              </FormLabel>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="microhubEditOnly"
                checked={microhubEditOnly}
                disabled={isSending}
                onChange={(e) => setMicrohubEditOnly(e.target.checked)}
              />
              <FormLabel htmlFor="microhubEditOnly" classes="py-2 px-2">
                Alleen gebruikers met rechten om zones/hubs te beheren
              </FormLabel>
            </div>

            <div className="EmailUsers-recipients mt-3 rounded-lg border px-3 py-2 text-sm">
              <strong>{recipientsLabel}</strong>
              {recipientCount > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-gray-600">Toon adressen</summary>
                  <ul className="mt-2 max-h-48 overflow-auto text-xs text-gray-700 list-disc pl-5">
                    {recipients.map((address) => <li key={address}>{address}</li>)}
                  </ul>
                </details>
              )}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">2. Inhoud</h2>

            <FormLabel htmlFor="mailingSubject" classes="mt-2 mb-2 font-bold">
              Onderwerp
            </FormLabel>
            <input
              id="mailingSubject"
              type="text"
              className="rounded-lg inline-block border-solid border-2 px-2 py-2 mb-4 text-sm w-full"
              value={subject}
              disabled={isSending}
              placeholder="Bijvoorbeeld: Nieuwe functies in het Dashboard Deelmobiliteit"
              onChange={(e) => setSubject(e.target.value)}
            />

            <FormLabel htmlFor="mailingBody" classes="mt-2 mb-2 font-bold">
              Bericht (Markdown)
            </FormLabel>
            <textarea
              id="mailingBody"
              className="rounded-lg block border-solid border-2 px-2 py-2 mb-2 text-sm w-full font-mono"
              style={{ minHeight: '360px' }}
              value={bodyMarkdown}
              disabled={isSending}
              placeholder="Schrijf je bericht in Markdown..."
              onChange={(e) => setBodyMarkdown(e.target.value)}
            />
            <p className="text-xs text-gray-500 mb-2">
              Gebruik <code># Kop</code>, <code>## Tussenkop</code>, <code>**vet**</code>, <code>*cursief*</code>,
              <code>- lijst</code> en <code>[tekst](https://...)</code> voor links.
              {lastInfo && <> {lastInfo}</>}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">3. Versturen</h2>

            <NoticeBox notice={notice} />

            {sendResult && sendResult.failed && sendResult.failed.length > 0 && (
              <details className="mb-4 text-sm">
                <summary className="cursor-pointer">Mislukte adressen ({sendResult.failed.length})</summary>
                <ul className="mt-2 text-xs list-disc pl-5">
                  {sendResult.failed.map((address) => <li key={address}>{address}</li>)}
                </ul>
              </details>
            )}

            <div style={{ marginLeft: '-0.5rem' }}>
              <Button
                theme="white"
                type="button"
                disabled={!hasContent || isSendingTest || isSending}
                onClick={handleSendTest}
                title={`Verstuur alleen naar ${acl?.user_id || 'jezelf'}`}
              >
                {isSendingTest ? 'Testmail wordt verstuurd...' : `Verstuur testmail naar mij (${acl?.user_id || ''})`}
              </Button>
              <Button
                theme="primary"
                type="button"
                disabled={!isTested || recipientCount === 0 || isSending || isLoadingRecipients}
                onClick={() => setDoShowConfirmModal(true)}
                title={isTested
                  ? `Verstuur naar ${recipientCount} gebruikers`
                  : 'Verstuur eerst een testmail naar jezelf'}
              >
                {isSending
                  ? 'E-mail wordt verstuurd...'
                  : `Verstuur naar ${recipientCount} ${recipientCount === 1 ? 'gebruiker' : 'gebruikers'}`}
              </Button>
            </div>
            {!isTested && hasContent && (
              <p className="text-xs text-gray-500">
                Verstuur eerst een testmail naar jezelf. Na een wijziging in het onderwerp, het bericht of de
                ontvangers moet je opnieuw een testmail versturen.
              </p>
            )}
          </section>
        </div>

        {/* Right: preview */}
        <div className="EmailUsers-preview">
          <h2 className="text-lg font-semibold mb-3">
            Voorbeeld
            {isLoadingPreview && <span className="ml-2 text-xs font-normal text-gray-500">wordt bijgewerkt...</span>}
          </h2>
          <div className="EmailUsers-preview-subject rounded-t-lg border border-b-0 px-3 py-2 text-sm bg-gray-50">
            <span className="text-gray-500">Onderwerp: </span>
            <strong>{subject || <em className="text-gray-400">(geen onderwerp)</em>}</strong>
          </div>
          <iframe
            title="Voorbeeld van de e-mail"
            className="EmailUsers-preview-frame rounded-b-lg border w-full bg-white"
            sandbox=""
            srcDoc={previewHtml}
          />
        </div>
      </div>

      <Modal
        isVisible={doShowConfirmModal}
        title="E-mail versturen"
        button1Title="Annuleren"
        button1Handler={() => setDoShowConfirmModal(false)}
        button2Title={`Ja, verstuur naar ${recipientCount} ${recipientCount === 1 ? 'gebruiker' : 'gebruikers'}`}
        button2Handler={handleSendAll}
        button2Options={{ isLoading: isSending }}
        hideModalHandler={() => setDoShowConfirmModal(false)}
      >
        <p className="mb-2">
          Weet je zeker dat je de e-mail <strong>&quot;{subject}&quot;</strong> wilt versturen
          naar <strong>{recipientCount}</strong> {recipientCount === 1 ? 'gebruiker' : 'gebruikers'}?
        </p>
        <p className="text-sm text-gray-600">
          Dit kan niet ongedaan gemaakt worden.
        </p>
      </Modal>
    </div>
  );
};

export default EmailUsers;
