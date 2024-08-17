output "arn" {
  value = var.domain_name != null ? aws_acm_certificate.cert[0].arn : aws_acm_certificate.import_cert[0].arn
}

output "id" {
  value = var.domain_name != null ? aws_acm_certificate.cert[0].id : aws_acm_certificate.import_cert[0].id
}
