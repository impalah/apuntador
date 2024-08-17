variable "name" {
  type        = string
  default     = ""
  description = "Name  (e.g. `app` or `cluster`)."
}

variable "environment" {
  type        = string
  default     = ""
  description = "Environment (e.g. `prod`, `dev`, `staging`)."
}

variable "tags" {
  type        = map(any)
  default     = {}
  description = "Additional tags (e.g. map(`BusinessUnit`,`XYZ`)."
}

variable "domain_name" {
  type        = string
  default     = null
  description = "Domain name for the hosted zone."
}

variable "subject_alternative_names" {
  type        = list(string)
  default     = []
  description = "A list of domains that should be SANs in the issued certificate."
}

variable "zone_id" {
  type        = string
  default     = null
  description = "The ID of the hosted zone to contain this record."
}

variable "private_key" {
  type        = string
  default     = null
  description = "Private key."
}

variable "certificate_body" {
  type        = string
  default     = null
  description = "Certificate body."
}

variable "certificate_chain" {
  type        = string
  default     = null
  description = "Certificate chain."
}

