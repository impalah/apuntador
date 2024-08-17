################################################
# DNS configuration
################################################

module "dns" {
  source = "../modules/route53"
  providers = {
      aws = aws.eu_west_1
  }
  domain_name = var.domain_name

}

output "zone_id" {
  value = module.dns.zone_id
}

output "name_servers" {
  value = module.dns.name_servers
}

################################################
# Certificate configuration
################################################

module "certificate" {
  source = "../modules/acm"
  providers = {
      aws = aws.us_east_1
  }
  domain_name = var.domain_name
  subject_alternative_names = var.alternative_domain_names
  zone_id = module.dns.zone_id

  depends_on = [
    module.dns
  ]


}

output "certificate_arn" {
  value = module.certificate.arn
}





################################################
# Frontend
################################################

module "s3_frontend" {
  source      = "../modules/s3"
  providers = {
      aws = aws.eu_west_1
  }
  environment = var.environment
  project     = var.project
  region      = var.region
  bucket_name = format("%s-%s-%s", lower(var.environment), lower(var.project), var.frontend_bucket_name)


}


module "cdn_frontend" {
  source      = "../modules/cdn"
  providers = {
      aws = aws.eu_west_1
  }
  environment = var.environment
  project     = var.project
  origin_id   = format("%s.%s", module.s3_frontend.s3_bucket_name, module.s3_frontend.s3_bucket_website_domain)
  s3_endpoint = format("%s.%s", module.s3_frontend.s3_bucket_name, module.s3_frontend.s3_bucket_website_domain)
  certificate_arn = module.certificate.arn
  domains         = var.cdn_domains

  depends_on = [
    module.s3_frontend,
    module.certificate
  ]

}


output "s3_frontend_bucket_name" {
  value = module.s3_frontend.s3_bucket_name
}

output "cdn_frontend_domain_name" {
  value = module.cdn_frontend.cdn_domain
}


################################################
# DNS records
################################################

resource "aws_route53_record" "cdn_alias" {
  for_each = toset(var.cdn_domains)

  zone_id = module.dns.zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = module.cdn_frontend.cdn_domain
    zone_id                = module.cdn_frontend.zone_id
    evaluate_target_health = false
  }

}
