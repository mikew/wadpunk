use std::{
  fs, io,
  path::{Path, PathBuf},
};

use once_cell::sync::OnceCell;
use tauri::{AppHandle, Error, Manager};

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();

/// Sets the global AppHandle. Call this once during setup.
pub fn set_app_handle(handle: AppHandle) {
  let _ = APP_HANDLE.set(handle);
}

/// Returns a reference to the global AppHandle
pub fn get_app_handle() -> &'static AppHandle {
  APP_HANDLE.get().expect("AppHandle has not been set")
}

pub fn home_dir() -> Result<std::path::PathBuf, Error> {
  get_app_handle().path().home_dir()
}

pub fn document_dir() -> Result<std::path::PathBuf, Error> {
  get_app_handle().path().document_dir()
}

#[derive(Debug)]
pub struct DiskEntry {
  pub name: String,
  pub path: PathBuf,
  // pub is_directory: bool,
  // pub is_file: bool,
  // pub is_symlink: bool,
  pub children: Option<Vec<DiskEntry>>,
}

pub fn read_dir(path: &Path, recursive: bool) -> crate::error::Result<Vec<DiskEntry>> {
  let dir_entries = match fs::read_dir(path) {
    Ok(dir_entries) => dir_entries,
    Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(vec![]),
    Err(error) => return Err(crate::error::Error::io("read folder", path)(error)),
  };

  let mut entries: Vec<DiskEntry> = vec![];

  for entry in dir_entries.flatten() {
    let path = entry.path();
    let Ok(mut name) = entry.file_name().into_string() else {
      eprintln!("Skipping {}: its name is not valid UTF-8", path.display());
      continue;
    };
    let is_directory = path.is_dir();
    // let is_file = path.is_file();
    // let is_symlink = path.is_symlink();

    if is_directory {
      name = format!("{}/", name);
    }

    let children = if recursive && is_directory {
      Some(read_dir(&path, true)?)
    } else {
      None
    };

    entries.push(DiskEntry {
      name,
      path,
      // is_directory,
      // is_file,
      // is_symlink,
      children,
    });
  }

  Ok(entries)
}
