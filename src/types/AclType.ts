export type AclType = {
  part_of_organisation: number
  is_admin: boolean,
  privileges: any,// Array / ENUM
  user_id: string
  organisation_type?: string
  type_of_organisation?: string
}
