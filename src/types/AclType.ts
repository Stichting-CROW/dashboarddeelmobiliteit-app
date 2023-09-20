export type AclType = {
  part_of_organisation: number
  is_admin: boolean,
  privileges: any,// Array / ENUM
  user_id: string
}
