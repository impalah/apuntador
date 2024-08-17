output "cdn_domain" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "cache_policy_id" {
  value = data.aws_cloudfront_cache_policy.CachingDisabled.id
}

# Constant: Cloudfront Zone Id
output "zone_id" {
  value = "Z2FDTNDATAQYW2"
}

