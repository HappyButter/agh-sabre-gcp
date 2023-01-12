terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.34.0"
    }
  }
}

provider "google" {
  project     = var.project_id
  region      = var.region
  zone        = var.zone
}

resource "google_storage_bucket" "function_bucket" {
    name     = var.project_id
    location = var.region
}

data "archive_file" "list_vms" {
    type        = "zip"
    source_dir  = "../cloud_function/list-vms"
    output_path = "/tmp/cf-list-vms.zip"
}

data "archive_file" "start_vm" {
    type        = "zip"
    source_dir  = "../cloud_function/start-vm"
    output_path = "/tmp/cf-start-vm.zip"
}

data "archive_file" "stop_vm" {
    type        = "zip"
    source_dir  = "../cloud_function/stop-vm"
    output_path = "/tmp/cf-stop-vm.zip"
}

resource "google_storage_bucket_object" "list_vms_zip" {
    source       = data.archive_file.list_vms.output_path
    content_type = "application/zip"

    name         = "src-${data.archive_file.list_vms.output_md5}.zip"
    bucket       = google_storage_bucket.function_bucket.name

    depends_on   = [
        google_storage_bucket.function_bucket, 
        data.archive_file.list_vms
    ]
}

resource "google_storage_bucket_object" "start_vm_zip" {
    source       = data.archive_file.start_vm.output_path
    content_type = "application/zip"

    name         = "src-${data.archive_file.start_vm.output_md5}.zip"
    bucket       = google_storage_bucket.function_bucket.name

    depends_on   = [
        google_storage_bucket.function_bucket, 
        data.archive_file.start_vm
    ]
}

resource "google_storage_bucket_object" "stop_vm_zip" {
    source       = data.archive_file.stop_vm.output_path
    content_type = "application/zip"

    name         = "src-${data.archive_file.stop_vm.output_md5}.zip"
    bucket       = google_storage_bucket.function_bucket.name

    depends_on   = [
        google_storage_bucket.function_bucket, 
        data.archive_file.stop_vm
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

resource "google_cloudfunctions_function" "start_vm_test" {
  name     = "start-vm-test"
  runtime  = "nodejs16"
  region = var.region

  trigger_http = true
  https_trigger_security_level = "SECURE_ALWAYS"
  available_memory_mb = 256
  timeout = 60
  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.start_vm_zip.name

  entry_point           = "startInstance"

  depends_on   = [
    google_storage_bucket_object.start_vm_zip,
  ]
}

resource "google_cloudfunctions_function" "stop_vm_test" {
  name     = "stop-vm-test"
  runtime  = "nodejs16"
  region = var.region

  trigger_http = true
  https_trigger_security_level = "SECURE_ALWAYS"
  available_memory_mb = 256
  timeout = 60
  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.stop_vm_zip.name

  entry_point           = "stopInstance"

  depends_on   = [
    google_storage_bucket_object.stop_vm_zip,
  ]
}
