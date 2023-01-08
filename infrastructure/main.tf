terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.34.0"
    }
  }
}

resource "google_storage_bucket" "function_bucket" {
    name     = var.project_id
    location = var.region
}

data "archive_file" "source" {
    type        = "zip"
    source_dir  = "../cloud_function/list-vms"
    output_path = "/tmp/cf-list-vms.zip"
}

resource "google_storage_bucket_object" "list_vms_zip" {
    source       = data.archive_file.source.output_path
    content_type = "application/zip"

    name         = "src-${data.archive_file.source.output_md5}.zip"
    bucket       = google_storage_bucket.function_bucket.name

    depends_on   = [
        google_storage_bucket.function_bucket, 
        data.archive_file.source
    ]
}

resource "google_cloudfunctions_function" "list_vms_test" {
  name     = "list-vms-test"
  runtime  = "nodejs16"
  region = var.region

  trigger_http = true
  https_trigger_security_level = "SECURE_ALWAYS"
  available_memory_mb = 256
  timeout = 60
  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.list_vms_zip.name

  entry_point           = "listAllInstances"

  depends_on   = [
    google_storage_bucket_object.list_vms_zip,
  ]
}
