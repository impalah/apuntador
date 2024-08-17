data "aws_cloudfront_cache_policy" "CachingDisabled" {
  name = "Managed-CachingDisabled"
}


resource "aws_cloudfront_distribution" "cdn" {

  aliases = var.domains

  origin {
    domain_name = var.s3_endpoint
    origin_id   = var.origin_id
    origin_path = ""

    custom_origin_config {
      http_port                = "80"
      https_port               = "443"
      origin_keepalive_timeout = 5
      origin_read_timeout      = 30
      origin_protocol_policy   = "http-only"
      origin_ssl_protocols     = ["TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  comment             = var.comment
  price_class         = var.price_class
  enabled             = var.enabled
  default_root_object = var.default_root_object
  http_version        = var.http_version
  is_ipv6_enabled     = var.is_ipv6_enabled

  default_cache_behavior {
    viewer_protocol_policy = "allow-all"
    smooth_streaming       = false
    compress               = false
    allowed_methods        = var.allowed_methods
    cached_methods         = var.cached_methods
    target_origin_id       = var.origin_id

    # Disable cache
    min_ttl     = var.min_ttl
    default_ttl = var.default_ttl
    max_ttl     = var.max_ttl

    # cache_policy_id = data.aws_cloudfront_cache_policy.CachingDisabled.id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  dynamic "viewer_certificate" {
    for_each = var.certificate_arn == null ? [1] : []
    content {
      cloudfront_default_certificate = true
      minimum_protocol_version       = "TLSv1"
      ssl_support_method             = "vip"
    }
  }

  dynamic "viewer_certificate" {
    for_each = var.certificate_arn != null ? [1] : []
    content {
      acm_certificate_arn      = var.certificate_arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.1_2016"
    }
  }

  tags = var.tags

  depends_on = [data.aws_cloudfront_cache_policy.CachingDisabled]

  lifecycle {
    ignore_changes = [
      viewer_certificate
    ]
  }



}
