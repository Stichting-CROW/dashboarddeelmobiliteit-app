export interface MailingFilters {
  organisation_id: number | null;
  core_group_only: boolean;
  microhub_edit_only: boolean;
}

export interface MailingRequest {
  subject: string;
  body_markdown: string;
  filters: MailingFilters;
}

export interface MailingPreview {
  subject: string;
  html: string;
}

export interface MailingRecipients {
  count: number;
  recipients: string[];
}

export interface MailingResult {
  mailing_id: number | null;
  sent_count: number;
  failed: string[];
}

export interface LastMailing {
  mailing_id: number;
  subject: string;
  body_markdown: string;
  filters: MailingFilters;
  is_test: boolean;
  recipient_count: number;
  sent_by: string;
  sent_at: string;
}
