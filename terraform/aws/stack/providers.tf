provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      environment   = var.environment
      deployment    = lower("Terraform")
      cost-center   = var.cost_center
      project       = var.project
      owner         = var.owner
      creation-date = formatdate("YYYY-MM-DD", timestamp())

    }
  }
  ignore_tags {
    keys = ["cloud", "entorno", "plataforma", "suscripcion"]
  }
}


provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = {
      environment   = var.environment
      deployment    = lower("Terraform")
      cost-center   = var.cost_center
      project       = var.project
      owner         = var.owner
      creation-date = formatdate("YYYY-MM-DD", timestamp())

    }
  }
  ignore_tags {
    keys = ["cloud", "entorno", "plataforma", "suscripcion"]
  }
}

