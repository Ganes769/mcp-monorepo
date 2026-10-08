export interface ApiRoot {
  status: string
  message: string
  database: string
  xero_login: string
  xero_login_url: string
  xero_status: string
  xero_contacts: string
  xero_webhooks: string
  xero_synced_contacts: string
  xero_synced_invoices: string
}

export interface DbTest {
  status: string
  database: string
  result: number
}

export interface XeroLastSync {
  status: string
  mode?: string
  contacts_stored?: number
  invoices_stored?: number
  finished_at: string | null
  error: string | null
}

export interface XeroStatus {
  connected: boolean
  credentials_loaded: boolean
  redirect_uri: string
  scopes: string
  tenant_id: string | null
  token_valid: boolean
  connection_count: number
  login_url: string
  login_url_api: string
  message: string
  last_sync?: XeroLastSync | null
}

export interface XeroSyncResponse {
  status?: string
  mode?: string
  contacts_stored?: number
  invoices_stored?: number
  finished_at?: string | null
  error?: string | null
  [key: string]: unknown
}

export interface XeroInvoicesResponse {
  count: number
  stored?: number
  invoices: Record<string, unknown>[]
}

export interface XeroLoginUrl {
  authorize_url: string
  instruction: string
}

export interface XeroSetup {
  client_id_prefix: string
  redirect_uri: string
  redirect_uri_alternate_localhost?: string
  xero_developer_steps: string[]
}

export interface XeroAddress {
  address_type: string | null
  address_line1: string | null
  address_line2: string | null
  address_line3?: string | null
  city: string | null
  region: string | null
  postal_code: string | null
  country: string | null
  attention_to: string | null
}

export interface XeroPhone {
  phone_type: string | null
  phone_number: string | null
  phone_area_code: string | null
  phone_country_code: string | null
}

export interface XeroPerson {
  first_name: string | null
  last_name: string | null
  email_address: string | null
  include_in_emails: boolean | null
}

export interface XeroContact {
  contact_id: string
  account_number: string | null
  contact_status: string | null
  name: string
  first_name: string | null
  last_name: string | null
  company_number: string | null
  email_address: string | null
  tax_number: string | null
  website: string | null
  is_customer: boolean | null
  is_supplier: boolean | null
  default_currency: string | null
  updated_date_utc: string | null
  contact_persons: XeroPerson[] | null
  addresses: XeroAddress[] | null
  phones: XeroPhone[] | null
}

export interface XeroContactsResponse {
  count: number
  contacts: XeroContact[]
}

export interface XeroSyncedContact {
  id: string
  name: string | null
  email: string | null
  deleted: boolean
  updated_at: string | null
  payload: Record<string, unknown> | null
}

export interface XeroSyncedContactsResponse {
  count: number
  contacts: XeroSyncedContact[]
}

export interface XeroSyncedInvoice {
  id: string
  invoice_number: string | null
  status: string | null
  deleted: boolean
  updated_at: string | null
  payload: Record<string, unknown> | null
}

export interface XeroSyncedInvoicesResponse {
  count: number
  invoices: XeroSyncedInvoice[]
}

export interface XeroWebhookEvent {
  id: string
  tenant_id: string
  resource_id: string
  event_category: string
  event_type: string
  processed: boolean
  error: string | null
  created_at: string | null
}

export interface XeroWebhookEventsResponse {
  count: number
  events: XeroWebhookEvent[]
}
