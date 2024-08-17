
variable "bucket_name" {
  description = "Bucket name"
  type        = string
  default     = null
}

variable "environment" {
  description = "Set environment name"
  type        = string
  default     = ""
}

variable "project" {
  description = "Project name"
  type        = string
  default     = ""
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}

variable "block_public_access" {
  description = "Indicate if the bucket will have public access"
  type        = bool
  default     = false
}

variable "enable_website_hosting" {
  description = "Indicate if website hosting should be configured"
  type        = bool
  default     = true
}

variable "enable_vpc_endpoint" {
  description = "Create a VPC endpoint for the s3 bucket"
  type        = bool
  default     = false
}


variable "vpc_id" {
  description = "ID of the VPC for the services"
  type        = string
  default     = null
}

variable "region" {
  description = "Region for the bucket"
  type        = string
  default     = null
}

variable "route_tables" {
  description = "Route tables for the VPC endpoint"
  type        = set(string)
  default     = []
}

variable "bucket_ownership" {
  description = "Bucket ownership"
  type        = string
  default     = "BucketOwnerPreferred"
}

variable "source_example" {
  description = "Example index file"
  type        = string
  default     = null
}

