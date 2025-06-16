use std::fs::metadata;

use tauri_plugin_opener::OpenerExt;

use crate::tauri_legacy::get_app_handle;

// https://github.com/tauri-apps/tauri/issues/4062#issuecomment-1338048169
pub fn reveal_file(path: &str) {
  get_app_handle().opener().reveal_item_in_dir(path).unwrap();
}

pub fn reveal_folder(path: &str) {
  get_app_handle()
    .opener()
    .open_path(path, None::<&str>)
    .unwrap();
}

pub fn reveal_file_or_folder(path: &str) {
  // Sometimes there is a forward slash at the end of the path, which causes
  // issues on some platforms.
  let path = if path.ends_with('/') {
    &path[..path.len() - 1]
  } else {
    path
  };

  if metadata(path).unwrap().is_dir() {
    reveal_folder(path);
  } else {
    reveal_file(path);
  }
}
