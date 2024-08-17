
variable "s3_endpoint" {
  description = "S3 endpoint"
  type        = string
  default     = null
}

variable "origin_id" {
  description = "Distribution origin ID"
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

# Certificate for Cloudfront
variable "certificate_arn" {
  description = "TLS certificate arn for Cloudfront"
  type        = string
  default     = null
}

variable "domains" {
  description = "Domains for Cloudfront"
  type        = list(string)
  default     = []
}

# Cache control (TTL). Set to 0 to disable cache
variable "min_ttl" {
  description = "Cache minimum TTL"
  type        = number
  default     = 0
}

variable "default_ttl" {
  description = "Cache default TTL"
  type        = number
  default     = 0
}

variable "max_ttl" {
  description = "Cache maximum TTL"
  type        = number
  default     = 0
}

variable "comment" {
  description = "Cloudfront distribution comment"
  type        = string
  default     = ""
}

variable "price_class" {
  description = "Cloudfront price class"
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "Invalid price class"
  }

  validation {
    condition     = length(var.price_class) > 0
    error_message = "Price class cannot be empty"
  }
}

variable "enabled" {
  description = "Cloudfront distribution enabled"
  type        = bool
  default     = true
}

variable "http_version" {
  description = "Cloudfront distribution HTTP version"
  type        = string
  default     = "http2"

  validation {
    condition     = contains(["http1.1", "http2"], var.http_version)
    error_message = "Invalid HTTP version"
  }

  validation {
    condition     = length(var.http_version) > 0
    error_message = "HTTP version cannot be empty"
  }
}

variable "default_root_object" {
  description = "Cloudfront distribution default root object"
  type        = string
  default     = "index.html"

}

variable "is_ipv6_enabled" {
  description = "Cloudfront distribution IPv6 enabled"
  type        = bool
  default     = true
}

variable "allowed_methods" {
  description = "Cloudfront distribution allowed methods"
  type        = list(string)
  default     = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
}

variable "cached_methods" {
  description = "Cloudfront distribution cached methods"
  type        = list(string)
  default     = ["GET", "HEAD"]
}

variable "smooth_streaming" {
  description = "Cloudfront distribution smooth streaming"
  type        = bool
  default     = false
}

