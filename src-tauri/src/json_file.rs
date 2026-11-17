use std::fs;
use std::io;
use std::path::Path;
use std::path::PathBuf;

use serde::de::DeserializeOwned;
use serde::Serialize;

use crate::error::Error;
use crate::error::Result;

pub fn read_json<T: DeserializeOwned>(path: &Path) -> Result<Option<T>> {
  let contents = match fs::read_to_string(path) {
    Ok(contents) => contents,
    Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
    Err(error) => return Err(Error::io("read", path)(error)),
  };

  serde_json::from_str(&contents)
    .map(Some)
    .map_err(|source| Error::Json {
      path: path.to_path_buf(),
      source,
    })
}

pub fn read_json_or_default<T: DeserializeOwned + Default>(path: &Path) -> Result<T> {
  Ok(read_json(path)?.unwrap_or_default())
}

pub fn write_json<T: Serialize + ?Sized>(path: &Path, value: &T) -> Result<()> {
  let contents = serde_json::to_string(value).map_err(|source| Error::Encode {
    path: path.to_path_buf(),
    source,
  })?;

  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(Error::io("create folder", parent))?;
  }

  let mut temporary_name = path.as_os_str().to_owned();
  temporary_name.push(".tmp");
  let temporary_path = PathBuf::from(temporary_name);

  fs::write(&temporary_path, contents).map_err(Error::io("write", &temporary_path))?;

  fs::rename(&temporary_path, path).map_err(|error| {
    let _ = fs::remove_file(&temporary_path);
    Error::io("write", path)(error)
  })
}
