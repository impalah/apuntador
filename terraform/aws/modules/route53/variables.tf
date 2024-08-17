variable "domain_name" {
  description = "Domain name for the hosted zone"
  type        = string
}

variable "description" {
  description = "Hosted zone description"
  type        = string
  default = null
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}

variable "vpc_id" {
  description = "ID of the VPC for the private hosted zone"
  type        = string
  default     = null
}

variable "region" {
  description = "Region of the VPC for the private hosted zone"
  type        = string
  default     = null
}
