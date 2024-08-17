resource "aws_acm_certificate" "cert" {
  count             = var.domain_name != null ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"
  subject_alternative_names = var.subject_alternative_names
  tags              = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  count = var.domain_name != null ? 1 : 0

  # Include only the first item in the domain_validation_options list
  zone_id = var.zone_id
  name    = element(tolist(aws_acm_certificate.cert[0].domain_validation_options), 0).resource_record_name
  type    = element(tolist(aws_acm_certificate.cert[0].domain_validation_options), 0).resource_record_type
  ttl     = 60
  records = [element(tolist(aws_acm_certificate.cert[0].domain_validation_options), 0).resource_record_value]

  lifecycle {
    create_before_destroy = true
    prevent_destroy = true
  }
}


resource "aws_acm_certificate_validation" "cert_validation" {
  count                = var.domain_name != null ? 1 : 0
  certificate_arn      = aws_acm_certificate.cert[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_acm_certificate" "import_cert" {
  count             = var.domain_name == null ? 1 : 0
  private_key       = var.private_key
  certificate_body  = var.certificate_body
  certificate_chain = var.certificate_chain
  tags              = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

