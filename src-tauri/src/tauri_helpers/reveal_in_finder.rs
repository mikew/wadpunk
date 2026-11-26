use std::fs::metadata;
use std::path::Path;

use tauri_plugin_opener::OpenerExt;

use crate::error::Error;
use crate::error::Result;
use crate::tauri_legacy::get_app_handle;

// https://github.com/tauri-apps/tauri/issues/4062#issuecomment-1338048169
pub fn reveal_file(path: &str) -> Result<()> {
  get_app_handle()
    .opener()
    .reveal_item_in_dir(path)
    .map_err(|source| Error::Reveal {
      path: path.to_string(),
      source,
    })
}

pub fn reveal_folder(path: &str) -> Result<()> {
  get_app_handle()
    .opener()
    .open_path(path, None::<&str>)
    .map_err(|source| Error::Reveal {
      path: path.to_string(),
      source,
    })
}

pub fn reveal_file_or_folder(path: &str) -> Result<()> {
  // Sometimes there is a forward slash at the end of the path, which causes
  // issues on some platforms.
  let path = path.strip_suffix('/').unwrap_or(path);

  let is_dir = metadata(path)
    .map_err(Error::io("open", Path::new(path)))?
    .is_dir();

  if is_dir {
    reveal_folder(path)
  } else {
    reveal_file(path)
  }
}
