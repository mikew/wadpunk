use std::io;
use std::path::Path;
use std::path::PathBuf;
use std::process::ExitStatus;

use crate::tauri_plugin_downloader::tauri_download;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error("could not {action} {}: {source}", .path.display())]
  Io {
    action: &'static str,
    path: PathBuf,
    source: io::Error,
  },

  #[error("{} is not valid JSON ({source}). Fix or remove the file", .path.display())]
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

  #[error("invalid path: {}", .0.display())]
  NotUtf8Path(PathBuf),

  #[error("{} is not in the Games folder", .0.display())]
  OutsideGamesFolder(PathBuf),

  #[error("invalid file name: {0}")]
  InvalidFileName(String),

  #[error("no source ports are configured")]
  NoSourcePorts,

  #[error("game {game} has no {missing}")]
  GameNotConfigured { game: String, missing: &'static str },

  #[error("source port {0} has no command configured")]
  EmptySourcePortCommand(String),

  #[error("could not read {}: {source}", .path.display())]
  Plist { path: PathBuf, source: plist::Error },

  #[error("{} doesn't say which program to run (no CFBundleExecutable)", .0.display())]
  MissingBundleExecutable(PathBuf),

  #[error("failed to launch `{program}`: {source}")]
  Launch { program: String, source: io::Error },

  #[error("{name} {outcome}")]
  GameExited { name: &'static str, outcome: String },

  #[error("could not extract {file}: {outcome}")]
  ExtractFailed { file: String, outcome: String },

  #[error("can't download from {0}")]
  UnsupportedDownloadHost(String),

  #[error("no id was given to download")]
  MissingDownloadHint,

  #[error("could not reach {what}: {source}")]
  Network {
    what: &'static str,
    source: reqwest::Error,
  },

  #[error("unexpected response from {from}: {detail}")]
  UnexpectedResponse { from: &'static str, detail: String },

  #[error("could not create a temporary folder: {0}")]
  TempDir(io::Error),

  #[error("could not download {url}: {source}")]
  Download {
    url: String,
    source: tauri_download::Error,
  },

  #[error("could not open {path}: {source}")]
  Reveal {
    path: String,
    source: tauri_plugin_opener::Error,
  },
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

/// "exited with code 1", or on Unix "was terminated by signal 11".
pub fn describe_exit_status(status: ExitStatus) -> String {
  if let Some(code) = status.code() {
    return format!("exited with code {}", code);
  }

  #[cfg(unix)]
  {
    use std::os::unix::process::ExitStatusExt;

    if let Some(signal) = status.signal() {
      return format!("was terminated by signal {}", signal);
    }
  }

  "exited unsuccessfully".to_string()
}
