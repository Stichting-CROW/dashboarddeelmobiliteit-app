export type MailTemplateType = {
  defaultFromName?: string,
  defaultHtmlTemplate: string,
  defaultSubject: string,
  defaultTextTemplate: string,
  fromEmail?: string,
  localizedFromNames?: object,
  localizedHtmlTemplates?: object,
  localizedSubjects?: object,
  localizedTextTemplates?: object,
  name: string
}
