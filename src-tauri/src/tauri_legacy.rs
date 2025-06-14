use std::{fs, path::PathBuf};

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
  return get_app_handle().path().home_dir();
}

pub fn document_dir() -> Result<std::path::PathBuf, Error> {
  return get_app_handle().path().document_dir();
}

#[derive(Debug)]
pub struct DiskEntry {
  pub name: Option<String>,
  pub path: PathBuf,
  pub is_directory: bool,
  pub is_file: bool,
  pub is_symlink: bool,
  pub children: Option<Vec<DiskEntry>>,
}

pub fn read_dir(path: PathBuf, recursive: bool) -> Option<Vec<DiskEntry>> {
  let mut entries: Vec<DiskEntry> = vec![];

  if let Ok(dir_entries) = fs::read_dir(path) {
    for entry in dir_entries {
      if let Ok(entry) = entry {
        let path = entry.path();
        let mut name = entry.file_name().into_string().unwrap();
        let is_directory = path.is_dir();
        let is_file = path.is_file();
        let is_symlink = path.is_symlink();

        if is_directory {
          name = format!("{}/", name);
        }

        let mut children: Option<Vec<DiskEntry>> = None;
        if recursive && is_directory {
          if let Some(child_entries) = read_dir(path.clone(), true) {
            children = Some(child_entries);
          }
        }

        entries.push(DiskEntry {
          name: Some(name),
          path,
          is_directory,
          is_file,
          is_symlink,
          children,
        });
      }
    }
  }

  return Some(entries);
}
