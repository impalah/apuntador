output "zone_id" {
  description = "The ID of the Route 53 Hosted Zone"
  value       = aws_route53_zone.zone.zone_id
}

output "name_servers" {
  description = "The list of name servers for the Route 53 Hosted Zone"
  value       = aws_route53_zone.zone.name_servers
}
