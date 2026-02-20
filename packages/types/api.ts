export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface IpInfo {
  ip: string
  city: string
  country: string
  region: string
  timezone: string
  asn: string
  asOrganization: string
  latitude: number
  longitude: number
}

export interface DnsRecord {
  name: string
  type: string
  TTL: number
  data: string
}

export interface DnsResponse {
  domain: string
  type: string
  records: DnsRecord[]
}

export interface ExchangeRate {
  from: string
  to: string
  rate: number
  timestamp: number
}
