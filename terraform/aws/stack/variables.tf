
# The home of the variables
variable "tags" {
  description = "External tags map"
  type        = map(string)
  default     = {}
}

variable "region" {
  description = "Set the primary region"
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "Set environment name"
  type        = string
  default     = ""
}

variable "customer" {
  description = "Set customer name"
  type        = string
  default     = ""
}

variable "cost_center" {
  description = "Cost center associated with the project"
  type        = string
  default     = ""
}

variable "project" {
  description = "Project name"
  type        = string
  default     = ""
}

variable "organization" {
  description = "Organization name (internal)"
  type        = string
  default     = ""
}

variable "owner" {
  description = "Owner name (internal)"
  type        = string
  default     = ""
}

# DNS
variable "domain_name" {
  description = "Domain name for the hosted zone"
  type        = string
  default     = null
}

variable "alternative_domain_names" {
  type        = list(string)
  default     = []
  description = "A list of domains that should be SANs in the issued certificate."
}

# Frontend
variable "frontend_bucket_name" {
  description = "Bucket name"
  type        = string
  default     = null
}

# Web Frontend
variable "web_frontend_bucket_name" {
  description = "Web Bucket name"
  type        = string
  default     = null
}


variable "frontend_s3_endpoint" {
  description = "S3 endpoint"
  type        = string
  default     = null
}


variable "frontend_origin_id" {
  description = "Distribution origin ID"
  type        = string
  default     = null
}


# Backend bucket name
variable "backend_bucket_name" {
  description = "Backend Bucket name"
  type        = string
  default     = null
}


# Certificate for Cloudfront
variable "cdn_certificate_arn" {
  description = "TLS certificate arn for Cloudfront"
  type        = string
  default     = null
}

variable "cdn_domains" {
  description = "Domains for Cloudfront"
  type        = list(string)
  default     = []
}

variable "web_cdn_domains" {
  description = "Domains for Cloudfront Web"
  type        = list(string)
  default     = []
}

