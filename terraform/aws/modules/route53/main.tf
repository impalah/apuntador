################################################################################
# Hosted zone
################################################################################

resource "aws_route53_zone" "zone" {
  name = var.domain_name
  comment = var.description

  # Private hosted zone only if VPC ID is provided
  dynamic "vpc" {
    for_each = var.vpc_id != null ? [1] : []
    content {
      vpc_id     = var.vpc_id
      vpc_region = var.region
    }
  }

  tags = var.tags

}



