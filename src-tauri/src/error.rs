use std::io;
use std::path::Path;
use std::path::PathBuf;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error("could not {action} {}: {source}", .path.display())]
  Io {
    action: &'static str,
    path: PathBuf,
    source: io::Error,
  },

  #[error("{} is not valid JSON ({source}). Fix the file, or remove it to start fresh.", .path.display())]
  Json {
    path: PathBuf,
    source: serde_json::Error,
  },

  #[error("could not encode data for {}: {source}", .path.display())]
  Encode {
    path: PathBuf,
    source: serde_json::Error,
  },

  #[error("could not copy {file}: {source}")]
  Copy {
    file: String,
    source: fs_extra::error::Error,
  },

  #[error("could not find your Documents folder: {0}")]
  NoDocumentsDirectory(tauri::Error),

  #[error("{kind} {id} not found")]
  NotFound { kind: &'static str, id: String },

  #[error("{0} has no id")]
  MissingId(&'static str),

  #[error("{} can't be used because its name is not valid text (UTF-8)", .0.display())]
  NotUtf8Path(PathBuf),

  #[error("{} is not inside the games folder", .0.display())]
  OutsideGamesFolder(PathBuf),

  #[error("can't import {0}: it has no usable file name")]
  InvalidFileName(String),
}

pub type Result<T> = std::result::Result<T, Error>;

impl Error {
  /// For `map_err`: `fs::read(&path).map_err(Error::io("read", &path))?`
  pub fn io<'a>(action: &'static str, path: &'a Path) -> impl FnOnce(io::Error) -> Error + 'a {
    move |source| Error::Io {
      action,
      path: path.to_path_buf(),
      source,
    }
  }

  pub fn not_found(kind: &'static str, id: &str) -> Error {
    Error::NotFound {
      kind,
      id: id.to_string(),
    }
  }
}
