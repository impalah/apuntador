resource "aws_s3_bucket" "bucket" {
  bucket        = var.bucket_name
  force_destroy = true

  tags = var.tags
}

resource "aws_s3_bucket_public_access_block" "bucket_access" {
  bucket = aws_s3_bucket.bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# resource "aws_s3_bucket_acl" "bucket-acl" {
#   bucket = aws_s3_bucket.bucket.id
#   acl    = "private"
# }

resource "aws_s3_bucket_ownership_controls" "bucket_ownership" {
  bucket = aws_s3_bucket.bucket.id

  rule {

    # BucketOwnerEnforced, BucketOwnerPreferred
    object_ownership = var.bucket_ownership
  }

  # depends_on = [aws_s3_bucket_acl.bucket-acl]

  lifecycle {
    ignore_changes = [
      rule
    ]
  }


}


# resource "aws_s3_bucket_acl" "bucket-acl" {
#   bucket     = aws_s3_bucket.bucket.id
#   acl        = "public-read"
#   depends_on = [aws_s3_bucket_ownership_controls.bucket_ownership]
# }

# resource "aws_iam_user" "bucket_user" {
#   name = format("%s-%s-bucket-user", var.environment, var.project)
# }


resource "aws_s3_bucket_website_configuration" "bucket-website" {
  count  = var.enable_website_hosting ? 1 : 0
  bucket = aws_s3_bucket.bucket.id

  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "index.html"
  }

}

resource "aws_s3_bucket_policy" "access-policy" {
  bucket = aws_s3_bucket.bucket.id
  # TODO: modify this horrible paths
  policy = templatefile(var.enable_website_hosting ? "${path.module}/../../policies/s3-read-policy.json" : "${path.module}/../../policies/s3-read-write-policy.json", { bucket = var.bucket_name })

  # Important! Without this depends we will have an Access Denied error
  depends_on = [aws_s3_bucket_public_access_block.bucket_access]

  lifecycle {
    ignore_changes = [
      policy
    ]
  }


}

# Upload example index
resource "aws_s3_object" "example-index" {

  count = var.enable_website_hosting && var.source_example != null ? 1 : 0

  bucket = aws_s3_bucket.bucket.id
  key    = "index.html"
  source = var.source_example
  acl    = "public-read"
}


# Enable VPC endpoint if requested
resource "aws_vpc_endpoint" "s3" {

  count             = var.enable_vpc_endpoint ? 1 : 0
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  route_table_ids   = var.route_tables
  vpc_endpoint_type = "Gateway"

  tags = var.tags

}

