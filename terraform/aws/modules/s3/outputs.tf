
output "s3_bucket_name" {
  value = aws_s3_bucket.bucket.bucket
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.bucket.arn
}

output "s3_bucket_website_url" {
  description = "The website endpoint of the bucket"
  value       = length(aws_s3_bucket_website_configuration.bucket-website) > 0 ? aws_s3_bucket_website_configuration.bucket-website[0].website_endpoint : null
}

output "s3_bucket_website_domain" {
  value = length(aws_s3_bucket_website_configuration.bucket-website) > 0 ? aws_s3_bucket_website_configuration.bucket-website[0].website_domain : null
}
